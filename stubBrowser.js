var window = require('global');


var registeredEvents = {};
var pushState, replaceState;

pushState = replaceState = function(state, title, url) {
  window.location.pathname = url;
  (registeredEvents['onpopstate'] || []).forEach(cb => cb({}));
};

window.location = window.location || {};
window.location.pathname = window.location.pathname || '/';
window.location.origin = window.location.origin || '';
window.location.search = window.location.search || '';
window.history = {
  pushState,
  replaceState,
};

window.addEventListener = function(eventName, cb) {
  eventName = 'on'+eventName;
  if (!registeredEvents[eventName]) {
    registeredEvents[eventName] = [];
  }
  registeredEvents[eventName].push(cb);
};
