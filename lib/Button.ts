import { createMultiMatcher } from './MultiMatcher'
import * as fieldDefinitions from './fieldDefinitions'
import inputSelectors from './inputSelectors'

export const Button = createMultiMatcher([
  fieldDefinitions.button,
  fieldDefinitions.label(() => inputSelectors.canBeClicked),
  fieldDefinitions.labelFor,
  fieldDefinitions.ariaLabel,
  fieldDefinitions.ariaLabelledBy,
])
