import { ExecutedTransform } from './ExecutedTransform'

export class ExecutedContainingTransform extends ExecutedTransform {
  public model: any
  public failingActuals: any[]

  public constructor (value: any, model: any, failingActuals: any[]) {
    super(value)
    this.model = model
    this.failingActuals = failingActuals
  }

  public renderError (): string {
    return `containing(${this.failingActuals ? JSON.stringify({expected: this.model, actual: this.failingActuals}) : ''}) [${this.value.length}]`
  }
}
