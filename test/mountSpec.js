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
    var page

    beforeEach(() => {
      page = monkeyBuilder(app)
    })

    afterEach(() => page.options().mount.stop())

    it('loads some data', () => {
      return page.find('.message').shouldHave({ text: 'default' }).then(() => {
        return page.find('button').click()
      }).then(() => {
        return page.find('.message').shouldHave({ text: 'hello browser-monkey' })
      })
    })

    it('can enter form fields', async () => {
      await page.set({'input': 'hi'})
      await page.assert({'.message': 'hi'})
    })

    it('exposes the app', () => {
      expect(page.options().app).to.equal(app)
    })
  })
}
