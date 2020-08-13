import * as hyperdom from 'hyperdom'

export default class WebApp extends hyperdom.RenderComponent {
  private message = 'default'

  hello () {
    this.message = 'hello browser-monkey'
  }

  render () {
    return <div>
      <button onclick={() => this.hello()}>press me</button>
      <input type="text" binding={[this, 'message']}/>
      <div class='message'>{this.message}</div>
    </div>
  }
}
