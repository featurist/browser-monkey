var browser = require('..');
var chai = require("chai");
var expect = chai.expect;
var createTestDiv = require('./createTestDiv');
var $ = require('jquery');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe('browser-monkey', function () {
  var div;

  beforeEach(function () {
    div = createTestDiv();
  });

  it('should eventually find an element', function () {
    var promise = browser.find('.element').exists();
    setTimeout(function () {
      $('<div class="element"></div>').appendTo(div);
    }, 200);
    return promise;
  });

  it('should eventually click an element', function () {
    var promise = browser.find('.element').click();
    var clicked = false;

    setTimeout(function () {
      $('<div class="element"></div>').click(function () {
        clicked = true;
      }).appendTo(div);
    }, 200);

    return promise.then(function () {
      expect(clicked).to.equal(true);
    });
  });

  it('should eventually enter text into an element', function () {
    var promise = browser.find('.element').typeIn('haha');
    var clicked = false;

    setTimeout(function () {
      $('<input type="text" class="element"></input>').appendTo(div);
    }, 200);

    return promise.then(function () {
      expect($(div).find('input.element').val()).to.equal('haha');
    });
  });

  it('eventually finds an element containing text', function () {
    var promise = browser.find('.element', {text: 'some t'}).exists();
    setTimeout(function () {
      $('<div class="element"><div>some text</div></div>').appendTo(div);
    }, 200);
    return promise;
  });

  describe('shouldHave', function () {
    it('eventually finds an element and asserts that it has text', function () {
      var good = browser.find('.element').shouldHave({text: 'some t'});
      var bad = browser.find('.element').shouldHave({text: 'sme t'});

      setTimeout(function () {
        $('<div class="element"><div>some text</div></div>').appendTo(div);
      }, 200);

      return Promise.all([
        good,
        expect(bad).to.be.rejected
      ]);
    });

    it('eventually finds an element and asserts that it has css', function () {
      var good = browser.find('.element').shouldHave({css: '.the-class'});
      var bad1 = browser.find('.element').shouldHave({css: '.not-the-class'});
      var bad2 = browser.find('.element').shouldHave({css: '.not-found'});

      setTimeout(function () {
        $('<div class="element the-class"><div class="not-the-class">some text</div></div>').appendTo(div);
      }, 200);

      return Promise.all([
        good,
        expect(bad1).to.be.rejected,
        expect(bad2).to.be.rejected
      ]);
    });

    it('eventually finds an element and asserts that it has n elements', function () {
      var good = browser.find('.element').shouldHave({length: 2});
      var bad1 = browser.find('.element').shouldHave({length: 1});

      setTimeout(function () {
        $('<div class="element"></div><div class="element"></div>').appendTo(div);
      }, 200);

      return Promise.all([
        good,
        expect(bad1).to.be.rejected
      ]);
    });

    it('eventually finds an element and asserts that it passes a predicate', function () {
      var good1 = browser.find('.element').shouldHave({elements: function (elements) {
        return elements.text() == 'a';
      }});
      var good2 = browser.find('.element').shouldHave(function (elements) {
        return elements.text() == 'a';
      });
      var bad1 = browser.find('.element').shouldHave({elements: function (elements) {
        return elements.text() == 'b';
      }, message: 'expected to have text b'});

      setTimeout(function () {
        $('<div class="element"></div><div class="element">a</div>').appendTo(div);
      }, 200);

      return Promise.all([
        good1,
        good2,
        expect(bad1).to.be.rejectedWith('expected to have text b')
      ]);
    });
  });

  it('eventually finds an element containing another element', function () {
    var promise = browser.find('.outer').containing('.inner').exists();
    setTimeout(function () {
      $('<div class="outer"><div>bad</div></div>').appendTo(div);
      $('<div class="outer"><div class="inner">good</div></div>').appendTo(div);
    }, 200);

    return promise.then(function (element) {
      expect($(element).text()).to.equal('good');
    });
  });

  it('can scope with an element', function () {
    var red = $('<div><div class="element">red</div></div>').appendTo(div);
    var blue = $('<div><div class="element">blue</div></div>').appendTo(div);

    return browser.scope(red).find('.element').exists().then(function (element) {
      expect($(element).text()).to.equal('red');
    }).then(function () {
      return browser.scope(blue).find('.element').exists();
    }).then(function (element) {
      expect($(element).text()).to.equal('blue');
    });
  });

  it('can scope with another finder', function () {
    var red = $('<div class="red"><div class="element">red</div></div>').appendTo(div);
    var blue = $('<div class="blue"><div class="element">blue</div></div>').appendTo(div);

    return browser.scope(browser.find('.red')).find('.element').exists().then(function (element) {
      expect($(element).text()).to.equal('red');
    }).then(function () {
      return browser.scope(browser.find('.blue')).find('.element').exists();
    }).then(function (element) {
      expect($(element).text()).to.equal('blue');
    });
  });

  describe('extend', function () {
    it('can return new selectors by extending', function () {
      var user = browser.extend({
        name: function () {
          return this.find('.user-name');
        },

        address: function () {
          return this.find('.user-address');
        }
      });

      var promise = user.name().exists();

      setTimeout(function () {
        $('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>').appendTo(div);
      }, 50);

      return promise;
    });

    it('can return new scoped selectors', function () {
      var admin = browser.extend({
        user: function () {
          return user.scope(this.find('.user'));
        }
      });

      var user = browser.extend({
        name: function () {
          return this.find('.user-name');
        },

        address: function () {
          return this.find('.user-address');
        }
      });

      var promise = admin.user().name().exists();

      setTimeout(function () {
        $('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>').appendTo(div);
      }, 50);

      return promise;
    });
  });
});
