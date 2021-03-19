// Uncomment when running project locally
// import 'regenerator-runtime/runtime'
import { Mount, Query } from "browser-monkey"
import hyperdom from "hyperdom"
import App from "../src/app"

describe("Browser-monkey", function () {
  let mount, page

  beforeEach(function () {
    if (mount) mount.unmount()

    // Create test DOM container
    mount = new Mount({ className: 'test-mount' })

    // Mount your SPA into the DOM as you would normally.
    // E.g. for react: `ReactDOM.render(React.createElement(SomeApp), mount.containerElement()))`
    hyperdom.append(mount.containerElement(), new App())

    // Set browser-monkey query scope to the test container
    page = new Query().mount(mount)
  })

  it("finds text", async function () {
    await page.find("h1").shouldContain("Hello, Lubbers!")
  })

  it("fills an input", async function () {
    await page.set({
      'Field("Name a beer")': "punk ipa"
    })
  })

  it("clicks a button", async function () {
    await page.clickButton("Get It")
  })

  it("finds text, eventually rendered by an ajax call", async function () {
    // Another way to submit search form
    await page.enterText('input', ['punk ipa', '{Enter}'])
    await page.shouldContain(/Punk IPA 2010 - Current/)
  })
})

// This is a codesandbox specific hack - don't copy this line
// eslint-disable-next-line
mocha.run()
