module.exports = function (el) {
  function sendEvent(eventName) {
    var event = new MouseEvent(eventName, {
      view: window,
      bubbles: true,
      cancelable: true
    });
    el.dispatchEvent(event);
  }

  sendEvent('mousedown');
  sendEvent('mouseup');
  sendEvent('click');
};
