import {match} from './match'
import BrowserMonkeyAssertionError from './BrowserMonkeyAssertionError'
import { Query } from './Query'

export function elementAttributes (expected): (query: Query) => void {
  return query => {
    const element = query.elementResult()
    const {isMatch, actual} = match(element, expected)

    if (!isMatch) {
      throw new BrowserMonkeyAssertionError('attributes did not match', {
        actual,
        expected,
      })
    }
  }
}
