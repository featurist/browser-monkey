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

## containing

```js
var scope = scope.containing(css, [options]);
```

Ensures that the scope contains the `css` and `options.text`, the scope returned still refers to the outer scope.

* `css` - css to find in the scope
* `options.text` - text to find in the scope.
