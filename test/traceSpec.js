var trace = require('../trace');
var expect = require('chai').expect;

describe('trace', function () {
  it('throws error with original stack', function () {
    var myErrorStack;

    return trace(wait(100).then(function () {
      var myError = new Error('my error');
      myErrorStack = myError.stack;
      if (myErrorStack) {
        throw myError;
      } else {
        // not supported in this browser
      }
    })).then(undefined, function (error) {
      expect(error.message).to.equal('my error');
      expect(error.stack).to.not.equal(myErrorStack);
    });
  });
});

function wait(n) {
  return new Promise(function (fulfil) {
    setTimeout(fulfil, n);
  });
}
