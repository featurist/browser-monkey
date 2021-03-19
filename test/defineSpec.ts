import { expect } from 'chai'
import { DomAssembly } from './assemblies/DomAssembly'
import {Query} from '../lib/Query'

describe('define', function () {
  let assembly
  let browser: Query

  beforeEach(function () {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
  })

  afterEach(() => {
    assembly.stop()
  })

  it('can define a field', () => {
    assembly.insertHtml('<div class=hello>bye</div>')
    browser.define('Hello', q => q.find('.hello'))

    expect(browser.find('Hello').result()).to.eql(assembly.findAll('.hello'))
  })

  it('finds defined field', async function() {
    assembly.insertHtml(`
      <div class="flash-success">Success!</div>
      <div class="flash-alert">Fail!</div>
    `)
    browser.define('Flash', (q, flashType) => q.find(`.flash-${flashType}`))

    await browser.shouldContain({
      'Flash("success")': 'Success!',
      'Flash("alert")': /Fail/,
    })
  })

  describe('definition not found', () => {
    it('with arguments: throws an error if the definition is not found', () => {
      expect(() => browser.find('Hello("one", 2)')).to.throw('no such definition Hello')
    })

    it('without arguments: assumes that it is CSS', () => {
      expect(() => browser.find('Hello').shouldExist().result()).to.throw("expected one or more elements, found 0 (found: find('Hello') [0])")
    })
  })
})
