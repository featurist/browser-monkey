var demand = require('must')
var create = require('../create')

describe('options', function () {
  it('can set an option that is inerhited by components', function () {
    var browser = create()
    var parentComponent = browser.find('div').component({})
    var childComponent = parentComponent.options({myOption: 'abc'}).find('div')
    demand(childComponent._options.myOption).to.equal('abc')
  })

  it('can overide default timeout', function () {
    var browser = create()
    var defaultTimeout = browser.options().timeout
    const timeoutBrowser = browser.options({timeout: 10})
    var start = new Date()

    return timeoutBrowser.find('.doesnt-exist').shouldExist().catch(function () {
      var end = new Date()
      var duration = end - start
      demand(duration > timeoutBrowser.options().timeout).to.equal(true)
      demand(duration < defaultTimeout).to.equal(true)
    })
  })
})
