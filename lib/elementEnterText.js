var elementTriggerEvent = require('./elementTriggerEvent')

function setValue (element, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value)
  } else {
    element.value = value
  }
  elementTriggerEvent(element, 'input')
}

function typeKey (element, value, key) {
  elementTriggerEvent(element, 'keydown', key)
  elementTriggerEvent(element, 'keypress', key)
  setValue(element, value)
  elementTriggerEvent(element, 'keyup', key)
}

module.exports = function elementEnterText (element, text, {incremental = true} = {}) {
  element.focus()

  if (incremental) {
    if (element.value !== '') {
      typeKey(element, '', undefined)
    }

    text.split('').forEach(function (key, index) {
      const value = text.slice(0, index + 1)
      typeKey(element, value, key)
    })
  } else {
    setValue(element, text)
  }

  elementTriggerEvent(element, 'change')
}
