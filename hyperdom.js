var Mount = require('./mount');
var hyperdom = require('hyperdom');
var createMonkey = require('./create');
var window = require('global');
var createTestDiv = require('./createTestDiv')
var setTestUrl = require('./setTestUrl')

module.exports = function(app, options) {
  return new Mount(app, {
    stopApp: function(){
    },
    startApp: function(){
      var router = typeof options == 'object' && options.hasOwnProperty('router')? options.router: undefined;
      if (router) {
        router.reset()
      }
      var app = this.app;

      if (Mount.runningInNode) {
        try {
          var vquery = require('vdom-query');
        } catch (e) {
          throw new Error('you must `npm install vdom-query --save-dev` to run tests in node');
        }
        var vdom = hyperdom.html('body');

        var monkey = createMonkey(vdom);
        monkey.set({$: vquery, visibleOnly: false, document: {}});

        hyperdom.appendVDom(vdom, app, { requestRender: setTimeout, window: window, router: router });
        return monkey;
      } else {
        var testDiv = createTestDiv()
        setTestUrl(options)
        hyperdom.append(testDiv, app, { requestRender: setTimeout, router: router });
        return createMonkey(testDiv);
      }
    }
  }).start();
}
