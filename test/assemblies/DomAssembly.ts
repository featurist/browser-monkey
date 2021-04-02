/* global location */

const createTestDiv = require('../../lib/createTestDiv')
const pathUtils = require('path')
import retry from '../../lib/retry'
const { expect } = require('chai')
import Dom from '../../lib/Dom'
import {Query} from '../../lib/Query'
const object = require('lowscore/object')
import inspect from 'object-inspect'

export class DomAssembly {
  private delayedOperations: number
  private retries: (() => void)[]
  private queuedRetries: number
  private dom: Dom
  private _div: HTMLElement
  private _normalRetry: boolean

  public constructor () {
    this.delayedOperations = 0
    this.retries = []
    this.queuedRetries = 0
    this.dom = new Dom()
    this._normalRetry = false
  }

  private createDiv (): void {
    this._div = createTestDiv()
  }

  public browserMonkey (): Query {
    this.createDiv()

    const browserMonkey = new Query(this._div)

    browserMonkey.options({
      retry: (fn) => {
        if (this._normalRetry) {
          return retry(fn)
        } else {
          return new Promise((resolve, reject) => {
            this.retries.push(() => {
              try {
                resolve(fn())
              } catch (e) {
                if (this.queuedRetries === 0) {
                  reject(e)
                }
              }
            })
            this.eventuallyDoNothing()
          })
        }
      }
    })
    return browserMonkey
  }

  public tick (): void {
    if (this._normalRetry) {
      return
    }

    if (this.retries.length) {
      this.queuedRetries--
      this.retries.forEach(r => r())
    } else {
      throw new Error('nothing retrying yet')
    }
  }

  public static localUrl (path): string {
    return location.protocol === 'file:'
      ? 'file://' + pathUtils.join(pathUtils.join(__dirname, '..'), path)
      : '/base/test/' + path
  }

  public useNormalRetry (): void {
    this._normalRetry = true
  }

  public findAll (css): HTMLElement[] {
    return Array.prototype.slice.call(this._div.querySelectorAll(css))
  }

  public find (css): HTMLElement {
    return this._div.querySelector(css)
  }

  public insertHtml (html, selector?: string): HTMLElement {
    const el = selector ? this._div.querySelector(selector) : this._div
    el.insertAdjacentHTML('beforeend', html)

    return el.lastElementChild as HTMLElement
  }

  public emptyHtml (): void {
    this._div.innerHTML = ''
  }

  public eventuallyDoNothing (): void {
    this.eventually(() => { /* do nothing */ })
  }

  public eventually <T>(fn: () => T): Promise<T> {
    if (!this._normalRetry && !this.retries.length) {
      throw new Error('nothing retrying yet, start retrying by calling .then() on a query')
    }

    this.queuedRetries++

    return new Promise((resolve) => {
      setTimeout(() => {
        const result = fn()
        this.tick()
        resolve(result)
      }, 0)
    })
  }

  public async eventuallyDeleteHtml (selector: string): Promise<void> {
    await this.eventually(() => {
      this._div.querySelector(selector).remove()
    })
  }

  public async eventuallyInsertHtml (html: string, selector?: string): Promise<HTMLElement> {
    return await this.eventually(() => {
      return this.insertHtml(html, selector)
    })
  }

  public assertElementIsFocussed (element): void {
    expect(document.activeElement).to.equal(element)
  }

  public assertRejection (promise: Promise<any>, expectedMessage, {assertMetrics = false} = {}): Promise<void> {
    return promise.then(() => {
      throw new Error('expected rejection ' + inspect(expectedMessage))
    }, e => {
      const message = assertMetrics
        ? e.message
        : e.message.replace(/ \[waited \d+ms, retried \d+ times\]/, '')

      if (expectedMessage instanceof RegExp ? !expectedMessage.test(message) : message.indexOf(expectedMessage) === -1) {
        throw new Error('expected error message ' + inspect(message) + ' to include ' + inspect(expectedMessage))
      }
    })
  }

  public async assertExpectedActual (query: Query, expected: any, actual: any, finalExpected?: any): Promise<void> {
    await query.shouldContain(expected).then(() => {
      throw new Error('expected rejection')
    }, e => {
      expect(e.message).to.contain('could not match')
      const actualWithErrorsAsStrings = deepMap(e.actual, value => {
        if (value instanceof Error) {
          return value.toString()
        } else {
          return value
        }
      })
      expect(actualWithErrorsAsStrings).to.eql(actual)
      expect(e.expected).to.eql(finalExpected || expected)
    })
  }

  public static hasDom (): boolean {
    return true
  }

  public stop (): void {
    if (this._div) {
      this._div.parentNode.removeChild(this._div)
    }
  }
}

function deepMap (obj: any, mapper: (any, index?: number | string) => any): any {
  function map (obj: any, index?: number | string): any {
    if (obj instanceof Array) {
      return obj.map((item, index) => map(item, index))
    } else if (obj && obj.constructor === Object) {
      return object(Object.keys(obj).map(key => [key, map(obj[key], key)]))
    } else {
      return mapper(obj, index)
    }
  }

  return map(obj)
}
