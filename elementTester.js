var chai = require('chai');
var expect = chai.expect;

var Options = require('./options');
var elementsToString = require('./elementsToString');


module.exports = function elementTester($, options) {
  function assertElementProperties(elements, expected, getProperty, exact) {
    function assertion(actual, expected) {
      if (exact) {
        expect(actual, 'expected element to have exact text ' + JSON.stringify(expected) + ' but contained ' + JSON.stringify(actual)).to.equal(expected.toString());
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

  var options = new Options(options);

  var css = options.option('css');
  var text = options.option('text');
  var exactText = options.option('exactText');
  var message = options.option('message');
  var predicate = options.option('elements');
  var length = options.option('length');
  var value = options.option('value');
  var exactValue = options.option('exactValue');
  var html = options.option('html');
  var checked = options.option('checked');

  options.validate();

  if (typeof options === 'string') {
    css = options;
  }

  if (typeof options === 'function') {
    predicate = options;
  }

  function getNormalisedText(el) {
    return $($(el)[0]).text().replace(/ +/g,' ').replace(/ *\n */g,"\n");
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
        assertElementProperties(els, text, function (e) { return getNormalisedText(e); });
      }

      if (exactText !== undefined) {
        assertElementProperties(els, exactText, function (e) { return getNormalisedText(e); }, true);
      }

      if (value !== undefined) {
        assertElementProperties(els, value, function (e) { return e.val() || ''; });
      }

      if (exactValue !== undefined) {
        assertElementProperties(els, exactValue, function (e) { return e.val() || ''; }, true);
      }

      if (checked) {
        var elements = els.toArray();

        if (checked instanceof Array) {
          var elementsChecked = elements.map(function (element) {
            return !!$(element).prop('checked');
          });
          expect(elementsChecked, 'expected ' + elementsToString(els) + ' to have checked states ' + JSON.stringify(checked)).to.eql(checked);
        } else {
          var elementsNotMatching = elements.filter(function (element) {
            return $(element).prop('checked') !== checked;
          });
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
