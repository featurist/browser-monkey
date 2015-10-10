var dispatchEvent = require('./dispatchEvent');

module.exports = function (el) {
  dispatchEvent(el, 'mousedown');
  dispatchEvent(el, 'mouseup');

  if (el.tagName == 'INPUT' && (el.type || '').toLowerCase() == 'checkbox') {
    el.checked = !el.checked;
  }

  dispatchEvent(el, 'click');
};
