const describeAssemblies = require('./describeAssemblies')
const {DomAssembly} = require('./assemblies/DomAssembly')

describe('assertions', () => {
  describeAssemblies([DomAssembly], (Assembly) => {
    var assembly
    var browser

    beforeEach(() => {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

    describe('shouldNotExist', () => {
      it("should ensure that element eventually doesn't exist", () => {
        assembly.insertHtml('<div class="removing"></div>')
        assembly.insertHtml('<div class="staying"></div>')

        var good = browser.find('.removing').shouldNotExist().then()
        var bad = browser.find('.staying').shouldNotExist().then()

        assembly.eventuallyDeleteHtml('.removing')

        return Promise.all([
          good,
          assembly.assertRejection(bad, 'expected no elements')
        ])
      })

      it('allows trytryagain parameters to be used', async () => {
        assembly.insertHtml('<div class="removing"></div>')

        var promise = browser.find('.removing').shouldNotExist({ timeout: 500, interval: 100 }).then()

        assembly.eventuallyDeleteHtml('.removing')

        await promise
      })
    })

    describe('is', () => {
      it('should eventually find an element if it has a class', async () => {
        var element = assembly.insertHtml('<div class="element"></div>')

        var good = browser.find('.element').is('.good').shouldExist().then()
        var bad = browser.find('.element').is('.bad').shouldExist().then()

        assembly.eventually(() => {
          element.classList.add('good')
        })

        await Promise.all([
          good,
          assembly.assertRejection(bad, 'expected one or more elements')
        ])
      })
    })

    describe('shouldExist', () => {
      it('eventually finds an element containing text', async () => {
        var promise = browser.find('.element', { text: 'some t' }).shouldExist().then()
        assembly.eventuallyInsertHtml('<div class="element"><div>some text</div></div>')
        await promise
      })
    })
  })
})
