# API Reference
## Overview
The API is made up of three concepts: scopes, actions and assertions.

* scopes are chains of queries, such as `find(css)` and `containing(css)`, that progressively narrow the scope of elements to be searched for. These queries return new scopes.
* actions such as `click()` and `typeIn(text)` wait for the scope to be found before simulating a UI event. These return promises that resolve when the event has been dispatched.
* assertions such as `shouldExist()` and `shouldHave(properties)` can be made on scopes to ensure that they exist or contain text, classes or other properties.

All scope chains are immutable, so you can reuse portions of a scope chain to build new chains:

```js
const details = browser.find('.details'); // finds .details
const name = details.find('.name');       // finds .details .name
const email = details.find('.email');     // finds .details .email
...
```

The API starts with the browser scope, which contains everything on the page.

You can also create DSLs for components on the page using `scope.component(methods)`. By extending a scope, you can add methods that represent elements of the component at a higher level than mere CSS selectors. It's probably worth noting that these methods should normally just return scopes and not perform actions or assertions.

## Immediate mode
Although browser-monkey is designed to retry finding elements and assertions, if you can guarantee there will be no delays due to asynchronous application code or rendering, you may prefer to write synchronous tests. In this case, set the `immediate` option to `true`:

```js
browser.set({ immediate: true })
browser.click('Yummy')
browser.click('Banana')
browser.shouldHave({ text: 'Delicious' })
```

## Options
There are some options you can set, which are inherited by inner scopes.

```js
scope.set({visibleOnly: false});
const innerScope = scope.find('input');

innerScope.get('visibleOnly'); // returns false
```

