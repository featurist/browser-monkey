var retry = require('trytryagain');
var trace = require('./trace');
var Options = require('./options');
var expectOneElement = require('./expectOneElement');

module.exports = {
  elementFinder: function(css) {
    var $ = this.get('$');
    var self = this;
    return {
      find: function(element) {
        var els = $(element).find(css);
        if (self.get('visibleOnly')) {
          els = els.filter(function(index){
            var el = this[index] || this;
            var ignoreVisibilityOfTags = ['OPTION'];
            if (el && ignoreVisibilityOfTags.indexOf(el.tagName) !== -1) {
              el = el.parentNode;
            }
            return $(el).is(':visible');
          });
        }
        if (els.length > 0) {
          return els;
        }
      },

      toString: function() {
        return css;
      }
    };
  },

  addFinder: function (finder) {
    var finders = this._finders && this._finders.slice() || [];
    finders.push(finder);
    return this.clone({_finders: finders});
  },

  createElementTester: function(criteria) {
    var self = this;

    if (typeof criteria === 'string') {
      criteria = { css: criteria };
    }

    if (typeof criteria === 'function') {
      criteria = { predicate: criteria };
    }

    return {
      find: function($el) {
        var message = criteria.message;
        Object.keys(criteria).forEach(function(key){
          var value = criteria[key];
          var tester = self._elementTesters[key];

          if (value !== undefined) {
            tester.call(self, $el, message, value);
          }
        });
        return $el;
      },

      toString: function(){
        return criteria.message || criteria.css || criteria.text;
      }
    };
  },

  find: function (selector, options) {
    var $ = this.get('$');
    var message = JSON.stringify(options);
    var scope = this.addFinder(this.elementFinder(selector));

    if (options) {
      var tester = this.createElementTester(options);

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
  },

  containing: function (selector, options) {
    var $ = this.get('$');
    var message = options && JSON.stringify(options);
    var findElements = this.elementFinder(selector);
    var finder;

    if (options) {
      var tester = this.createElementTester(options);

      finder = {
        find: function (elements) {
          var found = findElements.find(elements);
          var tested = found.toArray().filter(function (element) {
            try {
              tester.find(element);
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
        var els = Array.prototype.filter.call(elements, function(el) {
          try {
            return finder.find(el);
          } catch (e) {
            return false;
          }
        });

        if (els.length > 0) {
          return $(els);
        }
      },

      toString: function() {
        return ':has(' + finder.toString() + ')';
      }
    });
  },

  elements: function (options) {
    options = Options.default(options, {allowMultiple: true});
    return this.resolve(options);
  },

  element: function (options) {
    var $ = this.get('$');
    return this.resolve(options).then(function (elements) {
      return $(elements[0]);
    });
  },

  printFinders: function (finders) {
    return finders.map(function (f) { return f.toString(); }).join(' ').replace(/\s+\:/g,':');
  },

  findElements: function (options) {
    var $ = this.get('$');
    var self = this;
    var allowMultiple = options && options.hasOwnProperty('allowMultiple')? options.allowMultiple: false;

    function findWithFinder(el, finderIndex) {
      var finder = self._finders[finderIndex];

      if (finder) {
        var found = finder.find(el);

        if (!found) {
          throw new Error("expected to find: " + self.printFinders(self._finders.slice(0, finderIndex + 1)));
        }

        return findWithFinder(found, finderIndex + 1);
      } else {
        return el;
      }
    };

    function selector() {
      /*console.log('ele', typeof Element !== 'undefined')
      console.log('ele inst', self._selector instanceof Element, self._selector)
      console.log('iframe', self._selector.prop('tagName') == 'IFRAME')*/
      //if(typeof Element !== 'undefined' && self._selector instanceof Element && self._selector.prop('tagName') == 'IFRAME') {

      var selector = self._selector;
      if (
        selector &&
        typeof Element !== 'undefined' &&
        selector instanceof Element &&
        selector.tagName == 'IFRAME'
      ) {
        return selector.contentDocument.body; 
      } else if (
        selector &&
        typeof selector.prop === 'function' &&
        selector.prop('tagName') === 'IFRAME'
      ) {
        return selector[0].contentDocument.body;
      } else {
        return selector || 'body';
      }
    }

    var elements = findWithFinder($(selector()), 0);
    if (!allowMultiple) {
      expectOneElement(self, elements);
    }

    return elements.toArray();
  },

  resolve: function(options) {
    var self = this;
    var retryOptions = Options.remove(options, ['timeout', 'interval', 'trace']);
    var traceOption = retryOptions.hasOwnProperty('trace')? retryOptions.trace: true;

    var result = retry(retryOptions, function() {
      return self.findElements(options);
    });

    traceOption = false;
    if (traceOption) {
      return trace(result);
    } else {
      return result;
    }
  },

  notResolve: function(options) {
    var self = this;

    return retry(options, function() {
      var found = false;
      try {
        self.findElements({allowMultiple: true});
        found = true;
      } catch (e) {
      }
      if (found) {
        throw new Error("didn't expect to find element: " + self.printFinders(self._finders));
      }
    });
  },
  filter: function (filter, message) {
    var $ = this.get('$');
    return this.addFinder({
      find: function (elements) {
        var filteredElements = elements.toArray().filter(function(element){
          return filter($(element))
        });

        if (filteredElements && filteredElements.length > 0) {
          return $(filteredElements);
        }
      },

      toString: function () {
        return message || '[filter]';
      }
    });
  },

  enabled: function () {
    return this.filter(function (element) {
      var tagName = element.prop('tagName');
      return !((tagName == 'BUTTON' || tagName == 'INPUT') && element.prop('disabled'));
    }, '[disabled=false]');
  }

};
