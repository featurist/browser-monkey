import {DomAssembly} from './assemblies/DomAssembly'
import {expect} from 'chai'
import {Query, Button as OriginalButton, MultiMatcher} from '../lib/Query'

describe('buttons', function () {
  let assembly
  let browser: Query
  let Button: MultiMatcher

  beforeEach(function () {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
    Button = OriginalButton.clone()
  })

  afterEach(() => {
    assembly.stop()
  })

  function assertButtonFound(html, label): void {
    assembly.insertHtml(html)

    const elements = browser.find(Button(label)).result()
    const expected = assembly.find('.expected')
    expect(expected, 'no `.expected` element found').to.exist
    expect(elements).to.eql([expected])
  }

  function assertButtonNotFound(html, label): void {
    assembly.insertHtml(html)

    const elements = browser.find(Button(label)).result()
    expect(elements).to.eql([])
  }

  it('can recognise a button with exact text', function () {
    assertButtonFound(
      '<button class=expected>Login</button>',
      'Login'
    )
  })

  it("doesn't recognise a button without exact text match", function () {
    assertButtonNotFound(
      '<button class=expected>Login</button>',
      'ogin'
    )
  })

  it('can recognise an input of type submit with exact value', function () {
    assertButtonFound(
      '<input type="submit" value="Login" class=expected />',
      'Login'
    )
  })

  it('can recognise an input of type button with exact value', function () {
    assertButtonFound(
      '<input type="button" value="Login" class=expected />',
      'Login'
    )
  })

  it('can click on radio buttons by their label', function () {
    assertButtonFound(
      `
        <label>
          <input type=radio class=expected />
          Feature One
        </label>
      `,
      'Feature One'
    )
  })

  it('can click on checkboxes by their label', function () {
    assertButtonFound(
      `
        <label>
          <input type=checkbox class=expected />
          Feature Enabled
        </label>
      `,
      'Feature Enabled'
    )
  })

  it('can click a checkbox pointed to by label with for attribute', () => {
    assertButtonFound(
      `
        <label for="my-checkbox">
          Feature Enabled
        </label>
        <input id="my-checkbox" type=checkbox class=expected />
      `,
      'Feature Enabled'
    )
  })

  it('can find a checkbox by its aria-label', () => {
    assertButtonFound(
      `
        <input aria-label="Search" type=checkbox class=expected />
      `,
      'Search'
    )
  })

  it('can find a checkbox by its aria-labelledby', () => {
    assertButtonFound(
      `
        <label id="search-label">Search</label>
        <input aria-labelledby="search-label" type=checkbox class=expected />
      `,
      'Search'
    )
  })

  it("doesn't recognise an input of type button without exact value match", function () {
    assembly.insertHtml('<input type="button" value="Login" />')

    const elements = browser.find(Button('Logi')).result()
    expect(elements).to.eql([])
  })

  it('can recognise a link with exact text', function () {
    const button = assembly.insertHtml('<a>Login</a>')

    const elements = browser.find(Button('Login')).result()
    expect(elements).to.eql([button])
  })

  it("doesn't recognise a link without exact text match", function () {
    assembly.insertHtml('<a>Login</a>')

    const elements = browser.find(Button('Logi')).result()
    expect(elements).to.eql([])
  })

  describe('defining buttons', () => {
    it('can define a new button', () => {
      const button = assembly.insertHtml('<div class="button">Login</div>')
      assembly.insertHtml('<div class="button">Another</div>')

      Button.addFinder((query, name) => query.find('div.button').containing(name))

      const elements = browser.find(Button('Login')).result()
      expect(elements).to.eql([button])
    })

    it('can define a new button and still use original button definitions', () => {
      const button = assembly.insertHtml('<button>Login</button>')
      assembly.insertHtml('<button>Another</button>')

      Button.addFinder((query, name) => query.find('div.button').containing(name))

      const elements = browser.find(Button('Login')).result()
      expect(elements).to.eql([button])
    })
  })

  describe('removing button finders', function() {
    it('remove button finder no longer find buttons', function() {
      assembly.insertHtml('<div class="button">Login</div>')

      Button.addFinder('div.button', (query, name) => query.find('div.button').containing(name))

      let elements = browser.find(Button('Login')).result()
      expect(elements.length).to.eql(1)

      Button.removeFinder('div.button')

      elements = browser.find(Button('Login')).result()
      expect(elements.length).to.eql(0)
    })
  })

  describe('clicking a button', () => {
    async function assertCanClickButton(html, action): Promise<void> {
      const events = []
      assembly.insertHtml(html)
      const button = assembly.find('.target')
      button.addEventListener('click', () => events.push('click'))

      await action()
      expect(events).to.eql(['click'])
    }

    it('can click a button', async () => {
      await assertCanClickButton('<button class="target">Login</button>', () => browser.click(Button('Login')))
    })

    it('can find and click a button', async () => {
      await assertCanClickButton('<button class="target">Login</button>', () => browser.find(Button("Login")).click())
    })

    it('can click a button with selector', async () => {
      await assertCanClickButton('<button class="target">Login</button>', () => browser.click(Button("Login")))
    })

    it('can click a defined button', async () => {
      Button.addFinder((query, name) => query.find('div.button').containing(name))
      await assertCanClickButton('<div class="target button">Login</div>', () => browser.click(Button("Login")))
    })

    it('throws if the button cannot be found to click', async () => {
      Button.addFinder((query, name) => query.find('div.button').containing(name))
      assembly.insertHtml('<button class="target">Login</button>')
      await assembly.assertRejection(browser.click(Button('Logout')), "expected 1 element, found 0")
    })
  })
})
