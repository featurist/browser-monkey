import { ExecutedTransform } from './ExecutedTransform'
import { ExecutedTransformPath } from './ExecutedTransformPath'
import { ExecutedSimpleTransform } from './ExecutedSimpleTransform'
import { ExecutedConcatTransform } from './ExecutedConcatTransform'
import { ExecutedContainingTransform } from './ExecutedContainingTransform'
import { ExecutedFirstOfTransform } from './ExecutedFirstOfTransform'
import { ExecutedDetectTransform } from './ExecutedDetectTransform'
import { ExecutedTransformError } from './ExecutedTransformError'
import Dom from './Dom'
import BrowserMonkeyAssertionError from './BrowserMonkeyAssertionError'
import toExecutedTransform from './toExecutedTransform'
import pluralize from 'pluralize'
import extend from 'lowscore/extend'
import retry from './retry'
import inspect from 'object-inspect'
import uniq from 'lowscore/uniq'
const debug = require('debug')('browser-monkey')
import inputSelectors from './inputSelectors'
import object from 'lowscore/object'
import range from 'lowscore/range'
import flatten from 'lowscore/flatten'
import {match} from './match'
import * as matchers from './matchers'

type Transform = (elements: Array<HTMLElement>, executedTransforms: ExecutedTransform[]) => any
type Action = (elements: Array<HTMLElement>, executedTransforms: ExecutedTransform[]) => void
interface InputDefinition {
  values?: (query: Query) => Query
  setter?: (query: Query, value: any) => Query
  valueAsserters?: (query: Query, expected: any) => Query
}

type Match = {
  isMatch: boolean,
  actual: any,
  expected: any,
}

type FieldName = string | RegExp
type FieldFinderDefinition = (query: Query, name: FieldName) => Query
type FinderDefinition = (query: Query, ...any) => Query

type LiteralModel = string | RegExp | boolean
type FunctionModel = (query: Query) => void
type Model = LiteralModel | FunctionModel | { [key: string]: Model } | Model[]

interface Definitions {
  inputs: InputDefinition[]
  buttons: FieldFinderDefinition[]
  fields: ({name: string, definition: FieldFinderDefinition})[]
  finders: {
    [key: string]: FinderDefinition
  }
}

const missing = {}

export class Query implements Promise<any> {
  private _transforms: Transform[]
  private _options: Options
  private _input: [HTMLElement]
  private _actionExecuted = false
  private _action: Action
  private _hasExpectation = false
  private _dom: Dom

