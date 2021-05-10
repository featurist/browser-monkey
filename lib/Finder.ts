import { Query } from './Query'

const finders = {}

export const finderIdProperty = Symbol()
export const finderFunctionProperty = Symbol()

let lastFinderId = 0

export type FinderFunction = (query: Query, ...any) => Query

export interface Finder {
  (...args: any[]): string
  [finderIdProperty]: string
  [finderFunctionProperty]: FinderFunction
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

export function createFinder (css: string): any;
export function createFinder (finderFunction: FinderFunction): any;

export function createFinder (cssOrFinder: any): any {
  const id = lastFinderId++

  const finderFunction = typeof cssOrFinder == 'string'
    ? q => q.findCss(cssOrFinder)
    : cssOrFinder

  const finder = function (...args) {
    return JSON.stringify({
      id,
      args
    }, replacer)
  }

  finder.toString = function () { return JSON.stringify({id, args: []}) }
  finder[finderIdProperty] = id
  finder[finderFunctionProperty] = finderFunction

  finders[id] = finder

  return finder
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

export function parseFinder(finderString) {
  if (finderString[0] === '{') {
    const {id, args} = JSON.parse(finderString, reviver)
    const finder = finders[id]
    return {
      finder,
      args
    }
  }
}

export function callFinder(finder: Finder, query: Query, ...args: any[]) {
  return finder[finderFunctionProperty](query, ...args)
}
