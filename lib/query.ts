import { ExecutedTransform } from './ExecutedTransform'
import { ExecutedTransformSequence } from './ExecutedTransformSequence'
import { ExecutedSimpleTransform } from './ExecutedSimpleTransform'
import { ExecutedConcatTransform } from './ExecutedConcatTransform'
import { ExecutedFirstOfTransform } from './ExecutedFirstOfTransform'
import { ExecutedTransformError } from './ExecutedTransformError'
import BrowserMonkeyAssertionError from './BrowserMonkeyAssertionError'
import toExecutedTransform from './toExecutedTransform'
var extend = require('lowscore/extend')
var retry = require('trytryagain')
var elementInnerText = require('./elementInnerText')
var inspect = require('object-inspect')
var uniq = require('lowscore/uniq')
var debug = require('debug')('browser-monkey')
var inputsSelector = require('./inputsSelector')
const elementEnterText = require('./elementEnterText')

type Transform = (elements: any, executedTransforms: ExecutedTransform[]) => any
type Action = (elements: any, executedTransforms: ExecutedTransform[]) => void

class Query {
  private _transforms: Transform[]
  private _options: {
    visibleOnly: boolean
    timeout: number
    interval: number
    definitions: {
      setters: any[]
      button: ((monkey: any, name: any) => any)[]
      fields: {}
      finders: {}
      field: ((monkey: any, name: any) => any)[]
      fieldValue: {
        get: (monkey: any) => any
        set: (monkey: any, value: any) => void
        setter?: (monkey: any, value: any) => void
      }[]
    }
  }

  private _input: any
  private _actionExecuted: any
  private _action: Action
  private _hasExpectation: boolean

  public constructor () {
    this._hasExpectation = false
    this._transforms = []
    this._options = {
      visibleOnly: true,
      timeout: 1000,
      interval: 10,
      definitions: {
        setters: [],
        button: [
          function (monkey, name) {
            return monkey.find('button', { exactText: name })
          },
          function (monkey, name) {
            return monkey.find('input[type=button]', { exactValue: name })
          },
          function (monkey, name) {
            return monkey.find('a', { exactText: name })
          }
        ],

        fields: {},
        finders: {},

        field: [
          function (monkey, name) {
            return monkey.find('label', { exactText: name }).find('input')
          },
          function (monkey, name) {
            return monkey.find('input').filter(function (element) {
              var labelledBy = element.getAttribute('aria-labelledby')
              if (labelledBy) {
                var ids = labelledBy.split(/\s+/)
                var labels = ids.map(function (id) {
                  return element.ownerDocument.getElementById(id)
                })
                var label = labels.filter(Boolean).map(function (l) {
                  return elementInnerText(l)
                }).join(' ')
                return name === label
              }
            }, 'aria-labelledby ' + inspect({ text: name }))
          }
        ],
        fieldValue: [
          {
            set: function (monkey, value) {
              return monkey.typeIn(value)
            },
            setter: function (monkey) {
              return monkey.is(inputsSelector).element().mapAll(function (element) {
                return function (value) {
                  if (typeof value !== 'string') {
                    throw new Error('expected string as argument to typeIn')
                  }
                  debug('typeIn', element, value)
                  elementEnterText(element, value)
                }
              })
            },
            get: function (monkey) {
              return monkey.inputValue()
            }
          },
          {
            set: function (monkey, value) {
              return monkey.select(value)
            },
            get: function (monkey) {
              return monkey.selectValue()
            }
          },
          {
            set: function (monkey, value) {
              return monkey.check(value)
            },
            get: function (monkey) {
              return monkey.checked()
            }
          }
        ]
      }
    }
    this._input = undefined
  }

  public transform (transform: Transform): this {
    return this.clone(clone => clone._transforms.push(transform))
  }

  public expect (expectation: (any) => void): this {
    const expectQuery = this.transform(function (value) {
      expectation.call(this, value)
      return value
    })

    expectQuery._hasExpectation = true

    return expectQuery
  }

  public action (action: Action): any {
    if (this._action) {
      throw new Error('can only have one action')
    }

    return this.clone(clone => {
      clone._action = action
    })
  }

  public result (): any {
    return this.execute().value
  }

  public resolve (input: any): this {
    const resolved = this.clone()
    resolved._input = input
    resolved._transforms = []
    return resolved
  }

  public filter (filter: (a: any) => boolean, description: string): this {
    return this.transform((elements) => {
      return new ExecutedSimpleTransform(elements.filter(filter), description)
    })
  }

  public concat (queryCreators: [(q: Query) => Query]): this {
    return this.transform((elements) => {
      const resolved = this.resolve(elements)

      var transforms = queryCreators.map(queryCreator => runQueryCreator(queryCreator, resolved).execute())

      var value = uniq(Array.prototype.concat.apply([], transforms.map(t => t.value)))
      return new ExecutedConcatTransform(value, transforms)
    })
  }

  public error (message: string, {expected = undefined, actual = undefined} = {}): void {
    throw new BrowserMonkeyAssertionError(message, { expected, actual })
  }

