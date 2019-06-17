var elementTriggerEvent = require('./elementTriggerEvent')

module.exports = function elementEnterText (element, text) {
  element.focus()

  if (element.value !== '') {
    elementTriggerEvent(element, 'keydown')
    elementTriggerEvent(element, 'keypress')
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, '')
    } else {
      element.value = ''
    }
    elementTriggerEvent(element, 'input')
    elementTriggerEvent(element, 'keyup')
  }

  text.split('').forEach(function (key, index) {
    elementTriggerEvent(element, 'keydown', key)
    elementTriggerEvent(element, 'keypress', key)
    const value = text.slice(0, index + 1)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value)
    } else {
      element.value = value
    }
    elementTriggerEvent(element, 'input')
    elementTriggerEvent(element, 'keyup', key)
  })
  elementTriggerEvent(element, 'change')
}
