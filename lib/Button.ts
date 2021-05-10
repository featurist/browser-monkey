import { createMultiFinder } from './MultiFinder'
import * as fieldDefinitions from './fieldDefinitions'
import inputSelectors from './inputSelectors'

export const Button = createMultiFinder([
  fieldDefinitions.button,
  fieldDefinitions.label(() => inputSelectors.canBeClicked),
  fieldDefinitions.labelFor,
  fieldDefinitions.ariaLabel,
  fieldDefinitions.ariaLabelledBy,
])
