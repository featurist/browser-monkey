/* global location */

const createTestDiv = require('../../lib/createTestDiv')
const browserMonkey = require('../..')
const $ = require('jquery')
const pathUtils = require('path')
const trytryagain = require('trytryagain')
const {expect} = require('chai')
  
module.exports = class DomAssembly {
  constructor () {
    this.delayedOperations = 0
    this.jQuery = $
  }

  div () {
    this._div = createTestDiv()
  }

  browserMonkey () {
    this.div()

    this.retry = () => {}

    return browserMonkey.scope(this._div).options({
      retry: (retry) => {
        return this.runRetry(retry)
      }
    })
  }

  async runRetry (fn) {
    if (!this._normalRetry) {
      return new Promise((resolve, reject) => {
        let first = true

        this.retry = () => {
          try {
            resolve(fn())
          } catch (e) {
            if (!this.delayedOperations && !first) {
              reject(e)
            }
          }
        }
        this.retry()
        first = false

        setTimeout(() => {
          const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(m => /^eventually/.test(m))
          reject(new Error('no delayed actions made, use one of ' + methods.join(', ')))
        }, 1000)
      })
    } else {
      return trytryagain(fn)
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
    return this.eventually(function () {})
  }

  eventually (fn) {
    this.delayedOperations++
    return new Promise(resolve => {
      setTimeout(() => {
        this.delayedOperations--
        var result = fn()
        this.retry()
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

  assertElementIsFocussed (element) {
    expect(document.activeElement).to.equal(element)
  }

  static hasDom () {
    return true
  }
}
