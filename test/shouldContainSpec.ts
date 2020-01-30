import {DomAssembly} from './assemblies/DomAssembly'
import BrowserMonkeyAssertionError from '../lib/BrowserMonkeyAssertionError'
import {elementAttributes} from '../matchers'

describe('shouldContain', function () {
  let assembly
  let browser

  beforeEach(function () {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
  })

  afterEach(() => {
    assembly.stop()
  })

  describe('input types', () => {
    it('can assert html elements', async () => {
      assembly.insertHtml(`
        <span class="address">12 Hapless Boulevard</span>
      `)

      await browser.shouldContain({
        '.address': '12 Hapless Boulevard',
      })
    })

    it('can assert text inputs', async () => {
      assembly.insertHtml(`
        <input type=text class="address" value="12 Hapless Boulevard"/>
      `)

      await browser.shouldContain({
        '.address': '12 Hapless Boulevard',
      })
    })

    it('can reject text inputs', async () => {
      assembly.insertHtml(`
        <input type=text class="address" value="12 apless Boulevard"/>
      `)

      await assembly.assertExpectedActual(browser, {
        '.address': '12 Hapless Boulevard',
      }, {
        '.address': '12 apless Boulevard',
      })
    })

    it('can reject text inputs when the element is not found at all', async () => {
      assembly.insertHtml(`
      `)

      await assembly.assertExpectedActual(browser, {
        '.address': '12 Hapless Boulevard',
      }, {
        '.address': "Error: expected just one element, found 0 (found: path(find('.address') [0]))",
      })
    })

    describe('select', () => {
      it('can assert select options by text', async () => {
        assembly.insertHtml(`
          <select>
            <option>One</option>
            <option selected>Two</option>
          </select>
        `)

        await browser.shouldContain({
          'select': 'Two',
        })
      })

      it('can assert select options by value', async () => {
        assembly.insertHtml(`
          <select>
            <option value="one">1</option>
            <option value="two" selected>2</option>
          </select>
        `)

        await browser.shouldContain({
          'select': 'two',
        })
      })
    })

    it('can assert checkbox', async () => {
      assembly.insertHtml(`
        <input type=checkbox class="check" checked/>
      `)

      await browser.shouldContain({
        '.check': true,
      })
    })
  })

  describe('values', () => {
    it('matches if the exact text of the element is the same', async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street" value="7 Lola St" />
          </div>
        </form>
      `)

      await browser.find('.address .street').shouldContain('7 Lola St')
    })

    it('single argument, with scope asserts value', async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street" value="7 Lola St" />
          </div>
        </form>
      `)

      await assembly.assertExpectedActual(browser.find('.address .street'), '8 Lola St', '7 Lola St')
    })

    it('fails even if it contains the right text', async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street" value="8 Rue de Paris, St Etienne" />
          </div>
        </form>
      `)

      await assembly.assertExpectedActual(browser.find('.address .street'), '8 Rue de Paris', '8 Rue de Paris, St Etienne')
    })

    it('can match a resulgar expression', async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street" value="7 Lola St" />
          </div>
        </form>
      `)

      await browser.find('.address .street').shouldContain(/\d+ Lola St/)
    })

    it('fails if the regular expression does not match', async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street" value="7 Lola St" />
          </div>
        </form>
      `)

      await assembly.assertExpectedActual(browser.find('.address .street'), /\d+ High St/, '7 Lola St')
    })
  })

  describe('objects', function () {
    it('passes when the fields are there and have the expected values', async () => {
      assembly.insertHtml(`
        <div>
          <h1>Title</h1>
          <div class="content">The Content</div>
        </div>
      `)

      await browser.shouldContain({
        'h1': 'Title',
        '.content': 'The Content'
      })
    })

    it("fails when one field isn't there", async () => {
      assembly.insertHtml(`
        <div>
          <h1>Title</h1>
        </div>
      `)

      await assembly.assertExpectedActual(browser, {
        'h1': 'Title',
        '.content': 'The Content'
      }, {
        'h1': 'Title',
        '.content': "Error: expected just one element, found 0 (found: path(find('.content') [0]))"
      })
    })

    it("fails when contents are spread over two containers", async () => {
      assembly.insertHtml(`
        <div class="result">
          <h1>Title</h1>
        </div>
        <div class="result">
          <div class="content">The Content</div>
        </div>
      `)

      await assembly.assertExpectedActual(browser, {
        '.result': [{
          'h1': 'Title',
          '.content': 'The Content'
        }]
      }, {
        '.result': [
          {
            'h1': 'Title',
            '.content': "Error: expected just one element, found 0 (found: path(find('.result') [2], index 0 [1], find('.content') [0]))"
          },
          'The Content'
        ]
      })
    })

    describe('empty objects', () => {
      it("can assert that an element exists, without testing it's contents", async () => {
        assembly.insertHtml(`
          <div>
            <h1>Title</h1>
            <div class="content">The Content</div>
          </div>
        `)

        await browser.shouldContain({
          'h1': 'Title',
          '.content': {}
        })
      })

      it("fails when an element doesn't exist", async () => {
        assembly.insertHtml(`
          <div>
            <h1>Title</h1>
          </div>
        `)

        await assembly.assertExpectedActual(browser, {
          'h1': 'Title',
          '.content': {}
        }, {
          'h1': 'Title',
          '.content': "Error: expected just one element, found 0 (found: path(find('.content') [0]))"
        })
      })
    })
  })

  describe('arrays', function () {
    it('passes when the fields are there and have the expected values', async () => {
      assembly.insertHtml(`
        <div class="result">
          Result 1
        </div>
        <div class="result">
          Result 2
        </div>
        <div class="result">
          Result 3
        </div>
      `)

      await browser.shouldContain({
        '.result': [
          'Result 1',
          'Result 2',
          'Result 3'
        ]
      })
    })

    it('fails when the number of items is actually greater', async () => {
      assembly.insertHtml(`
        <div class="result">
          Result 1
        </div>
        <div class="result">
          Result 2
        </div>
        <div class="result">
          Result 3
        </div>
      `)

      await assembly.assertExpectedActual(browser, {
        '.result': [
          'Result 1',
          'Result 2'
        ]
      }, {
        '.result': [
          'Result 1',
          'Result 2',
          'Result 3'
        ]
      })
    })

    it('fails when the number of items is actually less', async () => {
      assembly.insertHtml(`
        <div class="result">
          Result 1
        </div>
      `)

      await assembly.assertExpectedActual(browser, {
        '.result': [
          'Result 1',
          'Result 2'
        ]
      }, {
        '.result': [
          'Result 1',
        ]
      })
    })

    it('can assert objects as items', async () => {
      assembly.insertHtml(`
        <div class="result">
          <h3>Title 1</h3>
          <div class="description">Description 1</div>
        </div>
        <div class="result">
          <h3>Title 2</h3>
          <div class="description">Description 2</div>
        </div>
      `)

      await browser.shouldContain({
        '.result': [
          {
            'h3': 'Title 1',
            '.description': 'Description 1'
          },
          {
            'h3': 'Title 2',
            '.description': 'Description 2'
          }
        ]
      })
    })

    describe('empty arrays', () => {
      it('asserts that no elements were found', async () => {
        assembly.insertHtml(`
          <div class="result">
            Result 1
          </div>
        `)

        await browser.shouldContain({
          '.notfound': []
        })
      })

      it('fails when elements are found', async () => {
        assembly.insertHtml(`
          <div class="result">
            Result 1
          </div>
        `)

        await assembly.assertExpectedActual(browser, {
          '.result': []
        }, {
          '.result': [
            'Result 1',
          ]
        })
      })
    })
  })

  describe('functions', () => {
    it('a function can assert something specific about the element found', async () => {
      assembly.insertHtml(`
        <div>
          <h1>Title</h1>
          <div class="content">The Content</div>
        </div>
      `)

      await browser.shouldContain({
        'h1': 'Title',
        '.content': query => {
          if (!/Content/.test(query.elementResult().innerText)) {
            throw new BrowserMonkeyAssertionError('asdf')
          }
        }
      })
    })

    it('fails when query from function fails with error', async () => {
      assembly.insertHtml(`
        <div>
          <h1>Title</h1>
          <div class="content">The Content</div>
        </div>
      `)

      await assembly.assertExpectedActual(browser, {
        'h1': 'Title',
        '.content': query => {
          if (/Content/.test(query.elementResult().innerText)) {
            throw new BrowserMonkeyAssertionError('asdf', {actual: 'error actual', expected: 'error expected'})
          }
        }
      }, {
        'h1': 'Title',
        '.content': 'error actual'
      }, {
        'h1': 'Title',
        '.content': 'error expected'
      })
    })

    it('throws if the function is asynchronous', async () => {
      assembly.insertHtml(`
        <div>
          <h1>Title</h1>
          <div class="content">The Content</div>
        </div>
      `)

      await assembly.assertRejection(
        browser.shouldContain({
          'h1': 'Title',
          '.content': async () => {
          }
        }),
        'model functions must not be asynchronous'
      )
    })

    it('does not throw if the function returns a query', async () => {
      assembly.insertHtml(`
        <div>
          <h1>Title</h1>
          <div class="content">The Content</div>
        </div>
      `)

      await browser.shouldContain({
        'h1': 'Title',
        '.content': q => q.shouldExist()
      })
    })
  })

  describe('attributes', () => {
    it('can assert attributes', async () => {
      assembly.insertHtml(`
        <input type="text" placeholder="Username" />
      `)

      await browser.shouldContain({
        input: elementAttributes({
          placeholder: 'Username'
        }),
      })
    })

    it("fails when the attributes don't match", async () => {
      assembly.insertHtml(`
        <input type="text" placeholder="Username" />
      `)

      await assembly.assertExpectedActual(browser,
        {
          input: elementAttributes({
            placeholder: 'User'
          })
        },
        {
          input: {
            placeholder: 'Username',
          },
        },
        {
          input: {
            placeholder: 'User',
          },
        }
      )
    })

    it("can use regexp", async () => {
      assembly.insertHtml(`
        <input type="text" placeholder="Username" />
      `)

      await browser.shouldContain({
        input: elementAttributes({
          placeholder: /User/
        })
      })
    })

    it("can assert boolean", async () => {
      assembly.insertHtml(`
        <input type="checkbox" checked />
      `)

      await browser.shouldContain({
        input: elementAttributes({
          checked: true
        })
      })
    })

    it("can assert integer", async () => {
      assembly.insertHtml(`
        <input type="checkbox" checked />
      `)

      await browser.shouldContain({
        input: elementAttributes({
          tabIndex: 0
        })
      })
    })
  })

  describe('define', () => {
    it('can define a field using a finder', async () => {
      assembly.insertHtml(`
        <div>
          <h1>Title</h1>
          <div class="content">The Content</div>
        </div>
      `)

      browser.define('Header', q => q.find('h1'))

      await browser.shouldContain({
        Header: 'Title',
        '.content': 'The Content'
      })
    })

    it('can define a field using css', async () => {
      assembly.insertHtml(`
        <div>
          <h1>Title</h1>
          <div class="content">The Content</div>
        </div>
      `)

      browser.define('Header', 'h1')

      await browser.shouldContain({
        Header: 'Title',
        '.content': 'The Content'
      })
    })

    it('can define a several fields using an object', async () => {
      assembly.insertHtml(`
        <div>
          <h1>Title</h1>
          <div class="content">The Content</div>
        </div>
      `)

      browser.define({
        Header: 'h1',
        Content: q => q.find('.content'),
      })

      await browser.shouldContain({
        Header: 'Title',
        Content: 'The Content'
      })
    })

    it('can define a section by its contents', async () => {
      assembly.insertHtml(`
        <section>
          <h1>Section A</h1>
          <div class="content">Section A Content</div>
        </section>
        <section>
          <h1>Section B</h1>
          <div class="content">Section B Content</div>
        </section>
      `)

      browser.define('Section', (query, value) => {
        return query.find('section').containing({h1: value})
      })

      await browser.shouldContain({
        'Section(/S.* A/)': {
          '.content': 'Section A Content'
        }
      })
    })

    it('can define a several hierarchical fields using finders', async () => {
      assembly.insertHtml(`
        <div>
          <h1>Title</h1>
          <div class="content">
            <div class="title">title</div>
            <div class="body">
              body
            </div>
          </div>
        </div>
      `)

      browser.define({
        Title: 'h1',
        Content: q => q.find('.content').define({
          Title: '.title',
          Body: '.body'
        }),
      })

      await browser.shouldContain({
        Title: 'Title',
        Content: {
          Title: 'title',
          Body: 'body'
        }
      })
    })
  })
})
