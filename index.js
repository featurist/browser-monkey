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

function elementTester(options) {
  var optionsObject = typeof options === 'object';

  var css = optionsObject && options.hasOwnProperty('css')? options.css: undefined;
  var text = optionsObject && options.hasOwnProperty('text')? options.text: undefined;
  var message = optionsObject && options.hasOwnProperty('message')? options.message: undefined;
  var predicate = optionsObject && options.hasOwnProperty('elements')? options.elements: undefined;
  var length = optionsObject && options.hasOwnProperty('length')? options.length: undefined;

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
          throw new Error(message || ('expected elements to have css ' + css));
        }
      }

      if (text) {
        if (text instanceof Array) {
          var actualTexts = els.toArray().map(function (item) {
            return $(item).text().trim();
          });

          expect(actualTexts).to.eql(text);
        } else {
          var elementText = els.text();

          if (elementText.indexOf(text) < 0) {
            throw new Error(message || ('expected element to have text ' + JSON.stringify(text) + ' but contained ' + JSON.stringify(elementText)));
          }
        }
      }

      if (length !== undefined) {
        if (els.length !== length) {
          throw new Error(message || ('expected to find ' + length + ' elements but found ' + els.length));
        }
      }

      if (predicate) {
        if (!predicate(els)) {
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

Selector.prototype.scope = function (scope) {
  if (scope instanceof Selector) {
    return new this.constructor(scope.selector, scope.finders);
  } else {
    return new this.constructor(scope, this.finders);
  }
};

Selector.prototype.extend = function (methods) {
  function Extension() {
    Selector.apply(this, arguments);
  }

  Extension.prototype = new Selector();
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
      finder.toString();
    }
  });
};

Selector.prototype.printFinders = function (finders) {
  return finders.map(function (f) { return f.toString(); }).join(' / ');
};

Selector.prototype.findElement = function () {
  var self = this;

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

  return findWithFinder($(this.selector || 'body'), 0);
};

Selector.prototype.resolve = function(options) {
  var self = this;
  var allowMultiple = options && options.hasOwnProperty('allowMultiple')? options.allowMultiple: false;

  return retry(function() {
    var els = self.findElement();

    if (!allowMultiple && els.length !== 1) {
      throw new Error("expected to find exactly one element: " + self.printFinders(self.finders));
    }

    return els;
  });
};

Selector.prototype.exists = function (options) {
  return this.shouldExist(options);
};

Selector.prototype.shouldExist = function (options) {
  return this.resolve(options);
};

Selector.prototype.elements = function (options) {
  return this.resolve({allowMultiple: true});
};

Selector.prototype.element = function (options) {
  return this.resolve();
};

Selector.prototype.has = function(options) {
  return this.addFinder(elementTester(options)).shouldExist({allowMultiple: true});
};

Selector.prototype.shouldHave = function(options) {
  return this.has(options);
};

Selector.prototype.click = function() {
  return this.resolve().then(function($element) {
      return sendclick($element[0]);
  });
};

Selector.prototype.typeIn = function(text) {
  return this.resolve().then(function($element) {
    return sendkeys($element[0], text);
  });
};

Selector.prototype.typeInHtml = function(html) {
  return this.resolve().then(function($element) {
    return sendkeys.html($element[0], html);
  });
};

module.exports = new Selector();

module.exports.hasText = function(text) {
  return function(element) {
    return expect(element.text()).to.equal(text);
  };
};
module.exports.is = function(css) {
  return function(element) {
    return expect(element.is(css), css).to.be.true;
  };
};
