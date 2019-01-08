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

        const customFieldBrowser = browser.defineField((monkey, name) => monkey.find('div.field').containing('.field-name', {exactText: name}).find('input'))

        return customFieldBrowser.field('Email').then(function (elements) {
          demand(elements).to.eql([field])
        })
      })

      it('can define a new field and still use original field definitions', () => {
        const field = assembly.insertHtml('<label>Email <input type="text" /></label>').querySelector('input')

        const customFieldBrowser = browser.defineField((monkey, name) => monkey.find('div.field').containing('.field-name', {exactText: name}).find('input'))

        return customFieldBrowser.field('Email').then(function (elements) {
          demand(elements).to.eql([field])
        })
      })
    })

    describe('defineFieldValue', () => {
      it('matches the right field type', async () => {
        const fieldDiv = assembly.insertHtml('<div class="field"></div>')

        const custom = browser.defineFieldValue({
          set: (monkey, value) => monkey.is('div.nomatch').one().action((element) => { element.innerText = 'no-match: ' + value }),
          get: (monkey) => monkey.is('div.nomatch').one().text()
        }).defineFieldValue({
          set: (monkey, value) => monkey.is('div.field').one().action((element) => { element.innerText = 'match: ' + value }),
          get: (monkey) => monkey.is('div.field').one().text()
        })

        await custom.find('.field').setValue('value')
        demand(fieldDiv.innerText).to.equal('match: value')
      })

      it('throws if no match can be found', async () => {
        assembly.insertHtml('<div class="non-field"></div>')

        const custom = browser.defineFieldValue({
          set: (monkey, value) => monkey.is('div.nomatch').one().action((element) => { element.innerText = 'no-match: ' + value }),
          get: (monkey) => monkey.is('div.nomatch').one().text()
        }).defineFieldValue({
          set: (monkey, value) => monkey.is('div.field').one().action((element) => { element.innerText = 'match: ' + value }),
          get: (monkey) => monkey.is('div.field').one().text()
        })

        await demand(custom.find('.non-field').setValue('value')).to.reject.with.error(/all queries failed in race/)
      })
    })

    describe('set value', () => {
      describe('setting input values', () => {
        [
          ['date', '1970-01-01'],
          ['datetime-local', '1970-01-01T09:30'],
          'email',
          ['month', '1970-01'],
          ['number', '1'],
          'password',
          'search',
          'tel',
          'text',
          ['time', '09:30'],
          'url',
          ['week', '1970-W01'],
          ['range', '50']
        ].forEach(type => {
          if (type instanceof Array) {
            canSetInputValueOfType.apply(undefined, type)
          } else {
            canSetInputValueOfType(type)
          }
        })

        canSetInputValueOfHtml('<textarea></textarea>')
      })

      function canSetInputValueOfType (type, value) {
        canSetInputValueOfHtml(`<input type="${type}" />`, value)
      }

      function canSetInputValueOfHtml (html, value = 'value') {
        it(`can set ${html} value`, async () => {
          const events = []
          const field = assembly.insertHtml(html)
          field.addEventListener('change', () => events.push('change'))

          await browser.scope(field).setValue(value)

          demand(events).to.eql(['change'])
          demand(field.value).to.equal(value)

          const valueSet = await browser.scope(field).value()
          demand(valueSet).to.equal(value)
        })
      }

      describe('setting select values', () => {
        it('can set a select value by option value', async () => {
          const select = assembly.insertHtml(`
            <select>
              <option value="value1">Text One</option>
              <option value="value2">Text Two</option>
            </select>
          `)

          const selectScope = browser.scope(select)

          await selectScope.setValue('value1')
          const value = await selectScope.value()
          demand(value).to.equal('Text One')
        })

        it('can set a select value by option text', async () => {
          const select = assembly.insertHtml(`
            <select>
              <option value="value1">Text One</option>
              <option value="value2">Text Two</option>
            </select>
          `)

          const selectScope = browser.scope(select)

          await selectScope.setValue('Text Two')
          const value = await selectScope.value()
          demand(value).to.equal('Text Two')
        })

        it('waits for option to appear before selecting it', async () => {
          const select = assembly.insertHtml(`
            <select>
              <option value="value1">Text One</option>
              <option value="value2">Text Two</option>
            </select>
          `)

          assembly.eventuallyAppendHtml(select, '<option>Text Three</option>')

          const selectScope = browser.scope(select)

          await selectScope.setValue('Text Three')
          const value = await selectScope.value()
          demand(value).to.equal('Text Three')
        })
      })

      describe('setting a checkbox value', () => {
        it('can set a checkbox value', async () => {
          const checkbox = assembly.insertHtml(`
            <input type=checkbox />
          `)

          const selectScope = browser.scope(checkbox)

          await selectScope.setValue(true)
          const trueValue = await selectScope.value()
          demand(trueValue).to.equal(true)

          await selectScope.setValue(false)
          const falseValue = await selectScope.value()
          demand(falseValue).to.equal(false)
        })
      })
    })

    describe('shouldHave value', () => {
      it('uses .value in shouldHave({exactValue})', async () => {
        const custom = browser.defineFieldValue({
          get: (monkey) => monkey.mapAll(() => 'div value')
        })

        await custom.shouldHave({exactValue: 'div value'})
      })

      it('uses .value in shouldHave({value})', async () => {
        const custom = browser.defineFieldValue({
          get: (monkey) => monkey.mapAll(() => 'div value')
        })

        await custom.shouldHave({value: 'value'})
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

        const custom = browser.defineField((monkey, name) => monkey.find('div.field').containing('.field-name', {exactText: name}).find('input'))

        return custom.setField('Email', 'bob@example.com').then(function () {
          demand(events).to.eql(['change'])
        })
      })
    })
  })
})
