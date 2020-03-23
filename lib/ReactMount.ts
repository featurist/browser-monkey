const ReactDOM = require('react-dom')
import Mount from './Mount'

export default class ReactMount extends Mount {
  public constructor (vdom: React.ReactNode) {
    super()
    const div = this.containerElement()

    ReactDOM.render(vdom, div)
  }
}
