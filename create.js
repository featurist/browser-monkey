var Selector = require('./lib/selector')
var finders = require('./lib/finders')
var actions = require('./lib/actions')
var button = require('./lib/button')
var assertions = require('./lib/assertions')

module.exports = function (rootSelector) {
  return new Selector(rootSelector)
    .component(finders)
    .component(actions)
    .component(button)
    .component(assertions)
}
