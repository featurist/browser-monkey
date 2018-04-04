var demand = require('must')
var retry = require('trytryagain')
var browser = require('..')
var hyperdom = require('hyperdom')
var h = hyperdom.html
var isBrowser = !require('is-node')
var createTestDiv = require('../lib/createTestDiv')

function wait (ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

if (isBrowser) {
  describe('hyperdom integration', function () {
    it('should find things rendered by hyperdom', function () {
      function App (model) {
        this.model = model
      }

      var other = {
        former: 'Male'
      }
      var fuzzy = {
        fuzzy: true
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
            h('option', {value: 'ml'}, 'Male'),
            h('option', {value: fuzzy}, 'Not sure'),
            h('option', {value: other}, 'Other')
          ),
          h('.name', 'Name: ', model.name),
          h('.gender', 'Gender: ', model.gender),
          renderMessage()
        ])
      }

      var model = {}
      var dom = createTestDiv()
      hyperdom.append(dom, new App(model))
      browser = browser.scope(dom)

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
      }).then(function () {
        return browser.find('select').select({text: 'Other'})
      }).then(function () {
        return wait(100).then(function () {
          return browser.find('option:selected').shouldHave({text: 'Other'})
        })
      })
    })
  })
}
