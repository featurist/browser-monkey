var dispatchEvent = require('./dispatchEvent');

module.exports = function (el) {
  dispatchEvent(el, 'mousedown');
  dispatchEvent(el, 'mouseup');
  dispatchEvent(el, 'click');
};
