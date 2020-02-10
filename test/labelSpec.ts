import {DomAssembly} from './assemblies/DomAssembly'
import {expect} from 'chai'
import {Query} from '../lib/Query'

describe('labels', function () {
  let assembly
  let browser: Query

  beforeEach(function () {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
  })

  afterEach(() => {
    assembly.stop()
  })

  function assertFoundElementByLabel(query, html, label): void {
    assembly.insertHtml(html)

    const expected = assembly.find('.result')
    expect(expected, 'expected to HTML to have element with class="result"').to.not.eql(null)

    const [found] = query.find(label).result()

    expect(found).to.equal(expected)
  }

  function assertNothingFound(query, html, label): void {
    assembly.insertHtml(html)

    query.find(label).expectNoElements().result()
  }

  describe('finding elements by their label', () => {
    it('checkbox with label as parent', () => {
      assertFoundElementByLabel(
        browser,
        `
          <label>
            <input type=checkbox class="result" />
            Feature Enabled
          </label>
        `,
        'Label("Feature Enabled")'
      )
    })

    it('checkbox pointed to by label with for attribute', () => {
      assertFoundElementByLabel(
        browser,
        `
          <label for="my-checkbox">
            Feature Enabled
          </label>
          <input id="my-checkbox" type=checkbox class="result" />
        `,
        'Label("Feature Enabled")'
      )
    })

    it('nothing found if the id is wrong', () => {
      assertNothingFound(
        browser,
        `
          <label for="wrong-id">
            Feature Enabled
          </label>
          <input id="my-checkbox" type=checkbox class="result" />
        `,
        'Label("Feature Enabled")'
      )
    })

    it('fails if not exact name', () => {
      assertNothingFound(
        browser,
        `
          <label for="wrong-id">
            Feature Enabled
          </label>
          <input id="my-checkbox" type=checkbox class="result" />
        `,
        'Label("Feature")'
      )
    })

    it('can be found by regex', () => {
      assertFoundElementByLabel(
        browser,
        `
          <label for="my-checkbox">
            Feature Enabled
          </label>
          <input id="my-checkbox" type=checkbox class="result" />
        `,
        'Label(/Feature/)'
      )
    })
  })

  describe('finding things by their aria labeling', () => {
    it('can find an element by its aria-label', () => {
      assertFoundElementByLabel(
        browser,
        `
          <input aria-label="Search" type=text class="result" />
        `,
        'Label("Search")'
      )
    })

    it('can find an element by its aria-label with regex', () => {
      assertFoundElementByLabel(
        browser,
        `
          <input aria-label="Search" type=text class="result" />
        `,
        'Label(/sea/i)'
      )
    })

    it('finds nothing if the label does not match', () => {
      assertNothingFound(
        browser,
        `
          <input aria-label="Search Box" type=text class="result" />
        `,
        'Label("Search")'
      )
    })

    it('can find an element by its aria-labelledby', () => {
      assertFoundElementByLabel(
        browser,
        `
          <label id="search-label">Search</label>
          <input aria-labelledby="search-label" type=text class="result" />
        `,
        'Label("Search")'
      )
    })

    it('can find an element by its area-labelledby with regex', () => {
      assertFoundElementByLabel(
        browser,
        `
          <label id="search-label">Search Box</label>
          <input aria-labelledby="search-label" type=text class="result" />
        `,
        'Label(/sea/i)'
      )
    })

    it('nothing found if aria-labelledby does not resolve', () => {
      assertNothingFound(
        browser,
        `
          <label id="search-label">Search</label>
          <input aria-labelledby="wrong-search-label" type=text class="result" />
        `,
        'Label("Search")'
      )
    })

    it('nothing found if label pointed to by aria-labelledby does not match', () => {
      assertNothingFound(
        browser,
        `
          <label id="search-label">Search Box</label>
          <input aria-labelledby="wrong-search-label" type=text class="result" />
        `,
        'Label("Search")'
      )
    })
  })

  describe('finding things by their placeholder', () => {
    it('can find an element by its placeholder', () => {
      assertFoundElementByLabel(
        browser,
        `
          <input type=text class="result" placeholder="Search" />
        `,
        'Label("Search")'
      )
    })

    it('can find an element by its placeholder with regex', () => {
      assertFoundElementByLabel(
        browser,
        `
          <input type=text class="result" placeholder="Search" />
        `,
        'Label(/sea/i)'
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

  describe('label definitions', () => {
    it('can define a new way of finding labels', () => {
      const query = browser.defineLabelType((query, label) => query.findCss(`[data-label=${JSON.stringify(label)}]`))

      assertFoundElementByLabel(
        query,
        `
          <div class="result" data-label="Search"/>
        `,
        'Label("Search")'
      )
    })

    it('can add and remove a label definition by name', async () => {
      const query = browser.defineLabelType('data-label', (query, label) => query.findCss(`[data-label=${JSON.stringify(label)}]`))

      assertFoundElementByLabel(
        query,
        `
          <div class="result" data-label="Search"/>
        `,
        'Label("Search")'
      )

      const without = query.undefineLabelType('data-label')

      await without.find('Label("Search")').expectNoElements().result()
    })

    it("throws if we try to undefine a label that doesn't exist", async () => {
      expect(() => browser.undefineLabelType('data-label')).to.throw("doesn't exist")
    })
  })
})
