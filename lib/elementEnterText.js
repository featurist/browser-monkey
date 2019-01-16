var elementTriggerEvent = require('./elementTriggerEvent')

module.exports = function elementEnterText (element, text) {
  element.focus()

  if (element.value !== '') {
    elementTriggerEvent(element, 'keydown')
    elementTriggerEvent(element, 'keypress')
    element.value = ''
    elementTriggerEvent(element, 'input')
    elementTriggerEvent(element, 'keyup')
  }

  text.split('').forEach(function (key, index) {
    elementTriggerEvent(element, 'keydown', key)
    elementTriggerEvent(element, 'keypress', key)
    element.value = text.slice(0, index + 1)
    elementTriggerEvent(element, 'input')
    elementTriggerEvent(element, 'keyup', key)
  })
  elementTriggerEvent(element, 'change')
}
