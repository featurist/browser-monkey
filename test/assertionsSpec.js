var assert = require('assert')
var expect = require('chai').expect
var demand = require('must')
var domTest = require('./domTest')

describe('assertions', function () {
  describe('shouldNotExist', function () {
    domTest("should ensure that element eventually doesn't exists", function (browser, dom) {
      dom.insert('<div class="removing"></div>')
      dom.insert('<div class="staying"></div>')

      var good = browser.find('.removing').shouldNotExist()
      var bad = browser.find('.staying').shouldNotExist()

      setTimeout(function () {
        dom.el.find('.removing').remove()
      }, 50)

      return Promise.all([
        good,
        demand(bad).reject.with.error()
      ])
    })

    domTest('allows trytryagain parameters to be used', function (browser, dom) {
      dom.insert('<div class="removing"></div>')

      var promise = browser.find('.removing').shouldNotExist({timeout: 500, interval: 100})

      setTimeout(function () {
        dom.el.find('.removing').remove()
      }, 50)

      return promise
    })

    domTest('stack trace', function (browser, dom) {
      dom.insert('<div></div>')

      return browser.find('div')
        .shouldNotExist()
        .assertStackTrace(__filename)
    }, {
      mochaOnly: true
    })
  })

  describe('shouldExist', function () {
    domTest('stack trace', function (browser, dom) {
      return browser.find('div')
        .shouldExist()
        .assertStackTrace(__filename)
    }, {
      mochaOnly: true
    })
  })

  describe('shouldFind', function () {
    domTest('stack trace', function (browser, dom) {
      return browser
        .shouldFind('div')
        .assertStackTrace(__filename)
    }, {
      mochaOnly: true
    })
  })

  describe('is', function () {
    domTest('should eventually find an element if it has a class', function (browser, dom) {
      var good = browser.find('.element').is('.good').shouldExist()
      var bad = browser.find('.element').is('.bad').shouldExist()

      setTimeout(function () {
        var element = dom.insert('<div class="element"></div>')

        setTimeout(function () {
          element.addClass('good')
        }, 10)
      }, 10)

      return Promise.all([good, demand(bad).reject.with.error()])
    })
  })

  domTest('eventually finds an element containing text', function (browser, dom) {
    var promise = browser.find('.element', {text: 'some t'}).shouldExist()
    dom.eventuallyInsert('<div class="element"><div>some text</div></div>')
    return promise
  })

  domTest('eventually finds an element containing text as it appears on the page', function (browser, dom) {
    var promise = browser.find('.element').shouldHave({text: 'This is some text that is all on one line.\nAnd some more on another line'})
/* eslint-disable no-multi-str */
    dom.eventuallyInsert('<div class="element"><div>\
    This\
    is\
    some\
    text\
    that is all on one line.\
    <br/>\
    And some more on another line.\
  </div></div>')
/* eslint-enable no-multi-str */
    return promise
  })

  domTest('eventually finds an element containing exactText', function (browser, dom) {
    var good = browser.find('.a', {exactText: '8'}).shouldExist()
    var bad = browser.find('.b', {exactText: '8'}).shouldExist()

    dom.eventuallyInsert('<div><div class="a">8</div><div class="b">28</div></div>')

    return Promise.all([
      good,
      demand(bad).reject.with.error()
    ])
  })

  domTest("treats assertion of text: '' as exact text", function (browser, dom) {
    dom.eventuallyInsert('<div><div class="a">something</div><div class="b"></div></div>')

    return browser.find('.a', {text: 'something'}).shouldExist().then(function () {
      return Promise.all([
        browser.find('.a', {text: ''}).shouldNotExist(),
        browser.find('.b', {text: ''}).shouldExist()
      ])
    })
  })

  describe('shouldHave', function () {
    domTest('stack trace', function (browser, dom) {
      dom.insert('<div>hello</div>')
      return browser.find('div')
        .shouldHave({text: 'something'})
        .assertStackTrace(__filename)
    }, {
      mochaOnly: true
    })

    domTest('eventually finds an element and asserts that it has text', function (browser, dom) {
      var good = browser.find('.element').shouldHave({text: 'some t'})
      var bad = browser.find('.element').shouldHave({text: 'sme t'})

      dom.eventuallyInsert('<div class="element"><div>some text</div></div>')

      return Promise.all([
        good,
        demand(bad).reject.with.error()
      ])
    })

    domTest('allows trytryagain parameters to be used', function (browser, dom) {
      var good = browser.find('.element').shouldHave({text: 'some t', timeout: 400, interval: 100})
      var bad = browser.find('.element').shouldHave({text: 'sme t'})

      dom.eventuallyInsert('<div class="element"><div>some text</div></div>')

      return Promise.all([
        good,
        demand(bad).reject.with.error()
      ])
    })

    domTest('finds duplicate text when asserting array of text', function (browser, dom) {
      dom.insert('<div class="element1">a</div>')
      dom.insert('<div class="element1">a</div>')

      return browser.find('.element1').shouldHave({text: ['a', 'a']})
    })

    domTest('eventually finds an element and asserts that it has value', function (browser, dom) {
      var good1 = browser.find('.element1 input').shouldHave({value: 'some t'})
      var good2 = browser.find('.element2 input').shouldHave({value: 0})
      var bad = browser.find('.element1 input').shouldHave({value: 'sme t'})

      dom.eventuallyInsert('<div class="element1"><input type=text value="some text" /></div>')
      dom.eventuallyInsert('<div class="element2"><input type=text value="0" /></div>')

      return Promise.all([
        good1,
        good2,
        demand(bad).reject.with.error()
      ])
    })

    domTest('error has a tip with suggestions for how to fix it', function (browser, dom) {
      dom.insert('<span>abc</span>')
      dom.insert('<span>bac</span>')
      dom.insert('<span>cba</span>')

      return browser.find('span').shouldHave({
        text: [
          'cba',
          'abc',
          'bac'
        ]
      }).catch(function (error) {
        demand(error.message).to.include('\nThe text was found but in a different order than specified - maybe you need some sorting?')
      })
    })

    domTest('error contains actual element text when no match found', function (browser, dom) {
      dom.insert('<span>abc</span>')
      dom.insert('<span>bac</span>')
      dom.insert('<span>c</span>')

      return browser.find('span').shouldHave({
        text: [
          'cba',
          'abc',
          'bac'
        ]
      }).catch(function (error) {
        demand(error.message).to.include("expected [ 'abc', 'bac', 'c' ]")
      })
    })

    domTest('finds an element with exact value', function (browser, dom) {
      var bad = browser.find('.element1 input').shouldHave({exactValue: 'some t'})
      var good = browser.find('.element1 input').shouldHave({exactValue: 'some text'})

      dom.eventuallyInsert('<div class="element1"><input type=text value="some text" /></div>')

      return Promise.all([
        good,
        demand(bad).reject.with.error()
      ])
    })

    domTest("treats assertion of value: '' as exact value", function (browser, dom) {
      var bad = browser.find('.element1 input').shouldHave({value: ''})
      var good = browser.find('.element2 input').shouldHave({value: ''})

      dom.eventuallyInsert('<div>\n' +
                             '<div class="element1"><input type=text value="some text" /></div>\n' +
                             '<div class="element2"><input type=text value="" /></div>\n' +
                           '</div>')

      return Promise.all([
        good,
        demand(bad).reject.with.error()
      ])
    })

    domTest('treats selects with no value as empty string', function (browser, dom) {
      dom.insert('<select></select>')

      var select = browser.find('select')

      return Promise.all([
        select.shouldHave({value: ''}),
        select.shouldHave({exactValue: ''})
      ])
    })

    domTest('recurses through a tree of assertions', function (browser, dom) {
      dom.insert('<div class="airport"><span class="date">Aug 2055</span><span class="text">LHR</span><span class="blank"></span></div>')
      return browser.component({
        airport: function () {
          return this.find('.airport').component({
            date: function () { return this.find('.date') },
            text: function () { return this.find('.text') },
            blank: function () { return this.find('.blank') }
          })
        }
      }).shouldHave({
        airport: {
          date: { exactText: 'Aug 2055' },
          text: { text: 'LHR' },
          blank: { text: undefined }
        }
      })
    })

    domTest('verifies attributes are present', function (browser, dom) {
      dom.insert('<a id="abc" href="/home">hello</a>')
      var good = browser.find('a').shouldHave({
        attributes: {
          id: 'abc',
          href: '/home'
        }
      })
      var bad = browser.find('a').shouldHave({
        attributes: {
          'class': 'other'
        }
      })
      return Promise.all([
        good,
        demand(bad).reject.with.error()
      ])
    })

    domTest('verifies array of attributes are present', function (browser, dom) {
      dom.insert('<div><img src="/a"/><img src="/b"/><img src="/c"/></div>')
      var good = browser.find('img').shouldHave({
        attributes: [
          {src: '/a'},
          {src: '/b'},
          {src: '/c'}
        ]
      })
      var bad = browser.find('img').shouldHave({
        attributes: [
          {src: '/c'},
          {src: '/a'},
          {src: '/b'}
        ]
      })
      return Promise.all([
        good,
        demand(bad).reject.with.error()
      ])
    })

    describe('exactText', function () {
      domTest('eventually finds elements that have the exact array of text', function (browser, dom) {
        var promise = browser.find('.element option').shouldHave({exactText: ['', 'Mr', 'Mrs']})

        dom.eventuallyInsert('<select class="element"><option></option><option>Mr</option><option>Mrs</option></select>')

        return promise
      })

      domTest('fails to find exact text', function (browser, dom) {
        var promise = browser.find('option').shouldHave({exactText: ['', 'Mr', 'Mrs']})

        dom.eventuallyInsert('<select><option>Optional</option><option>Mr</option><option>Mrs</option></select>')

        return demand(promise).reject.with.error()
      })
    })

    describe('checkboxes', function () {
      domTest('eventually finds a checked checkbox', function (browser, dom) {
        var good = browser.find('.checkbox').shouldHave({checked: true})

        var checkbox = dom.insert('<input class="checkbox" type=checkbox />')
        setTimeout(function () {
          checkbox.prop('checked', true)
        }, 20)

        return Promise.all([
          good
        ])
      })

      domTest('fails if only one of many checkboxes is checked', function (browser, dom) {
        var good = browser.find('.checkbox').shouldHave({checked: true})

        var checkbox = dom.insert('<input class="checkbox" type=checkbox />')
        dom.insert('<input class="checkbox" type=checkbox />')
        setTimeout(function () {
          checkbox.prop('checked', true)
        }, 20)

        return Promise.all([
          demand(good).reject.with.error()
        ])
      })

      domTest('ensures that each checkbox in the scope is either checked or unchecked', function (browser, dom) {
        var good = browser.find('.checkbox').shouldHave({checked: [true, false]})
        var bad = browser.find('.checkbox').shouldHave({checked: [false, true]})

        var checkbox = dom.insert('<input class="checkbox" type=checkbox />')
        dom.insert('<input class="checkbox" type=checkbox />')
        setTimeout(function () {
          checkbox.prop('checked', true)
        }, 20)

        return Promise.all([
          good,
          demand(bad).reject.with.error()
        ])
      })

      domTest('fails to find a checked checkbox', function (browser, dom) {
        var good = browser.find('.checkbox').shouldHave({checked: false})
        var bad = browser.find('.checkbox').shouldHave({checked: true})

        dom.insert('<input class="checkbox" type=checkbox />')

        return Promise.all([
          good,
          demand(bad).reject.with.error()
        ])
      })
    })

    domTest('eventually finds elements and asserts that they each have text', function (browser, dom) {
      var good = browser.find('.element div').shouldHave({text: ['one', 2]})
      var bad1 = browser.find('.element div').shouldHave({text: ['one']})
      var bad2 = browser.find('.element div').shouldHave({text: ['one', 'three']})

      dom.eventuallyInsert('<div class="element"><div>\nfirst one</div><div>number 2\n</div></div>')

      return Promise.all([
        good,
        demand(bad1).reject.with.error(),
        demand(bad2).reject.with.error()
      ])
    })

    domTest('eventually finds elements and asserts that they each have value', function (browser, dom) {
      var good = browser.find('.element input').shouldHave({value: ['one', 2, 0]})
      var bad1 = browser.find('.element input').shouldHave({value: ['one']})
      var bad2 = browser.find('.element input').shouldHave({value: ['one', 'three']})

      dom.eventuallyInsert('<div class="element"><input type=text value="first one"><input type=text value="number 2"><input type="text" value="0"></div>')

      return Promise.all([
        good,
        demand(bad1).reject.with.error(),
        demand(bad2).reject.with.error()
      ])
    })

    domTest('eventually finds an element and asserts that it has css', function (browser, dom) {
      var good = browser.find('.element').shouldHave({css: '.the-class'})
      var bad1 = browser.find('.element').shouldHave({css: '.not-the-class'})
      var bad2 = browser.find('.element').shouldHave({css: '.not-found'})

      dom.eventuallyInsert('<div class="element the-class"><div class="not-the-class">some text</div></div>')

      return Promise.all([
        good,
        demand(bad1).reject.with.error(),
        demand(bad2).reject.with.error()
      ])
    })

    domTest('eventually finds an element and asserts that it has n elements', function (browser, dom) {
      var good = browser.find('.element').shouldHave({length: 2})
      var bad1 = browser.find('.element').shouldHave({length: 1})

      dom.eventuallyInsert('<div class="element"></div>')
      dom.eventuallyInsert('<div class="element"></div>')

      return Promise.all([
        good,
        demand(bad1).reject.with.error()
      ])
    })

    domTest('eventually finds an element and asserts that it passes an assertion', function (browser, dom, $) {
      var good1 = browser.find('.element').shouldHaveElement(function (element) {
        assert.equal(element.text(), 'a')
      })

      var bad1 = browser.find('.multi').shouldHaveElement(function (element) {
        assert.equal(element.text(), 'b')
      })

      var bad2 = browser.find('.element').shouldHaveElement(function (element) {
        assert.equal(element.text(), 'b')
      })

      var element = dom.insert('<div class="element"></div>')
      dom.eventuallyInsert('<div class="multi"></div>')
      dom.eventuallyInsert('<div class="multi">b</div>')

      setTimeout(function () {
        element.text('a')
      }, 30)

      return Promise.all([
        good1,
        demand(bad1).reject.with.error(/expected to find exactly one element/),
        demand(bad2).reject.with.error("'a' == 'b'")
      ])
    })

    domTest('eventually finds elements and asserts that they pass an assertion', function (browser, dom, $) {
      var good1 = browser.find('.element').shouldHaveElements(function (elements) {
        var xs = elements.map(function (element) {
          return $(element).attr('data-x')
        })

        assert.deepEqual(xs, ['one', 'two', 'three'])
      })

      var bad1 = browser.find('.element').shouldHaveElements(function (elements) {
        var xs = elements.map(function (element) {
          return $(element).attr('data-x')
        })

        assert.deepEqual(xs, ['one', 'two'])
      })

      dom.eventuallyInsert('<div class="element" data-x="one"></div>')
      dom.eventuallyInsert('<div class="element" data-x="two"></div>')
      dom.eventuallyInsert('<div class="element" data-x="three"></div>')

      return Promise.all([
        good1,
        demand(bad1).reject.with.error(/\[ 'one', 'two', 'three' \]/)
      ])
    })

    domTest('copies error properly', function (browser, dom, $) {
      var errorThrown

      var good1 = browser.find('.element').shouldHaveElement(function (element) {
        try {
          expect($(element).text()).to.eql('not text')
        } catch (error) {
          errorThrown = error
          throw error
        }
      })

      dom.eventuallyInsert('<div class="element">text</div>')

      return good1.catch(function (error) {
        expect(error).to.equal(errorThrown)
      })
    })
  })

  describe('shouldNotHave', function () {
    domTest('eventually finds an element and asserts that it does not have text', function (browser, dom) {
      var promise = browser.find('.element').shouldNotHave({text: 'sme t'})

      dom.eventuallyInsert('<div class="element"><div>some text</div></div>')

      return promise
    })

    domTest('allows trytryagain parameters to be used', function (browser, dom) {
      var promise = browser.find('.element').shouldNotHave({text: 'sme t', timeout: 400, interval: 100})

      dom.eventuallyInsert('<div class="element"><div>some text</div></div>')

      return promise
    })
  })
})
