const describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')
var BrowserMonkeyAssertionError = require('../lib/BrowserMonkeyAssertionError').default
const {expect} = require('chai')

describe('assert', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

    describe('input types', () => {
      it('can assert html elements', async () => {
        assembly.insertHtml(`
          <span class="address">12 Hapless Boulevard</span>
        `)

        await browser.assert({
          '.address': '12 Hapless Boulevard',
        })
      })

      it('can assert text inputs', async () => {
        assembly.insertHtml(`
          <input type=text class="address" value="12 Hapless Boulevard"/>
        `)

        await browser.assert({
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
          '.address': "Error: expected 1 element, found 0 (found: find('.address') [0])",
        })
      })

      it('can assert select options', async () => {
        assembly.insertHtml(`
          <select>
            <option>One</option>
            <option selected>Two</option>
          </select>
        `)

        await browser.assert({
          'select': 'Two',
        })
      })

      it('can assert checkbox', async () => {
        assembly.insertHtml(`
          <input type=checkbox class="check" checked/>
        `)

        await browser.assert({
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

        await browser.find('.address .street').assert('7 Lola St')
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

        await browser.find('.address .street').assert(/\d+ Lola St/)
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

        await browser.assert({
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
          '.content': "Error: expected 1 element, found 0 (found: find('.content') [0])"
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

        await browser.assert({
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

        await browser.assert({
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
    })

    describe('functions', () => {
      it('a function can assert something specific about the element found', async () => {
        assembly.insertHtml(`
          <div>
            <h1>Title</h1>
            <div class="content">The Content</div>
          </div>
        `)

        await browser.assert({
          'h1': 'Title',
          '.content': query => {
            if (!/Content/.test(query.expectOneElement().result()[0].innerText)) {
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
            if (/Content/.test(query.expectOneElement().result()[0].innerText)) {
              throw new BrowserMonkeyAssertionError('asdf')
            }
          }
        }, {
          'h1': 'Title',
          '.content': 'Error: asdf'
        })
      })

      it('throws if the function is asynchronous', async () => {
        assembly.insertHtml(`
          <div>
            <h1>Title</h1>
            <div class="content">The Content</div>
          </div>
        `)

        await assembly.assertExpectedActual(browser, {
          'h1': 'Title',
          '.content': async () => {
          }
        }, {
          'h1': 'Title',
          '.content': 'Error: model functions must not be asynchronous'
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

        browser.define('header', q => q.find('h1'))

        await browser.assert({
          header: 'Title',
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

        browser.define('header', 'h1')

        await browser.assert({
          header: 'Title',
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
          header: 'h1',
          content: q => q.find('.content'),
        })

        await browser.assert({
          header: 'Title',
          content: 'The Content'
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
          title: 'h1',
          content: q => q.find('.content').define({
            title: '.title',
            body: '.body'
          }),
        })

        await browser.assert({
          title: 'Title',
          content: {
            title: 'title',
            body: 'body'
          }
        })
      })
    })
  })
})
