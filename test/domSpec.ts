import {DomAssembly} from './assemblies/DomAssembly'
import { expect } from 'chai'

describe('dom', () => {
  let assembly

  beforeEach(() => {
    assembly = new DomAssembly()
    assembly.createDiv()
  })

  afterEach(() => {
    assembly.stop()
  })

  function preventDefaultSubmit <X>(handler: (e: Event) => X): (e: Event) => X {
    return e => {
      if (e.type === 'submit') {
        e.preventDefault()
      }
      return handler(e)
    }
  }

  describe('submitting', () => {
    it('form with submit button receives submit event when element submitted inside it', () => {
      const formEvents = []
      const inputEvents = []
      const buttonEvents = []

      const form = assembly.insertHtml('<form><input type="text"/><button type="submit">submit</button></form>')
      const input = assembly.find('input')
      const button = assembly.find('button')

      ;['submit', 'keydown', 'keypress', 'click', 'keyup'].forEach(type => {
        form.addEventListener(type, preventDefaultSubmit(() => formEvents.push(type)))
        input.addEventListener(type, () => inputEvents.push(type))
        button.addEventListener(type, () => buttonEvents.push(type))
      })

      assembly.dom.submit(input)

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
      const formEvents = []
      const inputEvents = []

      const form = assembly.insertHtml('<form><input type="text"/></form>')
      const input = assembly.find('input')

      ;['submit', 'keydown', 'keypress', 'click', 'keyup'].forEach(type => {
        form.addEventListener(type, preventDefaultSubmit(() => formEvents.push(type)))
        input.addEventListener(type, () => inputEvents.push(type))
      })

      assembly.dom.submit(input)

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
      const element = assembly.insertHtml(`
        <div>
          first
          line
          <br/>
          second
          line
        </div>
      `)

      expect(assembly.dom.elementInnerText(element)).to.equal('first line\nsecond line')
    })

    it('normalises innerText removing extra spaces between words', () => {
      const element = assembly.insertHtml(`
        <div>
          two     words
        </div>
      `)

      expect(assembly.dom.elementInnerText(element)).to.equal('two words')
    })
  })

  describe('clicking', () => {
    it('clicks an element and sends correct events', () => {
      const events = []
      const element = assembly.insertHtml('<button/>')

      ;['mousedown', 'mouseup', 'click'].forEach(type => {
        element.addEventListener(type, () => events.push(type))
      })

      assembly.dom.click(element)

      expect(events).to.eql([
        'mousedown',
        'mouseup',
        'click'
      ])

      assembly.assertElementIsFocussed(element)
    })

    it('form receives submit event when button clicked inside it', () => {
      const events = []
      const element = assembly.insertHtml('<form><button id="submit" type="submit"/></form>')
      const submit = assembly.find('#submit')

      ;['submit'].forEach(type => {
        element.addEventListener(type, preventDefaultSubmit(() => events.push(type)))
      })

      assembly.dom.click(submit)

      expect(events).to.eql([
        'submit'
      ])
    })

    it('clicking a checkbox toggles the checked property', () => {
      const events = []
      const checkbox = assembly.insertHtml('<input type="checkbox"/>')

      ;['mousedown', 'mouseup', 'click'].forEach(type => {
        checkbox.addEventListener(type, () => events.push(type))
      })

      assembly.dom.click(checkbox)

      expect(events).to.eql([
        'mousedown',
        'mouseup',
        'click'
      ])

      expect(checkbox.checked).to.equal(true)
      assembly.dom.click(checkbox)
      expect(checkbox.checked).to.equal(false)
    })

    it('clicking a checkbox label toggle the checked property', () => {
      const events = []
      const label = assembly.insertHtml('<label><input type="checkbox"/> done</label>')
      const checkbox = assembly.find('input')

      ;['mousedown', 'mouseup', 'click'].forEach(type => {
        label.addEventListener(type, () => events.push('label:' + type))
        checkbox.addEventListener(type, () => events.push('checkbox:' + type))
      })

      assembly.dom.click(checkbox)

      expect(events).to.eql([
        'checkbox:mousedown',
        'label:mousedown',
        'checkbox:mouseup',
        'label:mouseup',
        'checkbox:click',
        'label:click'
      ])

      expect(checkbox.checked).to.equal(true)
      assembly.dom.click(checkbox)
      expect(checkbox.checked).to.equal(false)
    })
  })

  describe('selecting', () => {
    it('selects an option, sends events and sets value', () => {
      const selectEvents = []
      const selectElement = assembly.insertHtml(`
        <select>
          <option id="one">one</option>
          <option id="two">two</option>
        </select>
      `)

      const one = assembly.find('#one')
      const two = assembly.find('#two')

      ;['mousedown', 'mouseup', 'click', 'input', 'change'].forEach(type => {
        selectElement.addEventListener(type, () => selectEvents.push(type))
      })

      assembly.dom.selectOption(selectElement, one)

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

      assembly.dom.selectOption(selectElement, two)

      expect(selectElement.selectedIndex).to.equal(1)
      expect(selectElement.value).to.equal('two')
      expect(one.selected).to.equal(false)
      expect(two.selected).to.equal(true)
      assembly.assertElementIsFocussed(selectElement)
    })
  })

  describe('entering text', () => {
    it('enters text into an input', () => {
      const events = []
      const input = assembly.insertHtml('<input type="text"/>')

      ;['keydown', 'keypress', 'input', 'keyup', 'change'].forEach(type => {
        input.addEventListener(type, e => events.push(type + ':' + e.target.value))
      })

      assembly.dom.enterText(input, 'abc')

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
      const events = []
      const input = assembly.insertHtml('<input type="text" value="existing"/>')

      ;['keydown', 'keypress', 'input', 'keyup', 'change'].forEach(type => {
        input.addEventListener(type, e => events.push(type + ':' + e.target.value))
      })

      assembly.dom.enterText(input, 'abc')

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
      const events = []
      const input = assembly.insertHtml('<input type="text" value="existing"/>')

      ;['keydown', 'keypress', 'input', 'keyup', 'change'].forEach(type => {
        input.addEventListener(type, e => events.push(type + ':' + e.target.value))
      })

      assembly.dom.enterText(input, '')

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
    const eventNames = [
      'mousedown',
      'mouseup',
      'change',
      'keyup',
      'keydown',
      'keypress',
      'input'
    ]

    it('throws error if event type is not known', () => {
      const element = assembly.insertHtml('<div/>')

      expect(() => assembly.dom.triggerEvent(element, 'asdf')).to.throw('event type "asdf" not recognised')
    })

    function watchEvents (element): void {
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
          const element = assembly.insertHtml('<div/>')

          const eventReceived = new Promise(resolve => {
            element.addEventListener(eventName, function (event) {
              resolve(event)
            })
          })

          assembly.dom.triggerEvent(element, eventName)

          return eventReceived
        })

        it('can trigger ' + eventName + ' event and have it bubble to its parent', () => {
          const parent = assembly.insertHtml('<div><div id="child"></div></div>')

          const eventReceived = new Promise(resolve => {
            parent.addEventListener(eventName, function (event) {
              resolve(event)
            })
          })

          const child = assembly.find('#child')

          assembly.dom.triggerEvent(child, eventName)

          return eventReceived
        })
      })
    })
  })

  describe('visibility', () => {
    it('when element is visible it returns true', () => {
      const element = assembly.insertHtml('<div>hi</div>')

      expect(assembly.dom.elementVisible(element)).to.equal(true)
    })

    it('when element is visible but empty returns true', () => {
      const element = assembly.insertHtml('<div></div>')

      expect(assembly.dom.elementVisible(element)).to.equal(true)
    })

    it('when element is display:none it returns false', () => {
      const element = assembly.insertHtml('<div style="display: none">hi</div>')

      expect(assembly.dom.elementVisible(element)).to.equal(false)
    })

    it('when element is visible but parent is not', () => {
      assembly.insertHtml('<div style="display: none"><div id="child">hi</div></div>')

      const element = assembly.find('#child')

      expect(assembly.dom.elementVisible(element)).to.equal(false)
    })

    it('when element is option and select is visible, returns true', () => {
      assembly.insertHtml('<select><option id="option">1</option><select>')

      const element = assembly.find('#option')

      expect(assembly.dom.elementVisible(element)).to.equal(true)
    })

    it('when element is option and select is not visible, returns false', () => {
      assembly.insertHtml('<select style="display: none"><option id="option">1</option><select>')

      const element = assembly.find('#option')

      expect(assembly.dom.elementVisible(element)).to.equal(false)
    })
  })

  describe('matches', function () {
    describe('tagName', function () {
      it('returns true when tagName matches', () => {
        const element = assembly.insertHtml('<div></div>')
        expect(assembly.dom.elementMatches(element, 'div')).to.equal(true)
      })

      it('returns false when tagName doesnt match', () => {
        const element = assembly.insertHtml('<div></div>')
        expect(assembly.dom.elementMatches(element, 'select')).to.equal(false)
      })
    })

    describe('class', function () {
      it('returns true when class matches', () => {
        const element = assembly.insertHtml('<div class="hobo"></div>')
        expect(assembly.dom.elementMatches(element, '.hobo')).to.equal(true)
      })

      it('returns false when class doesnt match', () => {
        const element = assembly.insertHtml('<div></div>')
        expect(assembly.dom.elementMatches(element, '.hobo')).to.equal(false)
      })
    })
  })
})
