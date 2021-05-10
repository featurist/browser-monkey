import { createFinder } from './Finder'
import { Query } from './Query'

export const Css = createFinder((q: Query, css: string) => q.findCss(css))
