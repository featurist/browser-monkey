# browser monkey

Reliable DOM testing

```bash
npm install browser-monkey
```

# example

```js
var browser = require('browser-monkey');

describe('admin page', function () {
  it('has users', function () {
    ...
    return browser.find('.user-name', {text: 'Bob'}).exists();
  });
});
```
