import { Query } from './Query'
import { createMultiFinder } from './MultiFinder'
import * as fieldDefinitions from './fieldDefinitions'

export const Field = createMultiFinder([
  fieldDefinitions.label((query: Query) => query.inputSelector()),
  fieldDefinitions.labelFor,
  fieldDefinitions.ariaLabel,
  fieldDefinitions.ariaLabelledBy,
  fieldDefinitions.placeholder,
])