* `visibleOnly` if true, then only visible elements will be found, if false, then all elements are considered. Visible is determined by the element's computed CSS, see [jQuery's :visible selector](https://api.jquery.com/visible-selector/). Default is true.
* `timeout` an integer specifying the milliseconds to wait for an element to appear. This can be overriden by specifying the timeout when calling an action.

## Scopes
### scope
You can reset the starting point for the scope, the element from which all elements are searched for. By default this is the `<body>` element, but you can set it to a more specific element, or indeed another scope.

```js
const scopeUnderElement = scope.scope(element | selector | anotherScope);
```

* `element` - an element. This can be an `<iframe>` element, in which case the scope will be the contents of the iframe.
* `selector` - a CSS selector string
* `anotherScope` a scope to define where to start this scope. This is useful if you want to set the starting scope of a comonent. E.g.

    ```js
    const component = browser.component({
      ... methods ...
    });
    const componentScope = component.scope(browser.find('.component'));
    ```

### component
Represents a component on the page, with methods to access certain elements of the component.

```js
const componentScope = scope.component(methods);
```

* `methods` - an object containing functions for scopes of elements inside the component.
* `componentScope` - a scope, but containing additional access methods

You can create a component from another component too, simply extending the functionality in that component.

For example, you may have an area on the page that deals with instant messages. You have a list of messages, a text box to enter a new message, and a button to send the message.

```js
const messages = browser.component({
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
await messages.messages().shouldHave({text: ['hi!', 'wassup?']});
await messages.messageBox().typeIn("just hangin'");
await messages.sendButton().click();
```

## Query
### find
```js
const innerScope = scope.find(css, [options]);
```

Returns a new scope that matches `css`.

* `css` - css to find in the scope
* `options.text` - text to find in the scope.

### is
```js
const scope = scope.is(css);
```

Returns a new scope that ensures that the element found matches the CSS. For example, `scope.find('li').is('.enabled')` ensures that the `<li>` has the class `enabled`.

* `css` - css to match against the scope

### containing
```js
const scope = scope.containing(css, [options]);
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

### filter
```js
const scope = scope.filter(filter);
```

* `filter(element)` a function that takes a DOM element, and returns either truthy or falsey. If truthy, then the element will be considered as part of the scope, if falsey then it won't.

## Assertions
### shouldExist
Wait for an element to exist.

```js
await browser.find('.selector').shouldExist([options]);
```

* `options.timeout` - length of time to wait for the element (1000ms)
* `options.interval` - time between testing the dom (10ms)
* `options.allowMultiple` - allow multiple elements to be found, default just one

Returns a promise that resolves when the element exists, or is rejected if the timeout expires.

### shouldFind
As an alternative to `browser.find('.selector').shouldExist()` you can also do:

```js
await browser.shouldFind('.selector')
````

### shouldNotExist
Waits for the element not to exist.

```js
await scope.shouldNotExist([options]);
```

* `options.timeout` - length of time to wait for the element (1000ms)
* `options.interval` - time between testing the dom (10ms)

Returns a promise that resolves when the element no longer exists, or is rejected if the timeout expires.

### shouldHave
Assert that a scope has certain properties.

```js
await scope.shouldHave([options]);

//e.g.:
await browser.find('#topMonkey').shouldHave({ text: 'Olive Baboon' });
```

would match:

```html
<div id="topMonkey">OliveBaboon</div>
```

or if checking multiple elements:
```
await browser.find('#top5 .monkey-species').shouldHave({ text: [
  'Olive Baboon',
  'Patas Monkey',
  'Proboscis Monkey',
  'Pygmy Marmoset',
  'Red-Handed Tamarin']
});
```

would match:

```html
<ul id="top5">
  <li class="monkey-species">Olive Baboon</li>
  <li class="monkey-species">Patas Monkey</li>
  <li class="monkey-species">Proboscis Monkey</li>
  <li class="monkey-species">Pygmy Marmoset</li>
  <li class="monkey-species">Red-Handed Tamarin</li>
</ul>
```

You can also match child components:

```js
const component = browser.component({
  airport: function(){
    return this.find('.airport').component({
      date: function(){ return this.find('.date'); }
    });
  }
});

component.shouldHave({
  airport: {
    text: 'LHR',
    date: { exactText: 'Aug 2055' }
  }
});
```

would match:

```html

<div class="airport">
  LHR
  <span class="date">Aug 2055</span>
</div>
```

```js
browser.find('img').shouldHave({
  attributes: [
    {src: '/monkey1.jpg', alt: 'first monkey'},
    {src: '/monkey2.jpg', alt: 'second monkey'},
  ]
})
```

would match:

```html
<img src="/monkey1.jpg" alt="first monkey">
<img src="/monkey2.jpg" alt="second monkey">
```

* `options.text` - a string, expects the resolved scope to contain the text. If an array of strings, expects the elements to have the same number of elements as there are strings in the array, and expects each string to be found in each respective element's text.
* `options.exactText` - a string, expects the resolved scope to have the exact text. If an array of strings, expects the elements to have the same number of elements as there are strings in the array, and expects each string to equal each respective element's text.
* `options.css` - a CSS string. Expects the resolved element to be matched by the CSS selector. Note that it won't match if the element contains other elements that match the CSS selector. So if we have `{css: '.class'}` then we expect the resolved element to have a class `class`.
* `options.value` - a string, expects the resolved element to be an input and have the value. An array expects the same number of inputs, each with the respective value.
* `options.exactValue` - a string, expects the resolved scope to have the exact value. If an array of strings, expects the elements to have the same number of elements as there are strings in the array, and expects each string to equal each respective element's value.
* `options.checked` - a boolean, expects the resolved element to be an checkbox input and to be checked or not. An array expects the same number of checkboxes, each with the respective checked value.
* `options.html` - a string, expects the resolved element to have the html. An array expects the same number of elements, each with the respective html.
* `options.length` - a number, expects there to be this number of elements
* `options.elements` - a function, which is passed the resolved elements, return truthy for a match, falsey for a failure.
* `options.attributes` - an object or an array of objects representing the attributes that should appear on one or more elements, `shouldHave({ attributes: { href: '/home' } })` would match `<a href="/home"></a>`
* `options.message` - the error message
* `options.timeout` - length of time to wait for the element (1000ms)
* `options.interval` - time between testing the dom (10ms)

### shouldHaveElement
Assert that there is one element, and that it passes the expectations of a function.

```js
await scope.shouldHaveElement(fn, [options]);
```

* `fn` a function that tests the element. The function is repeatedly called until it doesn't throw an exception, or until the timeout.
* `options.timeout` the timeout given for the element to pass the expectations, default 1000ms.
* `options.interval` - time between testing the dom (10ms)

### shouldHaveElements
Assert that the elements found in the scope pass an expectation.

```js
await scope.shouldHaveElements(fn, [options]);
```

* `fn` a function that tests the elements. The function is repeatedly called until it doesn't throw an exception, or until the timeout.
* `options.timeout` the timeout given for the element to pass the expectations, default 1000ms.
* `options.interval` - time between testing the dom (10ms)

## Actions
### click
Returns a promise that resolves once the element has been found and the click has been triggered

```js
await scope.click();
```

### typeIn
Returns a promise that resolves once the element has been found and the text has been entered.

```js
await scope.typeIn(text);
```

* `text` the text to type into the input.

### submit
Returns a promise that resolves once the element has been found and the submit event has been triggered

```js
await scope.submit();
```

### select
Returns a promise that resolves once the element has been found and the matching item selected from the select box

```js
scope.select({text: 'Text of option'})
```

or

```js
scope.select('Text of option')
```

Example:

```html
<select class="my-select">
  <option>First</option>
  <option>Second</option>
</select>
```

```js
const scope = browser.component({
  mySelect: function(){
    return this.find('.my-select');
  }
})

await scope.mySelect().select({text: 'Second'});
```

```js
scope.select([options]);
```

* `options.text` - a string, text to match against the options text, this will also match partial text
* `options` could also just be the text of the string to match

### fill
It can be tedious to fill out forms using `typeIn`, `select`, etc.
Fill lets you easily specify fields and actions to run:

```
const address = browser.component({
  street: function(){return this.find('.street');},
  city: function(){return this.find('.city');},
  country: function(){return this.find('.country');},
});

address.fill([
  {name: 'street',  action: 'typeIn', options: {text: 'Monkey St'}},
  {name: 'city',    action: 'typeIn', options: {text: 'Browserville'}},
  {name: 'country', action: 'select', options: {text: 'Monkey Island'}},
]);
```

This is exectuted as if you wrote this:

```
await address.street().typeIn({text: 'Monkey St'})
await address.city().typeIn({text: 'Browserville'});
await address.country().select({text: 'Monkey Island'});
```

* name - the name of any element on the component
* action - an action to perform, eg. `select`, `typeIn`
* options - a hash of options that is passed to the action

or if this syntax is still too long for you try the abridged version:

```
address.fill([
  {typeIn: 'street',  text: 'Monkey St'},
  {typeIn: 'city',    text: 'Browserville'},
  {select: 'country', text: 'Monkey Island'},
]);
```

### elements
Returns a promise resolving to the list of elements matched by the scope.

```js
await scope.elements([options]);
```

* `elements` - the HTML DOM elements matched by the scope.
* `options.timeout` - length of time to wait for the element (1000ms)
* `options.interval` - time between testing the dom (10ms)

### element
Returns a promise resolving to the single element matched by the scope, it will be rejected if there are multiple.

```js
await scope.element([options]);
```

* `element` - the HTML DOM element matched by the scope.
* `options.timeout` - length of time to wait for the element (1000ms)
* `options.interval` - time between testing the dom (10ms)

### link
`browser.link('gorilla')` matches:
 - `<a>gorilla</a>`
 - `<a id="gorilla">link</a>`
 - `<a title="gorilla">link</a>`
 - `<a><img alt="gorilla"></a>`

### button
A button is considered any of the following types - `input[type=submit]`, `input[type=button]`, `input[type=reset]`

`browser.button('tamarin')` matches:
 - `<button>tamarin</button>`
 - `<button id="tamarin">button</button>`
 - `<button value="tamarin">button</button>`
 - `<button id="tamarin">button</button>`
 - `<button><img alt="tamarin"></button>`

### linkOrButton
would match either a link or button according to their respective rules

### click
Normally the click action is performed on a scope but you can also provide it with a string `browser.click('monkey')` and it will search for a link or button that matches and perform the click on it.

## Events
### on
You can receive an event whenever an interaction is made on the DOM, such as a click or text entry. The event will have the element that is interacted with, the event type and other properties depending on the event type.

```js
const scopeWithEvents = scope.on(function (event) {
  // handle event
});
```

* `event.type` is one of `'click'`, `'typing'`, `'typing html'`, `'select option'`.
* `event.element` is the element that received the interaction, i.e. the button or input.
* `event.optionElement` is the option element selected, in the case of type `'select option'`.
* `event.text` is the text entered, in the case of type `'typing'`.
* `event.html` is the html entered, in the case of type `'typing html'`.
