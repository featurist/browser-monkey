import { Query } from './Query'

const matchers = {}

export const matcherId = Symbol()
export const matcherFinder = Symbol()

let lastMatcherId = 0

export type Finder = (query: Query, ...any) => Query

export interface Matcher {
  (...args: any[]): string
  [matcherId]: string
  [matcherFinder]: Finder
}

function replacer(key, value) {
  if (value instanceof RegExp) {
    return {
      prototype: "RegExp",
      source: value.source,
      flags: value.flags
    }
  } else {
    return value
  }
}

export function createMatcher (css: string): any;
export function createMatcher (finder: Finder): any;

export function createMatcher (cssOrFinder: any): any {
  const id = lastMatcherId++

  const finder = typeof cssOrFinder == 'string'
    ? q => q.findCss(cssOrFinder)
    : cssOrFinder

  const matcher = function (...args) {
    return JSON.stringify({
      id,
      args
    }, replacer)
  }

  matcher.toString = function () { return JSON.stringify({id, args: []}) }
  matcher[matcherId] = id
  matcher[matcherFinder] = finder

  matchers[id] = matcher

  return matcher
}

function reviver(key, value) {
  if (value instanceof Object && value.prototype) {
    switch (value.prototype) {
      case 'RegExp':
        return new RegExp(value.source, value.flags)
    }
  }

  return value
}

export function parseMatcher(matcherString) {
  if (matcherString[0] === '{') {
    const {id, args} = JSON.parse(matcherString, reviver)
    const matcher = matchers[id]
    return {
      matcher,
      args
    }
  }
}
