var describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')
var demand = require('must')
var domTest = require('./domTest')
var retry = require('trytryagain')

describe('actions', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

  describe('clicking', function () {
    domTest('stack trace', function (browser, dom) {
      return browser.find('div')
        .click()
        .assertStackTrace(__filename)
    }, {
      mochaOnly: true
    })

    it('should eventually click an element', function () {
      var promise = browser.find('.element').click()
      var clicked = false

      assembly.eventuallyInsertHtml(
        assembly.jQuery('<div class="element"></div>').on('click', function () {
          clicked = true
        })
      )

      return promise.then(function () {
        demand(clicked).to.equal(true)
      })
    })

    it('sends mousedown mouseup and click events', function () {
      var events = []

      assembly.insertHtml(
        assembly.jQuery('<div class="element"></div>').on('mousedown', function () {
          events.push('mousedown')
        }).on('mouseup', function () {
          events.push('mouseup')
        }).on('click', function () {
          events.push('click')
        })
      )

      return browser.find('.element').click().then(function () {
        demand(events).to.eql(['mousedown', 'mouseup', 'click'])
      })
    })

    it('mousedown mouseup and click events bubble up to parent', function () {
      var events = []

      assembly.insertHtml(
        assembly.jQuery('<div class="element"><div class="inner-element">inner</div></div>').on('mousedown', function () {
          events.push('mousedown')
        }).on('mouseup', function () {
          events.push('mouseup')
        }).on('click', function () {
          events.push('click')
        })
      )

      return browser.find('.inner-element').click().then(function () {
        demand(events).to.eql(['mousedown', 'mouseup', 'click'])
      })
    }, {vdom: false})

    it('waits until checkbox is enabled before clicking', function () {
      var promise = browser.find('input[type=checkbox]').click()
      var clicked
      var buttonState = 'disabled'

      var button = assembly.jQuery(assembly.insertHtml('<input type=checkbox disabled></input>'))
      button.on('click', function () {
        clicked = buttonState
      })

      assembly.eventually(function () {
        button.prop('disabled', false)
        buttonState = 'enabled'
      })

      return promise.then(function () {
        demand(clicked).to.equal('enabled')
      })
    })

    it('waits until button is enabled before clicking', function () {
      var promise = browser.find('button', {text: 'a button'}).click()
      var clicked
      var buttonState = 'disabled'

      var button = assembly.jQuery(assembly.insertHtml('<button disabled>a button</button>'))
      button.on('click', function () {
        clicked = buttonState
      })

      assembly.eventually(function () {
        button.prop('disabled', false)
        buttonState = 'enabled'
      })

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
      it('eventually selects an option element using the text', function () {
        var promise = browser.find('.element').select({text: 'Second'})
        var selectedItem

        assembly.eventuallyInsertHtml(
          assembly.jQuery('<select class="element"><option>First</option><option>Second</option></select>').on('change', function () {
            selectedItem = assembly.jQuery(this).find(':selected').text()
          })
        )

        return promise.then(function () {
          demand(selectedItem).to.equal('Second')
        })
      })

      it('eventually selects an option element using the text, when text is passed as a string', function () {
        var promise = browser.find('.element').select('Second')
        var selectedItem

        assembly.eventuallyInsertHtml(
          assembly.jQuery('<select class="element"><option>First</option><option>Second</option></select>').on('change', function () {
            selectedItem = assembly.jQuery(this).find(':selected').text()
          })
        )

        return promise.then(function () {
          demand(selectedItem).to.equal('Second')
        })
      })

      it('should eventually select an option element using a partial match', function () {
        var promise = browser.find('.element').select({text: 'Seco'})
        var selectedItem

        assembly.eventuallyInsertHtml(
          assembly.jQuery('<select class="element"><option>First</option><option>Second</option></select>').on('change', function (e) {
            selectedItem = assembly.jQuery(this).find(':selected').text()
          })
        )

        return promise.then(function () {
          demand(selectedItem).to.equal('Second')
        })
      })

      it('selects the option by index names are ambiguous', function () {
        var selectedItem

        assembly.eventuallyInsertHtml(
          assembly.jQuery('<select><option value="1">Item</option><option value="2">Item</option></select>').on('change', function (e) {
            var select = e.target
            selectedItem = select.value
          })
        )

        return browser.find('select').select({index: 1}).then(function () {
          demand(selectedItem).to.equal('2')
        })
      })

      it('selects an option that eventually appears', function () {
        var promise = browser.find('.element').select({text: 'Second'})
        var selectedItem

        var select = assembly.insertHtml(
          assembly.jQuery('<select class="element"></select>').on('change', function (e) {
            selectedItem = assembly.jQuery(this).find(':selected').text()
          })
        )

        assembly.eventuallyInsertHtml('<option>First</option><option>Second</option>', select)

        return promise.then(function () {
          demand(selectedItem).to.equal('Second')
        })
      })

      it('errors when the specified option does not exist', function () {
        var promise = browser.find('.element').select({text: 'Does not exist'})

        assembly.eventuallyInsertHtml('<select class="element"><option>First</option><option>Second</option></select>')

        return demand(promise).reject.with.error()
      })

      it('errors when the input is not a select', function () {
        var promise = browser.find('.element').select({text: 'Whatevs'})
        assembly.eventuallyInsertHtml('<div class="element"></div>')
        return demand(promise).reject.with.error(/expected some elements/)
      })

      it('selects an option using text that is falsy', function () {
        var promise = browser.find('.element').select({text: 0})
        var selectedItem

        assembly.eventuallyInsertHtml(
          assembly.jQuery('<select class="element"><option>0</option><option>1</option></select>').on('change', function (e) {
            selectedItem = assembly.jQuery(this).find(':selected').text()
          })
        )

        return promise.then(function () {
          demand(selectedItem).to.equal('0')
        })
      })
    })

    describe('exactText', function () {
      it('should select an option using exact text that would otherwise match multiple options', function () {
        var promise = browser.find('.element').select({exactText: 'Mr'})
        var selectedItem

        assembly.eventuallyInsertHtml(
          assembly.jQuery('<select class="element"><option>Mr</option><option>Mrs</option></select>').on('change', function (e) {
            selectedItem = assembly.jQuery(this).find(':selected').text()
          })
        )

        return promise.then(function () {
          demand(selectedItem).to.equal('Mr')
        })
      })

      it('should select an option using exact text that is falsy', function () {
        var promise = browser.find('.element').select({exactText: ''})
        var selectedItem

        assembly.eventuallyInsertHtml(
          assembly.jQuery('<select class="element"><option value="0"></option><option>1</option></select>').on('change', function (e) {
            selectedItem = assembly.jQuery(this).find(':selected').val()
          })
        )

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

    it('should submit the form', function () {
      var submitted = false
      var promise = browser.find('input').submit()

      assembly.eventuallyInsertHtml(
        assembly.jQuery('<form action="#"><input type=text></form>').on('submit', function (ev) {
          submitted = true
        })
      )

      return promise.then(function () {
        demand(submitted).to.equal(true)
      })
    })

    it('should submit the form when submit button is clicked', function () {
      var submitted = false
      var promise = browser.find('input').click()

      assembly.eventuallyInsertHtml(
        assembly.jQuery('<form action="#"><input type="submit">submit</input></form>').on('submit', function (ev) {
          ev.preventDefault()
          submitted = true
        })
      )

      return promise.then(function () {
        demand(submitted).to.equal(true)
      })
    })
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
      it('eventually enters text into: ' + html, function () {
        var typeInPromise = browser.find('.element').typeIn('1234')
        var inputPromise = assembly.eventuallyInsertHtml(html)
        return Promise.all([typeInPromise, inputPromise]).then(function (elements) {
          var input = elements[1]
          demand(input.value).to.equal('1234')
        })
      })
    })

    var notAllowedToTypeInto = [
      '<div class="element"></div>',
      '<input type="checkbox" class="element"></input>',
      '<select class="element"></select>'
    ]

    notAllowedToTypeInto.forEach(function (html) {
      it('rejects attempt to type into element: ' + html, function () {
        var promise = browser.find('.element').typeIn('whatevs')
        var inputPromise = assembly.eventuallyInsertHtml(html)
        return inputPromise.then(function (input) {
          return demand(promise).reject.with.error(/expected some elements/)
        })
      })
    })

    it('blanks out existing text when typing empty text', function () {
      var firedEvents = []
      assembly.insertHtml(
        assembly.jQuery('<input type="text" class="element" value="good bye">')
          .on('input', function (ev) {
            firedEvents.push('input')
          })
      )

      return browser.find('.element').typeIn('').then(function () {
        return retry(function () {
          demand(assembly.find('input.element').value).to.equal('')
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
    it('can check a checkbox by clicking on it', function () {
      var checkbox = assembly.insertHtml('<input class="checkbox" type=checkbox>')
      var checked

      checkbox.addEventListener('click', function (ev) {
        checked = checkbox.checked
      })

      demand(checkbox.checked).to.equal(false)

      var clicked = browser.find('.checkbox').click()
      return clicked.then(function () {
        demand(checkbox.checked).to.equal(true)
        demand(checked).to.equal(true)
      }).then(function () {
        return browser.find('.checkbox').click()
      }).then(function () {
        demand(checkbox.checked).to.equal(false)
        demand(checked).to.equal(false)
      })
    })

    it('can check a checkbox by clicking its label', function () {
      assembly.insertHtml('<label>Check: <input class="checkbox" type=checkbox></label>')
      var checkbox = assembly.find('input')
      var checked

      checkbox.addEventListener('click', function (ev) {
        checked = checkbox.checked
      })

      demand(checkbox.checked).to.equal(false)

      var clicked = browser.find('label').click()
      return clicked.then(function () {
        demand(checkbox.checked).to.equal(true)
        demand(checked).to.equal(true)
      }).then(function () {
        return browser.find('.checkbox').click()
      }).then(function () {
        demand(checkbox.checked).to.equal(false)
        demand(checked).to.equal(false)
      })
    })
  })

  describe('field', function () {
    it('finds the input in the label with the text', () => {
      
    })
  })

  describe('fill', function () {
    it('fills a component with the supplied values', function () {
      var component = browser.component({
        title: function () {
          return this.find('.title')
        },
        name: function () {
          return this.find('.name')
        }
      })
      assembly.eventuallyInsertHtml('<select class="title"><option>Mrs</option><option>Mr</option></select>')
      assembly.eventuallyInsertHtml('<input type="text" class="name"></input>')

      return component.fill([
        {name: 'title', action: 'select', options: {exactText: 'Mr'}},
        {name: 'name', action: 'typeIn', options: {text: 'Joe'}}
      ]).then(function () {
        demand(assembly.find('.title').value).to.equal('Mr')
        demand(assembly.find('.name').value).to.equal('Joe')
      })
    })

    it('can fill using shortcut syntax', function () {
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
      assembly.eventuallyInsertHtml('<select class="title"><option>Mrs</option><option>Mr</option></select>')
      assembly.eventuallyInsertHtml('<input type="text" class="name"></input>')
      assembly.eventuallyInsertHtml('<label class="agree">Check: <input type="checkbox"></label>')

      return component.fill([
        {select: 'title', text: 'Mrs'},
        {typeIn: 'name', options: {text: 'Joe'}},
        {click: 'agree'}
      ]).then(function () {
        demand(assembly.find('.title').value).to.equal('Mrs')
        demand(assembly.find('.name').value).to.equal('Joe')
        demand(assembly.find('.agree input').checked).to.equal(true)
      })
    })

    it('can execute actions on a component', function () {
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
      assembly.eventuallyInsertHtml('<select class="title"><option>Mrs</option></select>')

      return component.fill([
        { myAction: 'title' }
      ]).then(function () {
        demand(myActionRan).to.equal(true)
      })
    })

    it('throws an error if the action cannot be found', function () {
      var component = browser.component({})

      var promise = component.fill([
        {actionDoesNotExist: 'name'}
      ])

      return demand(promise).reject.with.error(/actionDoesNotExist/)
    })

    it('throws an error when trying to call an action on a field which does not exist', function () {
      var component = browser.component({})

      var promise = component.fill([
        {typeIn: 'name'}
      ])

      return demand(promise).reject.with.error("Field 'name' does not exist")
    })

    it('throws an error if the field does not exist', function () {
      var component = browser.component({})

      var promise = component.fill(
        { name: 'address', action: 'blah' }
      )

      return demand(promise).reject.with.error("No field 'address' exists on this component")
    })
  })
  })
})
