export default async function retry<T>(fn: () => T, {interval = 10, timeout = 1000} = {}): Promise<T> {
  const startTime = Date.now()
  let firstTry = true

  for (;;) {
    try {
      return fn()
    } catch (e) {
      if (Date.now() > startTime + timeout) {
        throw e
      } else {
        await new Promise(resolve => setTimeout(resolve, firstTry ? 0 : interval))
        firstTry = false
      }
    }
  }
}
