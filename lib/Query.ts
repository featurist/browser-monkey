import { ExecutedTransform } from './ExecutedTransform'
import { ExecutedTransformSequence } from './ExecutedTransformSequence'
import { ExecutedSimpleTransform } from './ExecutedSimpleTransform'
import { ExecutedConcatTransform } from './ExecutedConcatTransform'
import { ExecutedFirstOfTransform } from './ExecutedFirstOfTransform'
import ExecutedDetectTransform from './ExecutedDetectTransform'
import { ExecutedTransformError } from './ExecutedTransformError'
import Dom from './Dom'
import BrowserMonkeyAssertionError from './BrowserMonkeyAssertionError'
import toExecutedTransform from './toExecutedTransform'
const pluralize = require('pluralize')
var extend = require('lowscore/extend')
var retry = require('trytryagain')
var inspect = require('object-inspect')
var uniq = require('lowscore/uniq')
var debug = require('debug')('browser-monkey')
var inputSelectors = require('./inputSelectors')
const object = require('lowscore/object')
const range = require('lowscore/range')
var flatten = require('lowscore/flatten')

type Transform = (elements: any, executedTransforms: ExecutedTransform[]) => any
type Action = (elements: any, executedTransforms: ExecutedTransform[]) => void
type FieldType = {
  value?: (query: Query) => Query
  setter?: (query: Query, value: any) => Query
  valueAsserter?: (query: Query, expected: any) => Query
}

interface Definitions {
  fieldTypes: FieldType[]
  button: ((query: Query, name: string) => Query)[]
  fields: {}
}

