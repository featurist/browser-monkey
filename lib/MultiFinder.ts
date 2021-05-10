import { Finder, createFinder, FinderFunction } from './Finder'
import { Query } from './Query'

type NamedFinder = {
  name: string,
  finder: FinderFunction
}

export interface MultiFinder extends Finder {
  addFinder(name: string | FinderFunction, finder?: FinderFunction)
  removeFinder(name: string)
  resetFinders()
  clone(name?: string): MultiFinder
  finders: NamedFinder[]
}

export function createMultiFinder(initialFinders?: NamedFinder[]): MultiFinder {
  const finders = initialFinders.slice()

  const finder = createFinder((query: Query, ...args: any[]) => {
    return query.concat(finders.map(({finder}) => {
      return (q: Query): Query => {
        return finder(q, ...args)
      }
    }))
  }) as MultiFinder

  finder.addFinder = function (name: string | FinderFunction, finder?: FinderFunction) {
    if (!finder) {
      finder = name as FinderFunction
      name = undefined
    }

    finders.push({
      name: name as string,
      finder
    })
  }

  finder.removeFinder = function (name: string) {
    const index = finders.findIndex(def => def.name === name)
    if (index >= 0) {
      finders.splice(index, 1)
    } else {
      throw new Error(`finder ${JSON.stringify(name)} doesn't exist`)
    }
  }

  finder.clone = function (): MultiFinder {
    return createMultiFinder(finders)
  }

  finder.finders = finders

  return finder
}
