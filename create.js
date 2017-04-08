var Selector = require('./lib/selector')
var finders = require('./lib/finders')
var actions = require('./lib/actions')
var assertions = require('./lib/assertions')
var promise = require('./lib/promise')

module.exports = function (rootSelector) {
  return new Selector(rootSelector)
    .component(promise)
    .component(finders)
    .component(actions)
    .component(assertions)
}
