import _debug from 'debug'
import Mount from './Mount'
import hobostyle from 'hobostyle'
import { iframeResizer } from 'iframe-resizer'
import {Query} from '../lib/Query'

const styles = `
.browser-monkey-browser {
  padding: 13px;
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.browser-monkey-address-bar-text {
  border-radius: 10px;
  background-color: white;
}

.browser-monkey-address-bar {
  padding: 5px;
  background-color: grey;
}

.browser-monkey-iframe {
  width: 100%;
  height: 100%;
}
`

const debug = _debug('browser-monkey:iframe')

export default class IFrameMount extends Mount {
  url: string
  resize: boolean
  _iframe: HTMLIFrameElement

  constructor (url: string, {resize = false} = {}) {
    super()

    this.url = url
    this.resize = resize

    debug('Mounting iframe: ' + this.url)

    const div = this.containerElement()
    div.className = 'browser-monkey-browser'

    div.innerHTML = `
      <div class="browser-monkey-address-bar">
        <button class="browser-monkey-back-button">&lt;</button>
        <button class="browser-monkey-forward-button">&gt;</button>
        <div class="browser-monkey-address-bar-text"></div>
      </div>
      <iframe class="browser-monkey-iframe"></iframe>
    `

    const forwardButton = div.querySelector('.browser-monkey-forward-button') as HTMLElement
    const backButton = div.querySelector('.browser-monkey-back-button') as HTMLElement
    const addressBarText = div.querySelector('.browser-monkey-address-bar-text') as HTMLElement
    addressBarText.innerText = this.url
    const iframe = div.querySelector('.browser-monkey-iframe') as HTMLIFrameElement

    forwardButton.addEventListener('click', () => {
      iframe.contentWindow.history.forward()
    })

    backButton.addEventListener('click', () => {
      iframe.contentWindow.history.back()
    })

    iframe.src = this.url
    iframe.addEventListener('load', () => {
      addressBarText.innerText = iframe.contentWindow.location.href

      if (this.resize) {
        const script = iframe.contentDocument.createElement('script')
        script.src = 'file://' + __dirname + '/node_modules/iframe-resizer/js/iframeResizer.contentWindow.min.js'
        iframe.contentDocument.head.appendChild(script)
      }
    })

    if (this.resize) {
      iframeResizer({ log: true, checkOrigin: false }, iframe)
    }

    hobostyle.style(styles.toString())

    this._iframe = iframe
  }

  iframe () {
    return this._iframe
  }

  mount (query: Query): Query {
    query.setInput(this._iframe)
    return query.iframe()
  }
}
