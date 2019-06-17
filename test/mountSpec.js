const { expect } = require('chai')
const pathUtils = require('path')
const describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')

describeAssemblies([DomAssembly], (Assembly) => {
  const assembly = new Assembly()
  if (Assembly.hasDom()) {
    testMount('angular', require('./app/angular'), require('../angular'))
    testMount('hyperdom', new (require('./app/hyperdom'))(), require('../hyperdom'))
    testMount('react', require('./app/react'), require('../react'))
    testMount('iframe', assembly.localUrl(pathUtils.join(__dirname, 'iframe-mount-test.html')), require('../iframe'))
  }
})

function testMount (appType, app, monkeyBuilder) {
  describe(`mount ${appType}`, () => {
    var monkey

    beforeEach(() => {
      monkey = monkeyBuilder(app)
    })

    afterEach(() => monkey.options().mount.stop())

    it('loads some data', () => {
      return monkey.find('.message').shouldHave({ text: 'default' }).then(() => {
        return monkey.find('button').click()
      }).then(() => {
        return monkey.find('.message').shouldHave({ text: 'hello browser-monkey' })
      })
    })

    it('exposes the app', () => {
      expect(monkey.options().app).to.equal(app)
    })
  })
}
