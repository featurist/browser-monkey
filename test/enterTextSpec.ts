import {expect} from 'chai'
import {DomAssembly} from './assemblies/DomAssembly'

describe('enterText', function () {
  let assembly
  let browser

  beforeEach(function () {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey().scope(document.body)
  })

  afterEach(() => {
    assembly.stop()
  })

  it('can get value of input', async () => {
    const input = assembly.insertHtml('<input class="element" type="text" />')
    await browser.enterText('.element', 'the text')
    expect(input.value).to.equal('the text')
  })

  it('can pass command keys', async () => {
    let textEntered

    const input = assembly.insertHtml('<input class="element" type="text" />')
    input.addEventListener('keypress', e => {
      if (e.code === 'Enter' && e.which === 13) {
        textEntered = e.target.value
      }
    })

    await browser.enterText('.element', ['the text', '{Enter}'])
    expect(textEntered).to.equal('the text')
  })
})
