import Mount from './Mount'

export default class ReactMount extends Mount {
  public constructor (vdom: any) {
    super()
    const div = this.containerElement()

    const ReactDOM = require('react-dom')
    ReactDOM.render(vdom, div)
  }
}
