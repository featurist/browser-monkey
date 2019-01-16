var elementTriggerEvent = require('./elementTriggerEvent')

module.exports = function elementClick (element) {
  elementTriggerEvent(element, 'mousedown')
  elementTriggerEvent(element, 'mouseup')
  element.click()
  element.focus()
}
