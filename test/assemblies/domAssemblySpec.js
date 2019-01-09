const DomAssembly = require('./DomAssembly')
const { expect } = require('chai')

describe('DomAssembly', () => {
  let assembly
  let browser

  beforeEach(() => {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
  })

  it('can insert html', async () => {
    const element = assembly.insertHtml('<div class="a"/>')
    const found = await browser.find('.a').element()
    expect(found).to.equal(element)
  })

  it('can eventually insert html before searching', async () => {
    const element = assembly.eventuallyInsertHtml('<div class="a"/>')
    const found = await browser.find('.a').element()
    expect(found).to.equal(await element)
  })

  it('can eventually insert html after searching', async () => {
    const found = browser.find('.a').element()
    const element = assembly.eventuallyInsertHtml('<div class="a"/>')
    expect(await found).to.equal(await element)
  })

  it('can eventually insert html before searching twice', async () => {
    const element = assembly.eventuallyInsertHtml('<div class="a"/>')
    const found = await Promise.all([
      browser.find('.a').element(),
      browser.find('.a').element()
    ])
    expect(found[0]).to.equal(await element)
    expect(found[1]).to.equal(await element)
  })
})
