var retry = require('trytryagain');
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var sendkeys = require('./sendkeys');
var sendclick = require('./sendclick');

var $ =
  typeof $ === 'undefined'
    ? require("jquery")
    : window.$;

function cssWithText(css, options) {
  var text = options && options.hasOwnProperty('text')? options.text: undefined;

  if (text) {
    return css + ":contains(" + JSON.stringify(text) + ")";
  } else {
    return css;
  }
}

function elementFinder(css, options) {
  var text = options && options.hasOwnProperty('text')? options.text: undefined;
  var ensure = options && options.hasOwnProperty('ensure')? options.ensure: undefined;
  var message = options && options.hasOwnProperty('message')? options.message: undefined;

  var cssContains = cssWithText(css, {
    text: text
  });

  return {
    find: function(element) {
      var els = $(element).find(cssContains);
      if (els.length > 0) {
          if (ensure) {
              ensure(els);
          }
          return els;
      }
    },

    toString: function() {
      return message || cssContains;
    }
  };
}

function assertElementProperties(elements, expected, getProperty) {
  function assertion(actual, expected) {
    expect(actual, 'expected element to have ' + JSON.stringify(expected) + ' but contained ' + JSON.stringify(actual)).to.contain(expected);
  }

  if (expected instanceof Array) {
    var actualTexts = elements.toArray().map(function (item) {
      return getProperty($(item));
    });

    expect(actualTexts.length, 'expected to have ' + expected.length + ' elements, but found ' + actualTexts.length).to.eql(expected.length);

    expected.forEach(function (expected, index) {
      var actualText = actualTexts[index];
      assertion(actualText, expected);
    });
  } else {
    var elementText = getProperty(elements);
    assertion(elementText, expected);
  }
}

function elementTester(options) {
  var optionsObject = typeof options === 'object';

  var css = optionsObject && options.hasOwnProperty('css')? options.css: undefined;
  var text = optionsObject && options.hasOwnProperty('text')? options.text: undefined;
  var message = optionsObject && options.hasOwnProperty('message')? options.message: undefined;
  var predicate = optionsObject && options.hasOwnProperty('elements')? options.elements: undefined;
  var length = optionsObject && options.hasOwnProperty('length')? options.length: undefined;
  var value = optionsObject && options.hasOwnProperty('value')? options.value: undefined;
  var html = optionsObject && options.hasOwnProperty('html')? options.html: undefined;

  if (typeof options === 'string') {
    css = options;
  }

  if (typeof options === 'function') {
    predicate = options;
  }

  return {
    find: function(element) {
      var els = $(element);

      if (css && !els.is(css)) {
        if (!els.is(css)) {
          var elements = els.toArray().map(function (el) {
            return el.outerHTML.replace(el.innerHTML, '');
          });
          throw new Error(message || ('expected elements ' + elements.join(', ') + ' to have css ' + css));
        }
      }

      if (text) {
        assertElementProperties(els, text, function (e) { return e.text(); });
      }

      if (value) {
        assertElementProperties(els, value, function (e) { return e.val(); });
      }

      if (html) {
        assertElementProperties(els, html, function (e) { return e.html(); });
      }

      if (length !== undefined) {
        if (els.length !== length) {
          throw new Error(message || ('expected to find ' + length + ' elements but found ' + els.length));
        }
      }

      if (predicate) {
        if (!predicate(els.toArray())) {
          throw new Error(message || 'expected elements to pass predicate');
        }
      }

      return els;
    },

    toString: function() {
      return message || css || text;
    }
  };
}

function Selector(selector, finders) {
  this.selector = selector;
  this.finders = finders || [];
}

Selector.prototype.addFinder = function (finder) {
  var finders = this.finders && this.finders.slice() || [];
  finders.push(finder);
  return new this.constructor(this.selector, finders);
};

Selector.prototype.find = function () {
  return this.addFinder(elementFinder.apply(null, arguments));
};

Selector.prototype.is = function (css) {
  return this.addFinder(elementTester({css: css}));
};

