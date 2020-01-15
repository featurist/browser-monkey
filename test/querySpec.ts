var describeAssemblies = require('./describeAssemblies')
const {expect} = require('chai')
import {DomAssembly} from './assemblies/DomAssembly'
import {Query} from '../lib/Query'

describe('query', () => {
  describeAssemblies([DomAssembly], Assembly => {
    let assembly: DomAssembly
    let browserMonkey: Query

    beforeEach(() => {
      assembly = new Assembly()
      browserMonkey = assembly.browserMonkey()
    })

    it('can find an element by DOM selector', async () => {
      const selectedElementPromise = browserMonkey.find('.test').expectOneElement().then()

      const insertedElementPromise = assembly.eventuallyInsertHtml(
        `<div class="test"></div>`
      )

      const [selectedElement] = await selectedElementPromise
      const insertedElement = await insertedElementPromise

      expect(selectedElement).to.equal(insertedElement)
    })

    describe('options', () => {
      it('returns a new Browser Monkey object without modifying the current one', () => {
        expect(browserMonkey.withOptions({a: 'a'}).options().a).to.equal('a')
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
          .withOptions({ a: 'a' })
          .find('asdf')

        expect(monkey.options().a).to.equal('a')
      })

      it('passes through the input', () => {
        const monkey = browserMonkey
          .withInput('a')
          .component({
            aMethod: function () { return 'aMethod' }
          })

        expect(monkey.input()).to.equal('a')
      })

      it('passes through the maps', async () => {
        const monkey = browserMonkey
          .withInput(1)
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
          .then()

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
          .then()

        assembly.eventuallyDeleteHtml('.message')
        await assembly.assertRejection(contacts, 'expected no elements')
      })
    })

    describe('expectOneElement', () => {
      it('when there is one element, selects it', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .expectOneElement()
          .then()

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
          .then()

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

        await assembly.assertRejection(contacts, 'expected just one element, found 2')
      })

      it('when there no elements, throws an error', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .expectOneElement()
          .then()

        assembly.eventuallyInsertHtml(`
          <div class="title"></div>
          <div class="title"></div>
        `)

        await assembly.assertRejection(contacts, 'expected just one element, found 0')
      })
    })

    describe('elementResult', () => {
      it('expects one html element and returns it', () => {
        const expected = assembly.insertHtml(`
          <div class="title"></div>
        `)

        const actual = browserMonkey
          .find('.title')
          .elementResult()

        expect(actual).to.equal(expected)
      })

      it('fails if there are more than one element', () => {
        assembly.insertHtml(`
          <div class="title"></div>
          <div class="title"></div>
        `)

        expect(() => browserMonkey
          .find('.title')
          .elementResult()).to.throw('expected just one element, found 2')
      })

      it('fails if there are no elements', () => {
        assembly.insertHtml(`
        `)

        expect(() => browserMonkey
          .find('.title')
          .elementResult()).to.throw('expected just one element, found 0')
      })
    })

    describe('elementsResult', () => {
      it('expects one or more html elements and returns them', () => {
        const div1 = assembly.insertHtml(`
          <div class="title"></div>
        `)
        const div2 = assembly.insertHtml(`
          <div class="title"></div>
        `)

        const actual = browserMonkey
          .find('.title')
          .elementsResult()

        expect(actual).to.eql([div1, div2])
      })

      it('fails if there are no elements', () => {
        assembly.insertHtml(`
        `)

        expect(() => browserMonkey
          .find('.title')
          .elementsResult()).to.throw('expected one or more elements, found 0')
      })
    })

    describe('expectSomeElements', () => {
      it('when there are one or more elements, selects them', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .expectSomeElements()
          .then()

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
          .then()

        assembly.eventuallyInsertHtml(`
          <div class="title"></div>
          <div class="title"></div>
        `)

        await assembly.assertRejection(contacts, 'expected one or more elements, found 0')
      })
    })

    describe('input', () => {
      it('input sets the input used in transform', async () => {
        const query = browserMonkey
          .withInput('a')
          .transform(x => `input: ${x}`)

        expect(query.result()).to.eql('input: a')
      })
    })

    describe('scope', () => {
      it('when scope is one element, sets the input to an array of one', () => {
        const query = browserMonkey
          .withScope(document.body)

        expect(query.input()).to.eql([document.body])
      })

      it('scope can be passed in to constructor', () => {
        const query = new Query(document.body)

        expect(query.input()).to.eql([document.body])
      })
    })

    describe('expect', () => {
      it('waits for the input to eventually pass the assertion', async () => {
        const hello = browserMonkey
          .expect(elements => {
            expect(elements.some(element => element.innerText.includes('hello'))).to.equal(true)
          })
          .then()

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
          .then()

        assembly.eventuallyInsertHtml(`
          <div>goodbye</div>
        `)

        await assembly.assertRejection(hello, 'expected to see hello')
      })
    })

    describe('transform', () => {
      it('can map all the elements', async () => {
        const contacts = browserMonkey
          .find('.name')
          .transform(names => {
            return names.map(contact => contact.innerText).join(', ')
          })
          .expect(x => expect(x).to.not.be.empty)
          .then()

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
          .then()

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

    describe('map', () => {
      it('can map elements', async () => {
        const contacts = browserMonkey
          .find('.contact')
          .map(contact => {
            return contact.querySelector('.name')
          })
          .expectSomeElements()
          .then()

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

        expect(await contacts).to.eql(assembly.findAll('.name'))
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
          .then()

        assembly.eventuallyInsertHtml(`
          <div class="container">
            <div class="contact">
              no .name
            </div>
            <div class="contact">
            </div>
          </div>
        `)

        await assembly.assertRejection(name, "expected just one element, found 0 (found: path(find('.container') [1], find('.contact') [2], find('.name') [0]))")
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

        return assembly.assertRejection(promise, "expected one or more elements, found 0 (found: path(concat(find('.a') [1], find('.b') [1]) [2], find('.child') [0])")
      })
    })

    describe('firstOf', () => {
      it('finds the first of two or more queries', async () => {
        const promise = browserMonkey.firstOf([
          b => b.find('.a').expectSomeElements(),
          b => b.find('.b').expectSomeElements()
        ]).then()

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

        await assembly.assertRejection(promise, "all queries failed in firstOf (found: path(find('.content') [1], firstOf(expected one or more elements, found 0 (found: find('.a') [0]), expected one or more elements, found 0 (found: find('.b') [0])) [0]))")
      })

      it('throws if one of the queries does not have an assertion or action', async () => {
        assembly.insertHtml('<div class="content">content<div class="c"/>C</div>')

        const promise = browserMonkey.find('.content').firstOf([
          b => b.find('.a'),
          b => b.find('.b').expectSomeElements()
        ])

        await assembly.assertRejection(promise, 'no expectations or actions in query')
      })
    })

    describe('detect', () => {
      it('finds the first of two or more queries', async () => {
        const promise = browserMonkey.detect({
          a: q => q.find('.a').expectSomeElements(),
          b: q => q.find('.b').expectSomeElements()
        }).then()

        const bPromise = assembly.eventuallyInsertHtml('<div class="b">B</div>')
        const actualB = [await bPromise]

        const {key, value} = await promise
        await bPromise

        expect(key).to.eql('b')
        expect(value).to.eql(actualB)
      })

      it('returns descriptions of all queries used when none are successful', async () => {
        assembly.insertHtml('<div class="content">content<div class="c"/>C</div>')

        const promise = browserMonkey.find('.content').detect({
          a: b => b.find('.a').expectSomeElements(),
          b: b => b.find('.b').expectSomeElements()
        })

        await assembly.assertRejection(promise, "all queries failed in detect (found: path(find('.content') [1], detect(a: expected one or more elements, found 0 (found: find('.a') [0]), b: expected one or more elements, found 0 (found: find('.b') [0])) [0]))")
      })

      it('throws if one of the queries does not have an assertion or action', async () => {
        assembly.insertHtml('<div class="content">content<div class="c"/>C</div>')

        const promise = browserMonkey.find('.content').detect({
          a: b => b.find('.a'),
          b: b => b.find('.b').expectSomeElements()
        })

        await assembly.assertRejection(promise, 'no expectations or actions in query')
      })
    })
  })
})
