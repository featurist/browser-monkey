var chai = require('chai');
var expect = chai.expect;
var elementsToString = require('./elementsToString');

module.exports = function expectOneElement(scope, elements) {
  var msg = "expected to find exactly one element: " + scope.printFinders(scope._finders) + ', but found :' + elementsToString(elements);
  expect(elements.size(), msg).to.equal(1);
}
