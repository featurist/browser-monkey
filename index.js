var retry = require('trytryagain');
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var sendkeys = require('./sendkeys');
var sendclick = require('./sendclick');
var debug = require('debug')('browser-monkey');
var dispatchEvent = require('./dispatchEvent');

function blurActiveElement() {
  var activeElement;
  try {
    activeElement = document.activeElement;
  } catch ( err ) { }

  if (activeElement) {
    dispatchEvent(activeElement, 'blur');
  }
}

function Options(options){
  this.options = options;
  this.isOptionsObject = typeof options === 'object';
  this.validOptions = [];
}

Options.remove = function(options, propertyNames){
  var newOptions = {};

  if (typeof options === 'object') {
    propertyNames.forEach(function(propertyName){
      newOptions[propertyName] = options[propertyName];
      delete options[propertyName];
    });
  }

  return newOptions;
}

Options.default = function(options, defaults){
  var newOptions = typeof options === 'object' ? options : {};

  Object.keys(defaults).forEach(function(key){
    if (!newOptions.hasOwnProperty(key)) {
      newOptions[key] = defaults[key]
    }
  });

  return newOptions;
}

Options.prototype.option = function(name) {
  this.validOptions.push(name);
  if (this.isOptionsObject) {
    var value = this.options.hasOwnProperty(name)? this.options[name]: undefined;
    delete this.options[name];
    return value;
  }
}

Options.prototype.validate = function(){
  if (this.isOptionsObject) {
    var keys = Object.keys(this.options);

    if (keys.length > 0) {
      throw new Error('properties ' + keys.join(', ') + ' not recognised, try ' + this.validOptions.join(', '));
    }
  }
}

var $ =
  typeof $ === 'undefined'
    ? require("jquery")
    : window.$;

function elementFinder(css) {
  return {
    find: function(element) {
      var els = $(element).find(css);
      if (els.length > 0) {
        return els;
      }
    },

    toString: function() {
      return css;
    }
  };
}

function assertElementProperties(elements, expected, getProperty, exact) {
  function assertion(actual, expected) {
    if (exact) {
      expect(actual, 'expected element to have exact text ' + JSON.stringify(expected) + ' but contained ' + JSON.stringify(actual)).to.equal(expected);
    } else {
      expect(actual, 'expected element to contain ' + JSON.stringify(expected) + ' but contained ' + JSON.stringify(actual)).to.contain(expected);
    }
  }

  if (expected instanceof Array) {
    var actualTexts = elements.toArray().map(function (item) {
      return getProperty($(item));
    });

    expect(actualTexts.length, 'expected ' + JSON.stringify(actualTexts) + ' to respectively contain ' + JSON.stringify(expected)).to.eql(expected.length);

    expected.forEach(function (expected, index) {
      var actualText = actualTexts[index];
      assertion(actualText, expected);
    });
  } else {
    var elementText = getProperty(elements);
    assertion(elementText, expected);
  }
}

function elementsToString(els) {
  return els.toArray().map(function (el) {
    return el.outerHTML.replace(el.innerHTML, '');
  }).join(', ');
}

