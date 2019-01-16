var elementTriggerEvent = require('./elementTriggerEvent')

module.exports = function elementSubmit (element) {
  element.focus()
  elementTriggerEvent(element, 'keydown')
  elementTriggerEvent(element, 'keypress')
  var submitButton = element.form.querySelector('input[type="submit"], button[type="submit"]')
  if (submitButton) {
    submitButton.click()
  } else {
    elementTriggerEvent(element.form, 'submit')
  }
  elementTriggerEvent(element, 'keyup')
}