  public constructor (input: HTMLElement = document.body) {
    this._transforms = []
    this._options = {
      visibleOnly: true,
      timeout: 1000,
      interval: 10,
      definitions: {
        inputs: [
          {
            setter: (query: Query, value) => {
              return query
                .is('input[type=checkbox]')
                .shouldHaveElements(1)
                .transform(([checkbox]) => {
                  if (typeof value !== 'boolean') {
                    throw new Error('expected boolean as argument to set checkbox')
                  }
                  return () => {
                    if (query._dom.checked(checkbox as HTMLInputElement) !== value) {
                      debug('checkbox', checkbox, value)
                      query._dom.click(checkbox)
                    }
                  }
                })
            },
            values: (query: Query) => {
              return query
                .is('input[type=checkbox]')
                .map((checkbox) => {
                  return query._dom.checked(checkbox)
                })
            }
          },
          {
            setter: (query: Query, value) => {
              return query
                .is('select')
                .shouldHaveElements(1, 'expected to be select element')
                .findCss('option')
                .filter(o => {
                  return match(o.value, value).isMatch || match(query._dom.elementInnerText(o), value).isMatch
                }, `option with text or value ${JSON.stringify(value)}`)
                .shouldHaveElements(1, `expected one option element with text or value ${JSON.stringify(value)}`)
                .transform(([option]) => {
                  return () => {
                    const selectElement = option.parentNode
                    debug('select', selectElement)
                    query._dom.selectOption(selectElement as HTMLSelectElement, option as HTMLOptionElement)
                  }
                })
            },
            valueAsserters: (query: Query, expected) => {
              return query
                .is('select')
                .map((select) => {
                  return () => {
                    const value = select.value

                    const matchValue = match(expected, value)

                    if (matchValue.isMatch) {
                      return matchValue
                    }

                    const selectedOption = select.options[select.selectedIndex]
                    if (selectedOption) {
                      const actual = query._dom.elementInnerText(selectedOption)
                      const matchText = match(expected, actual)

                      if (matchText.isMatch) {
                        return matchText
                      } else {
                        return {
                          isMatch: false,
                          actual,
                          expected,
                        }
                      }
                    }

                    return {
                      isMatch: false,
                      actual: value,
                      expected,
                    }
                  }
                })
            },
            values: (query: Query) => {
              return query
                .is('select')
                .map((select) => {
                  const selectedOption = select.options[select.selectedIndex]
                  return selectedOption && query._dom.elementInnerText(selectedOption)
                })
            }
          },
          {
            setter: (query: Query, value) => {
              return query
                .is(inputSelectors.settable)
                .shouldHaveElements(1)
                .transform(([element]) => {
                  if (typeof value !== 'string') {
                    throw new Error('expected string as argument to set input')
                  }
                  return () => {
                    debug('set', element, value)
                    query._dom.enterText(element as HTMLInputElement, value, {incremental: false})
                  }
                })
            },
            values: (query: Query) => {
              return query.is(inputSelectors.gettable).map((input) => {
                return input.value
              })
            }
          },
          {
            values: (query: Query) => {
              return query.map((element) => {
                return query._dom.elementInnerText(element)
              })
            }
          },
        ],
        buttons: [
          (query: Query, name) => {
            return query.findCss('button, input[type=button], input[type=submit], input[type=reset], a').containing(name)
          },
        ],
        fields: [
          {
            name: 'label',
            definition: (query: Query, name) => {
              return query.find('label').containing(name).find('input')
            },
          },
          {
            name: 'label-for',
            definition: (query: Query, name) => {
              return query.find('label[for]').containing(name).map(label => {
                const id = label.getAttribute('for')
                return label.ownerDocument.getElementById(id)
              }, 'for attribute').filter(Boolean)
            },
          },
          {
            name: 'aria-label',
            definition: (query: Query, name) => {
              return query.find('[aria-label]').filter(element => {
                const label = element.getAttribute('aria-label')
                return match(label, name).isMatch
              }, 'aria-label')
            },
          },
          {
            name: 'aria-labelledby',
            definition: (query: Query, name) => {
              return query.find('[aria-labelledby]').filter(element => {
                const id = element.getAttribute('aria-labelledby')
                const labelElement = element.ownerDocument.getElementById(id)
                if (labelElement) {
                  return match(query._dom.elementInnerText(labelElement), name).isMatch
                }
              }, 'aria-label')
            },
          },
          {
            name: 'placeholder',
            definition: (query: Query, name) => {
              return query.find(inputSelectors.gettable).containing(matchers.elementAttributes({
                placeholder: name,
              }))
            },
          },
        ],
        finders: {
          Field: (q: Query, value) => q.findLabel(value),
          Button: (q: Query, value) => q.findButton(value),
          Css: (q: Query, value) => q.findCss(value),
        },
      }
    }
    this._dom = new Dom()

    this._input = [input]
  }

  public get [Symbol.toStringTag](): string {
    return 'Query';
  }

  public transform (transform: Transform): Query {
    return this.clone(clone => clone._transforms.push(transform))
  }

  public expect (expectation: (any) => void): Query {
    const expectQuery = this.transform(function (value) {
      expectation.call(this, value)
      return value
    })

    expectQuery._hasExpectation = true

    return expectQuery
  }

  public action (action: Action): Query {
    if (this._action) {
      throw new Error('can only have one action')
    }

    return this.clone(clone => {
      clone._action = action
    })
  }

