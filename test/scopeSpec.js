var browser = require('..');
var createTestDom = require('./createTestDom');
var $ = require('jquery');

describe('scope', function () {
  var dom;

  beforeEach(function(){
    dom = createTestDom();
  });

  it('can scope with an element', function () {
    var red = dom.insert('<div><div class="element">red</div></div>');
    var blue = dom.insert('<div><div class="element">blue</div></div>');

    return browser.scope(red).find('.element').element().then(function (element) {
      expect($(element).text()).to.equal('red');
    }).then(function () {
      return browser.scope(blue).find('.element').element();
    }).then(function (element) {
      expect($(element).text()).to.equal('blue');
    });
  });

  it('can scope with another finder', function () {
    var red = dom.insert('<div class="red"><div class="element">red</div></div>');
    var blue = dom.insert('<div class="blue"><div class="element">blue</div></div>');

    return browser.scope(browser.find('.red')).find('.element').element().then(function (element) {
      expect($(element).text()).to.equal('red');
    }).then(function () {
      return browser.scope(browser.find('.blue')).find('.element').element();
    }).then(function (element) {
      expect($(element).text()).to.equal('blue');
    });
  });
});

