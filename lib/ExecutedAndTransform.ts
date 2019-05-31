import { ExecutedTransform } from './ExecutedTransform'

export class ExecutedAndTransform extends ExecutedTransform {
  public items: ExecutedTransform[]

  public constructor (value: any, items: ExecutedTransform[]) {
    super(value)
    this.items = items
  }

  public renderError (): string {
    return `and(${this.items.map(i => i.renderError()).join(', ')}) [${this.value.length}]`
  }
}
