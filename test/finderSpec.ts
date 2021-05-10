import { expect } from 'chai'
import { createFinder, parseFinder, finderIdProperty } from '../lib/Finder'

describe('finders', function () {
  it('can serialise a simple finder', () => {
    const Thing = createFinder(q => q)

    expect(parseFinder(Thing.toString())).to.eql({
      finder: Thing,
      args: []
    })
  })

  it('can serialise a finder with arguments', () => {
    const Thing = createFinder(q => q)

    expect(parseFinder(Thing('a'))).to.eql({
      finder: Thing,
      args: ['a']
    })
  })

  it('can serialise a finder with regex arguments', () => {
    const Thing = createFinder(q => q)

    expect(parseFinder(Thing(/a/i))).to.eql({
      finder: Thing,
      args: [/a/i]
    })
  })

  it('can be used in computed fields', () => {
    const Thing = createFinder(q => q)

    expect({
      [Thing('a', 'b')]: 'asdf'
    }).to.eql({
      [`{"id":${Thing[finderIdProperty]},"args":["a","b"]}`]: 'asdf'
    })
  })
})
