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
      browser = assembly.browserMonkey()
    })

  it('typeIn element should fire change', function () {
    var firedEvents = []

    assembly.insertHtml('<input type="text" class="input">')
      .on('blur', function () {
        firedEvents.push('blur')
      }).on('change', function () {
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

    assembly.insertHtml('<input type="text" class="input">')
      .on('input', function () {
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

  it('typeIn element should fire change and then blur event on input', function () {
    var firedEvents = []

    assertBrowserHasFocus()

    assembly.insertHtml('<input type="text" class="input" />')
    assembly.insertHtml('<input type="text" class="change" />')

    assembly.find('.input').on('blur', function (e) {
      firedEvents.push('blur')
    }).on('change', function () {
      firedEvents.push('change')
    })

    return browser.find('.input').typeIn('first').then(function () {
      return browser.find('.change').typeIn('second')
    }).then(function () {
      return retry(function () {
        demand(firedEvents).to.eql([
          'change',
          'blur'
        ])
      })
    })
  })

  it('click element should fire blur event on input', function () {
    var blurred = false

    assertBrowserHasFocus()

    assembly.insertHtml('<input type="text" class="input" />')
    assembly.insertHtml('<button>button</button>')

    assembly.find('.input').on('blur', function (e) {
      blurred = true
    })

    return browser.find('.input').typeIn('first').then(function () {
      return browser.find('button').click()
    }).then(function () {
      return retry(function () {
        demand(blurred).to.eql(true)
      })
    })
  })

  it('select element should fire blur event on input', function () {
    var blurred = false

    assertBrowserHasFocus()

    assembly.insertHtml('<select><option>one</option></select>')
    assembly.insertHtml('<input type="text" class="input"></input>')
    assembly.find('input').on('blur', function (e) {
      blurred = true
    })

    return browser.find('.input').typeIn('first').then(function () {
      return browser.find('select').select({text: 'one'})
    }).then(function () {
      return retry(function () {
        demand(blurred).to.eql(true)
      })
    })
  })

  describe('callbacks on interaction', function () {
    it('fires events on clicks', function () {
      var button = assembly.insertHtml('<button>a button</button>')

      var event

      return browser.on(function (e) {
        event = e
      }).find('button').click().then(function () {
        demand(event).to.not.equal(undefined)
        demand(event.type).to.equal('click')
        demand(event.element[0]).to.equal(button[0])
      })
    })

    it('fires events on typeIn', function () {
      var input = assembly.insertHtml('<input></input>')

      var event

      return browser.on(function (e) {
        event = e
      }).find('input').typeIn('some text').then(function () {
        demand(event).to.not.equal(undefined)
        demand(event.type).to.equal('typing')
        demand(event.text).to.equal('some text')
        demand(event.element[0]).to.equal(input[0])
      })
    })

    it('fires events on typeIn', function () {
      var editorDiv = assembly.insertHtml('<div class="editor"></div>')

      var event

      return browser.on(function (e) {
        event = e
      }).find('div.editor').typeInHtml('some <b>html</b>').then(function () {
        demand(event).to.not.equal(undefined)
        demand(event.type).to.equal('typing html')
        demand(event.html).to.equal('some <b>html</b>')
        demand(event.element[0]).to.equal(editorDiv[0])
      })
    })

    it('fires events on select', function () {
      var select = assembly.insertHtml('<select><option>one</option></select>')

      var event

      return browser.on(function (e) {
        event = e
      }).find('select').select({text: 'one'}).then(function () {
        demand(event).to.not.equal(undefined)
        demand(event.type).to.equal('select option')
        demand(event.value).to.equal('one')
        demand(event.optionElement[0]).to.equal(select.find('option')[0])
        demand(event.element[0]).to.equal(select[0])
      })
    })
  })
  })
})