function elementTester(options) {
  var options = new Options(options);

  var css = options.option('css');
  var text = options.option('text');
  var exactText = options.option('exactText');
  var message = options.option('message');
  var predicate = options.option('elements');
  var length = options.option('length');
  var value = options.option('value');
  var html = options.option('html');
  var checked = options.option('checked');

  options.validate();

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
          throw new Error(message || ('expected elements ' + elementsToString(els) + ' to have css ' + css));
        }
      }

      if (text !== undefined) {
        assertElementProperties(els, text, function (e) { return e.text(); });
      }

      if (exactText !== undefined) {
        assertElementProperties(els, exactText.toString(), function (e) { return e.text(); }, true);
      }

      if (value !== undefined) {
        assertElementProperties(els, value, function (e) { return e.val(); });
      }

      if (checked) {
        var elements = els.toArray();

        if (checked instanceof Array) {
          var elementsChecked = elements.map(function (element) {
            return !!element.checked;
          });
          expect(elementsChecked, 'expected ' + elementsToString(els) + ' to have checked states ' + JSON.stringify(checked)).to.eql(checked);
        } else {
          var elementsNotMatching = elements.filter(function (element) { return element.checked != checked; });
          expect(elementsNotMatching.length, 'expected ' + elementsToString(els) + ' to be ' + (checked? 'checked': 'unchecked')).to.equal(0);
        }
      }

      if (html) {
        assertElementProperties(els, html, function (e) { return e.html(); });
      }

      if (length !== undefined) {
        if (els.length !== length) {
          throw new Error(message || ('expected ' + elementsToString(els) + ' to have ' + length + ' elements'));
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

Selector.prototype.find = function (selector, options) {
  var message = JSON.stringify(options);
  var scope = this.addFinder(elementFinder(selector));

  if (options) {
    var tester = elementTester(options);

    return scope.filter(function (element) {
      try {
        return tester.find(element);
      } catch (error) {
        return false;
      }
    }, message);
  } else {
    return scope;
  }
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
  function Component() {
    Selector.apply(this, arguments);
  }

  Component.prototype = new this.constructor();
  Object.keys(methods).forEach(function (method) {
    Component.prototype[method] = methods[method];
  });
  Component.prototype.constructor = Component;

  return new Component().scope(this);
};

Selector.prototype.containing = function (selector, options) {
  var message = options && JSON.stringify(options);
  var findElements = elementFinder(selector);
  var finder;

  if (options) {
    var testElements = elementTester(options);
    finder = {
      find: function (elements) {
        var found = findElements.find(elements);
        var tested = found.toArray().filter(function (element) {
          try {
            testElements.find(element);
            return true;
          } catch (error) {
            return false;
          }
        });

        if (tested.length > 0) {
          return tested;
        }
      },

      toString: function () {
        return selector + (message? ' ' + message: '');
      }
    }
  } else {
    finder = findElements;
  }

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

  function selector() {
    if(self.selector instanceof Element && self.selector.tagName == 'IFRAME') {
      return self.selector.contentDocument;
    } else {
      return self.selector || 'body';
    }
  }

  var elements = findWithFinder($(selector()), 0);
  if (!allowMultiple && elements.length !== 1) {
    throw new Error("expected to find exactly one element: " + self.printFinders(self.finders) + ', but found :' + elementsToString(elements));
  }
  return elements.toArray();
};

Selector.prototype.resolve = function(options) {
  var self = this;
  var retryOptions = Options.remove(options, ['timeout', 'interval']);

  return retry(retryOptions, function() {
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
  options = Options.default(options, {allowMultiple: true});
  return this.resolve(options);
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
  var resolveOptions = Options.remove(options, ['timeout', 'interval']);
  resolveOptions.allowMultiple = true;

  return this.addFinder(elementTester(options)).shouldExist(resolveOptions);
};

Selector.prototype.shouldNotHave = function(options) {
  var resolveOptions = Options.remove(options, ['timeout', 'interval']);
  resolveOptions.allowMultiple = true;

  return this.addFinder(elementTester(options)).shouldNotExist(resolveOptions);
};

Selector.prototype.filter = function (filter, message) {
  return this.addFinder({
    find: function (elements) {
      var filteredElements = elements.toArray().filter(filter);

      if (filteredElements && filteredElements.length > 0) {
        return $(filteredElements);
      }
    },

    toString: function () {
      return message || '[filter]';
    }
  });
};

Selector.prototype.enabled = function () {
  return this.filter(function (element) {
    return !((element.tagName == 'BUTTON' || element.tagName == 'INPUT') && element.disabled == true);
  }, '[disabled=false]');
};

Selector.prototype.click = function(options) {
  return this.enabled().element(options).then(function(element) {
    debug('click', element);
    blurActiveElement();
    return sendclick(element);
  });
};

Selector.prototype.select = function(options) {
  var selectOptions = Options.remove(options, ['text', 'exactText']);

  return this.find('option', selectOptions).element().then(function(optionElement) {
    optionElement.selected = true;
    var selectElement = optionElement.parentNode;

    debug('select', selectElement);
    blurActiveElement();
    dispatchEvent(selectElement, 'change');
  });
};

Selector.prototype.typeIn = function(text, options) {
  return this.element(options).then(function(element) {
    debug('typeIn', element, text);
    blurActiveElement();
    return sendkeys(element, text);
  });
};

Selector.prototype.typeInHtml = function(html, options) {
  return this.element(options).then(function(element) {
    debug('typeInHtml', element, html);
    return sendkeys.html(element, html);
  });
};

module.exports = new Selector();
