var Mount = require('./mount');
var React = require('react')
var ReactDOM = require('react-dom')
var createMonkey = require('./create');
var createTestDiv = require('./createTestDiv');

module.exports = function(app) {
  return new Mount(app, {
    stopApp: function() {
    },
    startApp: function() {
      var div = createTestDiv()
      ReactDOM.render(React.createElement(this.app.constructor, null), div)

      return createMonkey(document.body);
    }
  }).start()
}
