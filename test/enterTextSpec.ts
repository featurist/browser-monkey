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

  it('does not submit on {Enter} if form has multiple inputs', async function() {
    let formSubmitted = false

    const form = assembly.insertHtml('<form><input class="element" type="text" /><input class="element2" type="text" /></form>')
    form.addEventListener('submit', e => {
      e.preventDefault()
      formSubmitted = true
    })

    await browser.enterText('.element', ['the text', '{Enter}'])
    expect(formSubmitted).to.eq(false)
  })

  it('clicks submit button on {Enter} if form has one', async function() {
    let formSubmitted = false

    const form = assembly.insertHtml('<form><input class="element" type="text" /><button></button></form>')
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

  it('does not submit form with submit button on {Enter} if button click is event is itercepted and cancelled', async function() {
    let formSubmitted = false

    const form = assembly.insertHtml('<form><input class="element" type="text" /><input type="submit"/ value="go"></form>')
    form.addEventListener('submit', e => {
      e.preventDefault()
      formSubmitted = true
    })

    const submit = form.querySelector('input[type=submit]')
    submit.addEventListener('click', (e) => {
      e.preventDefault()
    })

    await browser.enterText('.element', ['the text', '{Enter}'])

    expect(formSubmitted).to.eq(false)
  })
})
