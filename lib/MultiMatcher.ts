import { Matcher, createMatcher, Finder } from './Matcher'
import { Query } from './Query'

type NamedFinder = {
  name: string,
  finder: Finder
}

export interface MultiMatcher extends Matcher {
  addFinder(name: string | Finder, finder?: Finder)
  removeFinder(name: string)
  resetFinders()
  clone(name?: string): MultiMatcher
  finders: NamedFinder[]
}

export function createMultiMatcher(initialFinders?: NamedFinder[]): MultiMatcher {
  const finders = initialFinders.slice()

  const matcher = createMatcher((query: Query, ...args: any[]) => {
    return query.concat(finders.map(({finder}) => {
      return (q: Query): Query => {
        return finder(q, ...args)
      }
    }))
  }) as MultiMatcher

  matcher.addFinder = function (name: string | Finder, finder?: Finder) {
    if (!finder) {
      finder = name as Finder
      name = undefined
    }

    finders.push({
      name: name as string,
      finder
    })
  }

  matcher.removeFinder = function (name: string) {
    const index = finders.findIndex(def => def.name === name)
    if (index >= 0) {
      finders.splice(index, 1)
    } else {
      throw new Error(`finder ${JSON.stringify(name)} doesn't exist`)
    }
  }

  matcher.clone = function (): MultiMatcher {
    return createMultiMatcher(finders)
  }

  matcher.finders = finders

  return matcher
}
