var expect = require('chai').expect
var isBrowser = !require('is-node');

function isSupportedBrowser(){
  if (isBrowser) {
    var browser = require('detect-browser');
    if (browser.name === 'ie' && parseInt(browser.version.match(/(\d+)./)[1]) <= 10) {
      return false;
    }

    console.log('***************')
    console.log(browser.name)
    if (browser.name === 'safari' || browser.name === 'ios') {
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

    describe.only(`mount ${appType}`, () => {
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
