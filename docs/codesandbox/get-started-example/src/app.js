import { html as h } from "hyperdom"

export default class App {
  async getBeerInfo() {
    delete this.beer
    const response = await fetch(
      `https://api.punkapi.com/v2/beers?beer_name=${this.query || "sunk"}`
    )
    this.beer = await response.json()
  }

  onsubmit(e) {
    e.preventDefault()
    return this.getBeerInfo()
  }

  render() {
    return h("main", [
      h("h1", "Hello, Lubbers!"),
      h("form", { onsubmit: e => this.onsubmit(e) },
        [
          h("label", [
            "Name a beer",
            h("br"),
            h("input", { binding: [this, "query"] })
          ]),
          h("button", {type: 'submit'}, "Get It")
        ]
      ),
      this.beer
        ? h("div", [
            h("div", this.beer[0].name),
            h("img", { src: this.beer[0].image_url, width: 100 })
          ])
        : undefined
    ])
  }
}
