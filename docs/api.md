# API Reference

## Overview

The API is made up of three concepts: queries, actions and assertions.

* queries are chains of methods, such as `find` and `containing`, that progressively narrow the scope of elements to be searched for. Queries return new queries.
* actions such as `click` and `enterText` "execute" the query chain, waiting for the elements to be found before simulating a corresponding UI event. These return promises that resolve when the event has been dispatched.
* assertions such as `shouldExist` and `shouldContain` also "execute" the query chain and ensure that the elements exist or contain text, classes or other properties. These return promises that resolve if queries are satisfied, or rejected otherwise (after retrying query for some time).

### Queries

Queries can be of two types: those whose arguments filter elements based on their own properties (e.g. `find` or `is`), vs those whose arguments filter elements based on _contents_ of those elements (e.g. `containing`).

The former accepts a selector, which is either a css string or a [custom finder](#createFinder). The latter accepts a "model" (TODO: find a better name) and that can be one of the following:

* string: the exact text content
* RegExp: a matcher for text content
* [custom finder](#createFinder): to assert that certain elements are contained
* an object where keys are selectors (css string or a finder) and values are one of the above or a nested object
* an array with any of the above

## Mount

Browser-monkey can create a test DOM container to mount your app into. This is convinient, but not required - you can put your DOM wherever you want.

There are a couple of shortcuts for doing this for particular frameworks. Otherwise, generic mount is equally straightforward.

### React

```js
import {Query} from 'browser-monkey'
import ReactMount from 'browser-monkey/ReactMount'
const mount = new ReactMount(React.createElement(YourReactApp, {}, null))
```

### Hyperdom

```js
import {Query} from 'browser-monkey'
import HyperdomMount from 'browser-monkey/HyperdomMount'
const mount = new HyperdomMount(new YourHyperdomApp())
```

### Iframe

Instead of mounting client side app directly, you can also give browser-monkey a url to load in an iframe. This is a more realistic test environment - it covers js bundling and `index.html` - and so it may be worth having tests like this as well. Iframe mount can also be used for other types of browser automations, e.g. web crawler.

```js
import {IFrameMount, Query} from 'browser-monkey'
const mount = new IFrameMount('http://example.com/some/page')
```

### Manual

Browser-monkey mount gives you a reference to the test DOM container. It's just a DOM element, insert your html there.

```js
import {Mount, Query} from 'browser-monkey'
const mount = new Mount()
mount.containerElement().innerHTML = '<div>bananas</div>'
```

### Query mount

Once mount is created, it is passed to the Query API. The result is browser-monkey API, scoped to the contents of mount's container DOM.

```js
const page = new Query(mount.containerElement())
```

### Unmount

Remove test container (e.g. between tests):

```js
mount.unmount()
```

### No Mount

Simply pass DOM element to query constructor:

```js
const page = new Query(document.querySelector('#my-test-container'))
```

## Query

Queries are chains of methods, such as `find(css)` and `containing(text)`, that progressively narrow the scope of elements to be searched for. Queries return new queries.

All query chains are immutable, so you can reuse portions of a chain to build new chains:

```js
const page = new Query(mount.containerElement())

const details = page.find('.details')    // finds .details
const name = details.find('.name')       // finds .details .name
const email = details.find('.email')     // finds .details .email
```

A query can be "resolved" in a number of ways:

```js
// Simply resolving it as promise returns found elements (or rejects after timeout if none found)
const elements = await details

// Use a specific assertion
const elements = await details.shouldHaveElements(2)

// Call `result()` to grab whatever elements match _without_ waiting
const elements = details.result()
```

You can call `.scope()` explicitely to (re)set the starting point for the query (an element from which all elements are searched for):

```js
const scopeUnderElement = page.scope(element)
```

### setOptions

Set query options. They are inherited by inner queries.

```js
query.setOptions({visibleOnly: false})

query.find('div').getOptions().visibleOnly // => false
```

* `visibleOnly` if true, then only visible elements will be found, if false, then all elements are considered. Default is true.
* `timeout` an integer specifying the milliseconds to wait for an element to appear. This can be overriden by specifying the timeout when calling an action.
* `interval` a number of milliseconds to wait between querying DOM when waiting for element to appear.

### getOptions

Returns query options.

### find

Scope query by selector

```js
const innerQuery = query.find(css)
```

Returns a new query that matches `css`. A custom finder (see [`createFinder()`](#createFinder)) can also be used instead of CSS selector. Example:

```js
import { Button } from 'browser-monkey'

await page.find(Button('Submit')).click()
```

### createFinder

Defines a custom finder that can be used instead of css as an argument to `find`/`set`. Example:

```js
import { createFinder } from 'browser-monkey'

const Flash = createFinder(q => q.find('.messages .flash'))
await page.find(Flash).containing('Success!').shouldExist()
```

It's possible to create finders that accept parameters:

```js
const Flash = createFinder('Flash', (q, flashType) => q.find(`.flash-${flashType}`))
await page.shouldContain({
  [Flash('success')]: 'Success!',
  [Flash('alert')]: /Fail/,
})
```

Custom finders can be used in [`set()`](#set) too:

```js
page.set({
  [CustomParent]: {
    [CustomChild]: "new value"
  }
})
```

### is

Narrows the scope to match selector. This is useful for composability. Consider the following example:

```js
const alert = page.find('.alert')

// and then later
await alert.is('.success').shouldExist()

// and further down
await alert.is('.danger').shouldExist()
```

In the end, `find('.a').is('.b')` is the same as `find('.a.b')`. However the latter is atomic. Whereas the former can be composed programmatically bit by bit.

### containing

Narrows a scope based on its content. For example:

```js
const scope = page.find('.alert').containing('Success!')
```

Will only yield elements with class `alert` whose text content is 'Success!'. A RegExp can be used instead of a string for elements that _contain_ 'Success!'.

It's also possible to examine the content of individual bits inside the scope:

```js
const scope = page.find('.result').containing({
  '.title': 'Title',
  '.body': /Body/
})
```

Text content is not the only filtering option - element attributes can be inspected too:

```js
import {matchers} from 'browser-monkey'

const scope = page.find('.result').containing({
  '.body': matchers.elementAttributes({style: {color: 'red'}})
})
```

### filter

Narrow query scope based on a filtering function. The function receives a DOM element as its argument and returns either truthy or falsey. If truthy, then the element will be considered as part of the scope, if falsey then it won't.

```js
const [sally] = await page
  .find('.contact')
  .filter(e => e.querySelector('.name').innerText === 'Sally')
```

### findButton

Find button by one of the following criteria:

- `input[type=button|submit]`, `button` or `a` element text
- `label` text, enclosing an `input[type=radio|checkbox]`
- `label` text whose `for` attribute points to an `input[type=checkbox]`
- checkbox's `aria-label`
- `label` text whose `id` is referenced by a checkbox's `aria-labelledby`
- custom finder, defined by `addButtonDefinition()`

If you find button in order to click than you probably want `clickButton()` instead.

### addButtonDefinition

Define custom button finder. If you have non-standard buttons - e.g. `<div class="button"></div>` - then you can use `addButtonDefinition()` to have browser-monkey look it up when calling `findButton()`/`clickButton()` methods:

```js
const query = page.addButtonDefinition(
  (query, name) => query.find('div.button').containing(name)
)

await query.clickButton('Login')
```

You can name custom finders so that they can be later removed with [`removeButtonDefinition()`](#removeButtonDefinition).

```js
const query = page.addButtonDefinition(
  'div-button',
  (query, name) => query.find('div.button').containing(name)
)
```

### removeButtonDefinition

Remove button definition. You can remove both built-in button definitions and custom ones defined with [`addButtonDefinition()`](#addButtonDefinition).

```js
// built-in
page.removeButtonDefinition('aria-labelledby')
// custom
page.removeButtonDefinition('div-button')
```

Built-in definitions:

- `button`: elements that match `button, input[type=button], input[type=submit], input[type=reset], a`
- `label`: labels that contain a clickable input
- `label-for`: labels with `for` attribute
- `aria-label`: elements with attribute `aria-label`
- `aria-labelledby`: elements whole `id` is referenced by another element's `aria-labelledby`

### addFieldDefinition

When you use `find("Field('some-input')")`, browser-monkey is matching against a few built-in field definitions. It should cover most cases, but sometimes your inputs are special and then you might want to teach browser-monkey to recognise them.

For example, let's say that in your universe this is an input:

```html
<div class="result" data-label="Search"/>
```

By default, browser-monkey won't recognise it as such. But with `addFieldDefinition` it will:

```js
await page.set({ "Field('Search')": 'bananas' })
// => error!

page.addFieldDefinition('data-label', (query, label) => (
  query.find(`[data-label=${label}]`)
))

await page.set({ "Field('Search')": 'bananas' })
// => ok!
```

### removeFieldDefinition

Remove field definition. E.g:

```js
browser.removeFieldDefinition('data-label')
```

### result

Synchronously resolves query:

```js
page.find('.thing') // => new Query object
page.find('.thing').result() // => array of matching elements
```

### map

Use Javascript to transform a query (rather than css).

Sometimes, it's easier to define a query in Javascript. For example, getting a "target" element of a label's "for" attribute isn't even possible in css. So we could use something like this:

```js
page.find('label[for]').map(e => (
  document.getElementById(e.getAttribute('for'))
)).filter(Boolean)
```

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
