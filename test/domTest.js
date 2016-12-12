var createHDom = require('./createTestDom');
var createVDom = require('./createVDom');
var isNode = require('detect-node');
var h = require('virtual-dom/h');
var vquery = require('vdom-query')
var jquery = require('../jquery');
var createBrowser = require('../create');

function domTest(testName, testCb, options){
  options = options || {};

  var runTests = options.only ? describe.only : describe;
  var runHtml = it;
  var runVDom = it;

  if (options.hasOwnProperty('vdom') && !options.vdom) {
    runVDom = xit;
  }
  if (isNode || (options.hasOwnProperty('html') && !options.html)) {
    runHtml = xit;
  }
  if (!isNode && options.hasOwnProperty('mochaOnly') && options.mochaOnly) {
    runHtml = xit;
    runVDom = xit;
  }

  runTests(testName, function(){
    runHtml('HTML', function(){
      var htmlDom = createHDom();
      var browser = createBrowser(document.body);
      browser.set({
        timeout: global.timeout || 100
      });
      jquery.preventFormSubmit = true;
      return testCb(browser, htmlDom, jquery);
    });

    runVDom('VDOM', function(){
      var body = h('body');
      var browser = createBrowser(body);
      browser.set({
        $: vquery,
        visibleOnly: false,
        document: {},
        timeout: global.timeout || 100
      });

      var virtualDom = createVDom(body);
      return testCb(browser, virtualDom, vquery);
    });
  });
}

domTest.only = function(testName, testCb, options){
  options = options || {};
  options.only = true;
  domTest(testName, testCb, options);
}

module.exports = domTest;
