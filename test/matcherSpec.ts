import { expect } from 'chai'
import { createMatcher, parseMatcher, matcherId } from '../lib/Matcher'

describe('matchers', function () {
  it('can serialise a simple matcher', () => {
    const Thing = createMatcher(q => q)

    expect(parseMatcher(Thing.toString())).to.eql({
      matcher: Thing,
      args: []
    })
  })

  it('can serialise a matcher with arguments', () => {
    const Thing = createMatcher(q => q)

    expect(parseMatcher(Thing('a'))).to.eql({
      matcher: Thing,
      args: ['a']
    })
  })

  it('can serialise a matcher with regex arguments', () => {
    const Thing = createMatcher(q => q)

    expect(parseMatcher(Thing(/a/i))).to.eql({
      matcher: Thing,
      args: [/a/i]
    })
  })

  it('can be used in computed fields', () => {
    const Thing = createMatcher(q => q)

    expect({
      [Thing('a', 'b')]: 'asdf'
    }).to.eql({
      [`{"id":${Thing[matcherId]},"args":["a","b"]}`]: 'asdf'
    })
  })
})
