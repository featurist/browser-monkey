var elementClick = require('./elementClick')
var elementTriggerEvent = require('./elementTriggerEvent')

module.exports = function elementSelect (selectElement, optionElement) {
  elementClick(selectElement)
  selectElement.selectedIndex = optionElement.index
  elementTriggerEvent(selectElement, 'input')
  elementTriggerEvent(selectElement, 'change')
}
