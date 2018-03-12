var describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')
const elementVisible = require('../lib/elementVisible')
const elementClick = require('../lib/elementClick')
const elementSelect = require('../lib/elementSelect')
const elementMatches = require('../lib/elementMatches')
const elementSubmit = require('../lib/elementSubmit')
const elementTriggerEvent = require('../lib/elementTriggerEvent')
const elementEnterText = require('../lib/elementEnterText')
const elementInnerText = require('../lib/elementInnerText')
const {expect} = require('chai')

describe('dom', () => {
  describeAssemblies([DomAssembly], Assembly => {
    var assembly

    beforeEach(() => {
      assembly = new Assembly()
      assembly.div()
    })

    function preventDefaultSubmit (handler) {
      return e => {
        if (e.type === 'submit') {
          e.preventDefault()
        }
        return handler(e)
      }
    }

    describe('submitting', () => {
      it('form with submit button receives submit event when element submitted inside it', () => {
        var formEvents = []
        var inputEvents = []
        var buttonEvents = []

        var form = assembly.insertHtml('<form><input type="text"/><button type="submit">submit</button></form>')
        var input = assembly.find('input')
        var button = assembly.find('button')

        ;['submit', 'keydown', 'keypress', 'click', 'keyup'].forEach(type => {
          form.addEventListener(type, preventDefaultSubmit(e => formEvents.push(type)))
          input.addEventListener(type, () => inputEvents.push(type))
          button.addEventListener(type, () => buttonEvents.push(type))
        })

        elementSubmit(input)

        expect(formEvents).to.eql([
          'keydown',
          'keypress',
          'click',
          'submit',
          'keyup'
        ])

        expect(inputEvents).to.eql([
          'keydown',
          'keypress',
          'keyup'
        ])

        expect(buttonEvents).to.eql([
          'click'
        ])

        assembly.assertElementIsFocussed(input)
      })

      it('form without submit button receives submit event when element submitted inside it', () => {
        var formEvents = []
        var inputEvents = []

        var form = assembly.insertHtml('<form><input type="text"/></form>')
        var input = assembly.find('input')

        ;['submit', 'keydown', 'keypress', 'click', 'keyup'].forEach(type => {
          form.addEventListener(type, preventDefaultSubmit(e => formEvents.push(type)))
          input.addEventListener(type, () => inputEvents.push(type))
        })

        elementSubmit(input)

        expect(formEvents).to.eql([
          'keydown',
          'keypress',
          'submit',
          'keyup'
        ])

        expect(inputEvents).to.eql([
          'keydown',
          'keypress',
          'keyup'
        ])

        assembly.assertElementIsFocussed(input)
      })
    })

    describe('innerText', () => {
      it('normalises innerText removing extra spaces at the end of lines', () => {
        var element = assembly.insertHtml(`
          <div>
            first
            line
            <br/>
            second
            line
          </div>
        `)

        expect(elementInnerText(element)).to.equal('first line\nsecond line')
      })

      it('normalises innerText removing extra spaces between words', () => {
        var element = assembly.insertHtml(`
          <div>
            two     words
          </div>
        `)

        expect(elementInnerText(element)).to.equal('two words')
      })
    })

    describe('clicking', () => {
      it('clicks an element and sends correct events', () => {
        var events = []
        var element = assembly.insertHtml('<button/>')

        ;['mousedown', 'mouseup', 'click'].forEach(type => {
          element.addEventListener(type, () => events.push(type))
        })

        elementClick(element)

        expect(events).to.eql([
          'mousedown',
          'mouseup',
          'click'
        ])

        assembly.assertElementIsFocussed(element)
      })

      it('form receives submit event when button clicked inside it', () => {
        var events = []
        var element = assembly.insertHtml('<form><button id="submit" type="submit"/></form>')
        var submit = assembly.find('#submit')

        ;['submit'].forEach(type => {
          element.addEventListener(type, preventDefaultSubmit(() => events.push(type)))
        })

        elementClick(submit)

        expect(events).to.eql([
          'submit'
        ])
      })

      it('clicking a checkbox toggles the checked property', () => {
        var events = []
        var checkbox = assembly.insertHtml('<input type="checkbox"/>')

        ;['mousedown', 'mouseup', 'click'].forEach(type => {
          checkbox.addEventListener(type, () => events.push(type))
        })

        elementClick(checkbox)

        expect(events).to.eql([
          'mousedown',
          'mouseup',
          'click'
        ])

        expect(checkbox.checked).to.equal(true)
        elementClick(checkbox)
        expect(checkbox.checked).to.equal(false)
      })

      it('clicking a checkbox label toggle the checked property', () => {
        var events = []
        var label = assembly.insertHtml('<label><input type="checkbox"/> done</label>')
        var checkbox = assembly.find('input')

        ;['mousedown', 'mouseup', 'click'].forEach(type => {
          label.addEventListener(type, () => events.push('label:' + type))
          checkbox.addEventListener(type, () => events.push('checkbox:' + type))
        })

        elementClick(checkbox)

        expect(events).to.eql([
          'checkbox:mousedown',
          'label:mousedown',
          'checkbox:mouseup',
          'label:mouseup',
          'checkbox:click',
          'label:click'
        ])

        expect(checkbox.checked).to.equal(true)
        elementClick(checkbox)
        expect(checkbox.checked).to.equal(false)
      })
    })

    describe('selecting', () => {
      it('selects an option, sends events and sets value', () => {
        var selectEvents = []
        var selectElement = assembly.insertHtml(`
          <select>
            <option id="one">one</option>
            <option id="two">two</option>
          </select>
        `)

        var one = assembly.find('#one')
        var two = assembly.find('#two')

        ;['mousedown', 'mouseup', 'click', 'input', 'change'].forEach(type => {
          selectElement.addEventListener(type, () => selectEvents.push(type))
        })

        elementSelect(selectElement, one)

        expect(selectEvents).to.eql([
          'mousedown',
          'mouseup',
          'click',
          'input',
          'change'
        ])

        expect(selectElement.selectedIndex).to.equal(0)
        expect(selectElement.value).to.equal('one')
        expect(one.selected).to.equal(true)
        expect(two.selected).to.equal(false)
        expect(two.selected).to.equal(false)
        assembly.assertElementIsFocussed(selectElement)

        elementSelect(selectElement, two)

        expect(selectElement.selectedIndex).to.equal(1)
        expect(selectElement.value).to.equal('two')
        expect(one.selected).to.equal(false)
        expect(two.selected).to.equal(true)
        assembly.assertElementIsFocussed(selectElement)
      })
    })

    describe('entering text', () => {
      it('enters text into an input', () => {
        var events = []
        var input = assembly.insertHtml('<input type="text"/>')

        ;['keydown', 'keypress', 'input', 'keyup', 'change'].forEach(type => {
          input.addEventListener(type, e => events.push(type + ':' + e.target.value))
        })

        elementEnterText(input, 'abc')

        expect(events).to.eql([
          'keydown:',
          'keypress:',
          'input:a',
          'keyup:a',
          'keydown:a',
          'keypress:a',
          'input:ab',
          'keyup:ab',
          'keydown:ab',
          'keypress:ab',
          'input:abc',
          'keyup:abc',
          'change:abc'
        ])

        expect(input.value).to.equal('abc')

        assembly.assertElementIsFocussed(input)
      })

      it('clears any existing text', () => {
        var events = []
        var input = assembly.insertHtml('<input type="text" value="existing"/>')
        
        ;['keydown', 'keypress', 'input', 'keyup', 'change'].forEach(type => {
          input.addEventListener(type, e => events.push(type + ':' + e.target.value))
        })

        elementEnterText(input, 'abc')

        expect(events).to.eql([
          'keydown:existing',
          'keypress:existing',
          'input:',
          'keyup:',
          'keydown:',
          'keypress:',
          'input:a',
          'keyup:a',
          'keydown:a',
          'keypress:a',
          'input:ab',
          'keyup:ab',
          'keydown:ab',
          'keypress:ab',
          'input:abc',
          'keyup:abc',
          'change:abc'
        ])

        expect(input.value).to.equal('abc')

        assembly.assertElementIsFocussed(input)
      })

      it('clears any existing text, even if the text to enter is blank', () => {
        var events = []
        var input = assembly.insertHtml('<input type="text" value="existing"/>')
        
        ;['keydown', 'keypress', 'input', 'keyup', 'change'].forEach(type => {
          input.addEventListener(type, e => events.push(type + ':' + e.target.value))
        })

        elementEnterText(input, '')

        expect(events).to.eql([
          'keydown:existing',
          'keypress:existing',
          'input:',
          'keyup:',
          'change:'
        ])

        expect(input.value).to.equal('')

        assembly.assertElementIsFocussed(input)
      })
    })

    describe('triggering events', () => {
      var eventNames = [
        'mousedown',
        'mouseup',
        'change',
        'keyup',
        'keydown',
        'keypress',
        'input'
      ]

      it('throws error if event type is not known', () => {
        var element = assembly.insertHtml('<div/>')

        expect(() => elementTriggerEvent(element, 'asdf')).to.throw('event type "asdf" not recognised')
      })

      function watchEvents (element) {
        const eventTypes = 'input change keydown keyup keypress mousedown mouseup click submit'.split(' ')

        eventTypes.forEach(eventType => {
          element.addEventListener(eventType, function (event) {
            console.log(element.tagName, eventType, event.target.value)
            if (eventType === 'submit') {
              event.preventDefault()
            }
          })
        })
      }

      it('watch events', () => {
        watchEvents(assembly.insertHtml(`
          <button>asdf</button>
        `))

        watchEvents(assembly.insertHtml(`
          <select id="" name="">
            <option id="x">x</option>
            <option id="y">y <h1>asdf</h1></option>
          </select>
        `))

        watchEvents(assembly.find('#x'))
        watchEvents(assembly.find('#y'))

        watchEvents(assembly.insertHtml(`
          <input type="text">
        `))

        watchEvents(assembly.insertHtml(`
          <form>
            <h1>Form</h1>
            <input id="form-input" type="text"/>
            <button id="form-button">asdf</button>
          </form>
        `))

        watchEvents(assembly.find('#form-input'))
        watchEvents(assembly.find('#form-button'))
      })

      eventNames.forEach(eventName => {
        describe(eventName, () => {
          it('can trigger ' + eventName + ' event', () => {
            var element = assembly.insertHtml('<div/>')

            var eventReceived = new Promise(resolve => {
              element.addEventListener(eventName, function (event) {
                resolve(event)
              })
            })

            elementTriggerEvent(element, eventName)

            return eventReceived
          })

          it('can trigger ' + eventName + ' event and have it bubble to its parent', () => {
            var parent = assembly.insertHtml('<div><div id="child"></div></div>')

            var eventReceived = new Promise(resolve => {
              parent.addEventListener(eventName, function (event) {
                resolve(event)
              })
            })

            var child = assembly.find('#child')

            elementTriggerEvent(child, eventName)

            return eventReceived
          })
        })
      })
    })

    describe('visibility', () => {
      it('when element is visible it returns true', () => {
        var element = assembly.insertHtml('<div>hi</div>')

        expect(elementVisible(element)).to.equal(true)
      })

      it('when element is visible but empty returns true', () => {
        var element = assembly.insertHtml('<div></div>')

        expect(elementVisible(element)).to.equal(true)
      })

      it('when element is display:none it returns false', () => {
        var element = assembly.insertHtml('<div style="display: none">hi</div>')

        expect(elementVisible(element)).to.equal(false)
      })

      it('when element is visible but parent is not', () => {
        assembly.insertHtml('<div style="display: none"><div id="child">hi</div></div>')

        var element = assembly.find('#child')

        expect(elementVisible(element)).to.equal(false)
      })

      it('when element is option and select is visible, returns true', () => {
        assembly.insertHtml('<select><option id="option">1</option><select>')

        var element = assembly.find('#option')

        expect(elementVisible(element)).to.equal(true)
      })

      it('when element is option and select is not visible, returns false', () => {
        assembly.insertHtml('<select style="display: none"><option id="option">1</option><select>')

        var element = assembly.find('#option')

        expect(elementVisible(element)).to.equal(false)
      })
    })

    describe('matches', function () {
      describe('tagName', function () {
        it('returns true when tagName matches', () => {
          var element = assembly.insertHtml('<div></div>')
          expect(elementMatches(element, 'div')).to.equal(true)
        })

        it('returns false when tagName doesnt match', () => {
          var element = assembly.insertHtml('<div></div>')
          expect(elementMatches(element, 'select')).to.equal(false)
        })
      })

      describe('class', function () {
        it('returns true when class matches', () => {
          var element = assembly.insertHtml('<div class="hobo"></div>')
          expect(elementMatches(element, '.hobo')).to.equal(true)
        })

        it('returns false when class doesnt match', () => {
          var element = assembly.insertHtml('<div></div>')
          expect(elementMatches(element, '.hobo')).to.equal(false)
        })
      })
    })
  })
})
