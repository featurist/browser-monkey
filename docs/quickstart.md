# Quick start

Let's craete a tiny React project and test it with Browser Monkey.

```bash
yarn add react react-dom
yarn add browser-monkey --dev
```

Now create a test file: `test/appSpec.js`.
For simplicity we will create our react application in the test file.

```js
const {Query} = require('browser-monkey')
const {default: ReactMount} = require('browser-monkey/ReactMount')
const React = require('react')

class App extends React.Component {
  render () {
    return React.createElement('div', {className: 'greeting'}, 'Hello World')
  }
}

describe('greeting', () => {
  it('renders a greeting', async () => {
    const mount = new ReactMount(React.createElement(App, {}, null))
    const page = new Query().mount(mount)

    await page.find('.greeting').containing('Hello World').shouldExist()
  })
})
```

You will need a browser environment to run your tests in. For general feature development we recommend using [electron](#electron) - it does not require any javascript bundling and so your tests will run faster. For testing across different browser environments you can use something like [karma](#karma).

## Electron

```bash
yarn add electron electron-mocha --dev
```

Now you can run the test using `electron-mocha`, the `--renderer` flag tells electron to run the test in it's built in browser, the `--interactive` flag makes the browser visible so that you can debug or inspect the test

```bash
yarn electron-mocha test/**/*Spec.js --renderer --interactive
```

[Clone this example](https://github.com/featurist/browser-monkey3-electron-mocha/)

## Karma

```bash
yarn add karma karma-mocha karma-chrome-launcher karma-webpack webpack --dev
```

Create a karma config file `karma.conf.js`

```js
module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],
    files: [
      'test/**/*Spec.js',
    ],
    preprocessors: {
      'test/**/*Spec.js': ['webpack']
    },
    webpack: {},
    reporters: ['progress'],
    port: 9876,
    colors: true,
    browsers: ['Chrome']
  })
}
```

Now you can run the testing using `yarn karma start`

[Clone this example](https://github.com/featurist/browser-monkey3-karma/)
