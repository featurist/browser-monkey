# Browser Monkey
## What it is

Browser Monkey is a DOM assertion library. It helps you write framework agnostic browser tests that are reliable in the face of asynchronous behaviours like animations, AJAX and delayed rendering. It also helps you to write tests that exhibit the semantic meaning of the page, as opposed to a jumble of CSS selectors.

## Features

 - automatically waits for commands and assertions.
 - create rich DSLs for your page structure.
 - framework agnostic: works with React, Angular, jQuery, [Hyperdom](https://github.com/featurist/hyperdom) and many many more.
 - can simulate text entry and clicks.
 - returns promises that resolve when the elements are found.

## Examples

```js
import createMonkey from "browser-monkey/create";
import createTestDiv from "browser-monkey/lib/createTestDiv";
import hyperdom from "hyperdom";
import App from "./app";

describe("beer app", () => {
  let page;

  beforeEach(() => {
    const $testContainer = createTestDiv();
    hyperdom.append($testContainer, new App());
    page = createMonkey($testContainer);
  });

  it("greets me", async () => {
    await page.find("h1").shouldHave({ text: "Hello Lubbers" });
  });

  it("shows me beer", async () => {
    await page.click("Beer");
    await page.shouldHave({ text: "Punk IPA" });
  });
});
```

<iframe src="https://codesandbox.io/embed/2x8kv8voyn?fontsize=14&previewwindow=tests" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>
