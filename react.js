var Mount = require('./lib/mount')
var React = require('react')
var ReactDOM = require('react-dom')
var {Query} = require('./lib/Query')
var createTestDiv = require('./lib/createTestDiv')

module.exports = function (App, props) {
  return new Mount(App, {
    stopApp: function () {
    },
    startApp: function () {
      var div = createTestDiv()
      ReactDOM.render(React.createElement(App, props), div)

      return new Query(document.body)
    }
  }).start()
}
