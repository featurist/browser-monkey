var MouseEvent = require('./polyfills').MouseEvent
var KeyboardEvent = require('./polyfills').KeyboardEvent
const normaliseText = require('./normaliseText')

export default class Dom {
  enterText (element: HTMLInputElement, text: string, {incremental = true} = {}): void {
    element.focus()

    if (incremental) {
      if (element.value !== '') {
        this.typeKey(element, '', undefined)
      }

      text.split('').forEach((key, index) => {
        const value = text.slice(0, index + 1)
        this.typeKey(element, value, key)
      })
    } else {
      this.setInputValue(element, text)
    }

    this.triggerEvent(element, 'change')
  }

  elementInnerText (element: HTMLElement, selector): void {
    return normaliseText(element.innerText)
  }

  click (element: HTMLElement): void {
    this.triggerEvent(element, 'mousedown')
    this.triggerEvent(element, 'mouseup')
    element.click()
    element.focus()
  }

  querySelectorAll (element: HTMLElement, selector: string, {visibleOnly = true} = {}): HTMLElement[] {
    var children = Array.prototype.slice.call(element.querySelectorAll(selector))

    children = visibleOnly
      ? children.filter(c => this.elementVisible(c))
      : children

    return children
  }

  elementVisible (element: HTMLElement): boolean {
    if (element.tagName === 'OPTION' && element.parentNode) {
      return this.elementVisible(element.parentNode as HTMLElement)
    } else {
      return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
    }
  }

  elementMatches (element: HTMLElement, selector: string): boolean {
    return element.matches(selector)
  }

  selectOption (selectElement: HTMLSelectElement, optionElement: HTMLOptionElement): void {
    this.click(selectElement)
    selectElement.selectedIndex = optionElement.index
    this.triggerEvent(selectElement, 'input')
    this.triggerEvent(selectElement, 'change')
  }

  triggerEvent (element: HTMLElement, eventType, value?) {
    var creator = eventCreatorsByType[eventType]

    if (!creator) {
      throw new Error('event type ' + JSON.stringify(eventType) + ' not recognised')
    }

    var event = creator(value)

    element.dispatchEvent(event)
  }

  setInputValue (element: HTMLInputElement, value: string): void {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value)
    } else {
      element.value = value
    }
    this.triggerEvent(element, 'input')
  }

  typeKey (element: HTMLInputElement, value: string, key: string): void {
    this.triggerEvent(element, 'keydown', key)
    this.triggerEvent(element, 'keypress', key)
    this.setInputValue(element, value)
    this.triggerEvent(element, 'keyup', key)
  }

  checked (element: HTMLInputElement): 'indeterminate'|boolean {
    return element.indeterminate
      ? 'indeterminate'
      : element.checked
  }

  selector (element: HTMLElement): string {
    var id = element.id
    var classes = element.className.split(/ +/g).filter(Boolean).sort()
    var tag = element.tagName.toLowerCase()

    return (id || '') +
      tag +
      (classes.length ? '.' + classes.join('.') : '')
  }

  submit (element: HTMLInputElement) {
    element.focus()
    this.triggerEvent(element, 'keydown')
    this.triggerEvent(element, 'keypress')
    var submitButton = element.form.querySelector('input[type="submit"], button[type="submit"]')
    if (submitButton) {
      (submitButton as HTMLElement).click()
    } else {
      this.triggerEvent(element.form, 'submit')
    }
    this.triggerEvent(element, 'keyup')
  }
}

function createMouseEvent (type) {
  return new MouseEvent(type, { bubbles: true, cancelable: true })
}

function createEvent (type, params = {bubbles: true, cancelable: false}) {
  // IE compatible old school way of creating events.
  var event = document.createEvent('Event')
  event.initEvent(type, params.bubbles, params.cancelable)
  return event
}

function createKeyboardEvent (type, key) {
  return new KeyboardEvent(type, { bubbles: true, cancelable: true, key: key })
}

var eventCreatorsByType = {
  mousedown: function () {
    return createMouseEvent('mousedown')
  },
  mouseup: function () {
    return createMouseEvent('mouseup')
  },
  change: function () {
    return createEvent('change')
  },
  input: function () {
    return createEvent('input')
  },
  keydown: function (key) {
    return createKeyboardEvent('keydown', key)
  },
  keyup: function (key) {
    return createKeyboardEvent('keyup', key)
  },
  keypress: function (key) {
    return createKeyboardEvent('keypress', key)
  },
  submit: function () {
    return createEvent('submit', { bubbles: true, cancelable: true })
  }
}
