var Selector = require('./lib/selector')
var finders = require('./lib/finders')
var actions = require('./lib/actions')
var button = require('./lib/button')
var fields = require('./lib/fields')
var assertions = require('./lib/assertions')

module.exports = function (rootSelector) {
  return new Selector()
    .component(finders)
    .component(actions)
    .component(button)
    .component(fields)
    .component(assertions)
    .scope(rootSelector)
}
