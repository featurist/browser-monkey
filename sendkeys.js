function dispatchEvent(el, type, char) {
  var event = document.createEvent("Events");
  event.initEvent(type, true, false);
  event.charCode = char;
  el.dispatchEvent(event);
}

function sendkey(el, char) {
  dispatchEvent(el, "keydown", char);
  dispatchEvent(el, "keyup", char);
  dispatchEvent(el, "keypress", char);
}

function sendkeys(el, text) {
  el.focus();

  for (var n = 0; n < text.length; ++n) {
    var char = text[n];
    el.value = text.substring(0, n + 1);
    sendkey(el, char);
  }

  dispatchEvent(el, "input");
};

sendkeys.html = function(el, html) {
  el.innerHTML = html;
  dispatchEvent(el, "input");
};

module.exports = sendkeys;
