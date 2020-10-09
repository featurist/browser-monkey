module.exports.MouseEvent = (function () {
  try {
    new MouseEvent('click') // eslint-disable-line
    return MouseEvent // eslint-disable-line
  } catch (e) {
    // Need to polyfill - fall through
  }

  const MouseEventPolyfill = function (eventType, params) {
    params = params || { bubbles: false, cancelable: false }
    var mouseEvent = document.createEvent('MouseEvent')
    mouseEvent.initMouseEvent(
      eventType,
      params.bubbles,
      params.cancelable,
      window,
      0,
      params.screenX || 0,
      params.screenY || 0,
      params.clientX || 0,
      params.clientY || 0,
      false,
      false,
      false,
      false,
      0,
      null
    )

    return mouseEvent
  }

  MouseEventPolyfill.prototype = Event.prototype

  return MouseEventPolyfill
})()

// based on https://github.com/lifaon74/events-polyfill/blob/5ccca4002aa07f16ed1c298145f20c06d3544a29/src/constructors/KeyboardEvent.js
module.exports.KeyboardEvent = (function () {
  try {
    new KeyboardEvent('keyup') // eslint-disable-line
    return KeyboardEvent // eslint-disable-line
  } catch (e) {
    // Need to polyfill - fall through
  }

  const KeyboardEventPolyfill = function (eventType, params) {
    params = params || { bubbles: true, cancelable: false }

    const modKeys = [
      params.ctrlKey ? 'Control' : '',
      params.shiftKey ? 'Shift' : '',
      params.altKey ? 'Alt' : '',
      params.altGrKey ? 'AltGr' : '',
      params.metaKey ? 'Meta' : ''
    ].filter(Boolean).join(' ')

    const keyEvent = document.createEvent('KeyboardEvent')
    keyEvent.initKeyboardEvent(
      eventType,
      !!params.bubbles,
      !!params.cancelable,
      window,
      '',
      params.key,
      0,
      modKeys,
      !!params.repeat
    )

    return keyEvent
  }

  KeyboardEventPolyfill.prototype = Event.prototype

  return KeyboardEventPolyfill
})()
