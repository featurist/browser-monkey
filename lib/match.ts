import object from 'lowscore/object'

// TODO: get rid of `any`
export function match (actual: any, expected: any): {isMatch: boolean, actual: any, expected: any} {
  if (typeof expected === 'function') {
    try {
      expected(actual)
      return {
        isMatch: true,
        actual,
        expected: actual,
      }
    } catch (e) {
      if (e.actual && e.expected) {
        return {
          isMatch: false,
          actual: e.actual,
          expected: e.expected,
        }
      } else {
        throw e
      }
    }
  } else if (expected instanceof RegExp) {
    const isMatch = expected.test(actual)

    return {
      isMatch,
      actual,
      expected: isMatch ? actual : expected,
    }
  } else if (expected instanceof Array) {
    if (actual.length !== expected.length) {
      return {
        isMatch: false,
        actual,
        expected,
      }
    }

    const items = expected.map((expectedValue, index) => {
      const actualValue = actual[index]

      return match(actualValue, expectedValue)
    })

    return {
      isMatch: items.every(i => i.isMatch),
      actual: items.map(i => i.actual),
      expected: items.map(i => i.expected),
    }
  } else if (expected.constructor === Object) {
    let isMatch = true

    if (actual == undefined) {
      return {
        isMatch: false,
        actual,
        expected,
      }
    }

    const result = object(Object.keys(expected).map(key => {
      const expectedValue = expected[key]
      const actualValue = actual[key]

      const m = match(actualValue, expectedValue)
      if (!m.isMatch) {
        isMatch = false
      }

      return [key, m.actual]
    }))

    return {
      isMatch,
      actual: result,
      expected,
    }
  }

  return {
    isMatch: actual === expected,
    actual,
    expected,
  }
}
