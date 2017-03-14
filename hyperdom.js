var Mount = require('./mount');
var hyperdom = require('hyperdom');
var createMonkey = require('./create');
var window = require('global');

module.exports = function(app, options) {
  return new Mount(app, {
    stopApp: function(){
    },
    startApp: function(){
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

        hyperdom.appendVDom(vdom, app, { requestRender: setTimeout, window: window });
        return monkey;
      } else {
        hyperdom.append(Mount.createTestDiv(), app, options);
        return createMonkey(document.body);
      }
    }
  }).start();
}
