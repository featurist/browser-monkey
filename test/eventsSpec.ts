var describeAssemblies = require('./describeAssemblies')
const {DomAssembly} = require('./assemblies/DomAssembly')
var demand = require('must')
var retry = require('trytryagain')

describe('events', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

    it('setting text input sends change event', function () {
      var firedEvents = []

      const input = assembly.insertHtml('<input type="text" class="input">')

      input.addEventListener('change', function () {
        firedEvents.push('change')
      })

      return browser.find('.input').set('first').then(function () {
        demand(firedEvents).to.eql([
          'change'
        ])
      })
    })

    it('setting text input sends only one input event', function () {
      var firedEvents = []

      const input = assembly.insertHtml('<input type="text" class="input">')
      input.addEventListener('input', function () {
        firedEvents.push('input')
      })

      return browser.find('.input').set('123').then(function () {
        demand(firedEvents).to.eql([
          'input',
        ])
      })
    })

    function assertBrowserHasFocus (): void {
      demand(document.hasFocus(), 'the browser must be in focus for this test!').to.equal(true)
    }

    it('typeIn element should fire change and then blur event on input', async function () {
      var firedEvents = []

      assertBrowserHasFocus()

      const input = assembly.insertHtml('<input type="text" class="input" />')
      assembly.insertHtml('<input type="text" class="change" />')

      input.addEventListener('blur', function () {
        firedEvents.push('blur')
      })
      input.addEventListener('change', function () {
        firedEvents.push('change')
      })

      await browser.find('.input').set('first')
      await browser.find('.change').set('second')
      await retry(() => {
        demand(firedEvents).to.eql([
          'change',
          'blur'
        ])
      })
    })

    it('click element should fire blur event on input', async function () {
      var blurred = false

      assertBrowserHasFocus()

      const input = assembly.insertHtml('<input type="text" class="input" />')
      assembly.insertHtml('<button>button</button>')

      input.addEventListener('blur', function () {
        blurred = true
      })

      await browser.find('.input').set('first')
      await browser.find('button').click()
      await retry(function () {
        demand(blurred).to.eql(true)
      })
    })

    it('select element should fire blur event on input', async function () {
      var blurred = false

      assertBrowserHasFocus()

      assembly.insertHtml('<select><option>one</option></select>')
      const input = assembly.insertHtml('<input type="text" class="input"></input>')
      input.addEventListener('blur', function () {
        blurred = true
      })

      await browser.find('.input').set('first')
      await browser.find('select').set('one')
      await retry(function () {
        demand(blurred).to.eql(true)
      })
    })
  })
})
