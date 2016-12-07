require('lie/polyfill');

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

global.expect = chai.expect;
global.timeout = parseInt(typeof window == 'object' && window.__env__.BM_TIMEOUT || 100);

Promise.prototype.assertStackTrace = function(file) {
  return this.then(function(){
    throw new Error('This test should have thrown an error but did not. You need to fix this.');
  }).catch(function(error){
    var specLine = error.stack.split('\n').find(function(line){
      return line.indexOf(file) != -1;
    });

    expect(specLine).to.include(file);
  });
}
