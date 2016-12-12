var expect = require('chai').expect
var isBrowser = !require('is-node');

function isSupportedBrowser(){
  if (isBrowser) {
    var browser = require('detect-browser');
    if (browser.name === 'ie' && parseInt(browser.version.substring(0, 2)) <= 10) {
      return false;
    }

    if (browser.name === 'safari') {
      return false;
    }
    return true;
  }
}

if (isSupportedBrowser()) {
  var mount = require('../mount');
  var expressApp= require('./app/server');

  require('./app/angular');
  require('./app/hyperdom');
  require('./app/react');

  [
    'hyperdom',
    'angular',
    'react'
  ].forEach(appType => {
    var WebApp = require('./app/'+appType);
    var monkeyBuilder = mount[appType];

    describe(`mount ${appType}`, () => {
      var monkey, app;

      beforeEach(() => {
        monkey = monkeyBuilder()
          .withServer('http://localhost:1234', expressApp)
          .withApp(() => {
            app = new WebApp();
            return app;
          })
          .start();
      });

      afterEach(() => monkey.stop());

      it('loads some data', () => {
        return monkey.browser.find('li').shouldHave({text: [
          'browser-monkey',
          'hyperdom',
          'vinehill',
        ]})
      });

      it('exposes the app', () => {
        expect(monkey.app).to.equal(app);
      });
    });
  });
}
