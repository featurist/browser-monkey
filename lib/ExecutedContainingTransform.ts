import { ExecutedTransform } from './ExecutedTransform'

export class ExecutedContainingTransform extends ExecutedTransform {
  public model: any

  public constructor (value: any, model: any) {
    super(value)
    this.model = model
  }

  public renderError (): string {
    return `containing(${this.model ? '...' + this.model.renderError() : ''}) [${this.value.length}]`
  }
}
