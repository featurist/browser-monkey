var chai = require('chai');
var expect = chai.expect;
var elementsToString = require('./elementsToString');

function assertElementProperties($, elements, expected, getProperty, exact) {
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
    var elementText = getProperty($(elements));
    assertion(elementText, expected);
  }
}

function getNormalisedText(el) {
  return el.innerText().replace(/ +/g,' ').replace(/ *\n */g,"\n");
}

module.exports = {
  css: function($el, message, css) {
    if (!$el.is(css)) {
      throw new Error(message || ('expected elements ' + elementsToString($el) + ' to have css ' + css));
    }
  },
  elements: function($el, message, predicate){
    if (!predicate($el.toArray())) {
      throw new Error(message || 'expected elements to pass predicate');
    }
  },
  text: function($el, message, text) {
    assertElementProperties(this.get('$'), $el, text, function (e) { return getNormalisedText(e); });
  },
  length: function($el, message, length) {
    if ($el.length !== length) {
      throw new Error(message || ('expected ' + elementsToString($el) + ' to have ' + length + ' elements'));
    }
  },
  html: function($el, message, html) {
    assertElementProperties(this.get('$'), $el, html, function (e) { return e.html(); });
  },
  checked: function($el, message, checked) {
    var $ = this.get('$');
    var elements = $el.toArray();

    if (checked instanceof Array) {
      var elementsChecked = elements.map(function (element) {
        return !!$(element).prop('checked');
      });
      expect(elementsChecked, 'expected ' + elementsToString($el) + ' to have checked states ' + JSON.stringify(checked)).to.eql(checked);
    } else {
      var elementsNotMatching = elements.filter(function (element) {
        return $(element).prop('checked') !== checked;
      });
      expect(elementsNotMatching.length, 'expected ' + elementsToString($el) + ' to be ' + (checked? 'checked': 'unchecked')).to.equal(0);
    }
  },
  exactText: function($el, message, exactText) {
    assertElementProperties(this.get('$'), $el, exactText, function (e) { return getNormalisedText(e); }, true);
  },
  value: function($el, message, value) {
    assertElementProperties(this.get('$'), $el, value, function (e) { return e.val() || ''; });
  },
  exactValue: function($el, message, exactValue) {
    assertElementProperties(this.get('$'), $el, exactValue, function (e) { return e.val() || ''; }, true);
  },
  attributes: function($el, message, attributes) {
    var $ = this.get('$');
    var elements = $el.toArray();

    elements.forEach(function(el){
      Object.keys(attributes).forEach(function(attributeKey){
        expect($(el).attr(attributeKey)).to.equal(attributes[attributeKey]);
      });
    });
  }
};
