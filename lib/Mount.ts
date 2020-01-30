import {Query} from './Query'

export default class Mount {
  private _mountDiv: HTMLElement

  public mountDiv (): HTMLElement {
    if (!this._mountDiv) {
      this._mountDiv = window.document.createElement('div')
      window.document.body.appendChild(this._mountDiv)
    }

    return this._mountDiv
  }

  public mount (query: Query): Query {
    return query.scope(this._mountDiv)
  }

  public unmount (): void {
    if (this._mountDiv) {
      this._mountDiv.parentNode.removeChild(this._mountDiv)
    }
  }
}

