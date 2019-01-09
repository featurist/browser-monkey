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
  }

  div () {
    this._div = createTestDiv()
  }

  browserMonkey () {
    this.div()

    this.retry = () => {}

    return createBrowserMonkey(this._div).options({
      retry: (retry) => {
        if (this._normalRetry) {
          return trytryagain(retry)
        } else {
          return new Promise((resolve, reject) => {
            const success = result => {
              resolve(result)
              const index = this.retries.indexOf(retrier)
              if (index !== -1) {
                this.retries.splice(index, 1)
              }
            }

            const retrier = () => {
              try {
                success(retry())
              } catch (e) {
                reject(e)
              }
            }

            this.retries.push(retrier)

            this.tick()
          })
        }
      }
    })
  }

  async tick () {
    if (this.ticking) {
      return
    }

    this.ticking = true

    await new Promise(resolve => setTimeout(resolve))

    this.delayedActions.forEach(action => action())
    this.delayedActions = []
    this.retries.slice().forEach(retry => retry())

    this.ticking = false
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
    return this.eventually(function () {})
  }

  eventually (fn) {
    this.tick()
    return new Promise(resolve => {
      this.delayedActions.push(() => {
        var result = fn()
        resolve(result)
      })
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
      throw new Error('expected rejection')
    }, e => {
      if (e.message.indexOf(expectedMessage) === -1) {
        throw new Error('expected error message ' + inspect(e.message) + ' to include ' + inspect(expectedMessage))
      }
    })
  }

  static hasDom () {
    return true
  }
}