class Query {
  private _transforms: Transform[]
  private _options: Options
  private _input: any
  private _actionExecuted: any
  private _action: Action
  private _hasExpectation: boolean
  private _dom: Dom

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
          (query: Query, name: string): Query => {
            return query.css('button, input[type=button], a').containing(name)
          },
        ],

        fields: {},
      }
    }
    this._dom = new Dom()
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

  public firstOf (queryCreators: ((q: Query) => Query)[]): this {
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

  public detect (queryCreators: {[key: string]: (q: Query) => Query}): this {
    const transformed = this.transform((elements) => {
      const resolved = this.resolve(elements)

      var entries = Object.keys(queryCreators).map(key => {
        const queryCreator = queryCreators[key]

        try {
          const q = runQueryCreator(queryCreator, resolved)
          q.assertHasActionOrExpectation()
          return {
            key,
            value: q.execute()
          }
        } catch (e) {
          if (e instanceof BrowserMonkeyAssertionError) {
            return {
              key,
              error: new ExecutedTransformError(e)
            }
          } else {
            throw e
          }
        }
      })

      var firstSuccessIndex = entries.findIndex(v => {
        return !v.error
      })

      const firstSuccess = entries[firstSuccessIndex]

      const transform = new ExecutedDetectTransform(
        firstSuccess
          ? {
            key: firstSuccess.key,
            value: firstSuccess.value.value,
          }
          : undefined,
        entries.map(v => ({key: v.key, transform: v.error || v.value}))
      )

      if (firstSuccess) {
        return transform
      } else {
        var error = new BrowserMonkeyAssertionError('all queries failed in detect')
        error.addExecutedTransform(transform)
        throw error
      }
    })

    transformed._hasExpectation = true

    return transformed
  }

  public options (options: Options): any {
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

  public expectNoElements (message?: string): this {
    return this.expect(elements => {
      expectElements(elements)

      if (elements.length !== 0) {
        this.error(message || 'expected no elements, found ' + elements.length)
      }
    })
  }

  public expectOneElement (message?: string): this {
    return this.expect(elements => {
      expectElements(elements)

      if (elements.length !== 1) {
        this.error(message || 'expected just one element, found ' + elements.length)
      }
    })
  }

  public element (): HTMLElement {
    return this.expectOneElement().result()[0]
  }

  public expectSomeElements (message?: string): this {
    return this.expect(function (elements) {
      expectElements(elements)

      if (elements.length < 1) {
        this.error(message || 'expected one or more elements, found ' + elements.length)
      }
    })
  }

  public click (): this {
    return this.expectOneElement().action(([element]) => {
      debug('click', element)
      this._dom.click(element)
    })
  }

  public submit (): this {
    return this.expectOneElement().action(([element]) => {
      debug('submit', element)
      this._dom.submit(element)
    })
  }

  public scope (element: HTMLElement): this {
    var selector = this.clone()
    selector.input([element])

    if (isIframe(element)) {
      return selector.iframeContent()
    } else if (isHTMLElement(element)) {
      return selector
    } else {
      throw new Error('scope() expects HTML element')
    }
  }

  public iframeContent (): this {
    return this.transform(elements => {
      return elements.map(element => {
        if (isIframe(element)) {
          if (element.contentDocument && element.contentDocument.readyState === 'complete') {
            return element.contentDocument.body
          } else {
            throw new BrowserMonkeyAssertionError('iframe not loaded')
          }
        } else {
          throw new BrowserMonkeyAssertionError('not iframe')
        }
      })
    })
  }

  public enabled (): this {
    return this.filter(element => {
      var tagName = element.tagName
      return !((tagName === 'BUTTON' || tagName === 'INPUT') && element.disabled)
    }, 'enabled')
  }

  public clickButton (name: string): this {
    return this.button(name).click()
  }

  public set (selector, value): this {
    const model = value === undefined
      ? selector
      : {
        [selector]: value
      }

    return this.action(function (elements) {
      const setters = []

      const actions = {
        arrayLengthError: (query, actualLength, expectedLength) => {
          query.error('expected ' + expectedLength + ' ' + pluralize('elements', expectedLength) + ', found ' + actualLength)
        },

        value: (query, model) => {
          var setter = query.setter(model).result()
          setters.push(() => setter())
        },

        expectOne: (query) => {
          expectLength(query, 1).result()
        },

        function: (query, model) => {
          setters.push(() => runModelFunction(model, query))
        }
      }

      const clone = this.resolve(elements)
      mapModel(clone, model, actions)

      setters.forEach(set => {
        set()
      })
    })
  }

  public shouldExist (): this {
    return this.expectSomeElements()
  }

  public shouldNotExist (): this {
    return this.expectNoElements()
  }

  public shouldContain (model): this {
    return this.expect(elements => {
      let isError = false

      const actions = {
        arrayLengthError: () => {
          isError = true
        },

        expectOne: (query) => {
          try {
            expectLength(query, 1).result()
            return {}
          } catch (e) {
            if (e instanceof BrowserMonkeyAssertionError) {
              isError = true
              return 'Error: ' + e.message
            } else {
              throw e
            }
          }
        },

        value: (query, model) => {
          let valueAsserter

          try {
            valueAsserter = query.valueAsserter(model).result()
          } catch (e) {
            if (e instanceof BrowserMonkeyAssertionError) {
              isError = true
              return 'Error: ' + e.message
            } else {
              throw e
            }
          }

          try {
            valueAsserter()
          } catch (e) {
            if (e instanceof BrowserMonkeyAssertionError) {
              isError = true
              return e.actual === undefined ? 'Error: ' + e.message : e.actual
            } else {
              throw e
            }
          }

          return model
        },

        function: (query, model) => {
          try {
            runModelFunction(model, query)
            return model
          } catch (e) {
            if (e instanceof BrowserMonkeyAssertionError) {
              isError = true
              return 'Error: ' + e.message
            } else {
              throw e
            }
          }
        }
      }

      const clone = this.resolve(elements)
      const result = mapModel(clone, model, actions)

      if (isError) {
        this.error('could not match', {expected: model, actual: result})
      }
    })
  }

  public index (index: number): this {
    return this.transform(function (elements) {
      return new ExecutedSimpleTransform([elements[index]], 'index ' + index)
    })
  }

  public define (name, finder): this {
    if (typeof finder === 'function') {
      this._options.definitions.fields[name] = finder
    } else if (typeof finder === 'string') {
      this._options.definitions.fields[name] = q => q.find(finder)
    } else if (name.constructor === Object && finder === undefined) {
      Object.entries(name).forEach(([name, finder]) => this.define(name, finder))
    }

    return this
  }

  public setter (model): this {
    return this.firstOf(this._options.definitions.fieldTypes.filter(def => def.setter).map(def => {
      return query => def.setter(query, model)
    }))
  }

  public valueAsserter (expected: any): this {
    return this.firstOf(this._options.definitions.fieldTypes.filter(def => def.value).map(def => {
      return query => def.valueAsserter
        ? def.valueAsserter(query, expected)
        : def.value(query).transform(actual => {
          return () => {
            if (!testEqual(actual, expected)) {
              this.error('expected ' + inspect(actual) + ' to equal ' + inspect(expected), { actual, expected })
            }
          }
        })
    }))
  }

  public defineFieldType (fieldTypeDefinition: FieldType): void {
    this._options.definitions.fieldTypes.unshift(fieldTypeDefinition)
  }

  public containing (model: any): this {
    return this.transform(elements => {
      const actions = {
        arrayLengthError: (query, actualLength, expectedLength) => {
          query.error('expected ' + expectedLength + ' ' + pluralize('elements', expectedLength) + ', found ' + actualLength)
        },

        value: (query, value) => {
          const valueAsserter = query.valueAsserter(value).result()
          valueAsserter()
        },

        expectOne: (query) => {
          query.expectOne().result()
        },

        function: (query, fn) => {
          runModelFunction(fn, query)
        }
      }

      return new ExecutedSimpleTransform(elements.filter(element => {
        try {
          const clone = this.resolve([element])
          mapModel(clone, model, actions)
          return true
        } catch (e) {
          if (e instanceof BrowserMonkeyAssertionError) {
            return false
          } else {
            throw e
          }
        }
      }), `containing(${JSON.stringify(model)})`)
    })
  }

  public value (): this {
    return this.firstOf(this._options.definitions.fieldTypes.filter(def => def.value).map(def => {
      return query => def.value(query)
    }))
  }

  public installSetters (): this {
    this.define('css', (query, css) => query.css(css))

    this.defineFieldType({
      value: (query) => {
        return query.expectOneElement().transform(([element]) => {
          return query._dom.elementInnerText(element)
        })
      }
    })

    this.defineFieldType({
      setter: (query, value) => {
        return query
          .is(inputSelectors.settable)
          .expectOneElement()
          .transform(([element]) => {
            if (typeof value !== 'string') {
              throw new Error('expected string as argument to set input')
            }
            return () => {
              debug('set', element, value)
              query._dom.enterText(element, value, {incremental: false})
            }
          })
      },
      value: (query) => {
        return query.is(inputSelectors.gettable).expectOneElement().transform(([input]) => {
          return input.value
        })
      }
    })

    this.defineFieldType({
      setter: (query, value) => {
        return query
          .is('select')
          .expectOneElement('expected to be select element')
          .css('option')
          .filter(o => {
            return o.value === value || query._dom.elementInnerText(o) === value
          }, `option with text or value ${JSON.stringify(value)}`)
          .expectOneElement(`expected one option element with text or value ${JSON.stringify(value)}`)
          .transform(function ([option]) {
            return () => {
              const selectElement = option.parentNode
              debug('select', selectElement)
              query._dom.selectOption(selectElement, option)
            }
          })
      },
      valueAsserter: (query, expected) => {
        return query
          .is('select')
          .expectOneElement('expected to be select element')
          .transform(([select]) => {
            return () => {
              const value = select.value

              if (testEqual(value, expected)) {
                return
              }

              const selectedOption = select.options[select.selectedIndex]
              if (selectedOption) {
                const actual = query._dom.elementInnerText(selectedOption)
                if (testEqual(actual, expected)) {
                  return
                } else {
                  this.error('expected ' + inspect(actual) + ' or ' + inspect(value) + ' to equal ' + inspect(expected), { actual, expected })
                }
              }

              this.error('expected ' + inspect(value) + ' to equal ' + inspect(expected), { actual: value, expected })
            }
          })
      },
      value: (query) => {
        return query
          .is('select')
          .expectOneElement('expected to be select element')
          .transform(([select]) => {
            const selectedOption = select.options[select.selectedIndex]
            return selectedOption && query._dom.elementInnerText(selectedOption)
          })
      }
    })

    this.defineFieldType({
      setter: (query, value) => {
        return query
          .is('input[type=checkbox]')
          .expectOneElement()
          .transform(([checkbox]) => {
            if (typeof value !== 'boolean') {
              throw new Error('expected boolean as argument to set checkbox')
            }
            return () => {
              if (query._dom.checked(checkbox) !== value) {
                debug('checkbox', checkbox, value)
                query._dom.click(checkbox)
              }
            }
          })
      },
      value: (query) => {
        return query
          .is('input[type=checkbox]')
          .expectOneElement()
          .transform(([checkbox]) => {
            return query._dom.checked(checkbox)
          })
      }
    })

    return this
  }

  public css (selector: string): this {
    const findElements = this.transform(elements => {
      expectElements(elements)
      return new ExecutedSimpleTransform(flatten(elements.map(element => {
        return this._dom.querySelectorAll(element, selector, this._options)
      })), 'find(' + inspect(selector) + ')')
    })

    return findElements
  }

  public find (selector: string): this {
    // name(value)
    const match = /^\s*(.*?)\s*(\((.*)\)\s*)?$/.exec(selector)

    if (match) {
      const [, name,, value] = match
      const finder = this._options.definitions.fields[name]

      if (finder) {
        if (value !== undefined) {
          return finder(this, value.trim())
        } else {
          return finder(this)
        }
      }
    }

    return this.css(selector)
  }

  public is (selector: string): this {
    return this.filter(element => {
      return this._dom.elementMatches(element, selector)
    }, 'is: ' + selector)
  }
}

function expectElements (elements): void {
  if (!isArrayOfHTMLElements(elements)) {
    throw new BrowserMonkeyAssertionError('expected an array of HTML elements')
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

function isIframe (element): boolean {
  return isHTMLElement(element, 'HTMLIFrameElement')
}

function isHTMLElement (element, subclass: string = 'HTMLElement'): boolean {
  if (element.ownerDocument && element.ownerDocument.defaultView) {
    // an element inside an iframe
    return element instanceof element.ownerDocument.defaultView[subclass]
  } else {
    return false
  }
}

function isArrayOfHTMLElements (elements): boolean {
  return elements instanceof Array &&
    elements.every(element => {
      return isHTMLElement(element)
    })
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

function runModelFunction(fn: (Query) => Query, query: Query): void {
  const result = fn(query)
  if (result && typeof result.then === 'function') {
    query.error('model functions must not be asynchronous')
  }
}

const missing = {}

function expectLength (query, length): Query {
  return query.expect(elements => {
    const actualLength = elements.length
    if (actualLength !== length) {
      query.error('expected ' + length + ' ' + pluralize('elements', length) + ', found ' + actualLength)
    }
  })
}

interface Actions {
  arrayLengthError (q: Query, actual: number, expected: number): void
  function (q: Query, model: any): any
  value (q: Query, model: any): any
  expectOne (q: Query): any
}

function spliceModelArrayFromActual (model, query: Query, actions: Actions): any[] {
  const length = query.result().length

  if (length > model.length) {
    actions.arrayLengthError(query, length, model.length)
    return range(0, length).map((item, index) => {
      const modelItem = model[index]

      if (modelItem !== undefined) {
        return modelItem
      } else {
        return missing
      }
    })
  } else if (length < model.length) {
    actions.arrayLengthError(query, length, model.length)
    return model.slice(0, length)
  } else {
    return model
  }
}

function mapModel (query: Query, model: any, actions: Actions): any {
  function map (query: Query, model: any): any {
    if (model === missing) {
      return query.result().map(e => e.innerText).join()
    } else if (model instanceof Array) {
      return spliceModelArrayFromActual(model, query, actions).map((item, index) => {
        return map(query.index(index), item)
      })
    } else if (model.constructor === Object) {
      const lengthQuery = expectLength(query, 1)

      const entries = Object.entries(model)

      if (entries.length) {
        return object(entries.map(([selector, value]) => {
          return [selector, map(lengthQuery.find(selector), value)]
        }))
      } else {
        return actions.expectOne(query)
      }
    } else if (typeof model === 'function') {
      return actions.function(query, model)
    } else {
      return actions.value(expectLength(query, 1), model)
    }
  }

  return map(query, model)
}

function testEqual (actual: any, expected: any): boolean {
  return expected instanceof RegExp ? expected.test(actual) : actual === expected
}

interface Options {
  visibleOnly: boolean
  timeout: number
  interval: number
  definitions: Definitions
}

module.exports = Query
