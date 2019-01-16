var demand = require('must')
const describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')

describe('options', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

    it('can set an option that is inerhited by components', function () {
      var parentComponent = browser.find('div').component({})
      var childComponent = parentComponent.options({ myOption: 'abc' }).find('div')
      demand(childComponent._options.myOption).to.equal('abc')
    })

    it('can overide default timeout', function () {
      var defaultTimeout = browser.options().timeout
      const timeoutBrowser = browser.options({ timeout: 1 })
      var start = new Date()

      return timeoutBrowser.find('.doesnt-exist').shouldExist().catch(function () {
        var end = new Date()
        var duration = end - start
        demand(duration >= timeoutBrowser.options().timeout).to.equal(true)
        demand(duration < defaultTimeout).to.equal(true)
      })
    })
  })
})
