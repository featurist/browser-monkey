import {match} from '../lib/match'
import {expect} from 'chai'
import * as assert from 'assert'
import BrowserMonkeyAssertionError from '../lib/BrowserMonkeyAssertionError'

describe('match', () => {
  describe('strings', () => {
    it('matches when strings are identical', () => {
      expect(match('a', 'a')).to.eql({
        isMatch: true,
        actual: 'a',
        expected: 'a',
      })
    })

    it("doesn't match when strings aren't identical", () => {
      expect(match('b', 'a')).to.eql({
        isMatch: false,
        actual: 'b',
        expected: 'a',
      })
    })
  })

  describe('regexps', () => {
    it('matches when regexp matches', () => {
      expect(match('aaa', /a/)).to.eql({
        isMatch: true,
        actual: 'aaa',
        expected: 'aaa',
      })
    })

    it("doesn't match when regexp doesn't match", () => {
      expect(match('bbb', /a/)).to.eql({
        isMatch: false,
        actual: 'bbb',
        expected: /a/,
      })
    })
  })

  describe('objects', () => {
    it("matches when the expected object's properties match those of the actual object", () => {
      expect(match({a: 'a'}, {a: 'a'})).to.eql({
        isMatch: true,
        actual: {a: 'a'},
        expected: {a: 'a'},
      })
    })

    it("still matches when the actual object has other properties", () => {
      expect(match({a: 'a', b: 'b'}, {a: 'a'})).to.eql({
        isMatch: true,
        actual: {a: 'a'},
        expected: {a: 'a'},
      })
    })

    it("returns only the expected properties when there isn't a match", () => {
      expect(match({a: 'aa', b: 'b'}, {a: 'a'})).to.eql({
        isMatch: false,
        actual: {a: 'aa'},
        expected: {a: 'a'},
      })
    })

    it("can match deep objects", () => {
      expect(match({a: {aa: 'aa', bb: 'bb'}, b: 'b'}, {a: {aa: 'aa'}})).to.eql({
        isMatch: true,
        actual: {a: {aa: 'aa'}},
        expected: {a: {aa: 'aa'}},
      })
    })

    it("returns deep expected properties when no match", () => {
      expect(match({a: {aa: 'aa', bb: 'bb'}, b: 'b'}, {a: {aa: 'a'}})).to.eql({
        isMatch: false,
        actual: {a: {aa: 'aa'}},
        expected: {a: {aa: 'a'}},
      })
    })

    it("can match non-objects", () => {
      expect(match('asdf', {length: 4})).to.eql({
        isMatch: true,
        actual: {length: 4},
        expected: {length: 4},
      })
    })

    it("shows why non-objects are not matched", () => {
      expect(match('asdf', {length: 5})).to.eql({
        isMatch: false,
        actual: {length: 4},
        expected: {length: 5},
      })
    })
  })

  describe('arrays', () => {
    it("matches when array lengths are the same and each item matches", () => {
      expect(match(['a', {b: 'b'}, 'c'], [/a/, {b: 'b'}, 'c'])).to.eql({
        isMatch: true,
        actual: ['a', {b: 'b'}, 'c'],
        expected: ['a', {b: 'b'}, 'c'],
      })
    })

    it("doesn't match when array lengths are not the same", () => {
      expect(match(['a', 'b', 'c'], [/a/, 'b'])).to.eql({
        isMatch: false,
        actual: ['a', 'b', 'c'],
        expected: [/a/, 'b'],
      })
    })

    it("doesn't match when one of the items doesn't match", () => {
      expect(match(['a', 'b', 'c'], [/a/, 'b', 'd'])).to.eql({
        isMatch: false,
        actual: ['a', 'b', 'c'],
        expected: ['a', 'b', 'd'],
      })
    })
  })

  describe('functions', () => {
    it("matches when the function doesn't throw an exception", () => {
      expect(match(
        'a',
        () => { /* nothing */ }
      )).to.eql({
        isMatch: true,
        actual: 'a',
        expected: 'a',
      })
    })

    it("doesn't match when the function returns a node assertion exception", () => {
      expect(match(
        'a',
        () => {
          assert.equal('error actual', 'error expected')
        }
      )).to.eql({
        isMatch: false,
        actual: 'error actual',
        expected: 'error expected',
      })
    })

    it("doesn't match when the function returns a chai assertion exception", () => {
      expect(match(
        'a',
        () => {
          expect('error actual').to.equal('error expected')
        }
      )).to.eql({
        isMatch: false,
        actual: 'error actual',
        expected: 'error expected',
      })
    })

    it("doesn't match when the function returns a browser monkey assertion exception", () => {
      expect(match(
        'a',
        () => {
          throw new BrowserMonkeyAssertionError('asdf', {actual: 'error actual', expected: 'error expected'})
        }
      )).to.eql({
        isMatch: false,
        actual: 'error actual',
        expected: 'error expected',
      })
    })

    it("re-throws the error if it is not an assertion error", () => {
      expect(() => match(
        'a',
        () => {throw new Error('non-assertion error')}
      )).to.throw('non-assertion error')
    })

    it("function receives the actual as first argument", () => {
      let actual
      match('a', (a) => {actual = a})
      expect(actual).to.equal('a')
    })
  })
})
