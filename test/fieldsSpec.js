var describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')
var demand = require('must')

describe('fields', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

    it('can recognise a label with input', () => {
      const field = assembly.insertHtml('<label>Email <input type="text" /></label>').querySelector('input')

      return browser.field('Email').then(function (elements) {
        demand(elements).to.eql([field])
      })
    })

    it('can recognise an input with aria-labelledby', () => {
      assembly.insertHtml('<label id="email-label">Email</label>')
      const field = assembly.insertHtml('<input aria-labelledby="email-label" type="text" />')

      return browser.field('Email').then(function (elements) {
        demand(elements).to.eql([field])
      })
    })

    describe('defineField', () => {
      it('can define a new field', () => {
        const fieldDiv = assembly.insertHtml('<div class="field"><div class="field-name">Email</div><input type="text" /></div>')
        const field = fieldDiv.querySelector('input')

        browser.defineField((name, monkey) => monkey.find('div.field').containing('.field-name', {exactText: name}).find('input'))

        return browser.field('Email').then(function (elements) {
          demand(elements).to.eql([field])
        })
      })

      it('can define a new field and still use original field definitions', () => {
        const field = assembly.insertHtml('<label>Email <input type="text" /></label>').querySelector('input')

        browser.defineField((name, monkey) => monkey.find('div.field').containing('.field-name', {exactText: name}).find('input'))

        return browser.field('Email').then(function (elements) {
          demand(elements).to.eql([field])
        })
      })
    })

    describe('setting a field', () => {
      it("can set a field's value", () => {
        const events = []
        const field = assembly.insertHtml('<label>Email <input type="text" /></label>')
        field.addEventListener('change', () => events.push('change'))

        return browser.setField('Email', 'bob@example.com').then(function () {
          demand(events).to.eql(['change'])
        })
      })

      it("can set a defined field's value", () => {
        const events = []
        const fieldDiv = assembly.insertHtml('<div class="field"><div class="field-name">Email</div><input type="text" /></div>')
        const field = fieldDiv.querySelector('input')

        field.addEventListener('change', () => events.push('change'))

        browser.defineField((name, monkey) => monkey.find('div.field').containing('.field-name', {exactText: name}).find('input'))

        return browser.setField('Email', 'bob@example.com').then(function () {
          demand(events).to.eql(['change'])
        })
      })
    })
  })
})
