# browser monkey [![npm version](https://img.shields.io/npm/v/browser-monkey.svg)](https://www.npmjs.com/package/browser-monkey) [![npm](https://img.shields.io/npm/dm/browser-monkey.svg)](https://www.npmjs.com/package/browser-monkey) [![CircleCI](https://circleci.com/gh/featurist/browser-monkey.svg?style=svg)](https://circleci.com/gh/featurist/browser-monkey) [![Gitter chat](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/featurist/stack)

Reliable DOM testing

```bash
npm install browser-monkey
```

Browser Monkey is a DOM assertion library. It helps you write framework agnostic browser tests that are reliable in the face of asynchronous behaviours like animations, AJAX and delayed rendering. It also helps you to write tests that exhibit the semantic meaning of the page, as opposed to a jumble of CSS selectors.

* automatically waits for commands and assertions.
* create rich DSLs for your page structure.
* framework agnostic: works with React, Angular, jQuery, [Hyperdom](https://github.com/featurist/hyperdom) and many many more.
* can simulate text entry and clicks.
* returns promises that resolve when the elements are found.

Here is an [example project](https://github.com/dereke/web-testing) that demonstrates how to use browser-monkey with Karma.

[@dereke](https://github.com/dereke) has made an excellent [video](https://www.youtube.com/watch?v=WQZ2eIfmfEs) of a TDD session using browser-monkey.

# Docs
[Docs Website](https://browsermonkey.org)

# example

```js codesandbox: basic-example
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
<a href="https://codesandbox.io/api/v1/sandboxes/define?parameters=N4IgZglgNgpgziAXKADgQwMYGs0HMYB0AVnAPYB2SoGFALjObUiMADrkAEHrI5aAtjB6JuIAEYAnUgHc4MCQFp-FLDACeCmAA8BKWDwA07LjwBu8uBArDRARgIAGR4eOiAJvAwSIKWlfI2PABCUrLyHACyKuocYmiWGBwArnB4MBzauvogRpyi_GgQAUiiRR5aBAAWtPxQLnk8cF4-tHA2bHkmIHC0aBK0gSDoEhgwUBxl2lU14woKpCgM9VxdYknQboPDo-NrGxPk5dO1PK4AvrldHouHDBgQ8O2uq6FyisrkqmqDUGj0PcsVjxKmpFhI3KR-D8_vABiBzpd3DBTAARGA3Dzke6PEodFaibZjBRrQ6wCTQ_5w87sM7sEAXbojAD0aBQKAIcEWGGICGQIBojAYTEQIAg_BQpH6HC8MBhUU-MTAUn4okkMjeSmiaiZMphPAA3OwxRKpbr6AAVWEoiCmDhKyGq17yTUK7VQCBiHUSWUWq02g1G8WS2gcEFgiEq-0q4Gg-QRgPkY3BjgAQTZduVogILLZCfYHia3jEMAAFDxi-FWShDBwSwBKDgAXgAfBw8RxYCH0PhDQE8sWwJKYABRTCVEv1put9tcAU9DgAEkpAGE6IVyOFG9LvTDLT1raZ6738WG45CCFWGG4S0vYavGOv5AYOBvpKm2fW68eVt30luzTA8pfDeK5rkU8hfuckF9lwEC0GWIC4N6MCtBwgg1vEahYrWDYtm2zwcGg0iFF2aQEJAhwIZUtg8HWHKVKQSRQG4AASaDmCWwAcPQWi0CIPAsWMUCkBwAAySRiMWEhtCAHBnNBXDyb2rhwQhcAMbIaHpBW5I5IRcBYYkk54TOhHEXBHC_gQGDutgCFBDA8i0d-XBESRllkepjHMWxHFcTxfGiAACkknwcAAkkFKY8HJCmxb2Sn0gYjIYDm7IkFQ_J0EKzBJlKXHVLU-mhnJGYOjG4aQnmG5aCaIYeGAaBMSGNnxHA74oPheSYdh-C0A58jheQg6TqZHiduktCVBAcAEDpLnShQ87epyS1_mZ7lgChGDjsCtC0CgcCIEyOYQAQKChTgKBnTQ_BMqYABMTI6XATK2AAnA9zkEVNM1zY5EhNhtFkrRK5ByDyFBHtSMEcN6twSKNBHerQSQSJwu0gAURQ1gA2gRXCY9RNYCUJIniZJFi0YiJ4IWs-3WHpXEUDZEDYCIxmtr9s19QNEhDSNDYXKIfPUwT3HTbNOni1wAD8oYIW4_p6fjnT4urmNK6YNbc_98i4w4AC6BB8IIdY0-rtM8GKuA1lxcAjCIus6QbxtimkAD6aNQM-0gQG4U0iLYDgOLFMsrIbdbhyIoUNeBmxq5H360uQKdJSlTKTBUGV8gK9CMLlQb5YRbJXqVUaiKe4JVSAvZ5SGaadRXPDZlW1UnZelEQhgSSCIwBAAI5JPIagAMpjDAGC0JKCEAMRtyA5svjAb6N5-vbp1nxxQJlec5SKAA8ACEKIAPLLuaACaQXDqGMzNuwB-FVAD99k_spuK_rC0Affi0LAzYgp9B2BwUeaBDhiFIFoA-TI_4APYN_A-ghejSkqH0OQtBGw8AAKrmgAGIKAABwxSZK_GBlQP5f3IAfSBbg1Bfx_lrCYbgsEgAXs2GBWsqGIMLC0DgDsMCsIEZnW42cZIMJgbw3wZDnqkDoVQ8h996RnDOEAA&query=module%3D%2Fsrc%2Fapp.spec.js" target="_blank" rel="noopener noreferrer">Run this example</a>


## We're hiring!

Join our remote team and help us build amazing software. Check out [our career opportunities](https://www.featurist.co.uk/careers/).
