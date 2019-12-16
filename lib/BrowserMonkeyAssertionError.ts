import { ExecutedTransform } from './ExecutedTransform'
import { ExecutedTransformPath } from './ExecutedTransformPath'

class BrowserMonkeyAssertionError extends Error {
  private description: string
  public showDiff: boolean
  public expected: any
  public actual: any
  public executedTransforms: ExecutedTransformPath

  public constructor (message, {
    expected = undefined,
    actual = undefined,
    executedTransforms = new ExecutedTransformPath(undefined)
  } = {}) {
    super(message)
    this.description = message
    this.showDiff = true
    this.expected = expected
    this.actual = actual
    this.executedTransforms = executedTransforms

    Object.setPrototypeOf(this, BrowserMonkeyAssertionError.prototype)
    this.message = this.renderError()
  }

  public rewriteMessage (): void {
    this.message = this.renderError()
  }

  public addExecutedTransform (executedTransform: ExecutedTransform): void {
    this.executedTransforms.addTransform(executedTransform)
    this.rewriteMessage()
  }

  public prependExecutedTransforms (executedTransforms: ExecutedTransformPath): void {
    this.executedTransforms.prepend(executedTransforms)
    this.rewriteMessage()
  }

  public renderError (): string {
    return `${this.description}${this.executedTransforms.transforms.length ? ` (found: ${this.executedTransforms.renderError()})`: ''}`
  }
}

export default BrowserMonkeyAssertionError
