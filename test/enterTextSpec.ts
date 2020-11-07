import {expect} from 'chai'
import {DomAssembly} from './assemblies/DomAssembly'

describe('enterText', function () {
  let assembly
  let browser

  beforeEach(function () {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
  })

  afterEach(() => {
    assembly.stop()
  })

  it('can get value of input', async () => {
    const input = assembly.insertHtml('<input class="element" type="text" />')
    await browser.enterText('.element', 'the text')
    expect(input.value).to.equal('the text')
  })

  it('submits form on {Enter}', async () => {
    let formSubmitted = false

    const form = assembly.insertHtml('<form><input class="element" type="text" /></form>')
    form.addEventListener('submit', e => {
      e.preventDefault()
      formSubmitted = true
    })

    await browser.enterText('.element', ['the text', '{Enter}'])
    expect(formSubmitted).to.eq(true)
  })

  it('does not submit form on {Enter} if input catches and cancells the "keypress" event', async function() {
    let formSubmitted = false

    const form = assembly.insertHtml('<form><input class="element" type="text" /></form>')
    form.addEventListener('submit', e => {
      e.preventDefault()
      formSubmitted = true
    })

    const input = form.querySelector('input')
    input.addEventListener('keypress', (e) => {
      if (e.key == 'Enter') {
        e.stopPropagation()
      }
    })

    await browser.enterText('.element', ['the text', '{Enter}'])

    expect(formSubmitted).to.eq(false)
  })

  // TODO what if they really want to type {Enter}?
})
