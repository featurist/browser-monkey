import { Query } from './Query'
import { createMultiMatcher } from './MultiMatcher'
import * as fieldDefinitions from './fieldDefinitions'

export const Field = createMultiMatcher([
  fieldDefinitions.label((query: Query) => query.inputSelector()),
  fieldDefinitions.labelFor,
  fieldDefinitions.ariaLabel,
  fieldDefinitions.ariaLabelledBy,
  fieldDefinitions.placeholder,
])
