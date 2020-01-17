var demand = require('must')
var retry = require('trytryagain')
var hyperdom = require('hyperdom')
var h = hyperdom.html
var describeAssemblies = require('./describeAssemblies')
const {DomAssembly} = require('./assemblies/DomAssembly')

describe('hyperdom integration', function () {
  describeAssemblies([DomAssembly], Assembly => {
    let assembly
    let browserMonkey

    beforeEach(() => {
      assembly = new Assembly()
      browserMonkey = assembly.browserMonkey()
    })

    it('should find things rendered by hyperdom', async () => {
      var other = {
        former: 'Male'
      }
      var fuzzy = {
        fuzzy: true
      }

      class App {
        public constructor (model) {
          this.model = model
        }

        public render (): any {
          var model = this.model
          function renderMessage (): any {
            if (model.show) {
              return h('span', 'hello')
            }
          }
          return h('div',
            h('a.toggle', {
              onclick: function () {
                model.show = !model.show
              }
            }),
            h('input', { type: 'text', binding: [model, 'name'] }),
            h('select', { binding: [model, 'gender'] },
              h('option', 'Select..'),
              h('option', { value: 'fml' }, 'Female'),
              h('option', { value: 'ml' }, 'Male'),
              h('option', { value: fuzzy }, 'Not sure'),
              h('option', { value: other }, 'Other')
            ),
            h('.name', 'Name: ', model.name),
            h('.gender', 'Gender: ', model.gender),
            renderMessage()
          )
        }
      }

      var model = {}
      hyperdom.append(assembly._div, new App(model), { requestRender: setTimeout })

      await browserMonkey.find('.toggle').click()
      await browserMonkey.shouldContain({span: 'hello'})
      await browserMonkey.set({input: 'monkey'})
      await retry(function () {
        demand(model.name).to.equal('monkey')
      })
      await browserMonkey.set({select: 'Female'})
      return
      await browserMonkey.shouldContain({
        '.name': 'monkey',
        '.gender': 'fml',
        'input': 'monkey',
        'select': 'Other',
      })
    })
  })
})
