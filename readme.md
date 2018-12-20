# browser monkey [![npm version](https://img.shields.io/npm/v/browser-monkey.svg)](https://www.npmjs.com/package/browser-monkey) [![npm](https://img.shields.io/npm/dm/browser-monkey.svg)](https://www.npmjs.com/package/browser-monkey) [![Build Status](https://travis-ci.org/featurist/browser-monkey.svg?branch=master)](https://travis-ci.org/featurist/browser-monkey) [![Gitter chat](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/featurist/stack)

Reliable DOM testing

```bash
npm install browser-monkey
```

Browser Monkey is a DOM assertion library. It helps you write framework agnostic browser tests that are reliable in the face of asynchronous behaviours like animations, AJAX and delayed rendering. It also helps you to write tests that exhibit the semantic meaning of the page, as opposed to a jumble of CSS selectors.

* timing resistant
* create rich DSLs for your page structure
* framework agnostic: works with React, Angular, jQuery, [Hyperdom](https://github.com/featurist/hyperdom) and many many more.
* can simulate text entry and clicks. (please let us know if you need more!)
* returns promises that resolve when the elements are found.

Here is an [example project](https://github.com/dereke/web-testing) that demonstrates how to use browser-monkey with Karma.

[@dereke](https://github.com/dereke) has made an excellent [video](https://www.youtube.com/watch?v=WQZ2eIfmfEs) of a TDD session using browser-monkey.

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

# debug

Browser monkey will explain what it is doing using [`debug`](https://github.com/visionmedia/debug). It can be extremely useful to see which buttons were clicked, or which text boxes were typed-in. To turn on, follow the [guide](https://github.com/visionmedia/debug#browser-support), or in short, type this into your browser console:

```js
localStorage['debug'] = '*';
```

Or to be more specific:


```js
localStorage['debug'] = 'browser-monkey';
```

# mount

Typically you will need to mount your application into the DOM before running your tests.

Browser monkey comes with a handy way of doing this for popular web frameworks

**hyperdom**
where YourHyperdomApp is a class that has a render method. [see here](test/app/hyperdom.jsx) for an example

```js
var hyperdomMonkey = require('browser-monkey/hyperdom')
var monkey = hyperdomMonkey(new YourHyperdomApp())
```

**angular**
where YourAngularApp is a class with fields 'directiveName' and 'moduleName' [see here](test/app/angular.js) for an example

```js
var angularMonkey = require('browser-monkey/angular')
var monkey = angularMonkey({
  directiveName: 'best-frameworks',
  moduleName: 'FrameworksApp'
})
```

**react**
where YourReactApp is a react class [see here](test/app/react.jsx) for an example

```js
var reactMonkey = require('browser-monkey/react')
var monkey = reactMonkey(new YourReactApp())
```

**iframe**
You can also use browser-monkey to do full integration testing.
Just give it the url of your web server

```js
var iframeMonkey = require('browser-monkey/iframe')
var monkey = iframeMonkey('http://your-app.example')
```

and then you can use the monkey

```js
monkey.find('h1').shouldHave({text: 'Hello World'});
```

The `monkey` is a normal browser monkey object which the has the following additional options:

 * mount - the mount object used to mount the app (useful for unmounting later)
 * app - the application passed to withApp

you can retrieve these options using the options api eg. `monkey.get('app')`

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

You can also create DSLs for components on the page using `scope.component(methods)`. By extending a scope, you can add methods that represent elements of the component at a higher level than mere CSS selectors. It's probably worth noting that these methods should normally just return scopes and not perform actions or assertions.

## options

There are some options you can set, which are inherited by inner scopes.

```js
scope.set({visibleOnly: false});
var innerScope = scope.find('input');

innerScope.get('visibleOnly'); // returns false
```

* `visibleOnly` if true, then only visible elements will be found, if false, then all elements are considered. Visible is determined by the element's computed CSS, see [jQuery's :visible selector](https://api.jquery.com/visible-selector/). Default is true.
* `timeout` an integer specifying the milliseconds to wait for an element to appear. This can be overriden by specifying the timeout when calling an action.

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
var promise = browser.find('.selector').shouldExist([options]);
```

* `options.timeout` - length of time to wait for the element (1000ms)
* `options.interval` - time between testing the dom (10ms)
* `options.allowMultiple` - allow multiple elements to be found, default just one

Returns a promise that resolves when the element exists, or is rejected if the timeout expires.

## shouldFind

As an alternative to `browser.find('.selector').shouldExist()` you can also do:

```js
browser.shouldFind('.selector')
````

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

//e.g.:
var promise = browser.find('#topMonkey').shouldHave({ text: 'Olive Baboon' });
```

would match:

```html
<div id="topMonkey">OliveBaboon</div>
```

or if checking multiple elements:
```
var promise = browser.find('#top5 .monkey-species').shouldHave({ text: [
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
var component = browser.component({
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

## shouldHaveElement

Assert that there is one element, and that it passes the expectations of a function.

```js
var promise = scope.shouldHaveElement(fn, [options]);
```

* `fn` a function that tests the element. The function is repeatedly called until it doesn't throw an exception, or until the timeout.
* `options.timeout` the timeout given for the element to pass the expectations, default 1000ms.
* `options.interval` - time between testing the dom (10ms)

## shouldHaveElements

Assert that the elements found in the scope pass an expectation.

```js
var promise = scope.shouldHaveElements(fn, [options]);
```

* `fn` a function that tests the elements. The function is repeatedly called until it doesn't throw an exception, or until the timeout.
* `options.timeout` the timeout given for the element to pass the expectations, default 1000ms.
* `options.interval` - time between testing the dom (10ms)

## click

Returns a promise that resolves once the element has been found and the click has been triggered

```js
scope.click().then(function () {
});
```

## typeIn

Returns a promise that resolves once the element has been found and the text has been entered.

```js
scope.typeIn(text).then(function () {
});
```

* `text` the text to type into the input.

## submit

Returns a promise that resolves once the element has been found and the submit event has been triggered

```js
scope.submit().then(function () {
});
```

## select

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
var scope = browser.component({
  mySelect: function(){
    return this.find('.my-select');
  }
})

scope.mySelect().select({text: 'Second'}).then(function(){
});
```

```js
scope.select([options]);
```

* `options.text` - a string, text to match against the options text, this will also match partial text
* `options` could also just be the text of the string to match

## fill
It can be tedious to fill out forms using `typeIn`, `select`, etc.
Fill lets you easily specify fields and actions to run:

```
var address = browser.component({
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
address.street().typeIn({text: 'Monkey St'}).then(function(){
  return address.city().typeIn({text: 'Browserville'});
}).then(function(){
  return address.country().select({text: 'Monkey Island'});
});
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

## on

You can receive an event whenever an interaction is made on the DOM, such as a click or text entry. The event will have the element that is interacted with, the event type and other properties depending on the event type.

```js
var scopeWithEvents = scope.on(function (event) {
  // handle event
});
```

* `event.type` is one of `'click'`, `'typing'`, `'typing html'`, `'select option'`.
* `event.element` is the element that received the interaction, i.e. the button or input.
* `event.optionElement` is the option element selected, in the case of type `'select option'`.
* `event.text` is the text entered, in the case of type `'typing'`.
* `event.html` is the html entered, in the case of type `'typing html'`.

# Semantic Finders
Semantic finders use a text fragment to find matching elements.

## link
`browser.link('gorilla')` matches:
 - `<a>gorilla</a>`
 - `<a id="gorilla">link</a>`
 - `<a title="gorilla">link</a>`
 - `<a><img alt="gorilla"></a>`

## button
A button is considered any of the following types - `input[type=submit]`, `input[type=button]`, `input[type=reset]`

`browser.button('tamarin')` matches:
 - `<button>tamarin</button>`
 - `<button id="tamarin">button</button>`
 - `<button value="tamarin">button</button>`
 - `<button id="tamarin">button</button>`
 - `<button><img alt="tamarin"></button>`

## linkOrButton
would match either a link or button according to their respective rules

## click
Normally the click action is performed on a scope but you can also provide it with a string `browser.click('monkey')` and it will search for a link or button that matches and perform the click on it.

## Immediate mode
Although browser-monkey is designed to retry finding elements and assertions, if you can guarantee there will be no delays due to asynchronous application code or rendering, you may prefer to write synchronous tests. In this case, set the `immediate` option to `true`:

```js
browser.set({ immediate: true })
browser.click('Yummy')
browser.click('Banana')
browser.shouldHave({ text: 'Delicious' })
```

## We're hiring!

Join our remote team and help us build amazing software. Check out [our career opportunities](https://www.featurist.co.uk/careers/).
