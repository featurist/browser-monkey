var expect = require('chai').expect
var isBrowser = !require('is-node')

function isSupportedBrowser () {
  if (isBrowser) {
    var browser = require('detect-browser')
    if (browser.name === 'ie' && parseInt(browser.version.match(/(\d+)./)[1]) <= 10) {
      return false
    }

    return true
  }
}

if (isSupportedBrowser()) {
  testMount('angular', require('./app/angular'), require('../angular'))
  testMount('hyperdom', new (require('./app/hyperdom'))(), require('../hyperdom'))
  testMount('react', new (require('./app/react'))(), require('../react'))
  testMount('iframe', '/base/test/iframe-mount-test.html', require('../iframe'))
}

function testMount (appType, app, monkeyBuilder) {
  describe(`mount ${appType}`, () => {
    var monkey

    beforeEach(() => {
      monkey = monkeyBuilder(app)
    })

    afterEach(() => monkey.get('mount').stop())

    it('loads some data', () => {
      return monkey.find('.message').shouldHave({text: 'default'}).then(() => {
        return monkey.find('button').click()
      }).then(() => {
        return monkey.find('.message').shouldHave({text: 'hello browser-monkey'})
      })
    })

    it('exposes the app', () => {
      expect(monkey.get('app')).to.equal(app)
    })
  })
}
