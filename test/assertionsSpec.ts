import {DomAssembly} from './assemblies/DomAssembly'

describe('assertions', () => {
  let assembly
  let browser

  beforeEach(() => {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
  })

  afterEach(() => {
    assembly.stop()
  })

  describe('shouldNotExist', () => {
    it("should ensure that element eventually doesn't exist", () => {
      assembly.insertHtml('<div class="removing"></div>')
      assembly.insertHtml('<div class="staying"></div>')

      const good = browser.find('.removing').shouldNotExist().then()
      const bad = browser.find('.staying').shouldNotExist().then()

      assembly.eventuallyDeleteHtml('.removing')

      return Promise.all([
        good,
        assembly.assertRejection(bad, 'expected no elements')
      ])
    })

    it('allows timeout and interval parameters to be used', async () => {
      assembly.insertHtml('<div class="removing"></div>')

      const promise = browser.find('.removing').shouldNotExist({ timeout: 500, interval: 100 }).then()

      assembly.eventuallyDeleteHtml('.removing')

      await promise
    })
  })

  describe('is', () => {
    it('should eventually find an element if it has a class', async () => {
      const element = assembly.insertHtml('<div class="element"></div>')

      const good = browser.find('.element').is('.good').shouldExist().then()
      const bad = browser.find('.element').is('.bad').shouldExist().then()

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
      const promise = browser.find('.element', { text: 'some t' }).shouldExist().then()
      assembly.eventuallyInsertHtml('<div class="element"><div>some text</div></div>')
      await promise
    })
  })
})
