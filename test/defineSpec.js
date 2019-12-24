const describeAssemblies = require('./describeAssemblies')
const {DomAssembly} = require('./assemblies/DomAssembly')
const {expect} = require('chai')

describe('define', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

    it('can define a field', () => {
      browser.define('Hello', q => q.transform(() => 'hello'))

      expect(browser.find('Hello').result()).to.equal('hello')
    })

    it('can define a field with arguments', () => {
      let args

      browser.define('Hello', (q, arg1, arg2) => q.transform(() => {
        args = [arg1, arg2]
        return `hello ${arg1} ${arg2}`
      }))

      expect(browser.find('Hello("one", 2)').result()).to.equal('hello one 2')
      expect(args).to.eql(['one', 2])
    })

    describe('definition not found', () => {
      it('with arguments: throws an error if the definition is not found', () => {
        expect(() => browser.find('Hello("one", 2)')).to.throw('no such definition Hello')
      })

      it('without arguments: assumes that it is CSS', () => {
        expect(() => browser.find('Hello').shouldExist().result()).to.throw("expected one or more elements, found 0 (found: find('Hello') [0])")
      })
    })
  })
})
