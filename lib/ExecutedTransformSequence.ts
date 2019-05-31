import { ExecutedTransform } from './ExecutedTransform'

export class ExecutedTransformSequence extends ExecutedTransform {
  public transforms: ExecutedTransform[]

  public constructor (value: any) {
    super(value)
    this.transforms = []
  }

  public addTransform (transform: ExecutedTransform): void {
    this.value = transform.value
    this.transforms.push(transform)
  }

  public prepend (transforms: ExecutedTransformSequence): void {
    this.value = transforms.value
    this.transforms.unshift(...transforms.transforms)
  }

  public renderError (): string {
    return this.transforms.map(t => t.renderError()).join(', ')
  }

  public clone (): ExecutedTransformSequence {
    const e = new ExecutedTransformSequence(this.value)
    e.transforms = this.transforms.slice()
    return e
  }
}
