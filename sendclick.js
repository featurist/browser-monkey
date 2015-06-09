module.exports = function (el) {
  var event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });

  el.dispatchEvent(event);
};
