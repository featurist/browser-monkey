import { expect } from 'chai'
import { DomAssembly } from './assemblies/DomAssembly'
import {Query, createFinder} from '../lib/Query'

describe('define', function () {
  let assembly
  let query: Query

  beforeEach(function () {
    assembly = new DomAssembly()
    query = assembly.browserMonkey()
  })

  afterEach(() => {
    assembly.stop()
  })

  it('can define a field', () => {
    assembly.insertHtml('<div class=hello>bye</div>')
    const Hello = createFinder(q => q.find('.hello'))

    expect(query.find(Hello).result()).to.eql(assembly.findAll('.hello'))
  })

  it('can define', () => {
    assembly.insertHtml('<div class=hello>bye</div>')
    const Hello = createFinder('.hello')

    expect(query.find(Hello).result()).to.eql(assembly.findAll('.hello'))
  })

  it('finds defined field', async function() {
    assembly.insertHtml(`
      <div class="flash-success">Success!</div>
      <div class="flash-alert">Fail!</div>
    `)
    const Flash = createFinder((q, flashType) => q.find(`.flash-${flashType}`))

    const a = 'success'

    await query.shouldContain({
      [Flash(a)]: 'Success!',
      [Flash("alert")]: /Fail/,
    })
  })

  describe('definition not found', () => {
    it('without arguments: assumes that it is CSS', () => {
      expect(() => query.find('Hello').shouldExist().result()).to.throw("expected one or more elements, found 0 (found: find('Hello') [0])")
    })
  })
})
