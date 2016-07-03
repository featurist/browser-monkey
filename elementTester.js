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

function getValue(e, property) {
  var val = e.val();
  // Fails with missing value attribute in VDOM without 'string' test (returns SoftSetHook{value: ''})
  return (typeof val === "string" && val) || '';
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
    assertElementProperties(this.get('$'), $el, text, function (e) { return getNormalisedText(e)}, text === '');
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
    assertElementProperties(this.get('$'), $el, value, getValue, value === '');
  },
  exactValue: function($el, message, exactValue) {
    assertElementProperties(this.get('$'), $el, exactValue, getValue, true);
  },
  attributes: function($el, message, attributes) {
    var $ = this.get('$');
    var elements = $el.toArray();

    elements.forEach(function(el){
      Object.keys(attributes).forEach(function(attributeKey){
        expect($(el).attr(attributeKey)).to.equal(attributes[attributeKey]);
      });
    });
  },

  label: function($el, message, label) {
    var $ = this.get('$');
    var links = $el.toArray().filter(function(el) {
      if ($(el).is('a')) {
        var anchor = $(el);
        var href = anchor.attr('href');
        return typeof href !== typeof undefined &&
        href !== false &&
        (
         anchor.text() == label ||
         anchor.attr('id') == label ||
         anchor.attr('title') == label ||
         anchor.find("img").toArray().filter(function(img) {
           return $(img).attr('alt') == label;
         }).length > 0
        );
      }
      if ($(el).is('button, input[type=submit], input[type=button], input[type=reset]')) {
        var button = $(el);
        return button.attr('id') == label ||
      button.text() == label ||
      (typeof button.attr('value') == 'string' && button.attr('value').indexOf(label) > -1) ||
      (typeof button.attr('title') == 'string' && button.attr('title').indexOf(label) > -1) ||
      button.find("img").toArray().filter(function(img) {
        return typeof $(img).attr('alt') == 'string' && $(img).attr('alt').indexOf(label) > -1;
      }).length > 0
      
      }
    });

    expect(links.length).to.equal(1, message);
  }
};
