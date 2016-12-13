var expect = require('chai').expect
var isBrowser = !require('is-node');

function isSupportedBrowser(){
  if (isBrowser) {
    var browser = require('detect-browser');
    if (browser.name === 'ie' && parseInt(browser.version.match(/(\d+)./)[1]) <= 10) {
      return false;
    }

    return true;
  }
}

if (isSupportedBrowser()) {
  require('../mount/angular');
  require('../mount/hyperdom');
  require('../mount/react');

  require('./app/angular');
  require('./app/hyperdom');
  require('./app/react');

  var expressApp= require('./app/server');

  [
    'hyperdom',
    'angular',
    'react'
  ].forEach(appType => {
    var WebApp = require('./app/'+appType);
    var monkeyBuilder = require('../mount/'+appType);

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

      afterEach(() => monkey.get('mount').stop());

      it('loads some data', () => {
        return monkey.find('li').shouldHave({text: [
          'browser-monkey',
          'hyperdom',
          'vinehill',
        ]})
      });

      it('exposes the app', () => {
        expect(monkey.get('app')).to.equal(app);
      });
    });
  });
}
