import { Query } from './Query'
import { match } from './match'
import { withPlaceholders } from './inputSelectors'
import * as matchers from './matchers'

export const button = {
  name: 'button',
  definition: (query: Query, name) => {
    return query.findCss('button, input[type=button], input[type=submit], input[type=reset], a').containing(name)
  }
}

export const label = inputSelector => ({
  name: 'label',
  definition: (query: Query, name) => {
    return query.find('label').containing(name).find(inputSelector(query))
  },
})

export const labelFor = {
  name: 'label-for',
  definition: (query: Query, name) => {
    return query.find('label[for]').containing(name).map(label => {
      const id = label.getAttribute('for')
      return label.ownerDocument.getElementById(id)
    }, 'for attribute').filter(Boolean)
  },
}

export const ariaLabel = {
  name: 'aria-label',
  definition: (query: Query, name) => {
    return query.find('[aria-label]').filter(element => {
      const label = element.getAttribute('aria-label')
      return match(label, name).isMatch
    }, 'aria-label')
  },
}

export const ariaLabelledBy = {
  name: 'aria-labelledby',
  definition: (query: Query, name) => {
    return query.find('[aria-labelledby]').filter(element => {
      const id = element.getAttribute('aria-labelledby')
      const labelElement = element.ownerDocument.getElementById(id)
      if (labelElement) {
        return match(query.dom().elementInnerText(labelElement), name).isMatch
      }
    }, 'aria-label')
  },
}

export const placeholder = {
  name: 'placeholder',
  definition: (query: Query, name) => {
    return query.find(withPlaceholders).containing(matchers.elementAttributes({
      placeholder: name,
    }))
  },
}
