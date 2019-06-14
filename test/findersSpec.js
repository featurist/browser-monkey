var describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')
var demand = require('must')
const pathUtils = require('path')

describe('find', function () {
  describeAssemblies([DomAssembly], Assembly => {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

    it('should eventually find an element', function () {
      var promise = browser.find('.element').shouldExist()

      assembly.eventuallyInsertHtml('<div class="element"></div>')

      return promise
    })

    it('should eventually find an element, when collapsed into shouldFind(selector)', function () {
      var promise = browser.shouldFind('.element')

      assembly.eventuallyInsertHtml('<div class="element"></div>')

      return promise
    })

    it('should eventually find an element using a filter', async function () {
      var foundElement = browser.find('.element').filter(function (element) {
        return element.classList.contains('correct')
      }, 'has class "correct"').expectOneElement()

      assembly.insertHtml('<div class="element"></div>')
      const correctElement = await assembly.eventuallyInsertHtml('<div class="element correct"></div>')

      demand(await foundElement).to.eql([correctElement])
    })

    it('should eventually find an element with the right text', function () {
      var promise = browser.find('.element', { text: 'green' }).expectOneElement()

      assembly.insertHtml('<div class="element"></div>')
      assembly.eventuallyInsertHtml('<div class="element">red</div><div class="element">blue</div><div class="element" id="green">green</div>')

      return promise.then(function (elements) {
        demand(elements).to.eql([assembly.find('#green')])
      })
    })

    it('filter fails with the right message', function () {
      var promise = browser.find('.element').filter(function (element) {
        return element.classList.contains('correct')
      }, 'has class "correct"').expectOneElement()

      assembly.insertHtml('<div class="element"></div>')
      assembly.eventuallyInsertHtml('<div class="element"></div>')

      return demand(promise).reject.with.error(/has class "correct"/)
    })

    if (Assembly.hasDom()) {
      describe('iframes', () => {
        it('finds content after iframe navigation', async () => {
          const page2Exists = browser.find('iframe').iframeContent().find('h1', { text: 'Page 2' }).shouldExist()
          assembly.useNormalRetry()

          assembly.eventuallyInsertHtml(`<iframe src="${assembly.localUrl(pathUtils.join(__dirname, 'page1.html'))}"/>`)

          await browser.find('iframe').iframeContent().clickButton('page 2')

          return page2Exists
        })
      })

      it('should eventually find an element in an iframe', function () {
        var iframe = document.createElement('iframe')
        iframe.src = assembly.localUrl(pathUtils.join(__dirname, 'page1.html'))
        iframe.width = 700
        iframe.height = 1000
        assembly.insertHtml(iframe)
        var iframeScope = browser.scope(iframe)

        assembly.useNormalRetry()

        return iframeScope.find('a', { text: 'page 2' }).click().then(function () {
          return Promise.all([
            iframeScope.find('h1').shouldHave({ text: 'Page 2' }),
            iframeScope.shouldHave({ text: 'Page 2' })
          ])
        })
      }, { vdom: false })

      it('can find things in an iframe', function () {
        var iframe = document.createElement('iframe')
        iframe.src = assembly.localUrl(pathUtils.join(__dirname, 'page2.html'))
        iframe.width = 700
        iframe.height = 1000
        assembly.insertHtml(iframe)

        assembly.useNormalRetry()

        return browser.find('iframe').expectOneElement().then(function ([iframe]) {
          return browser.scope(iframe).find('h1', { text: 'Page 2' }).shouldExist()
        })
      }, { vdom: false })
    }

    describe('visibility', function () {
      it('should not find an element that is visually hidden', function () {
        assembly.insertHtml('<div class="element">hello <span style="display:none;">world</span></div>')

        assembly.eventuallyDoNothing()

        return browser.find('.element > span').shouldNotExist()
      }, { vdom: false })

      it('should find an element that is visually hidden when visibleOnly = false', function () {
        assembly.insertHtml('<div class="element">hello <span style="display:none;">world</span></div>')

        assembly.eventuallyDoNothing()

        browser.options({ visibleOnly: false })
        return browser.find('.element > span').shouldExist()
      })

      it('should find elements that are visually hidden because of how html renders them', function () {
        assembly.insertHtml('<select><option>First</option><option>Second</option></select>')

        assembly.eventuallyDoNothing()

        return browser.find('select option').shouldHave({ text: ['First', 'Second'] })
      })
    })

    describe('containing', function () {
      it('eventually finds an element containing another element', function () {
        var promise = browser.find('.outer').containing('.inner').shouldExist()

        assembly.eventuallyInsertHtml(
          '<div class="outer"><div>bad</div></div>' +
          '<div class="outer"><div class="inner">good</div></div>'
        )

        return promise
      })

      it('element returns the outer element', function () {
        var promise = browser.find('.outer').containing('.inner').expectOneElement()

        assembly.eventuallyInsertHtml(
          '<div class="outer"><div>bad</div></div>' +
          '<div id="good" class="outer"><div class="inner">good</div></div>'
        )

        return promise.then(function ([element]) {
          demand(element).to.eql(assembly.find('#good'))
        })
      })

      it("fails if it can't find an element containing another", function () {
        var promise = browser.find('.outer').containing('.inner').shouldExist()

        assembly.eventuallyInsertHtml('<div class="outer"><div>bad</div></div>')

        return demand(promise).reject.with.error(/expected one or more elements/)
      })

      it("fails if it can't find an element containing another", function () {
        var promise = browser.find('.outer').containing('.inner').shouldExist()

        assembly.eventuallyInsertHtml('<div class="outer"><div>bad</div></div>')

        return demand(promise).reject.with.error()
      })
    })

    describe('chains', function () {
      it('eventually finds the inner element, even if the outer element exists', function () {
        assembly.insertHtml('<div class="outer"></div>')
        var promise = browser.find('.outer').find('.inner').shouldExist()

        assembly.eventuallyInsertHtml('<div class="inner">good</div>', '.outer')

        return promise
      })

      it('fails to find the inner element if it never arrives', function () {
        var promise = browser.find('.outer').find('.inner').shouldExist()

        assembly.eventuallyInsertHtml('<div class="outer"></div>')

        return demand(promise).reject.with.error()
      })
    })
  })
})
