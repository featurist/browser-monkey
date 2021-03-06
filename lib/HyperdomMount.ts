import Mount from './Mount'
import hyperdom from 'hyperdom'
import {extend} from 'lowscore'

export default class HyperdomMount extends Mount {
  constructor (app: any, options?) {
    super()
    if (options && options.router) {
      options.router.reset()
    }

    const testDiv = this.containerElement()
    if (options && (options.hash || options.url) && options.router) {
      options.router.push(options.url || options.hash)
    }
    hyperdom.append(testDiv, app, extend({ requestRender: setTimeout }, options))
  }
}
