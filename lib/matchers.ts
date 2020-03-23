import {match} from './match'
import BrowserMonkeyAssertionError from './BrowserMonkeyAssertionError'

export function elementAttributes (expected): (Query) => void {
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
