const {DomAssembly} = require('./DomAssembly')
const { expect } = require('chai')

describe('DomAssembly', () => {
  let assembly
  let browser

  beforeEach(() => {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
  })

  afterEach(() => {
    assembly.stop()
  })

  it('can insert html', async () => {
    const element = assembly.insertHtml('<div class="a"/>')
    const [found] = await browser.find('.a').expectOneElement()
    expect(found).to.equal(element)
  })

  it('can eventually insert html before searching', async () => {
    const promise = browser.find('.a').expectOneElement().then()
    const element = assembly.eventuallyInsertHtml('<div class="a"/>')
    const [found] = await promise
    expect(found).to.equal(await element)
  })

  it('can eventually insert html after searching', async () => {
    const found = browser.find('.a').expectOneElement().then()
    const element = assembly.eventuallyInsertHtml('<div class="a"/>')
    expect((await found)[0]).to.equal(await element)
  })

  it('can eventually insert html before searching twice', async () => {
    const promise = Promise.all([
      browser.find('.a').expectOneElement().then(),
      browser.find('.a').expectOneElement().then()
    ])
    const element = assembly.eventuallyInsertHtml('<div class="a"/>')
    const [[found1], [found2]] = await promise
    expect(found1).to.equal(await element)
    expect(found2).to.equal(await element)
  })
})
