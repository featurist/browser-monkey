import {Query} from './Query'

export default class Mount {
  private _mountDiv: HTMLElement
  private className: string
  private parentNode: HTMLElement

  constructor ({className = undefined, parentNode = window.document.body} = {}) {
    this.className = className
    this.parentNode = parentNode
    this.containerElement()
  }

  public containerElement (): HTMLElement {
    if (!this._mountDiv) {
      this._mountDiv = window.document.createElement('div')
      if (this.className) {
        this._mountDiv.className = this.className
      }
      this.parentNode.appendChild(this._mountDiv)
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

