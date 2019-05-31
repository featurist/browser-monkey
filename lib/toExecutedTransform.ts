import { ExecutedTransform } from './ExecutedTransform'
import { ExecutedSimpleTransform } from './ExecutedSimpleTransform'

export default function toExecutedTransform (value: any): ExecutedTransform {
  if (value instanceof ExecutedTransform) {
    return value
  } else {
    return new ExecutedSimpleTransform(value)
  }
}
