import {DomAssembly} from './assemblies/DomAssembly'
import {Query} from '../lib/Query'

describe('buttons', function () {
  let assembly
  let browser: Query

  beforeEach(function () {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
  })

  afterEach(() => {
    assembly.stop()
  })

  describe('shouldAppearAfter', () => {
    it("passes if an element doesn't exist, but after the action, it does", async () => {
      const button = assembly.insertHtml(`
        <button>Show</button>
      `)

      button.addEventListener('click', () => assembly.insertHtml('<div class="element"></div>'))

      await browser.find('.element').shouldAppearAfter(() => browser.clickButton('Show'))
    })

    it('fails if the element fails to appear', async () => {
      assembly.insertHtml(`
        <button>Show</button>
      `)

      await assembly.assertRejection(
        browser.find('.element').shouldAppearAfter(() => browser.clickButton('Show')),
        'expected one or more elements, found 0'
      )
    })

    it('fails if the element exists before the action', async () => {
      assembly.insertHtml(`
        <div class="element"></div>
      `)

      await assembly.assertRejection(
        browser.find('.element').shouldAppearAfter(() => browser.clickButton('Show')),
        'expected no elements'
      )
    })
  })

  describe('shouldDisappearAfter', () => {
    it("passes if an element does exist, but after the action, it doesn't", async () => {
      const button = assembly.insertHtml(`
        <button>Show</button>
      `)
      const element = assembly.insertHtml(`
        <div class="element"></div>
      `)

      button.addEventListener('click', () => element.parentNode.removeChild(element))

      await browser.find('.element').shouldDisappearAfter(() => browser.clickButton('Show'))
    })

    it('fails if the element is still there after the action', async () => {
      assembly.insertHtml(`
        <button>Show</button>
        <div class="element"></div>
      `)

      await assembly.assertRejection(
        browser.find('.element').shouldDisappearAfter(() => browser.clickButton('Show')),
        'expected no elements, found 1'
      )
    })

    it("fails if the element doesn't exist before the action", async () => {
      assembly.insertHtml(`
      `)

      await assembly.assertRejection(
        browser.find('.element').shouldDisappearAfter(() => browser.clickButton('Show')),
        'expected one or more elements, found 0'
      )
    })
  })
})
