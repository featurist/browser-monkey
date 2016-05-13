var domTest = require('./domTest');

describe('scope', function () {
  domTest('can scope with an element', function (browser, dom, $) {
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

  domTest('can scope with another finder', function (browser, dom, $) {
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

