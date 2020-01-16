var debug = require('debug')('browser-monkey:angular')
var Mount = require('./lib/mount')
var {Query} = require('./lib/Query')
var createTestDiv = require('./lib/createTestDiv')
var angular = require('angular')

module.exports = function (app) {
  return new Mount(app, {
    stopApp: function () {},
    startApp: function () {
      debug('Mounting angular app ' + app.moduleName)
      var div = createTestDiv()
      div.setAttribute(app.directiveName, '')
      angular.bootstrap(div, [app.moduleName])

      return new Query(document.body)
    }
  }).start()
}
