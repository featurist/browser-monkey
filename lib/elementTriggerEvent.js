var MouseEvent = require('./polyfills').MouseEvent
var KeyboardEvent = require('./polyfills').KeyboardEvent

function createMouseEvent (type) {
  return new MouseEvent(type, { bubbles: true, cancelable: true })
}

function createEvent (type, params) {
  params = params || { bubbles: true, cancelable: false }
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

module.exports = function (element, eventType, value) {
  var creator = eventCreatorsByType[eventType]

  if (!creator) {
    throw new Error('event type ' + JSON.stringify(eventType) + ' not recognised')
  }

  var event = creator(value)

  element.dispatchEvent(event)
}
