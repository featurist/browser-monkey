import Mount from './Mount'
import ReactDOM from 'react-dom'

export default class ReactMount extends Mount {
  public constructor (vdom: any) {
    super()
    const div = this.containerElement()

    ReactDOM.render(vdom, div)
  }
}
