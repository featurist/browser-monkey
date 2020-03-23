import {MouseEvent} from './polyfills'
import {KeyboardEvent} from './polyfills'
import normaliseText from './normaliseText'
import keycode from 'keycode'

const eventCreatorsByType = {
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

export default class Dom {
  public enterText (element: HTMLInputElement, text: string | string[], {incremental = true} = {}): void {
    element.focus()

    const enterText = (text: string) => {
      if (matchKeyCode(text)) {
        this.triggerEvent(element, 'keydown', text)
        this.triggerEvent(element, 'keypress', text)
        this.triggerEvent(element, 'keyup', text)
      } else if (incremental) {
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
    }

    if (typeof text === 'string') {
      enterText(text)
    } else {
      text.forEach(t => enterText(t))
    }

    this.triggerEvent(element, 'change')
  }

  public elementInnerText (element: HTMLElement): string {
    return normaliseText(element.innerText)
  }

  public click (element: HTMLElement): void {
    this.triggerEvent(element, 'mousedown')
    this.triggerEvent(element, 'mouseup')
    element.click()
    element.focus()
  }

  public querySelectorAll (element: HTMLElement, selector: string, {visibleOnly = true} = {}): HTMLElement[] {
    var children = Array.prototype.slice.call(element.querySelectorAll(selector))

    children = visibleOnly
      ? children.filter(c => this.elementVisible(c))
      : children

    return children
  }

  public elementVisible (element: HTMLElement): boolean {
    if (element.tagName === 'OPTION' && element.parentNode) {
      return this.elementVisible(element.parentNode as HTMLElement)
    } else {
      return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
    }
  }

  public elementMatches (element: HTMLElement, selector: string): boolean {
    return element.matches(selector)
  }

  public selectOption (selectElement: HTMLSelectElement, optionElement: HTMLOptionElement): void {
    this.click(selectElement)
    selectElement.selectedIndex = optionElement.index
    this.triggerEvent(selectElement, 'input')
    this.triggerEvent(selectElement, 'change')
  }

  private triggerEvent (element: HTMLElement, eventType, value?): void {
    var creator = eventCreatorsByType[eventType]

    if (!creator) {
      throw new Error('event type ' + JSON.stringify(eventType) + ' not recognised')
    }

    var event = creator(value)

    element.dispatchEvent(event)
  }

  public setInputValue (element: HTMLInputElement, value: string): void {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value)
    } else {
      element.value = value
    }
    this.triggerEvent(element, 'input')
  }

  public typeKey (element: HTMLInputElement, value: string, key: string): void {
    this.triggerEvent(element, 'keydown', key)
    this.triggerEvent(element, 'keypress', key)
    this.setInputValue(element, value)
    this.triggerEvent(element, 'keyup', key)
  }

  public checked (element: HTMLInputElement): 'indeterminate'|boolean {
    return element.indeterminate
      ? 'indeterminate'
      : element.checked
  }

  public selector (element: HTMLElement): string {
    var id = element.id
    var classes = element.className.split(/ +/g).filter(Boolean).sort()
    var tag = element.tagName.toLowerCase()

    return (id || '') +
      tag +
      (classes.length ? '.' + classes.join('.') : '')
  }

  public submit (element: HTMLInputElement): void {
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

function createMouseEvent (type): MouseEvent {
  return new MouseEvent(type, { bubbles: true, cancelable: true })
}

function createEvent (type, params = {bubbles: true, cancelable: false}): Event {
  // IE compatible old school way of creating events.
  var event = document.createEvent('Event')
  event.initEvent(type, params.bubbles, params.cancelable)
  return event
}

function matchKeyCode (text) {
  return /^{(.*)}$/.exec(text)
}

function createKeyboardEvent (type, key): KeyboardEvent {
  const event = new KeyboardEvent(type, { bubbles: true, cancelable: true })

  const match = matchKeyCode(key)

  if (match) {
    const code = match[1]
    Object.defineProperty(event, 'code', {
      get: () => code,
    })
    const which = keycode(code)
    Object.defineProperty(event, 'keyCode', {
      get: () => which,
    })
    Object.defineProperty(event, 'which', {
      get: () => which,
    })
    Object.defineProperty(event, 'key', {
      get: () => code,
    })
  } else {
    Object.defineProperty(event, 'key', {
      get: () => key,
    })
  }

  return event
}
