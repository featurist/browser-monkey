var Query = require('./lib/Query')
var finders = require('./lib/finders')
var actions = require('./lib/actions')
var button = require('./lib/button')
var set = require('./lib/set')
var assertions = require('./lib/assertions')

module.exports = function (rootSelector = document.body) {
  return new Query()
    .component(finders)
    .component(button)
    .component(set)
    .installSetters()
    .scope(rootSelector)
    .component(actions)
    .component(assertions)
}
