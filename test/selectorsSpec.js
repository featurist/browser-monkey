var describeAssemblies = require('./describeAssemblies')
const expect = require('must')
const DomAssembly = require('./assemblies/DomAssembly')

describe('selectors', () => {
  describeAssemblies([DomAssembly], Assembly => {
    let assembly
    let browserMonkey

    beforeEach(() => {
      assembly = new Assembly()
      browserMonkey = assembly.browserMonkey()
    })

    it('can find an element by DOM selector', async () => {
      const selectedElementPromise = browserMonkey.find('.test').one()

      const insertedElementPromise = assembly.eventuallyInsertHtml(
        `<div class="test"></div>`
      )

      const selectedElement = await selectedElementPromise
      const insertedElement = await insertedElementPromise

      expect(selectedElement).to.equal(insertedElement)
    })

    describe('options', () => {
      it('returns a new Browser Monkey object without modifying the current one', () => {
        const withOptions = browserMonkey.options({ a: 'a' })
        expect(browserMonkey._options.a).to.equal(undefined)
        expect(withOptions._options.a).to.equal('a')
      })
    })

    describe('components', () => {
      it('can add a method to the returned Browser Monkey object', () => {
        const monkey = browserMonkey
          .component({
            aMethod: function () { return 'aMethod' }
          })

        expect(monkey.aMethod()).to.equal('aMethod')
      })

      it('passes through the options', () => {
        const monkey = browserMonkey
          .options({ a: 'a' })
          .component({
            aMethod: function () { return 'aMethod' }
          })

        expect(monkey._options.a).to.equal('a')
      })

      it('passes through the input', () => {
        const monkey = browserMonkey
          .input('a')
          .component({
            aMethod: function () { return 'aMethod' }
          })

        expect(monkey._value).to.equal('a')
      })

      it('passes through the maps', async () => {
        const monkey = browserMonkey
          .input(1)
          .mapAll(x => x + 1)
          .component({
            aMethod: function () { return 'aMethod' }
          })

        expect(await monkey).to.equal(2)
      })
    })

    describe('zero', () => {
      it('passes when there are no elements found', async () => {
        assembly.insertHtml(`
          <div class="contact">
            <div class="name">Sally</div>
            <div class="address">32 Yellow Drive</div>
          </div>
        `)

        const contacts = browserMonkey
          .find('.contact')
          .zero()

        assembly.eventuallyDeleteHtml('.contact')

        await contacts
      })

      it('fails when there are more than one element found', async () => {
        assembly.insertHtml(`
          <div class="contact">
            <div class="name">Sally</div>
            <div class="address">32 Yellow Drive</div>
          </div>
          <div class="message">
            <div class="subject">Hi</div>
            <div class="body">Quick beer after work?</div>
          </div>
        `)

        const contacts = browserMonkey
          .find('.contact')
          .zero()

        assembly.eventuallyDeleteHtml('.message')

        await expect(contacts).reject.with.error(/expected no elements/)
      })
    })

    describe('one', () => {
      it('when there is one element, selects it', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .one()

        assembly.eventuallyInsertHtml(`
          <div class="contact">
            <div class="name">Sally</div>
            <div class="address">32 Yellow Drive</div>
          </div>
        `)

        expect(await contacts).to.eql(assembly.find('.contact:nth-child(1)'))
      })

      it('when there is more than one element, throws an error', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .one()

        assembly.eventuallyInsertHtml(`
          <div class="contact">
            <div class="name">Sally</div>
            <div class="address">32 Yellow Drive</div>
          </div>
          <div class="contact">
            <div class="name">Bob</div>
            <div class="address">32 Red Drive</div>
          </div>
        `)

        await expect(contacts).reject.with.error(/expected one element/)
      })

      it('when there no elements, throws an error', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .one()

        assembly.eventuallyInsertHtml(`
          <div class="title"></div>
          <div class="title"></div>
        `)

        await expect(contacts).reject.with.error(/expected one element/)
      })

      it('when there is already one result, no array, selects it', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .one()
          .one()

        assembly.eventuallyInsertHtml(`
          <div class="contact">
            <div class="name">Sally</div>
            <div class="address">32 Yellow Drive</div>
          </div>
        `)

        expect(await contacts).to.eql(assembly.find('.contact:nth-child(1)'))
      })
    })

    describe('some', () => {
      it('when there are one or more elements, selects them', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .some()

        assembly.eventuallyInsertHtml(`
          <div class="contact">
            <div class="name">Sally</div>
            <div class="address">32 Yellow Drive</div>
          </div>
          <div class="contact">
            <div class="name">Bob</div>
            <div class="address">32 Red Drive</div>
          </div>
        `)

        expect(await contacts).to.eql(assembly.findAll('.contact'))
      })

      it('when there no elements, throws an error', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .some()

        assembly.eventuallyInsertHtml(`
          <div class="title"></div>
          <div class="title"></div>
        `)

        await expect(contacts).reject.with.error(/expected some elements/)
      })
    })

    describe('map', () => {
      it('can map elements', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .map(contact => ({
            name: contact.querySelector('.name').innerText,
            address: contact.querySelector('.address').innerText
          }))
          .some()

        assembly.eventuallyInsertHtml(`
          <div class="contact">
            <div class="name">Sally</div>
            <div class="address">32 Yellow Drive</div>
          </div>
          <div class="contact">
            <div class="name">Bob</div>
            <div class="address">32 Red Drive</div>
          </div>
        `)

        expect(await contacts).to.eql([
          {
            name: 'Sally',
            address: '32 Yellow Drive'
          },
          {
            name: 'Bob',
            address: '32 Red Drive'
          }
        ])
      })
    })

    describe('input', () => {
      it('input sets the input used in mapAll', async () => {
        const monkey = browserMonkey
          .input('a')
          .mapAll(x => `input: ${x}`)

        expect(await monkey).to.eql('input: a')
      })
    })

    describe('scope', () => {
      it('when scope is one element, sets the input to an array of one', () => {
        const monkey = browserMonkey
          .scope(document.body)

        expect(monkey._value).to.eql([document.body])
      })
    })

    describe('ensure', () => {
      it('waits for the input to eventually pass the assertion', async () => {
        const hello = browserMonkey
          .ensure(elements => {
            expect(elements.some(element => element.innerText.includes('hello'))).to.equal(true)
          })

        assembly.eventuallyInsertHtml(`
          <div>hello</div>
        `)

        await hello
      })

      it('eventually throws the last error if it never passes', async () => {
        const hello = browserMonkey
          .ensure(elements => {
            expect(elements.some(element => element.innerText.includes('hello')), 'expected to see hello').to.equal(true)
          })

        assembly.eventuallyInsertHtml(`
          <div>goodbye</div>
        `)

        await expect(hello).to.reject.with.error(/expected to see hello/)
      })
    })

    describe('mapAll', () => {
      it('can map all the elements', async () => {
        const contacts = browserMonkey
          .find('.name')
          .mapAll(names => {
            return names.map(contact => contact.innerText).join(', ')
          })
          .ensure(x => expect(x).to.not.be.empty())

        assembly.eventuallyInsertHtml(`
          <div class="name">Sally</div>
          <div class="name">Bob</div>
        `)

        expect(await contacts).to.eql('Sally, Bob')
      })
    })

    describe('filter', () => {
      it('can filter elements', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .filter(contact => {
            return contact.querySelector('.name').innerText === 'Sally'
          })
          .one()

        assembly.eventuallyInsertHtml(`
          <div class="contact">
            <div class="name">Sally</div>
            <div class="address">32 Yellow Drive</div>
          </div>
          <div class="contact">
            <div class="name">Bob</div>
            <div class="address">32 Red Drive</div>
          </div>
        `)

        expect(await contacts).to.eql(assembly.find('.contact:nth-child(1)'))
      })
    })

    describe('actions', () => {
      it('actions are only executed once', async () => {
        let actionExecuted = 0

        assembly.insertHtml(`
          <div>A</div>
        `)

        const action = browserMonkey.find('div').action(function () {
          actionExecuted++
        })

        await action
        expect(actionExecuted).to.equal(1)
        await action
        expect(actionExecuted).to.equal(1)
      })

      it('actions return the element or elements they acted on', async () => {
        const divA = assembly.insertHtml(`
          <div>A</div>
        `)
        const divB = assembly.insertHtml(`
          <div>B</div>
        `)

        let givenElements
        const action = browserMonkey.find('div').action(function (els) {
          givenElements = els
        })

        const elements = await action
        expect(elements).to.eql([divA, divB])
        expect(givenElements).to.eql([divA, divB])
      })
    })

    describe('errors', () => {
      it('shows what it was able to map', async () => {
        const name = browserMonkey
          .find('.container')
          .find('.contact')
          .find('.name')
          .one()

        assembly.eventuallyInsertHtml(`
          <div class="container">
            <div class="contact">
            </div>
            <div class="contact">
            </div>
          </div>
        `)

        await expect(name).to.reject.with.error("expected one element (found: scope [1], find('.container') [1], find('.contact') [2], find('.name') [0])")
      })
    })

    describe('all', () => {
      it('finds either', async () => {
        const a = assembly.insertHtml(`
          <div class="a">A</div>
        `)
        const b = assembly.insertHtml(`
          <div class="b">B</div>
        `)
        assembly.insertHtml(`
          <div class="c">C</div>
        `)

        const elementsFound = await browserMonkey.all([
          b => b.find('.a'),
          b => b.find('.b')
        ])

        expect(elementsFound).to.eql([a, b])
      })

      it('throws error with finders used in all', async () => {
        assembly.insertHtml(`
          <div class="a">A</div>
        `)
        assembly.insertHtml(`
          <div class="b">B</div>
        `)
        assembly.insertHtml(`
          <div class="c">C</div>
        `)

        const promise = browserMonkey.all([
          b => b.find('.a'),
          b => b.find('.b')
        ]).find('.child').some()

        return expect(promise).to.reject.with.error("expected some elements (found: scope [1], all (find('.a') [1], or find('.b') [1]) [2], find('.child') [0])")
      })
    })

    describe('race', () => {
      it('finds the first of two or more selectors', async () => {
        const promise = browserMonkey.race([
          b => b.find('.a').one(),
          b => b.find('.b').one()
        ])

        const bPromise = assembly.eventuallyInsertHtml('<div class="b">B</div>')

        const b = await promise

        expect(b).to.eql(await bPromise)
      })

      it('returns descriptions of all queries used when none are successful', async () => {
        assembly.insertHtml('<div class="content">content<div class="c"/>C</div>')

        const promise = browserMonkey.find('.content').race([
          b => b.find('.a').some(),
          b => b.find('.b').some()
        ])

        await expect(promise).to.reject.with.error("all queries failed in race (found: scope [1], find('.content') [1], race between (expected some elements (found: find('.a') [0]), and expected some elements (found: find('.b') [0])))")
      })
    })
  })
})
