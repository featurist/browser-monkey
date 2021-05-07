import { createMatcher } from './Matcher'
import { Query } from './Query'

export const Css = createMatcher((q: Query, css: string) => q.findCss(css))
