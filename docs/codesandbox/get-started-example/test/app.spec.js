import { Mount, Query } from "browser-monkey";
import hyperdom from "hyperdom";
import App from "../src/app";

describe("Browser-monkey", function () {
  let mount, page;

  beforeEach(function () {
    if (mount) {
      mount.unmount()
    }
    mount = new Mount({ className: 'test-mount' });
    hyperdom.append(mount.containerElement(), new App());
    page = new Query().mount(mount);
  });

  it("finds text", async function () {
    await page.find("h1").containing("Hello, Lubbers!").shouldExist();
  });

  it("fills an input", async function () {
    await page.set({
      'Field("Name a beer")': "punk ipa"
    });
  });

  it("clicks a button", async function () {
    await page.clickButton("Get It");
  });

  it("finds text, eventually rendered by an ajax call", async function () {
    await page.set({
      'Field("Name a beer")': "punk ipa"
    });
    await page.clickButton("Get It");
    await page.containing(/Punk IPA 2010 - Current/).shouldExist();
  });
});

// This is a codesandbox specific hack - don't copy this line
// eslint-disable-next-line
mocha.run();
