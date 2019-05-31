import { ExecutedTransform } from './ExecutedTransform'
import BrowserMonkeyAssertionError from './BrowserMonkeyAssertionError'

export class ExecutedTransformError extends ExecutedTransform {
  public exception: BrowserMonkeyAssertionError

  public constructor (exception: BrowserMonkeyAssertionError) {
    super([])
    this.exception = exception
  }

  public renderError (): string {
    return this.exception.renderError()
  }
}
