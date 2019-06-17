const describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')
const {expect} = require('chai')

describe('containing', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

    describe('values', () => {
      it('filters elements that have the exact text', () => {
        assembly.insertHtml(`
          <span class="car">car</span>
          <span class="car">car</span>
          <span>horse</span>
          <span>cart</span>
        `)

        const transports = browser.find('span').containing('car').result()
        const cars = assembly.findAll('.car')
        expect(transports).to.eql(cars)
      })
    })

    describe('objects', () => {
      it('must have all the fields in the same element', () => {
        assembly.insertHtml(`
          <div class="result">
            <div class="title">Title</div>
          </div>
          <div class="result correct">
            <div class="title">Title</div>
            <div class="body">Body</div>
          </div>
          <div class="result">
            <div class="body">Body</div>
          </div>
        `)

        const results = browser.find('.result').containing({'.title': 'Title', '.body': 'Body'}).result()
        const expected = assembly.findAll('.correct')
        expect(results).to.eql(expected)
      })

      it("shows why it couldn't find the element", () => {
        assembly.insertHtml(`
          <div class="result">
            <div class="title">Title</div>
          </div>
          <div class="result correct">
            <div class="title">Title</div>
            <div class="body">Body</div>
          </div>
          <div class="result">
            <div class="body">Body</div>
          </div>
        `)

        expect(() =>
          browser.find('.result').containing({'.title': 'Title', '.body': 'None'}).expectOneElement().result()
        ).to.throw(`expected just one element, found 0 (found: find('.result') [3], containing({".title":"Title",".body":"None"}) [0])`)
      })
    })
  })
})
