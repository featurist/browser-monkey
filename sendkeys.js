function dispatchEvent(el, type, char) {
  var event = document.createEvent("Events");
  event.initEvent(type, true, true);
  event.charCode = char;
  el.dispatchEvent(event);
}

function sendkey(el, char) {
  dispatchEvent(el, "keydown");
  dispatchEvent(el, "keyup");
  dispatchEvent(el, "keypress", char.charCodeAt(0));
  dispatchEvent(el, "input");
}

function sendkeys(el, text, options) {
  var mode = options.mode || 'replace';
  el.focus();
  if (el.setActive) {
    el.setActive();
  }

  var originalValue = el.value;

  var input = text.split('');

  function charAppender(e){
    if (!e.defaultPrevented){
      var char = String.fromCharCode(e.charCode)
      el.value = el.value + char;
    }
  }
  el.addEventListener('keypress', charAppender);

  if (mode === 'replace'){
    if (el.value !== ''){
      el.value = '';
      dispatchEvent(el, "input");
    }
  }
  for (var n = 0; n < text.length; ++n) {
    var char = text[n];
    sendkey(el, char);
  }

  el.removeEventListener('keypress', charAppender);

  if (originalValue !== text){
    dispatchEvent(el, 'change');
  }
};

sendkeys.html = function(el, html) {
  el.innerHTML = html;
  dispatchEvent(el, "input");
};

module.exports = sendkeys;
