var demand = require('must')
var domTest = require('./domTest')
var retry = require('trytryagain')

describe('actions', function () {
  describe('clicking', function () {
    domTest('stack trace', function (browser, dom) {
      return browser.find('div')
        .click()
        .assertStackTrace(__filename)
    }, {
      mochaOnly: true
    })

    domTest('should eventually click an element', function (browser, dom, $) {
      var promise = browser.find('.element').click()
      var clicked = false

      dom.eventuallyInsert(
        $('<div class="element"></div>').on('click', function () {
          clicked = true
        })
      )

      return promise.then(function () {
        demand(clicked).to.equal(true)
      })
    })

    domTest.only('should reject attempts to click multiple matching elements', function (browser, dom, $) {
      var promise = browser.find('span', { text: 'lemonade' }).click()

      dom.insert(
        $('<span class="x">lemonade</span><span class="y">lemonade</span>')
      )

      return promise.then(function () {
        throw new Error('Promise should not resolve')
      }).catch(function (error) {
        demand(error.message).to.equal('whatevs')
      })
    })

    domTest('sends mousedown mouseup and click events', function (browser, dom) {
      var events = []

      dom.insert('<div class="element"></div>').on('mousedown', function () {
        events.push('mousedown')
      }).on('mouseup', function () {
        events.push('mouseup')
      }).on('click', function () {
        events.push('click')
      })

      return browser.find('.element').click().then(function () {
        demand(events).to.eql(['mousedown', 'mouseup', 'click'])
      })
    })

    domTest('mousedown mouseup and click events bubble up to parent', function (browser, dom) {
      var events = []

      dom.insert('<div class="element"><div class="inner-element">inner</div></div>').on('mousedown', function () {
        events.push('mousedown')
      }).on('mouseup', function () {
        events.push('mouseup')
      }).on('click', function () {
        events.push('click')
      })

      return browser.find('.inner-element').click().then(function () {
        demand(events).to.eql(['mousedown', 'mouseup', 'click'])
      })
    }, {vdom: false})

    domTest('waits until checkbox is enabled before clicking', function (browser, dom) {
      var promise = browser.find('input[type=checkbox]').click()
      var clicked
      var buttonState = 'disabled'

      var button = dom.insert('<input type=checkbox disabled></input>')
      button.on('click', function () {
        clicked = buttonState
      })

      setTimeout(function () {
        button.prop('disabled', false)
        buttonState = 'enabled'
      }, 10)

      return promise.then(function () {
        demand(clicked).to.equal('enabled')
      })
    })

    domTest('waits until button is enabled before clicking', function (browser, dom) {
      var promise = browser.find('button', {text: 'a button'}).click()
      var clicked
      var buttonState = 'disabled'

      var button = dom.insert('<button disabled>a button</button>')
      button.on('click', function () {
        clicked = buttonState
      })

      setTimeout(function () {
        button.prop('disabled', false)
        buttonState = 'enabled'
      }, 10)

      return promise.then(function () {
        demand(clicked).to.equal('enabled')
      })
    })
  })

  describe('select', function () {
    domTest('stack trace', function (browser, dom) {
      return browser.find('div')
        .select({text: 'Text'})
        .assertStackTrace(__filename)
    }, {
      mochaOnly: true
    })

    describe('text', function () {
      domTest('respects timeout option', function (browser, dom, $) {
        var promise = browser.find('.element').select({text: 'Second', timeout: 3})

        dom.eventuallyInsert(
          $('<select class="element"><option>First</option><option>Second</option></select>')
        , 6)

        return demand(promise).reject.with.error()
      })

      domTest('respects timeout option, when passed separately from text', function (browser, dom, $) {
        var promise = browser.find('.element').select('Second', {timeout: 3})

        dom.eventuallyInsert(
          $('<select class="element"><option>First</option><option>Second</option></select>')
        , 6)

        return demand(promise).reject.with.error('expected to find: .element select option {"timeout":3,"text":"Second"}')
      })

      domTest('eventually selects an option element using the text', function (browser, dom, $) {
        var promise = browser.find('.element').select({text: 'Second'})
        var selectedItem

        dom.eventuallyInsert(
          $('<select class="element"><option>First</option><option>Second</option></select>').on('change', function () {
            selectedItem = $(this).find('option[selected]').text()
          })
        )

        return promise.then(function () {
          demand(selectedItem).to.equal('Second')
        })
      })

      domTest('eventually selects an option element using the text, when text is passed as a string', function (browser, dom, $) {
        var promise = browser.find('.element').select('Second')
        var selectedItem

        dom.eventuallyInsert(
          $('<select class="element"><option>First</option><option>Second</option></select>').on('change', function () {
            selectedItem = $(this).find('option[selected]').text()
          })
        )

        return promise.then(function () {
          demand(selectedItem).to.equal('Second')
        })
      })

      domTest('should eventually select an option element using a partial match', function (browser, dom, $) {
        var promise = browser.find('.element').select({text: 'Seco'})
        var selectedItem

        dom.eventuallyInsert(
          $('<select class="element"><option>First</option><option>Second</option></select>').on('change', function (e) {
            selectedItem = $(this).find('option[selected]').text()
          })
        )

        return promise.then(function () {
          demand(selectedItem).to.equal('Second')
        })
      })

      domTest('selects the first match if multiple available', function (browser, dom, $) {
        var selectedItem

        var select = dom.insert('<select><option value="1">Item</option><option value="2">Item</option></select>').on('change', function (e) {
          selectedItem = select.val()
        })

        return browser.find('select').select({text: 'Item'}).then(function () {
          demand(selectedItem).to.equal('1')
        })
      })

      domTest('selects an option that eventually appears', function (browser, dom, $) {
        var promise = browser.find('.element').select({text: 'Second'})
        var selectedItem

        var select = dom.insert('<select class="element"></select>').on('change', function (e) {
          selectedItem = $(this).find('option[selected]').text()
        })

        setTimeout(function () {
          select.append('<option>First</option><option>Second</option>')
        }, 20)

        return promise.then(function () {
          demand(selectedItem).to.equal('Second')
        })
      })

      domTest('errors when the specified option does not exist', function (browser, dom) {
        var promise = browser.find('.element').select({text: 'Does not exist'})

        dom.eventuallyInsert('<select class="element"><option>First</option><option>Second</option></select>')

        return demand(promise).reject.with.error()
      })

      domTest('errors when the input is not a select', function (browser, dom) {
        var promise = browser.find('.element').select({text: 'Whatevs'})
        dom.eventuallyInsert('<div class="element"></div>')
        return demand(promise).reject.with.error(/to have css select/)
      })

      domTest('selects an option using text that is falsy', function (browser, dom, $) {
        var promise = browser.find('.element').select({text: 0})
        var selectedItem

        dom.insert('<select class="element"><option>0</option><option>1</option></select>').on('change', function (e) {
          selectedItem = $(this).find('option[selected]').text()
        })

        return promise.then(function () {
          demand(selectedItem).to.equal('0')
        })
      })
    })

    describe('exactText', function () {
      domTest('should select an option using exact text that would otherwise match multiple options', function (browser, dom, $) {
        var promise = browser.find('.element').select({exactText: 'Mr'})
        var selectedItem

        dom.insert('<select class="element"><option>Mr</option><option>Mrs</option></select>').on('change', function (e) {
          selectedItem = $(this).find('option[selected]').text()
        })

        return promise.then(function () {
          demand(selectedItem).to.equal('Mr')
        })
      })

      domTest('should select an option using exact text that is falsy', function (browser, dom, $) {
        var promise = browser.find('.element').select({exactText: 0})
        var selectedItem

        dom.insert('<select class="element"><option>0</option><option>1</option></select>').on('change', function (e) {
          selectedItem = $(this).find('option[selected]').text()
        })

        return promise.then(function () {
          demand(selectedItem).to.equal('0')
        })
      })
    })
  })

  describe('submit', function () {
    domTest('stack trace', function (browser, dom) {
      return browser.find('div')
        .submit()
        .assertStackTrace(__filename)
    }, {
      mochaOnly: true
    })

    domTest('should submit the form', function (browser, dom) {
      var submitted = false
      var promise = browser.find('input').submit()

      dom.insert('<form action="#"><input type=text></form>').on('submit', function (ev) {
        submitted = true
      })

      return promise.then(function () {
        demand(submitted).to.equal(true)
      })
    })

    domTest('should submit the form when submit button is clicked', function (browser, dom) {
      var submitted = false
      var promise = browser.find('input').click()

      dom.insert('<form action="#"><input type="submit">submit</input></form>').on('submit', function (ev) {
        ev.preventDefault()
        submitted = true
      })

      return promise.then(function () {
        demand(submitted).to.equal(true)
      })
    }, {vdom: false})
  })

  describe('typeIn', function () {
    domTest('stack trace', function (browser, dom) {
      return browser.find('input')
        .typeIn('hello')
        .assertStackTrace(__filename)
    }, {
      mochaOnly: true
    })

    var allowedToTypeInto = [
      '<input class="element"></input>',
      '<input class="element" type="text"></input>',
      '<input class="element" type="email"></input>',
      '<input class="element" type="password"></input>',
      '<input class="element" type="search"></input>',
      '<input class="element" type="tel"></input>',
      '<input class="element" type="url"></input>',
      '<input class="element" type="number"></input>',
      '<textarea class="element"></textara>'
    ]

    allowedToTypeInto.forEach(function (html) {
      domTest('eventually enters text into: ' + html, function (browser, dom) {
        var promise = browser.find('.element').typeIn('1234')
        dom.eventuallyInsert(html)
        return promise.then(function () {
          demand(dom.el.find('.element').val()).to.equal('1234')
        })
      })
    })

    var notAllowedToTypeInto = [
      '<div class="element"></div>',
      '<input type="checkbox" class="element"></input>',
      '<select class="element"></select>'
    ]

    notAllowedToTypeInto.forEach(function (html) {
      domTest('rejects attempt to type into element: ' + html, function (browser, dom, $) {
        var promise = browser.find('.element').typeIn('whatevs')
        dom.eventuallyInsert(html)
        return demand(promise).reject.with.error('Cannot type into ' + $(html).prop('tagName'))
      })
    })

    domTest('blanks out existing text when typing empty text', function (browser, dom) {
      var firedEvents = []
      dom.insert('<input type="text" class="element" value="good bye">')
      .on('input', function (ev) { firedEvents.push('input') })

      return browser.find('.element').typeIn('').then(function () {
        return retry(function () {
          demand(dom.el.find('input.element').val()).to.equal('')
          demand(firedEvents).to.eql(['input'])
        })
      })
    })
  })
  describe('typeInHtml', function () {
    domTest('stack trace', function (browser, dom) {
      return browser.find('input')
        .typeInHtml('<p>hello</p>')
        .assertStackTrace(__filename)
    }, {
      mochaOnly: true
    })
  })

  describe('checkboxes', function () {
    domTest('can check a checkbox by clicking on it', function (browser, dom, $) {
      var checkbox = dom.insert('<input class="checkbox" type=checkbox>')
      var checked

      checkbox.on('click', function (ev) {
        checked = $(this).prop('checked')
      })

      demand(checkbox.prop('checked')).to.equal(false)

      var clicked = browser.find('.checkbox').click()
      return clicked.then(function () {
        demand(checkbox.prop('checked')).to.equal(true)
        demand(checked).to.equal(true)
      }).then(function () {
        return browser.find('.checkbox').click()
      }).then(function () {
        demand(checkbox.prop('checked')).to.equal(false)
        demand(checked).to.equal(false)
      })
    })

    domTest('can check a checkbox by clicking its label', function (browser, dom, $) {
      dom.insert('<label>Check: <input class="checkbox" type=checkbox></label>')
      var checkbox = dom.el.find('input')
      var checked

      checkbox.on('click', function (ev) {
        checked = $(this).prop('checked')
      })

      demand(checkbox.prop('checked')).to.equal(false)

      var clicked = browser.find('label').click()
      return clicked.then(function () {
        demand(checkbox.prop('checked')).to.equal(true)
        demand(checked).to.equal(true)
      }).then(function () {
        return browser.find('.checkbox').click()
      }).then(function () {
        demand(checkbox.prop('checked')).to.equal(false)
        demand(checked).to.equal(false)
      })
    })
  })

  describe('fill', function () {
    domTest('fills a component with the supplied values', function (browser, dom) {
      var component = browser.component({
        title: function () {
          return this.find('.title')
        },
        name: function () {
          return this.find('.name')
        }
      })
      dom.eventuallyInsert('<select class="title"><option>Mrs</option><option>Mr</option></select>')
      dom.eventuallyInsert('<input type="text" class="name"></input>')

      return component.fill([
        {name: 'title', action: 'select', options: {exactText: 'Mr'}},
        {name: 'name', action: 'typeIn', options: {text: 'Joe'}}
      ]).then(function () {
        demand(dom.el.find('.title').val()).to.equal('Mr')
        demand(dom.el.find('.name').val()).to.equal('Joe')
      })
    })

    domTest('can fill using shortcut syntax', function (browser, dom) {
      var component = browser.component({
        title: function () {
          return this.find('.title')
        },
        name: function () {
          return this.find('.name')
        },
        agree: function () {
          return this.find('.agree')
        }
      })
      dom.eventuallyInsert('<select class="title"><option>Mrs</option><option>Mr</option></select>')
      dom.eventuallyInsert('<input type="text" class="name"></input>')
      dom.eventuallyInsert('<label class="agree">Check: <input type="checkbox"></label>')

      return component.fill([
        {select: 'title', text: 'Mrs'},
        {typeIn: 'name', options: {text: 'Joe'}},
        {click: 'agree'}
      ]).then(function () {
        demand(dom.el.find('.title').val()).to.equal('Mrs')
        demand(dom.el.find('.name').val()).to.equal('Joe')
        demand(dom.el.find('.agree input').prop('checked')).to.equal(true)
      })
    })

    domTest('can execute actions on a component', function (browser, dom) {
      var myActionRan = false
      var component = browser.component({
        myAction: function () {
          myActionRan = true

          return new Promise(function (resolve) {
            resolve()
          })
        }
      }).component({
        title: function () {
          return this.find('.title')
        }
      })
      dom.eventuallyInsert('<select class="title"><option>Mrs</option></select>')

      return component.fill([
        { myAction: 'title' }
      ]).then(function () {
        demand(myActionRan).to.equal(true)
      })
    })

    domTest('throws an error if the action cannot be found', function (browser, dom) {
      var component = browser.component({})

      var promise = component.fill([
        {actionDoesNotExist: 'name'}
      ])

      return demand(promise).reject.with.error(/actionDoesNotExist/)
    })

    domTest('throws an error when trying to call an action on a field which does not exist', function (browser, dom) {
      var component = browser.component({})

      var promise = component.fill([
        {typeIn: 'name'}
      ])

      return demand(promise).reject.with.error("Field 'name' does not exist")
    })

    domTest('throws an error if the field does not exist', function (browser, dom) {
      var component = browser.component({})

      var promise = component.fill(
        { name: 'address', action: 'blah' }
      )

      return demand(promise).reject.with.error("No field 'address' exists on this component")
    })
  })
})
