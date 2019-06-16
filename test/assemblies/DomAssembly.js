/* global location */

const createTestDiv = require('../../lib/createTestDiv')
const createBrowserMonkey = require('../../create')
const $ = require('jquery')
const pathUtils = require('path')
const trytryagain = require('trytryagain')
const { expect } = require('chai')
const inspect = require('object-inspect')

module.exports = class DomAssembly {
  constructor () {
    this.delayedOperations = 0
    this.jQuery = $
    this.retries = []
    this.delayedActions = []
    this.queuedRetries = 0
  }

  div () {
    this._div = createTestDiv()
  }

  browserMonkey () {
    this.div()

    const browserMonkey = createBrowserMonkey(this._div)

    browserMonkey.options({
      retry: (retry) => {
        if (this._normalRetry) {
          return trytryagain(retry)
        } else {
          return new Promise((resolve, reject) => {
            this.retries.push(() => {
              try {
                resolve(retry())
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

  tick () {
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

  localUrl (path) {
    return location.protocol === 'file:'
      ? 'file://' + path
      : '/base/' + pathUtils.relative(pathUtils.join(__dirname, '../..'), path)
  }

  useNormalRetry () {
    this._normalRetry = true
  }

  findAll (css) {
    return Array.prototype.slice.call(this._div.querySelectorAll(css))
  }

  find (css) {
    return this._div.querySelector(css)
  }

  insertHtml (html) {
    return $(html).appendTo(this._div).get(0)
  }

  eventuallyDoNothing () {
    this.eventually(() => {})
  }

  eventually (fn) {
    if (!this._normalRetry && !this.retries.length) {
      throw new Error('nothing retrying yet, start retrying by calling .then() on a query')
    }

    this.queuedRetries++

    return new Promise((resolve) => {
      setTimeout(() => {
        const result =fn()
        this.tick()
        resolve(result)
      }, 0)
    })
  }

  eventuallyDeleteHtml (selector) {
    return this.eventually(() => {
      $(selector).remove()
    })
  }

  eventuallyInsertHtml (html, selector) {
    return this.eventually(() => {
      var div = selector
        ? $(this._div).find(selector).get(0)
        : this._div

      return $(html).appendTo(div).get(0)
    })
  }

  eventuallyAppendHtml (element, html) {
    return this.eventually(() => {
      return $(html).appendTo(element).get(0)
    })
  }

  assertElementIsFocussed (element) {
    expect(document.activeElement).to.equal(element)
  }

  assertRejection (promise, expectedMessage) {
    return promise.then(() => {
      throw new Error('expected rejection ' + JSON.stringify(expectedMessage))
    }, e => {
      if (e.message.indexOf(expectedMessage) === -1) {
        throw new Error('expected error message ' + inspect(e.message) + ' to include ' + inspect(expectedMessage))
      }
    })
  }

  assertExpectedActual (query, expected, actual) {
    return query.assert(expected).then(() => {
      throw new Error('expected rejection')
    }, e => {
      expect(e.message).to.contain('could not match')
      expect(e.actual).to.eql(actual)
    })
  }

  static hasDom () {
    return true
  }
}