  public findButton (name: FieldName): Query {
    return this.concat(this._options.definitions.buttons.map(definition => {
      return (q: Query): Query => {
        return definition(q, name)
      }
    }))
  }

  public findLabel (name: string): Query {
    return this.concat(this._options.definitions.fields.map(({definition}) => {
      return (q: Query): Query => {
        return definition(q, name)
      }
    }))
  }

  public defineButtonFinder (name: string | FieldFinderDefinition, definition?: FieldFinderDefinition): Query {
    if (!definition) {
      definition = name as FieldFinderDefinition
      name = undefined
    }

    return this.clone(q => q._options.definitions.buttons.push(definition))
  }

  public undefineButtonFinder (name: string): Query {
    return this.clone(q => {
      const index = q._options.definitions.buttons.findIndex(def => def.name === name)
      if (index >= 0) {
        q._options.definitions.buttons.splice(index, 1)
      } else {
        throw new Error(`field definition ${JSON.stringify(name)} doesn't exist`)
      }
    })
  }

  public defineFieldFinder (name: string | FieldFinderDefinition, definition?: FieldFinderDefinition): Query {
    if (!definition) {
      definition = name as FieldFinderDefinition
      name = undefined
    }

    return this.clone(q => q._options.definitions.fields.push({name: name as string, definition}))
  }

  public undefineFieldFinder (name: string): Query {
    return this.clone(q => {
      const index = q._options.definitions.fields.findIndex(def => def.name === name)
      if (index >= 0) {
        q._options.definitions.fields.splice(index, 1)
      } else {
        throw new Error(`field definition ${JSON.stringify(name)} doesn't exist`)
      }
    })
  }

  // TODO: try removing any
  public result (): any {
    return this.execute().value
  }

  public resolve (input: any): Query {
    const resolved = this.clone()
    resolved._input = input
    resolved._transforms = []
    return resolved
  }

  public map (map: (a: any) => any, description?: string): Query {
    return this.transform((elements) => {
      return new ExecutedSimpleTransform(elements.map(map), description)
    })
  }

  public filter (filter: (a: any) => boolean, description?: string): Query {
    return this.transform((elements) => {
      return new ExecutedSimpleTransform(elements.filter(filter), description)
    })
  }

  public concat (queryCreators: ((q: Query) => Query)[]): Query {
    return this.transform((elements) => {
      const resolved = this.resolve(elements)

      const transforms = queryCreators.map(queryCreator => runQueryCreator(queryCreator, resolved).execute())

      const value = uniq(Array.prototype.concat.apply([], transforms.map(t => t.value)))
      return new ExecutedConcatTransform(value, transforms)
    })
  }

  public error (message: string, {expected = undefined, actual = undefined} = {}): void {
    throw new BrowserMonkeyAssertionError(message, { expected, actual })
  }

  private execute (): ExecutedTransformPath {
    const transformPath = new ExecutedTransformPath(this._input)

    try {
      this._transforms.forEach(transform => {
        const executedTransform = toExecutedTransform(transform.call(this, transformPath.value, transformPath.transforms))
        transformPath.addTransform(executedTransform)
      })

      if (this._action && !this._actionExecuted) {
        this._action(transformPath.value, transformPath.transforms)
        this._actionExecuted = true
      }

      return transformPath
    } catch (e) {
      if (e instanceof BrowserMonkeyAssertionError) {
        e.prependExecutedTransforms(transformPath)
      }

      throw e
    }
  }

