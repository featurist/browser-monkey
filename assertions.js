var Options = require('./options');
var elementTester = require('./elementTester');
var expectOneElement = require('./expectOneElement');

module.exports = {
  is: function (css) {
    var $ = this.get('$');
    return this.addFinder(elementTester($, {css: css}));
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
    var $ = this.get('$');
    var self = this;

    var resolveOptions = Options.remove(options, ['timeout', 'interval']);
    resolveOptions.allowMultiple = true;

    var additionalAssertions = Object.keys(options).filter(function(finderMethodName){
      return options[finderMethodName] && options[finderMethodName].constructor === Object;
    });

    var additionalOptions = Options.remove(options, additionalAssertions);

    var assertions = additionalAssertions.map(function(finderMethodName){
      return self[finderMethodName]().shouldHave(additionalOptions[finderMethodName]);
    });

    assertions.push(this.addFinder(elementTester($, options)).shouldExist(resolveOptions));
    return Promise.all(assertions);
  },

  shouldHaveElement: function(fn, options) {
    var $ = this.get('$');
    var self = this;

    return this.addFinder({
      find: function (elements) {
        expectOneElement(self, elements);
        elements.toArray().forEach(function(element){
          fn($(element));
        });
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
    var $ = this.get('$');
    var resolveOptions = Options.remove(options, ['timeout', 'interval']);
    resolveOptions.allowMultiple = true;

    return this.addFinder(elementTester($, options)).shouldNotExist(resolveOptions);
  }
};
