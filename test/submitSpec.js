var describeAssemblies = require('./describeAssemblies')
const {DomAssembly} = require('./assemblies/DomAssembly')
var demand = require('must')
const {expect} = require('chai')

describe('submit', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey()
    })

    async function assertCanSubmitAForm (html, action) {
      const events = []
      assembly.insertHtml(html)
      const button = assembly.find('.target')
      button.addEventListener('submit', () => events.push('submit'))

      await action()
      expect(events).to.eql(['submit'])
    }

    async function assertCanResetAForm (html, action) {
      const events = []
      assembly.insertHtml(html)
      const button = assembly.find('.target')
      button.addEventListener('reset', () => events.push('reset'))

      await action()
      expect(events).to.eql(['reset'])
    }

    async function assertSubmitFailure (html, action, rejection) {
      assembly.insertHtml(html)
      await assembly.assertRejection(action(), rejection)
    }

    it('can submit a form', async () => {
      await assertCanSubmitAForm(
        `
          <form class="target">
            <input type="text" />
          </form>
        `,
        () => browser.find('input').submit()
      )
    })

    it('can submit a form with a selector', async () => {
      await assertCanSubmitAForm(
        `
          <form class="target">
            <input type="text" />
          </form>
        `,
        () => browser.submit('input')
      )
    })

    it('can submit a form by clicking the submit button', async () => {
      await assertCanSubmitAForm(
        `
          <form class="target">
            <input type="submit" value="ok"></input>
          </form>
        `,
        () => browser.clickButton('ok')
      )
    })

    it('fails if the element is not in a form', async () => {
      await assertSubmitFailure(
        `
          <input type="text" />
        `,
        () => browser.submit('input'),
        'expected element to be inside a form for submit'
      )
    })

    describe('reset buttons', () => {
      it('can reset a form', async () => {
        await assertCanResetAForm(
          `
            <form class="target">
              <input type="reset" value="ok"></input>
            </form>
          `,
          () => browser.clickButton('ok')
        )
      })
    })
  })
})
