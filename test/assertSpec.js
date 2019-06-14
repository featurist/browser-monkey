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
          '.content': undefined
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

      it('fails when query from function fails with error with actual', async () => {
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
              throw new BrowserMonkeyAssertionError('asdf', {actual: 'Content'})
            }
          }
        }, {
          'h1': 'Title',
          '.content': 'Content'
        })
      })

      it('fails when query from function fails with error without actual', async () => {
        assembly.insertHtml(`
          <div>
            <h1>Title</h1>
            <div class="content">The Content</div>
          </div>
        `)

        let error = new BrowserMonkeyAssertionError('asdf')

        await assembly.assertExpectedActual(browser, {
          'h1': 'Title',
          '.content': query => {
            if (/Content/.test(query.expectOneElement().result()[0].innerText)) {
              throw error
            }
          }
        }, {
          'h1': 'Title',
          '.content': error
        })
      })
    })
  })
})
