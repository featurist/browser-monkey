var Mount = require('./lib/mount')
var React = require('react')
var ReactDOM = require('react-dom')
var createMonkey = require('./create')
var createTestDiv = require('./lib/createTestDiv')

module.exports = function (App, props) {
  return new Mount(App, {
    stopApp: function () {
    },
    startApp: function () {
      var div = createTestDiv()
      ReactDOM.render(React.createElement(this.app, props), div)

      return createMonkey(document.body)
    }
  }).start()
}
