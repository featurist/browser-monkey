import { html as h } from "hyperdom";

export default class App {
  async getBeerInfo() {
    delete this.beer;
    const response = await fetch("https://api.punkapi.com/v2/beers/192");
    this.beer = await response.json();
  }

  render() {
    return h("main", [
      h("h1", "Hello Lubbers"),
      h("button", { onclick: () => this.getBeerInfo() }, "Beer"),
      this.beer
        ? h("div", [
            h("div", this.beer[0].name),
            h("img", { src: this.beer[0].image_url, width: 100 })
          ])
        : undefined
    ]);
  }
}
