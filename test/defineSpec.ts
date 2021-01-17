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
    browser.define('Hello', q => q.transform(() => 'hello'))

    expect(browser.find('Hello').result()).to.equal('hello')
  })

  it('can define a field with arguments', () => {
    let args

    browser.define('Hello', (q, arg1, arg2) => q.transform(() => {
      args = [arg1, arg2]
      return `hello ${arg1} ${arg2}`
    }))

    expect(browser.find('Hello("one", 2)').result()).to.equal('hello one 2')
    expect(args).to.eql(['one', 2])
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
