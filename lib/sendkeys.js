function dispatchEvent (el, type, char) {
  el.trigger(type, {charCode: char})
}

function sendkey (el, char) {
  dispatchEvent(el, 'keydown', char)
  dispatchEvent(el, 'keypress', char)
  dispatchEvent(el, 'input')
  dispatchEvent(el, 'keyup', char)
}

function setElementValue (el, value) {
  if (typeof el.get === 'function') { // skip in VDOM
    var element = el.get(0)
    var nativeInputValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value').set
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value)
    } else {
      element.value = value
    }
  } else {
    el.val(value)
  }
}

function sendkeys (el, text) {
  var originalValue = el.val()

  if (text.length === 0) {
    setElementValue(el, '')
    sendkey(el, '')
  } else {
    for (var n = 0; n < text.length; ++n) {
      var char = text[n]
      var value = text.substring(0, n + 1)
      setElementValue(el, value)
      sendkey(el, char)
    }
  }

  if (originalValue !== text) {
    dispatchEvent(el, 'change')
  }
};

sendkeys.html = function (el, html) {
  el.innerHTML = html
  dispatchEvent(el, 'input')
}

module.exports = sendkeys
