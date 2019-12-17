const describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')
const {expect} = require('chai')

describe('labels', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

    function assertFoundElementByLabel(html, label) {
      assembly.insertHtml(html)

      const expected = assembly.find('.result')
      expect(expected, 'expected to HTML to have element with class="result"').to.not.eql(null)

      const [found] = browser.find(label).result()

      expect(found).to.equal(expected)
    }

    function assertNothingFound(html, label) {
      assembly.insertHtml(html)

      browser.find(label).expectNoElements().result()
    }

    describe('finding elements by their label', () => {
      it('checkbox with label as parent', async () => {
        assertFoundElementByLabel(
          `
            <label>
              <input type=checkbox class="result" />
              Feature Enabled
            </label>
          `,
          'Label("Feature Enabled")'
        )
      })

      it('checkbox pointed to by label with for attribute', async () => {
        assertFoundElementByLabel(
          `
            <label for="my-checkbox">
              Feature Enabled
            </label>
            <input id="my-checkbox" type=checkbox class="result" />
          `,
          'Label("Feature Enabled")'
        )
      })

      it('nothing found if the id is wrong', async () => {
        assertNothingFound(
          `
            <label for="wrong-id">
              Feature Enabled
            </label>
            <input id="my-checkbox" type=checkbox class="result" />
          `,
          'Label("Feature Enabled")'
        )
      })
    })

    describe('finding things by their aria labeling', () => {
      it('can find an element by its aria-label', () => {
        assertFoundElementByLabel(
          `
            <input aria-label="Search" type=text class="result" />
          `,
          'Label("Search")'
        )
      })

      it('finds nothing if the label does not match', () => {
        assertNothingFound(
          `
            <input aria-label="Search Box" type=text class="result" />
          `,
          'Label("Search")'
        )
      })

      it('can find an element by its aria-labelledby', () => {
        assertFoundElementByLabel(
          `
            <label id="search-label">Search</label>
            <input aria-labelledby="search-label" type=text class="result" />
          `,
          'Label("Search")'
        )
      })

      it('nothing found if aria-labelledby does not resolve', () => {
        assertNothingFound(
          `
            <label id="search-label">Search</label>
            <input aria-labelledby="wrong-search-label" type=text class="result" />
          `,
          'Label("Search")'
        )
      })

      it('nothing found if label pointed to by aria-labelledby does not match', () => {
        assertNothingFound(
          `
            <label id="search-label">Search Box</label>
            <input aria-labelledby="wrong-search-label" type=text class="result" />
          `,
          'Label("Search")'
        )
      })
    })

    it('finds multiple elements', () => {
      assembly.insertHtml(
        `
          <label>
            <input type=checkbox class="result" />
            Feature Enabled
          </label>
          <label>
            <input type=checkbox class="result" />
            Feature Enabled
          </label>
        `
      )

      const expected = assembly.findAll('.result')

      const found = browser.find('Label("Feature Enabled")').result()

      expect(found).to.eql(expected)
    })

    describe('defineLabel', () => {
      it('can define a new way of finding labels', () => {
        browser.defineLabel((query, label) => query.css(`[data-label=${JSON.stringify(label)}]`))

        assertFoundElementByLabel(
          `
            <div class="result" data-label="Search"/>
          `,
          'Label("Search")'
        )
      })
    })
  })
})
