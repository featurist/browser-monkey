import {expect} from 'chai'
import {DomAssembly} from './assemblies/DomAssembly'
import {Query} from '../lib/Query'

describe('value', function () {
  let assembly
  let browser: Query

  beforeEach(function () {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
    browser.setInput(document.body)
  })

  afterEach(() => {
    assembly.stop()
  })

  function assertValue (html, expectedValue): void {
    assembly.insertHtml(html)

    const value = browser.find('.element').shouldHaveElements(1).values().result()
    expect(value).to.eql(expectedValue)
  }

  describe('text inputs', () => {
    it('can get value of input', () => {
      assertValue('<input class="element" type="text" value="the value">', ['the value'])
    })
  })

  describe('HTML elements', () => {
    it('returns the innerHTML', () => {
      assertValue('<div class="element">this is the inner text</div>', ['this is the inner text'])
    })
  })

  describe('checkboxes', () => {
    it('when checked, returns true', () => {
      assertValue('<input class="element" type="checkbox" checked />', [true])
    })

    it('when unchecked, returns false', () => {
      assertValue('<input class="element" type="checkbox" />', [false])
    })

    it("when indeterminate, returns 'indeterminate'", () => {
      const checkbox = assembly.insertHtml('<input class="element" type="checkbox" />')
      checkbox.indeterminate = true

      const values = browser.find('.element').shouldHaveElements(1).values().result()
      expect(values).to.eql(['indeterminate'])
    })
  })

  describe('selects', () => {
    it('returns the text of the option that is selected', () => {
      assertValue(
        `
          <select class="element">
            <option>one</option>
            <option selected>two</option>
          </select>
        `,
        ['two']
      )
    })
  })
})
