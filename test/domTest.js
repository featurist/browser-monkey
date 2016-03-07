var browser = require('..');
var createHDom = require('./createTestDom');
var createVDom = require('./createVDom');
var isNode = require('detect-node');

module.exports = function domTest(testName, testCb){
  if (!isNode) {
    it('HTML: ' + testName, function(){
      var htmlDom = createHDom();
      return testCb(browser, htmlDom);
    });
  }

  it('VDOM: ' + testName, function(){
    var h = require('virtual-dom/h');
    var body = h('body');
    var browser = require('..').create(body);
    var vquery = require('vdom-query')
    browser.set({$: vquery, visibleOnly: false});

    var virtualDom = createVDom(body);
    return testCb(browser, virtualDom);
  });
}

