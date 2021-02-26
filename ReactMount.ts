import ReactDOM from 'react-dom'
import Mount from './lib/Mount'

export default class ReactMount extends Mount {
  public constructor (vdom: any) {
    super()
    const div = this.containerElement()

    ReactDOM.render(vdom, div)
  }
}
