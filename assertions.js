var Options = require('./options');
var elementTester = require('./elementTester');
var expectOneElement = require('./expectOneElement');

module.exports = {
  containing: function (selector, options) {
    var message = options && JSON.stringify(options);
    var findElements = this.elementFinder(selector);
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
  },

  is: function (css) {
    return this.addFinder(elementTester({css: css}));
  },

  exists: function (options) {
    return this.shouldExist(options);
  },

  shouldExist: function (options) {
    return this.resolve(options).then(function () {});
  },

  shouldNotExist: function (options) {
    return this.notResolve(options);
  },

  has: function(options) {
    return this.shouldHave(options);
  },

  shouldHave: function(options) {
    var resolveOptions = Options.remove(options, ['timeout', 'interval']);
    resolveOptions.allowMultiple = true;

    return this.addFinder(elementTester(options)).shouldExist(resolveOptions);
  },

  shouldHaveElement: function(fn, options) {
    var self = this;

    return this.addFinder({
      find: function (elements) {
        expectOneElement(self, elements);
        elements.toArray().forEach(fn);
        return elements;
      }
    }).shouldExist(options);
  },

  shouldHaveElements: function(fn, options) {
    options = Options.default(options, {allowMultiple: true, trace: false});

    return this.addFinder({
      find: function (elements) {
        fn(elements.toArray());
        return elements;
      }
    }).shouldExist(options);
  },

  shouldNotHave: function(options) {
    var resolveOptions = Options.remove(options, ['timeout', 'interval']);
    resolveOptions.allowMultiple = true;

    return this.addFinder(elementTester(options)).shouldNotExist(resolveOptions);
  }
};
