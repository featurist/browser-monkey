var demand = require('must')
var retry = require('trytryagain')
var browser = require('..')
var hyperdom = require('hyperdom')
var h = hyperdom.html

describe('hyperdom integration', function () {
  it('should find things rendered by hyperdom', function () {
    function App (model) {
      this.model = model
    }

    App.prototype.render = function () {
      var model = this.model
      function renderMessage () {
        if (model.show) {
          return h('span', 'hello')
        }
      }
      return h('div', [
        h('a.toggle', {
          onclick: function () {
            model.show = !model.show
          }
        }),
        h('input', {type: 'text', binding: [model, 'name']}),
        h('select', {binding: [model, 'gender']},
           h('option', 'Select..'),
           h('option', {value: 'fml'}, 'Female'),
           h('option', {value: 'ml'}, 'Male')
          ),
        h('.name', 'Name: ', model.name),
        h('.gender', 'Gender: ', model.gender),
        renderMessage()
      ]
      )
    }

    var vdom = h('div')

    var model = {}
    hyperdom.appendVDom(vdom, new App(model), { requestRender: setTimeout, window: {} })
    browser = browser.scope(vdom)
    var vquery = require('vdom-query')
    browser.set({$: vquery, visibleOnly: false, document: {}})

    return browser.find('.toggle').click().then(function () {
      return browser.find('span', {text: 'hello'}).shouldExist()
    }).then(function () {
      return browser.find('input').typeIn({text: 'monkey'})
    }).then(function () {
      return retry(function () {
        demand(model.name).to.equal('monkey')
      })
    }).then(function () {
      return browser.find('select').select({text: 'Female'})
    }).then(function () {
      return browser.find('.name').shouldHave({text: 'monkey'})
    }).then(function () {
      return browser.find('.gender').shouldHave({text: 'fml'})
    }).then(function () {
      return browser.find('input').shouldHave({value: 'monkey'})
    })
  })
})
