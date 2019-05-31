export class ExecutedTransform {
  public value: any

  public constructor (value: any) {
    this.value = value
  }

  public renderError (): string {
    throw new Error()
  }

  public print (): void {
    throw new Error()
  }
}