  private execute (): ExecutedTransformSequence {
    const transformSequence = new ExecutedTransformSequence(this._input)

    try {
      this._transforms.forEach(transform => {
        const executedTransform = toExecutedTransform(transform.call(this, transformSequence.value, transformSequence.transforms))
        transformSequence.addTransform(executedTransform)
      })

      if (this._action && !this._actionExecuted) {
        this._action(transformSequence.value, transformSequence.transforms)
        this._actionExecuted = true
      }

      return transformSequence
    } catch (e) {
      if (e instanceof BrowserMonkeyAssertionError) {
        e.executedTransforms.prepend(transformSequence)
      }

      throw e
    }
  }

  public firstOf (queryCreators: [(q: Query) => Query]): this {
    const transformed = this.transform((elements) => {
      const resolved = this.resolve(elements)

      var values = queryCreators.map(query => {
        try {
          const q = runQueryCreator(query, resolved)
          q.assertHasActionOrExpectation()
          return {
            value: q.execute()
          }
        } catch (e) {
          if (e instanceof BrowserMonkeyAssertionError) {
            return {
              error: new ExecutedTransformError(e)
            }
          } else {
            throw e
          }
        }
      })

      var firstSuccessIndex = values.findIndex(v => {
        return !v.error
      })

      const firstSuccess = values[firstSuccessIndex]

      const transform = new ExecutedFirstOfTransform(firstSuccess ? firstSuccess.value.value : [], firstSuccessIndex, values.map(v => v.error || v.value))

      if (firstSuccess) {
        return transform
      } else {
        var error = new BrowserMonkeyAssertionError('all queries failed in firstOf')
        error.executedTransforms.addTransform(transform)
        throw error
      }
    })

    transformed._hasExpectation = true

    return transformed
  }

  public find (selector: string, options = undefined): this {
    // name(value)
    const match = /^\s*(.*?)\s*(\((.*)\)\s*)?$/.exec(selector)

    if (match) {
      const [, name,, value] = match
      const finder = this._options.definitions.fields[name]

      if (finder) {
        if (options) {
          throw new Error('options not used here')
        }

        if (value !== undefined) {
          return finder(this, value.trim())
        } else {
          return finder(this)
        }
      }
    }

    return this.css(selector, options)
  }

  public options (options): Options {
    if (options) {
      extend(this._options, options)
    } else {
      return this._options
    }
  }

  private assertHasActionOrExpectation (): void {
    if (!this._hasExpectation && !this._action) {
      throw new Error('no expectations or actions in query, use .result(), or add an expectation or an action')
    }
  }

  public then (...args): Promise<any> {
    this.assertHasActionOrExpectation()

    var self = this
    var retry = retryFromOptions(this._options)
    var originalStack = new Error().stack

    var promise = Promise.resolve(retry(function () {
      return self.execute().value
    })).catch(function (error) {
      if (error instanceof BrowserMonkeyAssertionError) {
        error.rewriteMessage()
        error.stack = originalStack

        if (debug.enabled) {
          debug('assertion error', error.message)
          error.executedTransforms.transforms.forEach(function (transform) {
            transform.print()
          })
        }
      }

      throw error
    })

    return promise.then.apply(promise, args)
  }

  public catch (fn): Promise<void> {
    return this.then(undefined, fn)
  }

  public clone (modifier?: (clone: this) => void): this {
    var clone = new (this.constructor as any)()
    copySelectorFields(this, clone)
    if (modifier) {
      modifier(clone)
    }
    return clone
  }

  public input (value): void {
    this._input = value
  }

  public component (methods): this {
    var self = this

    function Component () {
      copySelectorFields(self, this)
    }

    Component.prototype = new (this.constructor as any)()
    Object.keys(methods).forEach(function (method) {
      var descriptor = Object.getOwnPropertyDescriptor(methods, method)
      if (descriptor) {
        Object.defineProperty(Component.prototype, method, descriptor)
      } else {
        Component.prototype[method] = methods[method]
      }
    })
    Component.prototype.constructor = Component

    return new Component()
  }
}

function copySelectorFields (from: Query, to: Query): void {
  to._transforms = from._transforms.slice()
  to._input = from._input

  to._hasExpectation = from._hasExpectation

  to._options = extend({}, from._options)
  to._options.definitions = {}

  Object.keys(from._options.definitions).forEach(function (key) {
    if (from._options.definitions[key] instanceof Array) {
      to._options.definitions[key] = from._options.definitions[key].slice()
    } else {
      to._options.definitions[key] = Object.assign({}, from._options.definitions[key])
    }
  })
}

function retryFromOptions (options) {
  if (options && options.retry) {
    return options.retry
  } else if (options && (options.timeout || options.interval)) {
    return function (fn) {
      return retry(fn, options)
    }
  } else {
    return retry
  }
}

function runQueryCreator (queryCreator: (q: Query) => Query, query: Query): Query {
  const q = queryCreator(query)

  if (!(q instanceof Query)) {
    throw new Error(`function ${queryCreator} expected to return Query but was: ` + q)
  }

  return q
}

module.exports = Query
