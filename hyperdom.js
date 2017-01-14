var Mount = require('./mount');
var hyperdom = require('hyperdom');
var createMonkey = require('./create');
var window = require('global');

try{
  var router = require('hyperdom-router');
} catch(e) {
  console.warn('no hyperdom router has been found, if you need routing please install this using `npm install hyperdom-router --save-`')
}
module.exports = function() {
  if (router) {
    router.start();
  }

  return new Mount({
    stopApp: function(){
      if (router) {
        router.clear();
      }
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
        hyperdom.append(Mount.createTestDiv(), app);
        return createMonkey(document.body);
      }
    }
  });
}
