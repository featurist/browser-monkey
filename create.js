var Selector = require('./selector');
var finders = require('./finders');
var actions = require('./actions');
var assertions = require('./assertions');
var promise = require('./promise');

module.exports = function(rootSelector) {
  return new Selector(rootSelector)
    .component(promise)
    .component(finders)
    .component(actions)
    .component(assertions);
}
