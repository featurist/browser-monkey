import {DomAssembly} from './assemblies/DomAssembly'
import {expect} from 'chai'

describe('find', () => {
  let assembly
  let browser

  beforeEach(function () {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
  })

  afterEach(() => {
    assembly.stop()
  })

  function assertFound (html, query): void {
    assembly.insertHtml(html)

    const expected = assembly.findAll('.expected')

    expect(query.result()).to.eql(expected)
  }

  it('finds all elements that match', () => {
    assertFound(
      `
        <div>
          <div class="expected match"></div>
        </div>
        <div>
          <div class="expected match"></div>
        </div>
      `,
      browser.find('.match')
    )
  })

  it('restricts search scope of subsequent queries', () => {
    assertFound(
      `
        <div>
          <div class="outer">
            <div class="expected inner"></div>
          </div>
        </div>
        <div>
          <div class="inner"></div>
        </div>
      `,
      browser.find('.outer').find('.inner')
    )
  })

  it('returns an emtpy array if nothing matched', () => {
    assembly.insertHtml(
      `
        <div>
          <div></div>
        </div>
      `,
    )

    expect(browser.find('.missing').result()).to.eql([])
  })

  describe('iframes', () => {
    it('can search into iframes', async () => {
      const iframe = browser.iframe('iframe')

      assembly.useNormalRetry()
      assembly.eventuallyInsertHtml(`<iframe src="${DomAssembly.localUrl('page1.html')}"/>`)

      await iframe.clickButton('page 2')
      await iframe.shouldContain({h1: 'Page 2'})
    })
  })

  describe('visibility', () => {
    it('should not find an element that is visually hidden', () => {
      assembly.insertHtml('<div class="element">hello <span style="display:none;">world</span></div>')

      return browser.find('.element > span').shouldNotExist()
    })

    it('should find an element that is visually hidden when visibleOnly = false', () => {
      assembly.insertHtml('<div class="element">hello <span style="display:none;">world</span></div>')

      return browser.options({ visibleOnly: false }).find('.element > span').shouldExist()
    })

    it('should find elements that are visually hidden because of how html renders them', () => {
      assembly.insertHtml('<select><option>First</option><option>Second</option></select>')

      return browser.find('select option').shouldContain(['First', 'Second'])
    })
  })
})
