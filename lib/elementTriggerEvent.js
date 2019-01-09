/* global Event KeyboardEvent MouseEvent */

module.exports = function (element, eventType, value) {
  var creator = eventCreatorsByType[eventType]

  if (!creator) {
    throw new Error('event type ' + JSON.stringify(eventType) + ' not recognised')
  }

  var event = creator(value)

  element.dispatchEvent(event)
}

function createMouseEvent (type) {
  return new MouseEvent(type, { bubbles: true, cancelable: true })
}

function createEvent (type) {
  return new Event(type, { bubbles: true, cancelable: false })
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
    return new Event('submit', { bubbles: true, cancelable: true })
  }
}
