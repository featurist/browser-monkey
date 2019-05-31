import { ExecutedTransformSequence } from './ExecutedTransformSequence'
import { ExecutedSimpleTransform } from './ExecutedSimpleTransform'
import { ExecutedConcatTransform } from './ExecutedConcatTransform'
import { ExecutedOrTransform } from './ExecutedOrTransform'
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

type Transform = (any) => any

class Query {
  private _transforms: Transform[]
  private _executedTransforms: ExecutedTransformSequence
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

  private _value: any
  private _actionExecuted: any
  private _action: (value: any) => void
  private _isResolved: boolean

  public constructor () {
    this._isResolved = false
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
    this._value = undefined
  }

  public transform (transform: Transform): this {
    if (this._isResolved) {
      return this.clone(clone => {
        const executedTransform = toExecutedTransform(transform.call(this, this._value))
        clone._executedTransforms.addTransform(executedTransform)
        clone._value = executedTransform.value
      })
    } else {
      return this.clone(clone => clone._transforms.push(transform))
    }
  }

  public assertion (assertion: (any) => void): this {
    return this.transform((value) => {
      assertion.call(this, value)
      return value
    })
  }

  public action (action: (any) => void): any {
    if (this._action) {
      throw new Error('can only have one action')
    }

    if (this._isResolved) {
      action.call(this, this._value)
    } else {
      return this.clone(clone => {
        clone._action = action
      })
    }
  }

  public value (): any {
    if (this._isResolved) {
      return this._value
    } else {
      return toExecutedTransform(this.execute()).value
    }
  }

  public resolve (): this {
    if (!this._isResolved) {
      this._executedTransforms = this.execute()
      this._value = this._executedTransforms.value
      this._isResolved = true
      return this
    } else {
      return this
    }
  }

  public map (mapper, description): this {
    return this.transform((elements) => {
      return new ExecutedSimpleTransform(elements.map(mapper), description)
    })
  }

  public filter (filter, description): this {
    return this.transform((elements) => {
      return new ExecutedSimpleTransform(elements.filter(filter), description)
    })
  }

  public concat (queryCreators): this {
    var queries = queryCreators.map(queryCreator => {
      return this.subQuery(queryCreator)
    })

    return this.transform((elements) => {
      var transforms = queries.map(query => {
        const transforms = new ExecutedTransformSequence(elements)
        query.executeQuery(transforms)
        return transforms
      })

      var value = uniq(Array.prototype.concat.apply([], transforms.map(t => t.value)))
      return new ExecutedConcatTransform(value, transforms)
    })
  }

  private subQuery (createQuery) {
    var clone = this.clone()
    clone._transforms = []
    var query = createQuery(clone)
    if (!(query instanceof Query)) {
      throw new Error('expected to create query: ' + createQuery)
    }
    return query
  }

  public error (message: string, { expected, actual }): void {
    if (this._isResolved) {
      throw new BrowserMonkeyAssertionError(message, { expected, actual, executedTransforms: this._executedTransforms })
    } else {
      throw new BrowserMonkeyAssertionError(message, { expected, actual })
    }
  }

  private resolveSubQuery (createQuery, value) {
    return this.subQuery(createQuery).resolve()
  }

  private executeQuery (transformSequence: ExecutedTransformSequence) {
    const query = this

    function reducer (transform) {
      const executedTransform = toExecutedTransform(transform.call(query, transformSequence.value))
      transformSequence.addTransform(executedTransform)
    }

    try {
      this._transforms.forEach(reducer)
      if (this._action && !this._actionExecuted) {
        this._action(transformSequence.value)
        this._actionExecuted = true
      }
    } catch (e) {
      if (e instanceof BrowserMonkeyAssertionError) {
        e.executedTransforms.prepend(transformSequence)
      }

      throw e
    }
  }

  private execute (): ExecutedTransformSequence {
    if (!this._isResolved) {
      const transformSequence = new ExecutedTransformSequence(this._value)
      this.executeQuery(transformSequence)
      return transformSequence
    } else {
      return this._executedTransforms
    }
  }

