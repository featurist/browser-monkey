const describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')
var BrowserMonkeyAssertionError = require('../lib/BrowserMonkeyAssertionError').default

describe('assert', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
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
          'css:h1': 'Title',
          'css:.content': 'The Content'
        })
      })

      it("fails when one field isn't there", async () => {
        assembly.insertHtml(`
          <div>
            <h1>Title</h1>
          </div>
        `)

        await assembly.assertRejection(browser.assert({
          'css:h1': 'Title',
          'css:.content': 'The Content'
        }), '.content')
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
          'css:.result': [
            'Result 1',
            'Result 2',
            'Result 3'
          ]
        })
      })

      it('fails when the number of items is wrong', async () => {
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

        await assembly.assertRejection(browser.assert({
          'css:.result': [
            'Result 1',
            'Result 2'
          ]
        }), 'expected 2 elements')
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
          'css:.result': [
            {
              'css: h3': 'Title 1',
              'css: .description': 'Description 1'
            },
            {
              'css: h3': 'Title 2',
              'css: .description': 'Description 2'
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
          'css:h1': 'Title',
          'css:.content': query => {
            if (!/Content/.test(query.element().value().innerText)) {
              throw new BrowserMonkeyAssertionError('asdf')
            }
          }
        })
      })

      it('fails when query from function fails', async () => {
        assembly.insertHtml(`
          <div>
            <h1>Title</h1>
            <div class="content">The Content</div>
          </div>
        `)

        await assembly.assertRejection(browser.assert({
          'css:h1': 'Title',
          'css:.content': query => {
            if (/Content/.test(query.element().value().innerText)) {
              throw new BrowserMonkeyAssertionError('asdf')
            }
          }
        }), 'asdf')
      })
    })
  })
})
