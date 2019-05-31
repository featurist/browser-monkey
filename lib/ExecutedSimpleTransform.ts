import { ExecutedTransform } from './ExecutedTransform'

export class ExecutedSimpleTransform extends ExecutedTransform {
  public description: string

  public constructor (value: any, description = '') {
    super(value)
    this.description = description
  }

  public renderError (): string {
    return `${this.description} [${this.value.length}]`
  }
}
