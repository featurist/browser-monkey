var demand = require('must')
var domTest = require('./domTest')

describe('.set({ immediate: true })', function () {
  describe('click', function () {
    domTest('makes clicks happen immediately', function (browser, dom, $) {
      var clicked = false

      dom.insert('<div class="element">red</div>').on('click', function () {
        clicked = true
      })

      browser.set({ immediate: true })
      browser.find('.element').click()
      demand(clicked).to.equal(true)
    })

    domTest('throws errors immediately', function (browser, dom, $) {
      browser.set({ immediate: true })
      demand(function () {
        browser.find('.element').click()
      }).throw('expected to find: .element [disabled=false]')
    })
  })

  domTest('fills a component with supplied values immediately', function (browser, dom) {
    browser.set({ immediate: true })

    var component = browser.component({
      title: function () {
        return this.find('.title')
      },
      name: function () {
        return this.find('.name')
      }
    })
    dom.insert('<select class="title"><option>Mrs</option><option>Mr</option></select>')
    dom.insert('<input type="text" class="name"></input>')

    component.fill([
      {name: 'title', action: 'select', options: {exactText: 'Mr'}},
      {name: 'name', action: 'typeIn', options: {text: 'Joe'}}
    ])
    demand(dom.el.find('.title').val()).to.equal('Mr')
    demand(dom.el.find('.name').val()).to.equal('Joe')
  })

  describe('shouldHave', function () {
    domTest('tests text values immediately', function (browser, dom, $) {
      dom.insert('<div class="element">red</div>')

      browser.set({ immediate: true })
      browser.find('.element').shouldHave({text: 'red'})
    })

    domTest('throws on failure immediately', function (browser, dom, $) {
      dom.insert('<div class="element">red</div>')

      browser.set({ immediate: true })
      demand(function () {
        browser.find('.element').shouldHave({text: 'blue'})
      }).throw(/expected element to contain "blue" but contained "red"/)
    })
  })
})
