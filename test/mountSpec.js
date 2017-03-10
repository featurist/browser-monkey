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
  require('../angular');
  require('../hyperdom');
  require('../react');

  require('./app/angular');
  require('./app/hyperdom');
  require('./app/react');

  [
    'hyperdom',
    'angular',
    'react'
  ].forEach(appType => {
    var WebApp = require('./app/'+appType);
    var monkeyBuilder = require('../'+appType);

    describe(`mount ${appType}`, () => {
      var monkey, app;

      beforeEach(() => {
        app = new WebApp();
        monkey = monkeyBuilder(app)
      });

      afterEach(() => monkey.get('mount').stop());

      it('loads some data', () => {
        return monkey.find('.message').shouldHave({text: 'default'}).then(() => {
          return monkey.find('button').click();
        }).then(() => {
          return monkey.find('.message').shouldHave({text: 'hello browser-monkey'})
        })
      });

      it('exposes the app', () => {
        expect(monkey.get('app')).to.equal(app);
      });
    });
  });
}
