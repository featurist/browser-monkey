import { ExecutedTransform } from './ExecutedTransform'

export default class ExecutedDetectTransform extends ExecutedTransform {
  public items: {key: string, transform: ExecutedTransform}[]

  public constructor (value: {key: string, value: any}, items: {key: string, transform: ExecutedTransform}[]) {
    super(value)
    this.items = items
  }

  public renderError (): string {
    return `detect(${this.items.map(i => `${i.key}: ${i.transform.renderError()}`).join(', ')}) [${this.value ? this.value.length : 0}]`
  }
}
