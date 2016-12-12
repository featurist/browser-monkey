var expect = require('chai').expect
var isBrowser = !require('is-node');
if (isBrowser) {
  var mount = require('../mount');
  var expressApp= require('./app/server');

  require('./app/angular');
  require('./app/hyperdom');

  [
    'hyperdom',
    'angular'
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
