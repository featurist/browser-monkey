# browser monkey

Reliable DOM testing

```bash
npm install browser-monkey
```

Browser Monkey is a DOM assertion library. It helps you write framework agnostic browser tests that are reliable in the face of asynchronous behaviours like animations, AJAX and delayed rendering. It also helps you to write tests that exhibit the semantic meaning of the page, as opposed to a jumble of CSS selectors.

* timing resistant
* create rich DSLs for your page structure
* framework agnostic: works with React, Angular, jQuery, [Plastiq](https://github.com/featurist/plastiq) and many many more.
* can simulate text entry and clicks. (please let us know if you need more!)
* returns promises that resolve when the elements are found.

# example

```js
describe('admin', function () {
  // describes the admin panel, with a search box, results and a user editor
  var adminPanel = browser.extend({
    searchUsers: function () {
      return this.find('.search');
    },
    userResult: function (name) {
      // find a user in the results by their name
      return this.find('.results .user', {text: name});
    }
    userEditor: function () {
      // return the user editor, scoped to the .user-editor div.
      return userEditor.scope(this.find('.user-editor'));
    }
  });

  // describes the user editor, with inputs for name and email, and a save button.
  var userEditor = browser.extend({
    name: function () { this.find('.name'); },
    email: function () { this.find('.email'); },
    save: function () { this.find('.save'); },
  });

  it('can search for, edit and save a user', function () {
    return adminPanel.searchUsers().typeIn('bar').then(function () {
      return adminPanel.userResult('Barry').click();
    }).then(function () {
      var userEditor = adminPanel.userEditor();
      return Promise.all([
        userEditor.name().typeIn('Barry Jones'),
        userEditor.email().typeIn('barryjones@example.com')
      ]).then(function () {
        return userEditor.save().click();
      });
    }).then(function () {
      // verify that the user was saved
      // use mockjax-router!
    });
  });
});
```

# debug

Browser monkey will explain what it is doing using [`debug`](https://github.com/visionmedia/debug). It can be extremely useful to see which buttons were clicked, or which text boxes were typed-in. To turn on, follow the [guide](https://github.com/visionmedia/debug#browser-support), or in short:

Put this into your test

```js
window._debug = require('debug');
```

Then type this into your browser console and refresh:

```js
_debug.enable('*');
```

Or to be more specific:


```js
_debug.enable('browser-monkey');
```

# api

The API is made up of three concepts: scopes, actions and assertions.

* scopes are chains of queries, such as `find(css)` and `containing(css)`, that progressively narrow the scope of elements to be searched for. These queries return new scopes.
* actions such as `click()` and `typeIn(text)` wait for the scope to be found before simulating a UI event. These return promises that resolve when the event has been dispatched.
* assertions such as `shouldExist()` and `shouldHave(properties)` can be made on scopes to ensure that they exist or contain text, classes or other properties.

All scope chains are immutable, so you can reuse portions of a scope chain to build new chains:

```js
var details = browser.find('.details'); // finds .details
var name = details.find('.name');       // finds .details .name
var email = details.find('.email');     // finds .details .email
...
```

The API starts with the browser scope, which contains everything on the page.

You can also create DSLs for components on the page using `scope.extend(methods)`. By extending a scope, you can add methods that represent elements of the component at a higher level than mere CSS selectors. It's probably worth noting that these methods should normally just return scopes and not perform actions or assertions.

## find

```js
var innerScope = scope.find(css, [options]);
```

Returns a new scope that matches `css`.

* `css` - css to find in the scope
* `options.text` - text to find in the scope.

## is

```js
var scope = scope.is(css);
```

Returns a new scope that ensures that the element found matches the CSS. For example, `scope.find('li').is('.enabled')` ensures that the `<li>` has the class `enabled`.

* `css` - css to match against the scope

## containing

```js
var scope = scope.containing(css, [options]);
```

Ensures that the scope contains the `css` and `options.text`, the scope returned still refers to the outer scope. This is useful, for example, in finding list items that contain certain elements, but still referring to the list items.

* `css` - css to find in the scope
* `options.text` - text to find in the scope.

For example, find the `li` that contains the `h2` with the text `Second`, and click the link in the `li`.

```html
<ul>
	<li>
		<h2>First</h2>
        <a href="first">link</a>
	</li>
	<li>
		<h2>Second</h2>
        <a href="second">link</a>
	</li>
	<li>
		<h2>Third</h2>
        <a href="third">link</a>
	</li>
</ul>
```

```js
browser.find('ul li').containing('h2', {text: 'Second'}).find('a').click();
```

## filter

```js
var scope = scope.filter(filter);
```

* `filter(element)` a function that takes a DOM element, and returns either truthy or falsey. If truthy, then the element will be considered as part of the scope, if falsey then it won't.

## component

Represents a component on the page, with methods to access certain elements of the component.

```js
var componentScope = scope.component(methods);
```

* `methods` - an object containing functions for scopes of elements inside the component.
* `componentScope` - a scope, but containing additional access methods

You can create a component from another component too, simply extending the functionality in that component.

For example, you may have an area on the page that deals with instant messages. You have a list of messages, a text box to enter a new message, and a button to send the message.

```js
var messages = browser.component({
  messages: function () {
    return this.find('.messages');
  },
  messageText: function () {
    return this.find('input.message');
  },
  sendButton: function () {
    return this.find('button', {text: 'Send'});
  }
});
```

You can then use the messages component:

```js
messages.messages().shouldHave({text: ['hi!', 'wassup?']}).then(function () {
  return messages.messageBox().typeIn("just hangin'");
}).then(function () {
  return messages.sendButton().click();
});
```

## scope

You can reset the starting point for the scope, the element from which all elements are searched for. By default this is the `<body>` element, but you can set it to a more specific element, or indeed another scope.

```js
var scopeUnderElement = scope.scope(element | selector | anotherScope);
```

* `element` - an element. This can be an `<iframe>` element, in which case the scope will be the contents of the iframe.
* `selector` - a CSS selector string
* `anotherScope` a scope to define where to start this scope. This is useful if you want to set the starting scope of a comonent. E.g.

    ```js
    var component = browser.component({
      ... methods ...
    });
    var componentScope = component.scope(browser.find('.component'));
    ```

## shouldExist

Wait for an element to exist.

```js
var promise = scope.shouldExist([options]);
```

* `options.timeout` - length of time to wait for the element (1000ms)
* `options.interval` - time between testing the dom (10ms)
* `options.allowMultiple` - allow multiple elements to be found, default just one

Returns a promise that resolves when the element exists, or is rejected if the timeout expires.

## shouldNotExist

Waits for the element not to exist.

```js
var promise = scope.shouldNotExist([options]);
```

* `options.timeout` - length of time to wait for the element (1000ms)
* `options.interval` - time between testing the dom (10ms)

Returns a promise that resolves when the element no longer exists, or is rejected if the timeout expires.

## shouldHave

Assert that a scope has certain properties.

```js
var promise = scope.shouldHave([options]);
```

* `options.text` - a string, expects the resolved scope to have the text. If an array of strings, expects the elements to have the same number of elements as there are strings in the array, and expects each string to be found in each respective element's text.
* `options.css` - a CSS string. Expects the resolved element to be matched by the CSS selector. Note that it won't match if the element contains other elements that match the CSS selector. So if we have `{css: '.class'}` then we expect the resolved element to have a class `class`.
* `options.value` - a string, expects the resolved element to be an input and have the value. An array expects the same number of inputs, each with the respective value.
* `options.html` - a string, expects the resolved element to have the html. An array expects the same number of elements, each with the respective html.
* `options.length` - a number, expects there to be this number of elements
* `options.elements` - a function, which is passed the resolved elements, return truthy for a match, falsey for a failure.
* `options.message` - the error message
* `options.timeout` - length of time to wait for the element (1000ms)
* `options.interval` - time between testing the dom (10ms)

## click

Returns a promise that resolves once the element has been found and the click has been triggered

```js
scope.click().then(function () {
});
```

## select

Returns a promise that resolves once the element has been found and the matching item selected from the select box

```js
scope.select({text: 'Text of option'}).then(function () {
});
```

Example:

```html
<select class="my-select">
  <option>First</option>
  <option>Second</option>
</select>
```

```js
var scope = browser.extend({
  mySelect: function(){
    return this.find('.my-select');
  }
})

scope.mySelect().select({text: 'Second'}).then(function(){
});
```

## selection delay
You can slow down the speed at which actions take place (currently only click events) by calling `setSelectionDelay` with the number of milliseconds to wait before proceeding.

```js
scope.setSelectionDelay(1000);
scope.click().then(function () {
});
```

## elements

Returns a promise resolving to the list of elements matched by the scope.

```js
scope.elements([options]).then(function (elements) {
});
```

* `elements` - the HTML DOM elements matched by the scope.
* `options.timeout` - length of time to wait for the element (1000ms)
* `options.interval` - time between testing the dom (10ms)

## element

Returns a promise resolving to the single element matched by the scope, it will be rejected if there are multiple.

```js
scope.element([options]).then(function (element) {
});
```

* `element` - the HTML DOM element matched by the scope.
* `options.timeout` - length of time to wait for the element (1000ms)
* `options.interval` - time between testing the dom (10ms)
