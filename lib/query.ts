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
var elementClick = require('./elementClick')
var elementSubmit = require('./elementSubmit')

type Transform = (elements: any, executedTransforms: ExecutedTransform[]) => any
type Action = (elements: any, executedTransforms: ExecutedTransform[]) => void
interface Definitions {
  fieldTypes: {
    value: (query: Query) => any
    settter?: (query: Query, value: any) => () => void
  }[]
  button: ((monkey: any, name: any) => any)[]
  fields: {}
}

class Query {
  private _transforms: Transform[]
  private _options: {
    visibleOnly: boolean
    timeout: number
    interval: number
    definitions: Definitions
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
        fieldTypes: [],
        button: [
          function (monkey, name) {
            return monkey.css('button', { exactText: name })
          },
          function (monkey, name) {
            return monkey.css('input[type=button]', { exactValue: name })
          },
          function (monkey, name) {
            return monkey.css('a', { exactText: name })
          }
        ],

        fields: {},
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

  public button (name: string): this {
    return this.concat(this._options.definitions.button.map(definition => {
      return (q: Query): Query => {
        return definition(q, name)
      }
    }))
  }

  public defineButton (definition: (q: Query, name?: string) => Query): void {
    this._options.definitions.button.push(definition)
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

  public concat (queryCreators: ((q: Query) => Query)[]): this {
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
        e.prependExecutedTransforms(transformSequence)
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
        error.addExecutedTransform(transform)
        throw error
      }
    })

    transformed._hasExpectation = true

    return transformed
  }

  public options (options): any {
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
    clone.copyQueryFields(this)
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

    function Component (): void {
      this.copyQueryFields(self)
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

  private copyQueryFields (from: Query): void {
    this._transforms = from._transforms.slice()
    this._input = from._input

    this._hasExpectation = from._hasExpectation

    this._options = extend({}, from._options)
    this._options.definitions = cloneDefinitions(from._options.definitions)
  }
}

function cloneDefinitions(definitions: Definitions): Definitions {
  const result = {}

  Object.keys(definitions).forEach(function (key) {
    if (definitions[key] instanceof Array) {
      result[key] = definitions[key].slice()
    } else {
      result[key] = Object.assign({}, definitions[key])
    }
  })

  return result as Definitions
}

type Retry = (fn: () => any) => Promise<any>

function retryFromOptions (options: {retry?: Retry, timeout?: number, interval?: number}): Retry {
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