  private race (queryCreators): this {
    return this.transform(() => {
      const resolved = this.clone().resolve()

      var values = queryCreators.map(query => {
        try {
          return {
            value: query(resolved).execute()
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

      const transform = new ExecutedOrTransform((firstSuccess && firstSuccess.value.value) || [], firstSuccessIndex, values.map(v => v.error || v.value))

      if (firstSuccess) {
        return transform
      } else {
        var error = new BrowserMonkeyAssertionError('all queries failed in race')
        error.executedTransforms.addTransform(transform)
        throw error
      }
    })
  }

  public query (selector: string) {
    const field = this._options.definitions.fields[selector]

    if (field) {
      return field(this)
    } else {
      const [finderName, value] = selector.split(':')
      if (this[finderName]) {
        return this[finderName](value.trim())
      } else {
        throw new Error('no such finder: ' + finderName)
      }
    }
  }

  public options (options) {
    if (options) {
      return this.clone(function (clone) {
        extend(clone._options, options)
      })
    } else {
      return this._options
    }
  }

  public then (...args) {
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

  public ensure (assertion, name): this {
    return this.transform(function (value) {
      assertion(value)
      return new ExecutedSimpleTransform(value, name || 'ensure')
    })
  }

  public zero (): this {
    return this.transform(function (results) {
      if (results instanceof Array) {
        if (results.length !== 0) {
          throw new BrowserMonkeyAssertionError('expected no elements')
        } else {
          return new ExecutedSimpleTransform(results, 'zero')
        }
      } else {
        throw new BrowserMonkeyAssertionError('expected array of no elements')
      }
    })
  }

  public one (): this {
    return this.transform(function (results) {
      if (results instanceof Array) {
        if (results.length === 1) {
          return new ExecutedSimpleTransform(results[0], 'one')
        } else {
          throw new BrowserMonkeyAssertionError('expected one element')
        }
      } else {
        return new ExecutedSimpleTransform(results, 'one')
      }
    })
  }

  public some (): this {
    return this.transform(function (results) {
      if (results instanceof Array && results.length !== 0) {
        return new ExecutedSimpleTransform(results, 'some')
      } else {
        throw new BrowserMonkeyAssertionError('expected some elements')
      }
    })
  }

  public input (value): this {
    return this.clone(function (clone) {
      clone._value = value
    })
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

function copySelectorFields (from, to) {
  to._transforms = from._transforms.slice()
  to._value = from._value

  to._isResolved = from._isResolved
  if (from._isResolved) {
    to._executedTransforms = from._executedTransforms.clone()
  }

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

function errorMessage (error) {
  if (error instanceof BrowserMonkeyAssertionError) {
    return browserMonkeyAssertionErrorMessage(error)
  } else {
    return error.message
  }
}

function browserMonkeyAssertionErrorMessage (error: BrowserMonkeyAssertionError) {
  var foundMessage = describeAccumulatedTransforms(error.executedTransforms)
  return error.message + ' (found: ' + foundMessage + ')'
}

function describeAccumulatedTransforms (accumulatedTransforms: ExecutedTransformSequence) {
  return accumulatedTransforms.transforms.map(function (transform) {
    return transform.renderError()
    // if (transform.concat instanceof Array) {
    //   return describeTransform({
    //     description: 'concat (' + transform.concat.map(describeAccumulatedTransforms).join(', or ') + ')',
    //     value: transform.value
    //   })
    // } else if (transform.raceErrors instanceof Array) {
    //   return 'race between (' + transform.raceErrors.map(errorMessage).join(', and ') + ')'
    // } else {
    //   return describeTransform(transform)
    // }
  }).join(', ')
}

function describeTransform (transform) {
  var v = transform.value instanceof Array
    ? '[' + transform.value.length + ']'
    : '(' + typeof transform.value + ')'
  return transform.description + ' ' + v
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

module.exports = Query
