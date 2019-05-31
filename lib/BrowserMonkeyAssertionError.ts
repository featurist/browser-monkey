import { ExecutedTransformSequence } from './ExecutedTransformSequence'

class BrowserMonkeyAssertionError extends Error {
  private description: string
  public showDiff: boolean
  public expected: any
  public actual: any
  public executedTransforms: ExecutedTransformSequence

  public constructor (message, {
    expected = undefined,
    actual = undefined,
    executedTransforms = new ExecutedTransformSequence(undefined)
  } = {}) {
    super(message)
    this.description = message
    this.showDiff = true
    this.expected = expected
    this.actual = actual
    this.executedTransforms = executedTransforms

    Object.setPrototypeOf(this, BrowserMonkeyAssertionError.prototype)
  }

  public rewriteMessage (): void {
    this.message = this.renderError()
  }

  public renderError (): string {
    return `${this.description} (found: ${this.executedTransforms.renderError()})`
  }
}

export default BrowserMonkeyAssertionError
