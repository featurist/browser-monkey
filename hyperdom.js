var Mount = require('./mount');
var hyperdom = require('hyperdom');
var createMonkey = require('./create');
var window = require('global');
var createTestDiv = require('./createTestDiv')
var extend = require('lowscore/extend')

module.exports = function(app, options) {
  return new Mount(app, {
    stopApp: function(){
    },
    startApp: function(){
      if (options && options.router) {
        options.router.reset()
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

        hyperdom.appendVDom(vdom, app, extend({ requestRender: setTimeout, window: window }, options));
        return monkey;
      } else {
        var testDiv = createTestDiv()
        if (options && (options.hash || options.url) && options.router) {
          options.router.push(options.url || options.hash)
        }
        hyperdom.append(testDiv, app, extend({ requestRender: setTimeout }, options));
        return createMonkey(testDiv);
      }
    }
  }).start();
}
