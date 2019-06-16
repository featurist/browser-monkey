var describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')
var demand = require('must')
var retry = require('trytryagain')

describe('events', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey().browserMonkey2Compat()
    })

    it('typeIn element should fire change', function () {
      var firedEvents = []

      const input = assembly.insertHtml('<input type="text" class="input">')

      input.addEventListener('change', function () {
        firedEvents.push('change')
      })

      return browser.find('.input').typeIn('first').then(function () {
        demand(firedEvents).to.eql([
          'change'
        ])
      })
    })

    it('typeIn element should fire input on each character', function () {
      var firedEvents = []

      const input = assembly.insertHtml('<input type="text" class="input">')
      input.addEventListener('input', function () {
        firedEvents.push('input')
      })

      return browser.find('.input').typeIn('123').then(function () {
        demand(firedEvents).to.eql([
          'input',
          'input',
          'input'
        ])
      })
    })

    function assertBrowserHasFocus () {
      demand(document.hasFocus(), 'the browser must be in focus for this test!').to.equal(true)
    }

    it('typeIn element should fire change and then blur event on input', async function () {
      var firedEvents = []

      assertBrowserHasFocus()

      const input = assembly.insertHtml('<input type="text" class="input" />')
      assembly.insertHtml('<input type="text" class="change" />')

      input.addEventListener('blur', function (e) {
        firedEvents.push('blur')
      })
      input.addEventListener('change', function () {
        firedEvents.push('change')
      })

      await browser.find('.input').typeIn('first')
      await browser.find('.change').typeIn('second')
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

      input.addEventListener('blur', function (e) {
        blurred = true
      })

      await browser.find('.input').typeIn('first')
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
      input.addEventListener('blur', function (e) {
        blurred = true
      })

      await browser.find('.input').typeIn('first')
      await browser.find('select').select({ text: 'one' })
      await retry(function () {
        demand(blurred).to.eql(true)
      })
    })
  })
})
