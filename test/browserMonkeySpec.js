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

  function eventuallyInsertHtml(html) {
    setTimeout(function () {
      $(html).appendTo(div);
    }, 200);
  }

  describe('find', function () {
    it('should eventually find an element', function () {
      var promise = browser.find('.element').shouldExist();

      eventuallyInsertHtml('<div class="element"></div>');

      return promise;
    });

    it('should eventually find an element using a filter', function () {
      var promise = browser.find('.element').filter(function (element) {
        return element.classList.contains('correct');
      }, 'has class "correct"').element();

      $('<div class="element"></div>').appendTo(div);
      eventuallyInsertHtml('<div class="element correct"></div>');

      return promise.then(function (element) {
        expect(element.className).to.equal('element correct');
      });
    });

    it('filter fails with the right message', function () {
      var promise = browser.find('.element').filter(function (element) {
        return element.classList.contains('correct');
      }, 'has class "correct"').element();

      $('<div class="element"></div>').appendTo(div);
      eventuallyInsertHtml('<div class="element"></div>');

      return expect(promise).to.be.rejectedWith('has class "correct"');
    });

    it('should eventually find an element in an iframe', function(){
      var iframe = document.createElement('iframe');
      iframe.src = '/base/test/page1.html';
      iframe.width = 700;
      iframe.height = 1000;
      div.appendChild(iframe);
      var iframeScope = browser.scope(iframe);
      return iframeScope.find('a', {text: 'page 2'}).click().then(function(){
        return iframeScope.find('h1').shouldHave({text: 'Hello World'});
      });
    });
  });

  describe('is', function () {
    it('should eventually find an element if it has a class', function () {
      var good = browser.find('.element').is('.good').shouldExist();
      var bad = browser.find('.element').is('.bad').shouldExist();

      setTimeout(function () {
        var element = $('<div class="element"></div>').appendTo(div);

        setTimeout(function () {
          element.addClass('good');
        }, 100);
      }, 200);

      return Promise.all([good, expect(bad).to.be.rejected]);
    });
  });

  describe('shouldNotExist', function () {
    it("should ensure that element eventually doesn't exists", function () {
      var elementToRemove = $('<div class="removing"></div>').appendTo(div);
      var elementToStay = $('<div class="staying"></div>').appendTo(div);

      var good = browser.find('.removing').shouldNotExist();
      var bad = browser.find('.staying').shouldNotExist();

      setTimeout(function () {
        elementToRemove.remove();
      }, 50);

      return Promise.all([
        good,
        expect(bad).to.be.rejected
      ]);
    });
  });

  describe('clicking', function () {
    it('should eventually click an element', function () {
      var promise = browser.find('.element').click();
      var clicked = false;

      eventuallyInsertHtml(
        $('<div class="element"></div>').click(function () {
          clicked = true;
        })
      );

      return promise.then(function () {
        expect(clicked).to.equal(true);
      });
    });

    it('sends mousedown mouseup and click events', function () {
      var events = [];

      $('<div class="element"></div>').mousedown(function () {
        events.push('mousedown');
      }).mouseup(function () {
        events.push('mouseup');
      }).click(function () {
        events.push('click');
      }).appendTo(div);

      return browser.find('.element').click().then(function () {
        expect(events).to.eql(['mousedown', 'mouseup', 'click']);
      });
    });

    it('waits until checkbox is enabled before clicking', function () {
      var promise = browser.find('input[type=checkbox]').click();
      var clicked;
      var buttonState = 'disabled';

      var button = $('<input type=checkbox disabled></input>').appendTo(div);
      button[0].addEventListener('click', function () {
        clicked = buttonState;
      });

      setTimeout(function () {
        button.prop('disabled', false);
        buttonState = 'enabled'
      }, 100);

      return promise.then(function () {
        expect(clicked).to.equal('enabled');
      });
    });

    it('waits until button is enabled before clicking', function () {
      var promise = browser.find('button', {text: 'a button'}).click();
      var clicked;
      var buttonState = 'disabled';

      var button = $('<button disabled>a button</button>').appendTo(div);
      button[0].addEventListener('click', function () {
        clicked = buttonState;
      });

      setTimeout(function () {
        button.prop('disabled', false);
        buttonState = 'enabled'
      }, 100);

      return promise.then(function () {
        expect(clicked).to.equal('enabled');
      });
    });
  });

  it('should eventually select an option element', function(){
    var promise = browser.find('.element').select({text: 'Second'});
    var selectedItem = undefined;

    eventuallyInsertHtml(
      $('<select class="element"><option>First</option><option>Second</option></select>').change(function (e) {
        var el = e.target;
        selectedItem = el.options[el.selectedIndex].text;
      })
    );

    return promise.then(function () {
      expect(selectedItem).to.equal('Second');
    });
  });

  it('should eventually enter text into an element', function () {
    var promise = browser.find('.element').typeIn('haha');
    var clicked = false;

    eventuallyInsertHtml('<input type="text" class="element"></input>');

    return promise.then(function () {
      expect($(div).find('input.element').val()).to.equal('haha');
    });
  });

  it('eventually finds an element containing text', function () {
    var promise = browser.find('.element', {text: 'some t'}).shouldExist();
    eventuallyInsertHtml('<div class="element"><div>some text</div></div>');
    return promise;
  });

  describe('shouldHave', function () {
    it('eventually finds an element and asserts that it has text', function () {
      var good = browser.find('.element').shouldHave({text: 'some t'});
      var bad = browser.find('.element').shouldHave({text: 'sme t'});

      eventuallyInsertHtml('<div class="element"><div>some text</div></div>');

      return Promise.all([
        good,
        expect(bad).to.be.rejected
      ]);
    });

    it('eventually finds an element and asserts that it has value', function () {
      var good = browser.find('.element input').shouldHave({value: 'some t'});
      var bad = browser.find('.element input').shouldHave({value: 'sme t'});

      eventuallyInsertHtml('<div class="element"><input type=text value="some text" /></div>');

      return Promise.all([
        good,
        expect(bad).to.be.rejected
      ]);
    });

    it('eventually finds elements and asserts that they each have text', function () {
      var good = browser.find('.element div').shouldHave({text: ['one', 2]});
      var bad1 = browser.find('.element div').shouldHave({text: ['one']});
      var bad2 = browser.find('.element div').shouldHave({text: ['one', 'three']});

      eventuallyInsertHtml('<div class="element"><div>\nfirst one</div><div>number 2\n</div></div>');

      return Promise.all([
        good,
        expect(bad1).to.be.rejected,
        expect(bad2).to.be.rejected
      ]);
    });

    it('eventually finds elements and asserts that they each have value', function () {
      var good = browser.find('.element input').shouldHave({value: ['one', 2]});
      var bad1 = browser.find('.element input').shouldHave({value: ['one']});
      var bad2 = browser.find('.element input').shouldHave({value: ['one', 'three']});

      eventuallyInsertHtml('<div class="element"><input type=text value="first one"></input><input type=text value="number 2"></input></div>');

      return Promise.all([
        good,
        expect(bad1).to.be.rejected,
        expect(bad2).to.be.rejected
      ]);
    });

    it('eventually finds an element and asserts that it has css', function () {
      var good = browser.find('.element').shouldHave({css: '.the-class'});
      var bad1 = browser.find('.element').shouldHave({css: '.not-the-class'});
      var bad2 = browser.find('.element').shouldHave({css: '.not-found'});

      eventuallyInsertHtml('<div class="element the-class"><div class="not-the-class">some text</div></div>');

      return Promise.all([
        good,
        expect(bad1).to.be.rejected,
        expect(bad2).to.be.rejected
      ]);
    });

    it('eventually finds an element and asserts that it has n elements', function () {
      var good = browser.find('.element').shouldHave({length: 2});
      var bad1 = browser.find('.element').shouldHave({length: 1});

      eventuallyInsertHtml('<div class="element"></div><div class="element"></div>');

      return Promise.all([
        good,
        expect(bad1).to.be.rejected
      ]);
    });

    it('eventually finds an element and asserts that it passes a predicate', function () {
      var good1 = browser.find('.element').shouldHave({elements: function (elements) {
        return $(elements).text() == 'a';
      }});
      var good2 = browser.find('.element').shouldHave(function (elements) {
        return $(elements).text() == 'a';
      });
      var bad1 = browser.find('.element').shouldHave({elements: function (elements) {
        return $(elements).text() == 'b';
      }, message: 'expected to have text b'});

      eventuallyInsertHtml('<div class="element"></div><div class="element">a</div>');

      return Promise.all([
        good1,
        good2,
        expect(bad1).to.be.rejectedWith('expected to have text b')
      ]);
    });
  });

  describe('containing', function () {
    it('eventually finds an element containing another element', function () {
      var promise = browser.find('.outer').containing('.inner').shouldExist();

      setTimeout(function () {
        $('<div class="outer"><div>bad</div></div>').appendTo(div);
        $('<div class="outer"><div class="inner">good</div></div>').appendTo(div);
      }, 200);

      return promise;
    });

    it('element returns the outer element', function () {
      var promise = browser.find('.outer').containing('.inner').element();

      setTimeout(function () {
        $('<div class="outer"><div>bad</div></div>').appendTo(div);
        $('<div class="outer"><div class="inner">good</div></div>').appendTo(div);
      }, 200);

      return promise.then(function (element) {
        expect($(element).is('.outer')).to.be.true;
      });
    });

    it("fails if it can't find an element containing another", function () {
      var promise = browser.find('.outer').containing('.inner').shouldExist();

      setTimeout(function () {
        $('<div class="outer"><div>bad</div></div>').appendTo(div);
      }, 200);

      return expect(promise).to.be.rejected;
    });
  });

  describe('chains', function () {
    it('eventually finds the inner element, even if the outer element exists', function () {
      var promise = browser.find('.outer').find('.inner').shouldExist();

      setTimeout(function () {
        var outer = $('<div class="outer"></div>').appendTo(div);
        setTimeout(function () {
          $('<div class="inner">good</div>').appendTo(outer);
        }, 200);
      }, 200);

      return promise;
    });

    it('fails to find the inner element if it never arrives', function () {
      var promise = browser.find('.outer').find('.inner').shouldExist();

      setTimeout(function () {
        var outer = $('<div class="outer"></div>').appendTo(div);
      }, 200);

      return expect(promise).to.be.rejected;
    });
  });

  describe('scope', function () {
    it('can scope with an element', function () {
      var red = $('<div><div class="element">red</div></div>').appendTo(div);
      var blue = $('<div><div class="element">blue</div></div>').appendTo(div);

      return browser.scope(red).find('.element').element().then(function (element) {
        expect($(element).text()).to.equal('red');
      }).then(function () {
        return browser.scope(blue).find('.element').element();
      }).then(function (element) {
        expect($(element).text()).to.equal('blue');
      });
    });

    it('can scope with another finder', function () {
      var red = $('<div class="red"><div class="element">red</div></div>').appendTo(div);
      var blue = $('<div class="blue"><div class="element">blue</div></div>').appendTo(div);

      return browser.scope(browser.find('.red')).find('.element').element().then(function (element) {
        expect($(element).text()).to.equal('red');
      }).then(function () {
        return browser.scope(browser.find('.blue')).find('.element').element();
      }).then(function (element) {
        expect($(element).text()).to.equal('blue');
      });
    });
  });

  describe('component', function () {
    it('can return new selectors by extending', function () {
      var user = browser.component({
        name: function () {
          return this.find('.user-name');
        },

        address: function () {
          return this.find('.user-address');
        }
      });

      var promise = user.name().shouldExist();

      eventuallyInsertHtml('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>');

      return promise;
    });

    it('components are independent', function () {
      var user = browser.component({
        name: function () {
          return this.find('.user-name');
        }
      });

      var bah = browser.component({
        name: function () {
          return this.find('.bah-name');
        }
      });

      var promise = user.name().shouldExist();

      eventuallyInsertHtml('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>');

      return promise;
    });

    it('can extend another component', function () {
      var user = browser.component({
        name: function () {
          return this.find('.user-name');
        },

        address: function () {
          return this.find('.user-address');
        }
      });

      var bossUser = user.component({
        secondAddress: function () {
          return this.find('.user-second-address');
        }
      });

      var name = bossUser.name().shouldExist();
      var secondAddress = bossUser.secondAddress().shouldExist();

      eventuallyInsertHtml('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div><div class="user-second-address">bob\'s second address</div></div>');

      return Promise.all([name, secondAddress]);
    });

    it('can return new scoped selectors', function () {
      var admin = browser.component({
        user: function () {
          return user.scope(this.find('.user'));
        }
      });

      var user = browser.component({
        name: function () {
          return this.find('.user-name');
        },

        address: function () {
          return this.find('.user-address');
        }
      });

      var promise = admin.user().name().shouldExist();

      eventuallyInsertHtml('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>');

      return promise;
    });

    it('components inherit scope', function () {
      var adminArea = browser.find('.admin');

      var admin = adminArea.component({
        user: function () {
          return this.find('.user');
        }
      });

      var promise = admin.user().shouldHave({text: ['Jane']});

      eventuallyInsertHtml(
          '<div class="user">Bob</div>'
        + '<div class="admin">'
          + '<div class="user">Jane</div>'
        + '</div>'
      );

      return promise;
    });
  });
});
