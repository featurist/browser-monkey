import {MouseEvent, KeyboardEvent} from './polyfills'
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

function getFormSubmits(form) {
  return form.querySelectorAll('input[type=submit],button:not([type=reset])')
}

function multipleInputsAllowImplicitSubmissionAndNoSubmitElements(form) {
  const submits = getFormSubmits(form)

  // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
  // some types of inputs can submit the form when hitting {enter}
  // but only if they are the sole input that allows implicit submission
  // and there are no buttons or input[submits] in the form
  const implicitSubmissionInputs = Array.from(form.querySelectorAll('input')).filter(isInputAllowingImplicitFormSubmission)

  return (implicitSubmissionInputs.length > 1) && (submits.length === 0)
}

function simulateSubmitHandler(form, event) {
  // bail if we have multiple inputs allowing implicit submission and no submit elements
  if (multipleInputsAllowImplicitSubmissionAndNoSubmitElements(form)) {
    return
  }

  const defaultButton = getFormSubmits(form)[0]

  // bail if the default button is in a 'disabled' state
  if (defaultButton && defaultButton.disabled) {
    return
  }

  // issue the click event to the 'default button' of the form
  // we need this to be synchronous so not going through our
  // own click command
  // as of now, at least in Chrome, causing the click event
  // on the button will indeed trigger the form submit event
  // so we dont need to fire it manually anymore!
  if (defaultButton) {
    defaultButton.click()
  } else {
    // if we werent able to click the default button
    // then synchronously fire the submit event
    // currently this is sync but if we use a waterfall
    // promise in the submit command it will break again
    // consider changing type to a Promise and juggle logging
    const submitForm = (e) => {
      if (e == event) {
        form.removeEventListener('keypress', submitForm)
        form.dispatchEvent(createEvent('submit', { bubbles: true, cancelable: true }))
      }
    }
    return form.addEventListener('keypress', submitForm)
  }
}

function isInputAllowingImplicitFormSubmission(el) {
  // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
  return [
    'text',
    'search',
    'url',
    'tel',
    'email',
    'password',
    'date',
    'month',
    'week',
    'time',
    'datetime-local',
    'number',
  ].includes(el.type)
}

export default class Dom {
  private jsdom: boolean

  public constructor({jsdom = window.navigator.userAgent.includes('jsdom')} = {}) {
    this.jsdom = jsdom
  }

  public enterText (element: HTMLInputElement, text: string | string[], {incremental = true} = {}): void {
    element.focus()

    const enterText = (text: string) => {
      if (matchKeyCode(text)) {
        this.triggerEvent(element, 'keydown', text)
        this.triggerEvent(element, 'keyup', text)

        if (element.form && isInputAllowingImplicitFormSubmission(element) && text == '{Enter}') {
          const event = createKeyboardEvent('keypress', text)
          simulateSubmitHandler(element.form, event)
          element.dispatchEvent(event)
        } else {
          this.triggerEvent(element, 'keypress', text)
        }
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
    const text = this.jsdom
      ? element.textContent
      : element.innerText

    return normaliseText(text)
  }

  public click (element: HTMLElement): void {
    this.triggerEvent(element, 'mousedown')
    this.triggerEvent(element, 'mouseup')
    element.focus()
    element.click()
  }

  public querySelectorAll (element: HTMLElement, selector: string, {visibleOnly = true} = {}): HTMLElement[] {
    const children = Array.prototype.slice.call(element.querySelectorAll(selector))

    return visibleOnly && !this.jsdom
      ? children.filter(c => this.elementVisible(c))
      : children
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
    const creator = eventCreatorsByType[eventType]

    if (!creator) {
      throw new Error('event type ' + JSON.stringify(eventType) + ' not recognised')
    }

    const event = creator(value)

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
    const id = element.id
    const classes = element.className.split(/ +/g).filter(Boolean).sort()
    const tag = element.tagName.toLowerCase()

    return (id || '') +
      tag +
      (classes.length ? '.' + classes.join('.') : '')
  }

  public submit (element: HTMLInputElement): void {
    element.focus()
    this.triggerEvent(element, 'keydown')
    this.triggerEvent(element, 'keypress')
    const submitButton = getFormSubmits(element.form)[0]
    if (submitButton) {
      (submitButton as HTMLElement).click()
    } else {
      this.triggerEvent(element.form, 'submit')
    }
    this.triggerEvent(element, 'keyup')
  }
}

function createMouseEvent (type): MouseEvent {
  // @ts-ignore
  return new window.MouseEvent(type, { bubbles: true, cancelable: true })
}

function createEvent (type, params = {bubbles: true, cancelable: false}): Event {
  return new window.Event(type, params)
}

function matchKeyCode (text) {
  return /^{(.*)}$/.exec(text)
}

function createKeyboardEvent (type, key): KeyboardEvent {
  // @ts-ignore
  const event = new window.KeyboardEvent(type, { bubbles: true, cancelable: true })

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
