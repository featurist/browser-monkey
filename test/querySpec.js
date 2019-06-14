var describeAssemblies = require('./describeAssemblies')
const expect = require('must')
const DomAssembly = require('./assemblies/DomAssembly')
const BrowserMonkeyAssertionError = require('../lib/BrowserMonkeyAssertionError').default

describe('query', () => {
  describeAssemblies([DomAssembly], Assembly => {
    let assembly
    let browserMonkey

    beforeEach(() => {
      assembly = new Assembly()
      browserMonkey = assembly.browserMonkey()
    })

    it('can find an element by DOM selector', async () => {
      const selectedElementPromise = browserMonkey.find('.test').expectOneElement()

      const insertedElementPromise = assembly.eventuallyInsertHtml(
        `<div class="test"></div>`
      )

      const [selectedElement] = await selectedElementPromise
      const insertedElement = await insertedElementPromise

      expect(selectedElement).to.equal(insertedElement)
    })

    describe('options', () => {
      it('returns a new Browser Monkey object without modifying the current one', () => {
        browserMonkey.options({ a: 'a' })
        expect(browserMonkey._options.a).to.equal('a')
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
        browserMonkey.options({ a: 'a' })

        const monkey = browserMonkey
          .component({
            aMethod: function () { return 'aMethod' }
          })

        expect(monkey._options.a).to.equal('a')
      })

      it('passes through the input', () => {
        browserMonkey.input('a')

        const monkey = browserMonkey
          .component({
            aMethod: function () { return 'aMethod' }
          })

        expect(monkey._input).to.equal('a')
      })

      it('passes through the maps', async () => {
        browserMonkey.input(1)

        const monkey = browserMonkey
          .transform(x => x + 1)
          .component({
            aMethod: function () { return 'aMethod' }
          })

        expect(monkey.result()).to.equal(2)
      })
    })

    describe('expectNoElements', () => {
      it('passes when there are no elements found', async () => {
        assembly.insertHtml(`
          <div class="contact">
            <div class="name">Sally</div>
            <div class="address">32 Yellow Drive</div>
          </div>
        `)

        const contacts = browserMonkey
          .find('.contact')
          .expectNoElements()

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
          .expectNoElements()

        assembly.eventuallyDeleteHtml('.message')
        await expect(contacts).reject.with.error(/expected no elements/)
      })
    })

    describe('expectOneElement', () => {
      it('when there is one element, selects it', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .expectOneElement()

        assembly.eventuallyInsertHtml(`
          <div class="contact">
            <div class="name">Sally</div>
            <div class="address">32 Yellow Drive</div>
          </div>
        `)

        expect(await contacts).to.eql([assembly.find('.contact:nth-child(1)')])
      })

      it('when there is more than one element, throws an error', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .expectOneElement()

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

        await expect(contacts).reject.with.error(/expected just one element, found 2/)
      })

      it('when there no elements, throws an error', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .expectOneElement()

        assembly.eventuallyInsertHtml(`
          <div class="title"></div>
          <div class="title"></div>
        `)

        await expect(contacts).reject.with.error(/expected just one element, found 0/)
      })
    })

    describe('expectSomeElements', () => {
      it('when there are one or more elements, selects them', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .expectSomeElements()

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
          .expectSomeElements()

        assembly.eventuallyInsertHtml(`
          <div class="title"></div>
          <div class="title"></div>
        `)

        await expect(contacts).reject.with.error(/expected one or more elements, found 0/)
      })
    })

    describe('input', () => {
      it('input sets the input used in transform', async () => {
        browserMonkey.input('a')

        const monkey = browserMonkey
          .transform(x => `input: ${x}`)

        expect(monkey.result()).to.eql('input: a')
      })
    })

    describe('scope', () => {
      it('when scope is one element, sets the input to an array of one', () => {
        const monkey = browserMonkey
          .scope(document.body)

        expect(monkey._input).to.eql([document.body])
      })
    })

    describe('expect', () => {
      it('waits for the input to eventually pass the assertion', async () => {
        const hello = browserMonkey
          .expect(elements => {
            expect(elements.some(element => element.innerText.includes('hello'))).to.equal(true)
          })

        assembly.eventuallyInsertHtml(`
          <div>hello</div>
        `)

        await hello
      })

      it('eventually throws the last error if it never passes', async () => {
        const hello = browserMonkey
          .expect(elements => {
            expect(elements.some(element => element.innerText.includes('hello')), 'expected to see hello').to.equal(true)
          })

        assembly.eventuallyInsertHtml(`
          <div>goodbye</div>
        `)

        await expect(hello).to.reject.with.error(/expected to see hello/)
      })
    })

    describe('transform', () => {
      it('can map all the elements', async () => {
        const contacts = browserMonkey
          .find('.name')
          .transform(names => {
            return names.map(contact => contact.innerText).join(', ')
          })
          .expect(x => expect(x).to.not.be.empty())

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
          .expectOneElement()

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

        expect(await contacts).to.eql([assembly.find('.contact:nth-child(1)')])
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
          .expectOneElement()

        assembly.eventuallyInsertHtml(`
          <div class="container">
            <div class="contact">
              no .name
            </div>
            <div class="contact">
            </div>
          </div>
        `)

        await expect(name).to.reject.with.error("expected just one element, found 0 (found: find('.container') [1], find('.contact') [2], find('.name') [0])")
      })
    })

    describe('concat', () => {
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

        const elementsFound = browserMonkey.concat([
          b => b.find('.a'),
          b => b.find('.b')
        ]).result()

        expect(elementsFound).to.eql([a, b])
      })

      it('throws error with finders used in concat', async () => {
        assembly.insertHtml(`
          <div class="a">A</div>
        `)
        assembly.insertHtml(`
          <div class="b">B</div>
        `)
        assembly.insertHtml(`
          <div class="c">C</div>
        `)

        const promise = browserMonkey.concat([
          b => b.find('.a'),
          b => b.find('.b')
        ]).find('.child').expectSomeElements()

        return expect(promise).to.reject.with.error("expected one or more elements, found 0 (found: concat (find('.a') [1], find('.b') [1]) [2], find('.child') [0])")
      })
    })

    describe('firstOf', () => {
      it('finds the first of two or more queries', async () => {
        const promise = browserMonkey.firstOf([
          b => b.find('.a').expectSomeElements(),
          b => b.find('.b').expectSomeElements()
        ])

        const bPromise = assembly.eventuallyInsertHtml('<div class="b">B</div>')

        const foundB = await promise
        const actualB = [await bPromise]

        expect(foundB).to.eql(actualB)
      })

      it('returns descriptions of all queries used when none are successful', async () => {
        assembly.insertHtml('<div class="content">content<div class="c"/>C</div>')

        const promise = browserMonkey.find('.content').firstOf([
          b => b.find('.a').expectSomeElements(),
          b => b.find('.b').expectSomeElements()
        ])

        await expect(promise).to.reject.with.error("all queries failed in firstOf (found: find('.content') [1], firstOf(expected one or more elements, found 0 (found: find('.a') [0]), expected one or more elements, found 0 (found: find('.b') [0])) [0])")
      })

      it('throws if one of the queries does not have an assertion or action', async () => {
        assembly.insertHtml('<div class="content">content<div class="c"/>C</div>')

        const promise = browserMonkey.find('.content').firstOf([
          b => b.find('.a'),
          b => b.find('.b').expectSomeElements()
        ])

        await expect(promise).to.reject.with.error(/no expectations or actions in query/)
      })
    })
  })
})
