import retry from '../lib/retry'
import hyperdom, {html as h} from 'hyperdom'
import {DomAssembly} from './assemblies/DomAssembly'
import {expect} from 'chai'
import {Query} from '../lib/Query'

describe('hyperdom integration', function () {
  let assembly
  let browserMonkey: Query

  beforeEach(() => {
    assembly = new DomAssembly()
    browserMonkey = assembly.browserMonkey()
  })

  afterEach(() => {
    assembly.stop()
  })

  it('should find things rendered by hyperdom', async () => {
    const other = {
      former: 'Male'
    }
    const fuzzy = {
      fuzzy: true
    }

    type Model = {
      name?: string
      show?: boolean
      gender?: string
    }

    class App extends hyperdom.RenderComponent {
      private model: Model

      public constructor (model) {
        super()
        this.model = model
      }

      public render (): any {
        const model = this.model
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

    const model: Model = {}
    hyperdom.append(assembly._div, new App(model), { requestRender: setTimeout })

    await browserMonkey.find('.toggle').click()
    await browserMonkey.shouldContain({span: 'hello'})
    await browserMonkey.set({input: 'monkey'})
    await retry(function () {
      expect(model.name).to.equal('monkey')
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
