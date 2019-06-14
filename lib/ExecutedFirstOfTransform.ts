import { ExecutedTransform } from './ExecutedTransform'

export class ExecutedFirstOfTransform extends ExecutedTransform {
  public items: ExecutedTransform[]
  public index: number

  public constructor (value: any, index: number, items: ExecutedTransform[]) {
    super(value)
    this.index = index
    this.items = items
  }

  public renderError (): string {
    return `firstOf(${this.items.map(i => i.renderError()).join(', ')}) [${this.value.length}]`
  }
}
