var demand = require('must')
var retry = require('trytryagain')
var domTest = require('./domTest')

describe('events', function () {
  domTest('typeIn element should fire change', function (browser, dom) {
    var firedEvents = []

    dom.insert('<input type="text" class="input">')
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

  domTest('typeIn element should fire input on each character', function (browser, dom) {
    var firedEvents = []

    dom.insert('<input type="text" class="input">')
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

  domTest('typeIn element should fire change and then blur event on input', function (browser, dom) {
    var firedEvents = []

    assertBrowserHasFocus()

    dom.insert('<input type="text" class="input" />')
    dom.insert('<input type="text" class="change" />')

    dom.el.find('.input').on('blur', function (e) {
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

  domTest('click element should fire blur event on input', function (browser, dom) {
    var blurred = false

    assertBrowserHasFocus()

    dom.insert('<input type="text" class="input" />')
    dom.insert('<button>button</button>')

    dom.el.find('.input').on('blur', function (e) {
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

  domTest('select element should fire blur event on input', function (browser, dom, $) {
    var blurred = false

    assertBrowserHasFocus()

    dom.insert('<select><option>one</option></select>')
    dom.insert('<input type="text" class="input"></input>')
    dom.el.find('input').on('blur', function (e) {
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
    domTest('fires events on clicks', function (browser, dom) {
      var button = dom.insert('<button>a button</button>')

      var event

      return browser.on(function (e) {
        event = e
      }).find('button').click().then(function () {
        demand(event).to.not.equal(undefined)
        demand(event.type).to.equal('click')
        demand(event.element[0]).to.equal(button[0])
      })
    })

    domTest('fires events on typeIn', function (browser, dom) {
      var input = dom.insert('<input></input>')

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

    domTest('fires events on typeIn', function (browser, dom) {
      var editorDiv = dom.insert('<div class="editor"></div>')

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

    domTest('fires events on select', function (browser, dom) {
      var select = dom.insert('<select><option>one</option></select>')

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
