require('babel-polyfill')
var demand = require('must')
var domTest = require('./domTest')
var retry = require('trytryagain')

describe('find', function () {
  domTest('should eventually find an element', function (browser, dom) {
    var promise = browser.find('.element').shouldExist()

    dom.eventuallyInsert('<div class="element"></div>')

    return promise
  })

  domTest('should eventually find an element, when collapsed into shouldFind(selector)', function (browser, dom) {
    var promise = browser.shouldFind('.element')

    dom.eventuallyInsert('<div class="element"></div>')

    return promise
  })

  domTest('should eventually find an element using a filter', function (browser, dom) {
    var promise = browser.find('.element').filter(function (element) {
      return element.hasClass('correct')
    }, 'has class "correct"').element()

    dom.insert('<div class="element"></div>')
    dom.eventuallyInsert('<div class="element correct"></div>')

    return promise.then(function (element) {
      demand(element.attr('class')).to.equal('element correct')
    })
  })

  domTest('should eventually find an element with the right text', function (browser, dom) {
    var promise = browser.find('.element', {text: 'green'}).element()

    dom.insert('<div class="element"></div>')
    dom.eventuallyInsert('<div class="element">red</div><div class="element">blue</div><div class="element">green</div>')

    return promise.then(function (element) {
      demand(element.text()).to.equal('green')
    })
  })

  domTest('filter fails with the right message', function (browser, dom) {
    var promise = browser.find('.element').filter(function (element) {
      return element.hasClass('correct')
    }, 'has class "correct"').element()

    dom.insert('<div class="element"></div>')
    dom.eventuallyInsert('<div class="element"></div>')

    return demand(promise).reject.with.error(/has class "correct"/)
  })

  domTest('should eventually find an element in an iframe', function (browser, dom) {
    var iframe = document.createElement('iframe')
    iframe.src = '/base/test/page1.html'
    iframe.width = 700
    iframe.height = 1000
    dom.el.append(iframe)
    var iframeScope = browser.scope(iframe)
    return iframeScope.find('a', {text: 'page 2'}).click().then(function () {
      return Promise.all([
        iframeScope.find('h1').shouldHave({text: 'Hello World'}),
        iframeScope.shouldHave({text: 'Hello World'})
      ])
    })
  }, {vdom: false})

  domTest('can find things in an iframe', function (browser, dom) {
    var iframe = document.createElement('iframe')
    iframe.src = '/base/test/page2.html'
    iframe.width = 700
    iframe.height = 1000
    dom.el.append(iframe)

    return browser.find('iframe').element().then(function (iframe) {
      return browser.scope(iframe).find('h1', {text: 'Hello World'}).shouldExist()
    })
  }, {vdom: false})

  domTest('calls a function for each element found', function (browser, dom) {
    var promise = browser.find('span').elements()

    dom.insert('<div><span>a</span><span>b</span></div>')

    return promise.then(function (elements) {
      demand(elements.length).to.equal(2)
    })
  })

  describe('visibility', function () {
    domTest('should not find an element that is visually hidden', function (browser, dom) {
      dom.insert('<div class="element">hello <span style="display:none;">world</span></div>')

      return browser.find('.element > span').shouldNotExist()
    }, {vdom: false})

    domTest('should find an element that is visually hidden when visibleOnly = false', function (browser, dom) {
      dom.insert('<div class="element">hello <span style="display:none;">world</span></div>')

      return browser.set({visibleOnly: false}).find('.element > span').shouldExist()
    })

    domTest('should find elements that are visually hidden because of how html renders them', function (browser, dom) {
      dom.insert('<select><option>First</option><option>Second</option></select>')
      return browser.find('select option').shouldHave({text: ['First', 'Second']})
    })
  })

  describe('containing', function () {
    domTest('eventually finds an element containing another element', function (browser, dom) {
      var promise = browser.find('.outer').containing('.inner').shouldExist()

      setTimeout(function () {
        dom.insert('<div class="outer"><div>bad</div></div>')
        dom.insert('<div class="outer"><div class="inner">good</div></div>')
      }, 10)

      return promise
    })

    domTest('element returns the outer element', function (browser, dom) {
      var promise = browser.find('.outer').containing('.inner').element()

      setTimeout(function () {
        dom.insert('<div class="outer"><div>bad</div></div>')
        dom.insert('<div class="outer"><div class="inner">good</div></div>')
      }, 10)

      return promise.then(function (element) {
        demand(element.hasClass('outer')).to.eql(true)
      })
    })

    domTest('errors with a usable css selector if it cant find something', function (browser, dom) {
      var promise = browser.find('.outer').find('.not-there').element()

      setTimeout(function () {
        dom.insert('<div class="outer"><div>bad</div></div>')
      }, 200)

      return demand(promise).reject.with.error(/expected to find: .outer .not-there/)
    })

    domTest('errors with a usable css selector if it cant find an element containing another', function (browser, dom) {
      var promise = browser.find('.outer').containing('.not-there').shouldExist()

      setTimeout(function () {
        dom.insert('<div class="outer"><div>bad</div></div>')
      }, 200)

      return demand(promise).reject.with.error('expected to find: .outer:has(.not-there)')
    })

    domTest("fails if it can't find an element containing another", function (browser, dom) {
      var promise = browser.find('.outer').containing('.inner').shouldExist()

      setTimeout(function () {
        dom.insert('<div class="outer"><div>bad</div></div>')
      }, 200)

      return demand(promise).reject.with.error('expected to find: .outer:has(.inner)')
    })

    domTest('errors with a usable css selector if it cant find an element containing another', function (browser, dom) {
      var promise = browser.find('.outer').containing('.not-there').shouldExist()

      setTimeout(function () {
        dom.insert('<div class="outer"><div>bad</div></div>')
      }, 200)

      return demand(promise).reject.with.error('expected to find: .outer:has(.not-there)')
    })

    domTest("fails if it can't find an element containing another", function (browser, dom) {
      var promise = browser.find('.outer').containing('.inner').shouldExist()

      setTimeout(function () {
        dom.insert('<div class="outer"><div>bad</div></div>')
      }, 10)

      return demand(promise).reject.with.error()
    })
  })
  describe('chains', function () {
    domTest('eventually finds the inner element, even if the outer element exists', function (browser, dom) {
      var promise = browser.find('.outer').find('.inner').shouldExist()

      setTimeout(function () {
        var outer = dom.insert('<div class="outer"></div>')
        setTimeout(function () {
          outer.append('<div class="inner">good</div>')
        }, 10)
      }, 10)

      return promise
    })

    domTest('fails to find the inner element if it never arrives', function (browser, dom) {
      var promise = browser.find('.outer').find('.inner').shouldExist()

      setTimeout(function () {
        dom.insert('<div class="outer"></div>')
      }, 10)

      return demand(promise).reject.with.error()
    })
  })

  describe.only('map', function () {
    domTest('can map element values into objects', function (browser, dom) {
      var promise = browser.find('.content').map(function (element) {
        return {
          a: element.find('.a').text(),
          b: element.find('.b').text()
        }
      }).assert(function (content) {
        demand(content).to.eql({
          a: 'Aye',
          b: 'Bee'
        })
      })

      setTimeout(function () {
        dom.insert('<div class="content"><div class="a">Aye</div><div class="b">Bee</div></div>')
      }, 10)

      return promise
    })

    domTest('can map element values into objects', function (browser, dom) {
      var promise = browser.find('.content').map(function (element) {
        return {
          a: element.find('.a').text(),
          b: element.find('.b').text()
        }
      }).assert(function (content) {
        demand(content).to.eql({
          a: 'Axe',
          b: 'Bee'
        })
      })

      setTimeout(function () {
        dom.insert('<div class="content"><div class="a">Aye</div><div class="b">Bee</div></div>')
      }, 10)

      return demand(promise).reject.with.error('Axe')
    })
  })
})
