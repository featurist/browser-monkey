import { ExecutedTransform } from './ExecutedTransform'

export class ExecutedTransformPath extends ExecutedTransform {
  public transforms: ExecutedTransform[]

  public constructor (value: any) {
    super(value)
    this.transforms = []
  }

  public addTransform (transform: ExecutedTransform): void {
    this.value = transform.value
    this.transforms.push(transform)
  }

  public addTransforms (transforms: ExecutedTransform[]): void {
    this.value = transforms[transforms.length - 1].value
    this.transforms.push(...transforms)
  }

  public prepend (transforms: ExecutedTransformPath): void {
    this.value = transforms.value
    this.transforms.unshift(...transforms.transforms)
  }

  public clear (): void {
    this.transforms = []
  }

  public renderError (): string {
    const errors = this.transforms.map(t => t.renderError()).filter(Boolean).join(', ')
    if (this.transforms.length > 1) {
      return `path(${errors})`
    } else {
      return errors
    }
  }

  public clone (): ExecutedTransformPath {
    const e = new ExecutedTransformPath(this.value)
    e.transforms = this.transforms.slice()
    return e
  }
}
