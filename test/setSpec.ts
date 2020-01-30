import {DomAssembly} from './assemblies/DomAssembly'
import {expect} from 'chai'

describe('set', function () {
  let assembly
  let browser

  beforeEach(function () {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
  })

  afterEach(() => {
    assembly.stop()
  })

  describe('field types', () => {
    it('can set text fields', async () => {
      assembly.insertHtml(`
        <input type=text class="address"/>
      `)

      await browser.set({
        '.address': '7 Lola St',
      })

      expect(assembly.find('.address').value).to.equal('7 Lola St')
    })

    it('can set select fields', async () => {
      assembly.insertHtml(`
        <select>
          <option>One</option>
          <option>Two</option>
        </select>
      `)

      await browser.set({
        select: 'Two',
      })

      const selectedItem = assembly.jQuery(assembly.find('select')).find(':selected').text()
      expect(selectedItem).to.equal('Two')
    })

    it('can set checkbox fields', async () => {
      const checkbox = assembly.insertHtml(`
        <input type=checkbox class="check"/>
      `)

      await browser.set({
        '.check': true,
      })

      expect(checkbox.checked).to.equal(true)
    })
  })

  describe('values', () => {
    it('single argument, with scope sets value', async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street"/>
          </div>
        </form>
      `)

      await browser.find('.address .street').set('7 Lola St')

      expect(assembly.find('.address .street').value).to.equal('7 Lola St')
    })
  })

  describe('objects', function () {
    it('can set deep fields by CSS', async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street"/>
            <input type=text class="city"/>
            <input type=text class="country"/>
            <input type=text class="postcode"/>
          </div>
          <input type=text class="phone"/>
          <input type=text class="first-name"/>
        </form>
      `)

      await browser.set({
        '.address': {
          '.street': '7 Lola St',
          '.city': 'Frisby City',
          '.country': 'Atlantis',
          '.postcode': '12345'
        },
        '.phone': '123123123',
        '.first-name': 'Barry'
      })

      expect(assembly.find('.address .street').value).to.equal('7 Lola St')
      expect(assembly.find('.address .city').value).to.equal('Frisby City')
      expect(assembly.find('.address .country').value).to.equal('Atlantis')
      expect(assembly.find('.address .postcode').value).to.equal('12345')
      expect(assembly.find('.phone').value).to.equal('123123123')
      expect(assembly.find('.first-name').value).to.equal('Barry')
    })

    it("an object asserts the number of matching elements", async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street"/>
          </div>
          <div class="address">
            <input type=text class="city"/>
          </div>
        </form>
      `)

      await assembly.assertRejection(browser.set({
        '.address': {
          '.street': '7 Lola St',
          '.city': 'Frisby City',
        },
      }), "expected just one element, found 2 (found: path(find('.address') [2]))")
    })

    it('a value does assert that there is only one matching element', async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street"/>
            <input type=text class="street"/>
            <input type=text class="city"/>
          </div>
        </form>
      `)

      await assembly.assertRejection(browser.set({
        '.address': {
          '.street': '7 Lola St',
          '.city': 'Frisby City',
        },
      }), "expected just one element, found 2 (found: path(find('.address') [1], find('.street') [2]))")
    })

    it('deep fields disambiguate', async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street"/>
          </div>
          <input type=text class="street"/>
        </form>
      `)

      await browser.set({
        '.address': {
          '.street': '7 Lola St'
        }
      })

      expect(assembly.find('.address .street').value).to.equal('7 Lola St')
      expect(assembly.find('form > .street').value).to.equal('')
    })
  })

  describe('arrays', function () {
    it('arrays can set multiple matching elements', async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street"/>
          </div>
          <div class="address">
            <input type=text class="street"/>
          </div>
          <div class="address">
            <input type=text class="street"/>
          </div>
        </form>
      `)

      await browser.set({
        '.address': [
          { '.street': '1' },
          { '.street': '2' },
          { '.street': '3' }
        ]
      })

      expect(assembly.find('.address:nth-child(1) .street').value).to.equal('1')
      expect(assembly.find('.address:nth-child(2) .street').value).to.equal('2')
      expect(assembly.find('.address:nth-child(3) .street').value).to.equal('3')
    })

    it('arrays must have exact number of matching elements', async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street"/>
          </div>
          <div class="address">
            <input type=text class="street"/>
          </div>
          <div class="address">
            <input type=text class="street"/>
          </div>
        </form>
      `)

      await assembly.assertRejection(
        browser.set({
          '.address': [
            { '.street': '1' },
            { '.street': '2' }
          ]
        }),
        'expected 2 elements'
      )

      expect(assembly.find('.address:nth-child(1) .street').value).to.equal('')
      expect(assembly.find('.address:nth-child(2) .street').value).to.equal('')
      expect(assembly.find('.address:nth-child(3) .street').value).to.equal('')
    })

    it('empty arrays assert no elements', async () => {
      assembly.insertHtml(`
        <form>
          <div class="address">
            <input type=text class="street"/>
          </div>
        </form>
      `)

      await assembly.assertRejection(
        browser.set({
          '.address': []
        }),
        'expected 0 elements'
      )

      expect(assembly.find('.address:nth-child(1) .street').value).to.equal('')
    })
  })

  describe('functions', () => {
    it('can return query to execute', async () => {
      assembly.insertHtml(`
        <form>
          <span class="street"></span>
        </form>
      `)

      await browser.set({
        '.street': streetQuery => {
          streetQuery.expectOneElement().result()[0].innerText = 'hi'
        }
      })

      expect(assembly.find('.street').innerText).to.equal('hi')
    })
  })

  describe('selecting options atomically', () => {
    it('setting fields is atomic', async () => {
      assembly.insertHtml(`
        <form>
          <input type=text class="phone"/>
          <input type=text class="first-name"/>
        </form>
      `)

      const promise = browser.find('form').set({
        '.street': '7 Lola St',
        '.phone': '123123123',
        '.first-name': 'Barry'
      })
      await assembly.assertRejection(promise, "expected just one element, found 0 (found: path(find('form') [1], find('.street') [0]))")

      expect(assembly.find('.phone').value).to.equal('')
      expect(assembly.find('.first-name').value).to.equal('')
    })

    it('waits until the desired option appears on the page', async () => {
      const select = assembly.insertHtml(`
        <select>
          <option>One</option>
          <option>Two</option>
        </select>
      `)

      const promise = browser.set({
        'select': 'Three',
      }).then()

      assembly.eventually(() => {
        assembly.jQuery(select).append('<option>Three</option>')
      })

      await promise

      const selectedItem = assembly.jQuery(select).find(':selected').text()
      expect(selectedItem).to.equal('Three')
    })
  })

  describe('defining fields', () => {
    it('can define a named field', async function () {
      assembly.insertHtml(`
        <form>
          <input type=text class="phone"/>
          <input type=text class="first-name"/>
        </form>
      `)

      browser.define('phone', b => b.find('.phone'))
      browser.define('firstName', b => b.find('.first-name'))

      await browser.set({
        phone: '123123123',
        firstName: 'Barry'
      })

      expect(assembly.find('.phone').value).to.equal('123123123')
      expect(assembly.find('.first-name').value).to.equal('Barry')
    })

    it('can define a named field with parameter', async function () {
      assembly.insertHtml(`
        <form>
          <input name=phone type=text class="phone"/>
          <input name=firstname type=text class="first-name"/>
        </form>
      `)

      browser.define('form', (b, name) => b.find('* [name=' + JSON.stringify(name) + ']'))

      await browser.set({
        'form("phone")': '123123123',
        'form("firstname")': 'Barry'
      })

      expect(assembly.find('.phone').value).to.equal('123123123')
      expect(assembly.find('.first-name').value).to.equal('Barry')
    })
  })
})
