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

function elementTester(css, options) {
  if (typeof css !== 'string') {
    options = css;
    css = undefined;
  }

  var predicate;
  if (typeof options === 'function') {
    predicate = options;
    options = undefined;
  }

  var css, text, message;

  if (typeof options === 'string') {
    css = options;
  } else {
    css = options && options.hasOwnProperty('css')? options.css: undefined;
    text = options && options.hasOwnProperty('text')? options.text: undefined;
    message = options && options.hasOwnProperty('message')? options.message: undefined;
  }

  return {
    find: function(element) {
      var els = $(element);

      if (css && !els.is(css)) {
        return;
      }

      if (text) {
        var elementText = els.text();

        if (elementText.indexOf(text) < 0) {
          throw new Error('expected element to have text ' + JSON.stringify(text) + ' but contained ' + JSON.stringify(elementText));
        }
      }

      if (predicate && !predicate(els)) {
        return;
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

Selector.prototype.findElement = function (el) {
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

Selector.prototype.resolve = function() {
  var self = this;

  return retry(function() {
    var els = self.findElement();

    if (els.length !== 1) {
      throw new Error("expected to find exactly one element: " + self.printFinders(self.finders));
    }

    return els;
  });
};

Selector.prototype.exists = function () {
  return this.resolve();
};

Selector.prototype.has = function(options) {
  return this.addFinder(elementTester(options)).exists();
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

Selector.prototype.expect = function(assertion) {
  return this.addFinder({
    find: function(element) {
      assertion(element);
      return element;
    }
  }).exists();
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
