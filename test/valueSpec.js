var expect = require('chai').expect
var describeAssemblies = require('./describeAssemblies')
const {DomAssembly} = require('./assemblies/DomAssembly')

describe('value', function () {
  describeAssemblies([DomAssembly], Assembly => {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey().withScope(document.body)
    })

    function assertValue (html, expectedValue) {
      assembly.insertHtml(html)

      const value = browser.find('.element').expectOneElement().value().result()
      expect(value).to.equal(expectedValue)
    }

    describe('text inputs', () => {
      it('can get value of input', () => {
        assertValue('<input class="element" type="text" value="the value">', 'the value')
      })
    })

    describe('HTML elements', () => {
      it('returns the innerHTML', () => {
        assertValue('<div class="element">this is the inner text</div>', 'this is the inner text')
      })
    })

    describe('checkboxes', () => {
      it('when checked, returns true', () => {
        assertValue('<input class="element" type="checkbox" checked />', true)
      })

      it('when unchecked, returns false', () => {
        assertValue('<input class="element" type="checkbox" />', false)
      })

      it("when indeterminate, returns 'indeterminate'", () => {
        const checkbox = assembly.insertHtml('<input class="element" type="checkbox" />')
        checkbox.indeterminate = true

        const value = browser.find('.element').expectOneElement().value().result()
        expect(value).to.equal('indeterminate')
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
          'two'
        )
      })
    })
  })
})
