import { ExecutedTransform } from './ExecutedTransform'
import inspect from 'object-inspect'

export class ExecutedContainingTransform extends ExecutedTransform {
  public model: any
  public failingActuals: any[]

  public constructor (value: any, model: any, failingActuals: any[]) {
    super(value)
    this.model = model
    this.failingActuals = failingActuals
  }

  public renderError (): string {
    return `containing(${this.failingActuals ? inspect({expected: this.model, actual: this.failingActuals}) : inspect(this.model)}) [${this.value.length}]`
  }
}