  public firstOf (queryCreators: ((q: Query) => Query)[]): Query {
    const transformed = this.transform((elements) => {
      const resolved = this.resolve(elements)

      const values = queryCreators.map(query => {
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

      const firstSuccessIndex = values.findIndex(v => {
        return !v.error
      })

      const firstSuccess = values[firstSuccessIndex]

      const transform = new ExecutedFirstOfTransform(firstSuccess ? firstSuccess.value.value : [], firstSuccessIndex, values.map(v => v.error || v.value))

      if (firstSuccess) {
        return transform
      } else {
        const error = new BrowserMonkeyAssertionError('all queries failed in firstOf')
        error.addExecutedTransform(transform)
        throw error
      }
    })

    transformed._hasExpectation = true

    return transformed
  }

  public detect (queryCreators: {[key: string]: (q: Query) => Query}): Query {
    const transformed = this.transform((elements) => {
      const resolved = this.resolve(elements)

      const entries = Object.keys(queryCreators).map(key => {
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

      const firstSuccessIndex = entries.findIndex(v => {
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
        const error = new BrowserMonkeyAssertionError('all queries failed in detect')
        error.addExecutedTransform(transform)
        throw error
      }
    })

    transformed._hasExpectation = true

    return transformed
  }

  public options (options: Options): Query {
    return this.clone(q => extend(q._options, options))
  }

  public getOptions (): Options {
    return this._options
  }

  private assertHasActionOrExpectation (): void {
    if (!this._hasExpectation && !this._action) {
      throw new Error('no expectations or actions in query, use .result(), or add an expectation or an action')
    }
  }

  public then (resolve?: (r) => any, reject?: (e) => any): Promise<any> {
    this.assertHasActionOrExpectation()

    const retry = retryFromOptions(this._options)

    let retries = 0
    const startTime = new Date()

    const promise = Promise.resolve(retry(() => {
      retries++
      return this.execute().value
    })).catch(error => {
      if (error instanceof BrowserMonkeyAssertionError) {
        error.retries = retries
        error.duration = Number(new Date()) - Number(startTime)
        error.rewriteMessage()

        if (debug.enabled) {
          debug('assertion error', error.message)
          error.executedTransforms.transforms.forEach(transform => {
            transform.print()
          })
        }
      }

      throw error
    })

    return promise.then.call(promise, resolve, reject)
  }

  public catch (fn): Promise<void> {
    return this.then(undefined, fn)
  }

  public finally (fn): Promise<any> {
    return this.then(
      async r => {
        await fn()
        return r
      },
      async e => {
        await fn()
        throw e
      })
  }

  private clone (modifier?: (clone: Query) => void): Query {
    const clone = new (this.constructor as any)()
    clone.copyQueryFields(this)
    if (modifier) {
      modifier(clone)
    }
    return clone
  }

  // TODO: why is this public?
  public input (value): Query {
    return this.clone(q => q._input = value)
  }

  // TODO: rename `input`/`getInput` to something better
  public getInput (): [HTMLElement] {
    return this._input
  }

  private copyQueryFields (from: Query): void {
    this._transforms = from._transforms.slice()
    this._input = from._input

    this._hasExpectation = from._hasExpectation

    this._options = extend({}, from._options)
    this._options.definitions = cloneDefinitions(from._options.definitions)
  }

  public shouldHaveElements (count: number, message?: string): Query {
    return this.expect(elements => {
      if (elements.length !== count) {
        this.error(message || `expected ${count} ${pluralize('elements', count)}, found ` + elements.length)
      }
    })
  }

  public shouldExist (message?: string): Query {
    return this.expect(elements => {
      if (elements.length < 1) {
        this.error(message || 'expected one or more elements, found ' + elements.length)
      }
    })
  }

  public shouldNotExist (message?: string): Query {
    return this.expect(elements => {
      if (elements.length !== 0) {
        this.error(message || 'expected no elements, found ' + elements.length)
      }
    })
  }

  public elementResult (): HTMLElement {
    return this.shouldHaveElements(1).result()[0]
  }

  public elementsResult (): HTMLElement {
    return this.shouldExist().result()
  }

  public click (selector?: string): Query {
    return this.optionalSelector(selector).shouldHaveElements(1).action(([element]) => {
      debug('click', element)
      this._dom.click(element)
    })
  }

  public clickButton (name: FieldName): Query {
    return this.findButton(name).click()
  }

  public submit (selector?: string): Query {
    return this.optionalSelector(selector)
      .shouldHaveElements(1)
      .expect(([element]) => {
        if (!element.form) {
          throw new BrowserMonkeyAssertionError('expected element to be inside a form for submit')
        }
      })
      .action(([element]) => {
        debug('submit', element)
        this._dom.submit(element as HTMLInputElement)
      })
  }

  public enterText (selector: string, text?: string | string[]): Query {
    if (text === undefined) {
      text = selector
      selector = undefined
    }

    return this.optionalSelector(selector)
      .shouldHaveElements(1)
      .is(inputSelectors.settable)
      .action(([element]) => {
        debug('enterText', element, text)
        this._dom.enterText(element as HTMLInputElement, text)
      })
  }

  public scope (element: HTMLElement): Query {
    return this.input([element])
  }

  public mount (mount: {mount: (query: Query) => Query}): Query {
    return mount.mount(this)
  }

  public iframe (selector?: string): Query {
    return this.optionalSelector(selector).transform(elements => {
      return new ExecutedSimpleTransform(elements.map(element => {
        if (isIframe(element)) {
          if (element.contentDocument && element.contentDocument.readyState === 'complete') {
            return element.contentDocument.body
          } else {
            throw new BrowserMonkeyAssertionError('iframe not loaded')
          }
        } else {
          throw new BrowserMonkeyAssertionError('not iframe')
        }
      }), 'iframe.contentDocument')
    })
  }

  public enabled (): Query {
    return this.filter(element => {
      const tagName = element.tagName
      return !((tagName === 'BUTTON' || tagName === 'INPUT') && element.disabled)
    }, 'enabled')
  }

  public set (model: Model): Query {
    return this.action(elements => {
      const setters = []

      const actions = {
        arrayLengthError: (query: Query, actualLength, expectedLength): void => {
          query.error('expected ' + expectedLength + ' ' + pluralize('elements', expectedLength) + ', found ' + actualLength)
        },

        value: (query: Query, model): ActualExpected => {
          const setter = query.shouldHaveElements(1).setter(model).result()
          setters.push(() => setter())
          return {
            actual: undefined,
            expected: undefined,
          }
        },

        expectOne: (query: Query): ActualExpected => {
          query.shouldHaveElements(1).result()
          return {
            actual: {},
            expected: {},
          }
        },

        function: (query: Query, model): ActualExpected => {
          setters.push(() => this.runModelFunction(model, query))
          return {
            actual: undefined,
            expected: undefined,
          }
        }
      }

      const clone = this.resolve(elements)
      clone.mapModel(model, actions)

      setters.forEach(set => {
        set()
      })
    })
  }

  public async shouldAppearAfter (action: () => void): Promise<void> {
    await this.shouldNotExist()
    await action()
    await this.shouldExist()
  }

  public async shouldDisappearAfter (action: () => void): Promise<void> {
    await this.shouldExist()
    await action()
    await this.shouldNotExist()
  }

  public shouldContain (model: Model): Query {
    return this.expect(elements => {
      let isError = false

      const actions = {
        arrayLengthError: (): void => {
          isError = true
        },

        expectOne: (query: Query): ActualExpected => {
          try {
            query.shouldHaveElements(1).result()
            return {actual: {}, expected: {}}
          } catch (e) {
            if (e instanceof BrowserMonkeyAssertionError) {
              isError = true
              return {
                actual: 'Error: ' + e.message,
                expected: {},
              }
            } else {
              throw e
            }
          }
        },

        value: (query: Query, model): ActualExpected => {
          const match = query.matchValue(model)

          if (!match.isMatch) {
            isError = true
          }

          return match
        },

        function: (query: Query, model): ActualExpected => {
          try {
            this.runModelFunction(model, query)
            return {
              actual: model,
              expected: model,
            }
          } catch (e) {
            if (e instanceof BrowserMonkeyAssertionError) {
              isError = true
              return {
                actual: e.actual,
                expected: e.expected,
              }
            } else {
              throw e
            }
          }
        }
      }

      const clone = this.resolve(elements)
      const result = clone.mapModel(model, actions)

      if (isError) {
        this.error('could not match', {expected: result.expected, actual: result.actual})
      }
    })
  }

  public index (index: number): Query {
    return this.transform(elements => {
      if (elements.length <= index) {
        this.error(`index(${index}) where there are only ${elements.length} elements`)
      }
      return new ExecutedSimpleTransform([elements[index]], 'index ' + index)
    })
  }

  public define (name: string | Object, finderDefinition?: FinderDefinition | string): this {
    if (typeof finderDefinition === 'function') {
      this._options.definitions.finders[name as string] = finderDefinition
    } else if (typeof finderDefinition === 'string') {
      this._options.definitions.finders[name as string] = q => q.find(finderDefinition)
    } else if (name.constructor === Object && finderDefinition === undefined) {
      Object.keys(name).forEach(key => this.define(key, name[key]))
    }

    return this
  }

  private setter (value): Query {
    return this.firstOf(this._options.definitions.inputs.filter(def => def.setter).map(def => {
      return query => def.setter(query, value)
    }))
  }

  private valueAsserters (expected: any): Query {
    return this.transform(elements => {
      const definitions = this._options.definitions.inputs.filter(def => def.values || def.valueAsserters)

      const asserters = elements.map(element => {
        const queryOfOneElement = this.resolve([element])

        const firstAsserterForElement = definitions.map(def => {
          const definitionAsserters = def.valueAsserters
            ? def.valueAsserters(queryOfOneElement, expected)
            : def.values(queryOfOneElement).transform(actuals => {
              return actuals.map(actual => () => {
                return match(actual, expected)
              })
            })

          return definitionAsserters.result()[0]
        })

        return firstAsserterForElement.find(Boolean)
      }).filter(Boolean)

      return asserters
    })
  }

  public defineInput (inputDefinition: InputDefinition): void {
    this._options.definitions.inputs.unshift(inputDefinition)
  }

  public containing (model: Model): Query {
    return this.transform(elements => {
      const actions = {
        arrayLengthError: (query: Query, actualLength, expectedLength): void => {
          query.error('expected ' + expectedLength + ' ' + pluralize('elements', expectedLength) + ', found ' + actualLength)
        },

        value: (query: Query, model): ActualExpected => {
          const match = query.matchValue(model)

          if (!match.isMatch) {
            isError = true
          }

          return match
        },

        function: (query: Query, fn): ActualExpected => {
          this.runModelFunction(fn, query)
          return {actual: fn, expected: fn}
        }
      }

      let isError
      const failingActuals = []
      const matchingElements = []

      elements.forEach(element => {
        try {
          const clone = this.resolve([element])

          isError = false

          const match = clone.mapModel(model, actions)

          if (isError) {
            failingActuals.push(match.actual)
          } else {
            matchingElements.push(element)
          }
        } catch (e) {
          if (e instanceof BrowserMonkeyAssertionError) {
            failingActuals.push({
              isMatch: false,
              actual: e.actual,
              expected: e.expected,
            })
          } else {
            throw e
          }
        }
      })

      return new ExecutedContainingTransform(matchingElements, model, matchingElements.length ? undefined : failingActuals)
    })
  }

  public values (): Query {
    return this.transform(elements => {
      const definitions = this._options.definitions.inputs.filter(def => def.values)

      const values = elements.map(element => {
        const queryOfOneElement = this.resolve([element])

        const value = definitions.map(def => {
          const values = def.values(queryOfOneElement).transform(actuals => {
            return actuals
          }).result()

          return values
        }).filter(vs => vs.length).map(vs => vs[0])[0]

        return value
      })

      return values
    })
  }

  public findCss (selector: string): Query {
    const findElements = this.transform(elements => {
      return new ExecutedSimpleTransform(flatten(elements.map(element => {
        return this._dom.querySelectorAll(element, selector, this._options)
      })), 'find(' + inspect(selector) + ')')
    })

    return findElements
  }

  public find (selector: string): Query {
    // name(arg1, arg2, ...)
    const match = /^\s*([$a-z_][0-9a-z_$]*)\s*(\((.*)\)\s*)?$/i.exec(selector)

    if (match) {
      const [, name,, value] = match
      const finder = this._options.definitions.finders[name]

      if (value !== undefined) {
        if (finder) {
          const func = new Function(`return [${value}]`)
          const args = func()
          return finder(this, ...args)
        } else {
          throw new Error('no such definition ' + name)
        }
      } else if (finder) {
        return finder(this)
      }
    }

    return this.findCss(selector)
  }

  public is (selector: string): Query {
    return this.filter(element => {
      return this._dom.elementMatches(element, selector)
    }, 'is: ' + selector)
  }

  private runModelFunction(fn: (query: Query) => any, query: Query): ExecutedTransform | undefined {
    const result = fn(query)
    if (result instanceof Query) {
      return result.execute()
    } else if (result && typeof result.then === 'function') {
      throw new Error('model functions must not be asynchronous')
    }
  }

  private optionalSelector (selector?: string): Query {
    return selector ? this.find(selector) : this
  }

  private matchValue(model: any): Match {
    const valueAsserters = this.valueAsserters(model).result()
    const results = valueAsserters.map(valueAsserter => valueAsserter())
    const success = results.find(r => r.isMatch)

    if (success) {
      return success
    } else {
      const actual = results.length === 1
        ? results[0].actual
        : results.length === 0
          ? undefined
          : results.map(r => r.actual)

      return {
        isMatch: false,
        actual,
        expected: model,
      }
    }
  }

  private mapModel (model: Model, actions: Actions): any {
    const map = (query: Query, model: any): any => {
      if (model === missing) {
        return {
          actual: query.result().map(e => this._dom.elementInnerText(e)).join(),
        }
      } else if (model instanceof Array) {
        const items = spliceModelArrayFromActual(model, query, actions).map((item, index) => {
          return map(query.index(index), item)
        })

        return {
          actual: items.map(i => i.actual),
          expected: arrayAssign(model, items.map(i => i.expected)),
        }
      } else if (model.constructor === Object) {
        const keys = Object.keys(model)

        if (keys.length) {
          const properties = keys.map(selector => {
            const value = model[selector]

            const {actual, expected} = map(query.find(selector), value)

            return [
              selector,
              actual,
              expected,
            ]
          })

          return {
            actual: object(properties.map(([key, actual]) => [key, actual])),
            expected: object(properties.map(([key, , expected]) => [key, expected])),
          }
        } else {
          return actions.expectOne(query)
        }
      } else if (typeof model === 'function') {
        return actions.function(query, model)
      } else {
        return actions.value(query, model)
      }
    }

    return map(this, model)
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

function isIframe (element: HTMLElement): element is HTMLIFrameElement {
  return (element as HTMLIFrameElement).contentWindow !== undefined
}

type Retry = <T>(fn: () => T, options?: {timeout?: number, interval?: number}) => Promise<T>

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

interface ActualExpected {actual: any, expected: any}

interface Actions {
  arrayLengthError (q: Query, actual: number, expected: number): void
  function (q: Query, model: any): ActualExpected
  value (q: Query, model: any): ActualExpected
  expectOne? (q: Query): ActualExpected
}

// TODO: try getting rid of any
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

// TODO: try getting rid of any
function arrayAssign (a: any[], b: any[]): any[] {
  return a.map((itemA, index) => {
    return index < b.length ? b[index] : itemA
  })
}

interface Options {
  visibleOnly?: boolean
  timeout?: number
  interval?: number
  definitions?: Definitions
  retry?: Retry
}
