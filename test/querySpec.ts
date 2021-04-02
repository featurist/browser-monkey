import {expect} from 'chai'
import {DomAssembly} from './assemblies/DomAssembly'
import {Query} from '../lib/Query'
import Dom from '../lib/Dom'

describe('query', () => {
  let assembly: DomAssembly
  let browser: Query
  let dom: Dom

  beforeEach(() => {
    assembly = new DomAssembly()
    browser = assembly.browserMonkey()
    dom = new Dom()
  })

  afterEach(() => {
    assembly.stop()
  })

  it('can find an element by DOM selector', async () => {
    const selectedElementPromise = browser.find('.test').shouldHaveElements(1).then()

    const insertedElementPromise = assembly.eventuallyInsertHtml(
      `<div class="test"></div>`
    )

    const [selectedElement] = await selectedElementPromise
    const insertedElement = await insertedElementPromise

    expect(selectedElement).to.equal(insertedElement)
  })

  describe('options', () => {
    it('returns a new Browser Monkey object without modifying the current one', () => {
      browser.options({timeout: 400})
      expect(browser.getOptions().timeout).to.equal(400)
    })

    it('overrides previously set option', () => {
      browser.options({timeout: 400})
      browser.options({timeout: 4000})
      expect(browser.getOptions().timeout).to.equal(4000)
    })
  })

  describe('shouldNotExist', () => {
    it('passes when there are no elements found', async () => {
      assembly.insertHtml(`
        <div class="contact">
          <div class="name">Sally</div>
          <div class="address">32 Yellow Drive</div>
        </div>
      `)

      const contacts = browser
        .find('.contact')
        .shouldNotExist()
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

      const contacts = browser
        .find('.contact')
        .shouldNotExist()
        .then()

      assembly.eventuallyDeleteHtml('.message')
      await assembly.assertRejection(contacts, 'expected no elements')
    })
  })

  describe('shouldHaveElements', () => {
    describe('when 1', () => {
      it('when there is one element, returns it', async () => {
        const contacts = browser
          .find('.contact')
          .shouldHaveElements(1)
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
        const contacts = browser
          .find('.contact')
          .shouldHaveElements(1)
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

        await assembly.assertRejection(contacts, 'expected 1 element, found 2')
      })

      it('when there no elements, throws an error', async () => {
        const contacts = browser
          .find('.contact')
          .shouldHaveElements(1)
          .then()

        assembly.eventuallyInsertHtml(`
          <div class="title"></div>
          <div class="title"></div>
        `)

        await assembly.assertRejection(contacts, 'expected 1 element, found 0')
      })
    })

    it('asserts list of two elements has two elements', async () => {
      const items = browser
        .find('li ul')
        .shouldHaveElements(2)
        .then()

      assembly.eventuallyInsertHtml(`
        <li>
          <ul>one</ul>
          <ul>two</ul>
        </li>
      `)

      expect(await items).to.eql(assembly.findAll('li ul'))
    })

    it('fails when a list of two element is asserted to have three elements', async () => {
      const items = browser
        .find('li ul')
        .shouldHaveElements(3)
        .then()

      assembly.eventuallyInsertHtml(`
        <li>
          <ul>one</ul>
          <ul>two</ul>
        </li>
      `)

      await assembly.assertRejection(items, 'expected 3 elements, found 2')
    })
  })

  describe('elementResult', () => {
    it('expects one html element and returns it', () => {
      const expected = assembly.insertHtml(`
        <div class="title"></div>
      `)

      const actual = browser
        .find('.title')
        .elementResult()

      expect(actual).to.equal(expected)
    })

    it('fails if there are more than one element', () => {
      assembly.insertHtml(`
        <div class="title"></div>
        <div class="title"></div>
      `)

      expect(() => browser
        .find('.title')
        .elementResult()).to.throw('expected 1 element, found 2')
    })

    it('fails if there are no elements', () => {
      assembly.insertHtml(`
      `)

      expect(() => browser
        .find('.title')
        .elementResult()).to.throw('expected 1 element, found 0')
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

      const actual = browser
        .find('.title')
        .elementsResult()

      expect(actual).to.eql([div1, div2])
    })

    it('fails if there are no elements', () => {
      assembly.insertHtml(`
      `)

      expect(() => browser
        .find('.title')
        .elementsResult()).to.throw('expected one or more elements, found 0')
    })
  })

  describe('shouldExist', () => {
    it('when there are one or more elements, selects them', async () => {
      const contacts = browser
        .find('.contact')
        .shouldExist()
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
      const contacts = browser
        .find('.contact')
        .shouldExist()
        .then()

      assembly.eventuallyInsertHtml(`
        <div class="title"></div>
        <div class="title"></div>
      `)

      await assembly.assertRejection(contacts, 'expected one or more elements, found 0')
    })
  })

  // transform() has been moved to private
  // describe('input', () => {
  //   it('input sets the input used in transform', async () => {
  //     const query = browser
  //       .input('a')
  //       .transform(x => `input: ${x}`)

  //     expect(query.result()).to.eql('input: a')
  //   })
  // })

  describe('scope', () => {
    it('when scope is one element, sets the input to an array of one', () => {
      const query = browser
        .scope(document.body)

      expect(query.getInput()).to.eql([document.body])
    })

    it('scope can be passed in to constructor', () => {
      const query = new Query(document.body)

      expect(query.getInput()).to.eql([document.body])
    })
  })

  describe('expect', () => {
    it('waits for the input to eventually pass the assertion', async () => {
      const hello = browser
        .expect(elements => {
          expect(elements.some(element => dom.elementInnerText(element).includes('hello'))).to.equal(true)
        })
        .then()

      assembly.eventuallyInsertHtml(`
        <div>hello</div>
      `)

      await hello
    })

    it('eventually throws the last error if it never passes', async () => {
      const hello = browser
        .expect(elements => {
          expect(elements.some(element => dom.elementInnerText(element).includes('hello')), 'expected to see hello').to.equal(true)
        })
        .then()

      assembly.eventuallyInsertHtml(`
        <div>goodbye</div>
      `)

      await assembly.assertRejection(hello, 'expected to see hello')
    })
  })

  // Moved to private
  // describe('transform', () => {
  //   it('can map all the elements', async () => {
  //     const contacts = browser
  //       .find('.name')
  //       .transform(names => {
  //         return names.map(contact => contact.innerText).join(', ')
  //       })
  //       .expect(x => expect(x).to.not.be.empty)
  //       .then()

  //     assembly.eventuallyInsertHtml(`
  //       <div class="name">Sally</div>
  //       <div class="name">Bob</div>
  //     `)

  //     expect(await contacts).to.eql('Sally, Bob')
  //   })
  // })

  describe('filter', () => {
    it('can filter elements', async () => {
      const contacts = browser
        .find('.contact')
        .filter(contact => {
          return dom.elementInnerText(contact.querySelector('.name') as HTMLElement) === 'Sally'
        })
        .shouldHaveElements(1)
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
      const contacts = browser
        .find('.contact')
        .map(contact => {
          return contact.querySelector('.name')
        })
        .shouldExist()
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

  // Moved to private
  // describe('actions', () => {
  //   it('actions are only executed once', async () => {
  //     let actionExecuted = 0

  //     assembly.insertHtml(`
  //       <div>A</div>
  //     `)

  //     const action = browser.find('div').action(function () {
  //       actionExecuted++
  //     })

  //     await action
  //     expect(actionExecuted).to.equal(1)
  //     await action
  //     expect(actionExecuted).to.equal(1)
  //   })

  //   it('actions return the element or elements they acted on', async () => {
  //     const divA = assembly.insertHtml(`
  //       <div>A</div>
  //     `)
  //     const divB = assembly.insertHtml(`
  //       <div>B</div>
  //     `)

  //     let givenElements
  //     const action = browser.find('div').action(function (els) {
  //       givenElements = els
  //     })

  //     const elements = await action
  //     expect(elements).to.eql([divA, divB])
  //     expect(givenElements).to.eql([divA, divB])
  //   })
  // })

  describe('errors', () => {
    it('shows what it was able to map', async () => {
      const name = browser
        .find('.container')
        .find('.contact')
        .find('.name')
        .shouldHaveElements(1)
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

      await assembly.assertRejection(name, "expected 1 element, found 0 (found: path(find('.container') [1], find('.contact') [2], find('.name') [0]))")
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

      const elementsFound = browser.concat([
        q => q.find('.a'),
        q => q.find('.b'),
        q => q.find('.x'),
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

      const promise = browser.concat([
        b => b.find('.a'),
        b => b.find('.b')
      ]).find('.child').shouldExist()

      return assembly.assertRejection(promise, "expected one or more elements, found 0 (found: path(concat(find('.a') [1], find('.b') [1]) [2], find('.child') [0])")
    })
  })

  describe('errors', () => {
    it('throws error with wait duration and retry count', async () => {
      assembly.insertHtml(`
        <div class="a">A</div>
      `)

      const promise = browser.find('.b').shouldExist()

      return assembly.assertRejection(promise, /expected one or more elements, found 0 \[waited \d+ms, retried 1 times\]/, {assertMetrics: true})
    })
  })

  describe('firstOf', () => {
    it('finds the first of two or more queries', async () => {
      const promise = browser.firstOf([
        b => b.find('.a').shouldExist(),
        b => b.find('.b').shouldExist()
      ]).then()

      const bPromise = assembly.eventuallyInsertHtml('<div class="b">B</div>')

      const foundB = await promise
      const actualB = [await bPromise]

      expect(foundB).to.eql(actualB)
    })

    it('returns descriptions of all queries used when none are successful', async () => {
      assembly.insertHtml('<div class="content">content<div class="c"/>C</div>')

      const promise = browser.find('.content').firstOf([
        b => b.find('.a'),
        b => b.find('.b')
      ])

      await assembly.assertRejection(promise, "all queries failed in firstOf (found: path(find('.content') [1], firstOf(expected one or more elements, found 0 (found: find('.a') [0]), expected one or more elements, found 0 (found: find('.b') [0])) [0]))")
    })
  })

  describe('detect', () => {
    it('finds the first of two or more queries', async () => {
      const promise = browser.detect({
        a: q => q.find('.a'),
        b: q => q.find('.b')
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

      const promise = browser.find('.content').detect({
        a: b => b.find('.a').shouldExist(),
        b: b => b.find('.b').shouldExist()
      })

      await assembly.assertRejection(promise, "all queries failed in detect (found: path(find('.content') [1], detect(a: expected one or more elements, found 0 (found: find('.a') [0]), b: expected one or more elements, found 0 (found: find('.b') [0])) [0]))")
    })
  })
})