Selector.prototype.scope = function (scope) {
  if (scope instanceof Selector) {
    return new this.constructor(scope.selector, scope.finders);
  } else {
    return new this.constructor(scope, this.finders);
  }
};

Selector.prototype.extend = function (methods) {
  return this.component(methods);
};

Selector.prototype.component = function (methods) {
  function Extension() {
    Selector.apply(this, arguments);
  }

  Extension.prototype = new this.constructor();
  Object.keys(methods).forEach(function (method) {
    Extension.prototype[method] = methods[method];
  });
  Extension.prototype.constructor = Extension;

  return new Extension();
};

Selector.prototype.containing = function () {
  var finder = elementFinder.apply(null, arguments);

  return this.addFinder({
    find: function(elements) {
      var els = elements.filter(function() {
        try {
          return finder.find(this);
        } catch (e) {
          return false;
        }
      });

      if (els.length > 0) {
        return els;
      }
    },

    toString: function() {
      return 'containing: ' + finder.toString();
    }
  });
};

Selector.prototype.printFinders = function (finders) {
  return finders.map(function (f) { return f.toString(); }).join(' / ');
};

Selector.prototype.findElements = function (options) {
  var self = this;
  var allowMultiple = options && options.hasOwnProperty('allowMultiple')? options.allowMultiple: false;

  function findWithFinder(el, finderIndex) {
    var finder = self.finders[finderIndex];

    if (finder) {
      var found = finder.find(el);

      if (!found) {
        throw new Error("expected to find: " + self.printFinders(self.finders.slice(0, finderIndex + 1)));
      }

      return findWithFinder(found, finderIndex + 1);
    } else {
      return el;
    }
  };

  var elements = findWithFinder($(this.selector || 'body'), 0);
  if (!allowMultiple && elements.length !== 1) {
    throw new Error("expected to find exactly one element: " + self.printFinders(self.finders));
  }
  return elements.toArray();
};

Selector.prototype.resolve = function(options) {
  var self = this;

  return retry(options, function() {
    return self.findElements(options);
  });
};

Selector.prototype.notResolve = function(options) {
  var self = this;

  return retry(options, function() {
    var found = false;
    try {
      self.findElements({allowMultiple: true});
      found = true;
    } catch (e) {
    }
    if (found) {
      throw new Error("didn't expect to find element: " + self.printFinders(self.finders));
    }
  });
};

Selector.prototype.exists = function (options) {
  return this.shouldExist(options);
};

Selector.prototype.shouldExist = function (options) {
  return this.resolve(options).then(function () {});
};

Selector.prototype.shouldNotExist = function (options) {
  return this.notResolve(options);
};

Selector.prototype.elements = function (options) {
  return this.resolve({allowMultiple: true});
};

Selector.prototype.element = function (options) {
  return this.resolve(options).then(function (elements) {
    return elements[0];
  });
};

Selector.prototype.has = function(options) {
  return this.shouldHave(options);
};

Selector.prototype.shouldHave = function(options) {
  var resolveOptions;
  if (typeof options === 'object') {
    resolveOptions = JSON.parse(JSON.stringify(options));
    resolveOptions.allowMultiple = true;
  } else {
    resolveOptions = {allowMultiple: true};
  }
  return this.addFinder(elementTester(options)).shouldExist(resolveOptions);
};

Selector.prototype.shouldNotHave = function(options) {
  var resolveOptions;
  if (typeof options === 'object') {
    resolveOptions = JSON.parse(JSON.stringify(options));
    resolveOptions.allowMultiple = true;
  } else {
    resolveOptions = {allowMultiple: true};
  }
  return this.addFinder(elementTester(options)).shouldNotExist(resolveOptions);
};

Selector.prototype.click = function(options) {
  return this.element(options).then(function(element) {
    return sendclick(element);
  });
};

Selector.prototype.typeIn = function(text, options) {
  return this.element(options).then(function(element) {
    return sendkeys(element, text);
  });
};

Selector.prototype.typeInHtml = function(html, options) {
  return this.element(options).then(function(element) {
    return sendkeys.html(element, html);
  });
};

module.exports = new Selector();
