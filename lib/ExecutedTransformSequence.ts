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

  public addTransforms (transforms: ExecutedTransform[]): void {
    this.value = transforms[transforms.length - 1].value
    this.transforms.push(...transforms)
  }

  public prepend (transforms: ExecutedTransformSequence): void {
    this.value = transforms.value
    this.transforms.unshift(...transforms.transforms)
  }

  public clear (): void {
    this.transforms = []
  }

  public renderError (): string {
    const transformsUpUntilAndIncludingFirstFailure = this.transforms.reduce(({ keepTaking, array }, b) => {
      if (keepTaking) {
        return {
          keepTaking: !!b.value.length,
          array: array.concat([b])
        }
      } else {
        return { array }
      }
    }, {
      array: [],
      keepTaking: true
    }).array

    return transformsUpUntilAndIncludingFirstFailure.map(t => t.renderError()).filter(Boolean).join(', ')
  }

  public clone (): ExecutedTransformSequence {
    const e = new ExecutedTransformSequence(this.value)
    e.transforms = this.transforms.slice()
    return e
  }
}
