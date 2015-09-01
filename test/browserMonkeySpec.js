require('lie/polyfill');
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

  function insertHtml(html){
    return $(html).appendTo(div);
  }

  function eventuallyInsertHtml(html) {
    setTimeout(function () {
      insertHtml(html);
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

    it('calls a function for each element found', function(){
      var promise = browser.find('span').elements();

      eventuallyInsertHtml('<div><span>a</span><span>b</span></div>');

      return promise.then(function(elements){
        expect(elements.length).to.equal(2);
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

    it('allows trytryagain parameters to be used', function () {
      var elementToRemove = $('<div class="removing"></div>').appendTo(div);

      var promise = browser.find('.removing').shouldNotExist({timeout: 500, interval: 100});

      setTimeout(function () {
        elementToRemove.remove();
      }, 50);

      return promise;
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

  describe('select', function(){
    describe('text', function(){
      it('should eventually select an option element using the text', function(){
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

      it('should eventually select an option element using a partial match', function(){
        var promise = browser.find('.element').select({text: 'Seco'});
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

      it('should select an option that eventually appears', function(){
        var promise = browser.find('.element').select({text: 'Second'});
        var selectedItem = undefined;

        var select = $('<select class="element"></select>').appendTo(div).change(function (e) {
          var el = e.target;
          selectedItem = el.options[el.selectedIndex].text;
        });

        setTimeout(function () {
          $('<option>First</option><option>Second</option>').appendTo(select);
        }, 20);

        return promise.then(function () {
          expect(selectedItem).to.equal('Second');
        });
      });

      it('should error when the specified option does not exist', function(){
        var promise = browser.find('.element').select({text: 'Does not exist'});

        eventuallyInsertHtml($('<select class="element"><option>First</option><option>Second</option></select>'));

        return Promise.all([
          expect(promise).to.be.rejected
        ]);
      });

      it('should select an option using text that is falsy', function(){
        var promise = browser.find('.element').select({text: 0});
        var selectedItem = undefined;

        var select = $('<select class="element"><option>0</option><option>1</option></select>').appendTo(div).change(function (e) {
          var el = e.currentTarget;
          selectedItem = el.options[el.selectedIndex].text;
        });


        return promise.then(function () {
          expect(selectedItem).to.equal('0');
        });
      });
    });

    describe('exactText', function(){
      it('should select an option using exact text that would otherwise match multiple options', function(){
        var promise = browser.find('.element').select({exactText: 'Mr'});
        var selectedItem = undefined;

        var select = $('<select class="element"><option>Mr</option><option>Mrs</option></select>').appendTo(div).change(function (e) {
          var el = e.currentTarget;
          selectedItem = el.options[el.selectedIndex].text;
        });


        return promise.then(function () {
          expect(selectedItem).to.equal('Mr');
        });
      });

      it('should select an option using exact text that is falsy', function(){
        var promise = browser.find('.element').select({exactText: 0});
        var selectedItem = undefined;

        var select = $('<select class="element"><option>0</option><option>1</option></select>').appendTo(div).change(function (e) {
          var el = e.currentTarget;
          selectedItem = el.options[el.selectedIndex].text;
        });


        return promise.then(function () {
          expect(selectedItem).to.equal('0');
        });
      });
    });
  });

  describe('typeIn', function(){
    it('should eventually enter text into an element', function () {
      var promise = browser.find('.element').typeIn('haha');

      eventuallyInsertHtml('<input type="text" class="element"></input>');

      return promise.then(function () {
        expect($(div).find('input.element').val()).to.equal('haha');
      });
    });

    it('typing empty text blanks out existing text', function () {
      var firedEvents = [];
      insertHtml('<input type="text" class="element" value="good bye">')
        .on('input', function(){ firedEvents.push('input'); });

      return browser.find('.element').typeIn('').then(function () {
        expect($(div).find('input.element').val()).to.equal('');
        expect(firedEvents).to.eql(['input'])
      });
    });
  });

  describe('events', function(){
    it('typeIn element should fire change', function(){
      var firedEvents = [];

      insertHtml('<input type="text" class="input">')
        .on('blur', function(){
          firedEvents.push('blur');
        }).on('change', function(){
          firedEvents.push('change');
        })

      return browser.find('.input').typeIn('first').then(function(){
        expect(firedEvents).to.eql([
          'change'
        ])
      });
    });

    it('typeIn element should fire input on each character', function(){
      var firedEvents = [];

      insertHtml('<input type="text" class="input">')
        .on('input', function(){
          firedEvents.push('input');
        });

      return browser.find('.input').typeIn('123').then(function(){
        expect(firedEvents).to.eql([
          'input',
          'input',
          'input'
        ])
      });
    });

    it('typeIn element should fire change and then blur event on input', function(){
      var firedEvents = [];

      insertHtml('<input type="text" class="input"><input type="text" class="change">');

      $(div).find('.input').one('blur', function(e){
        firedEvents.push('blur');
      }).one('change', function(){
        firedEvents.push('change');
      });

      return browser.find('.input').typeIn('first').then(function(){
        return browser.find('.change').typeIn('second');
      }).then(function () {
        expect(firedEvents).to.eql([
          'change',
          'blur'
        ])
      });
    });

    it('click element should fire blur event on input', function(){
      var blurred = false;

      insertHtml('<input type="text" class="input"><button>button</button>');


      $(div).find('.input').on('blur', function(e){
        if (e.target.className === 'input') {
          blurred = true;
        }
      })

      return browser.find('.input').typeIn('first').then(function(){
        return browser.find('button').click();
      }).then(function(){
        expect(blurred).to.be.true
      });
    });

    it('select element should fire blur event on input', function(){
      var blurred = false;

      insertHtml('<input type="text" class="input"><select><option>one</option></select>');


      $(div).find('.input').on('blur', function(e){
        if (e.target.className === 'input') {
          blurred = true;
        }
      })

      return browser.find('.input').typeIn('first').then(function(){
        return browser.find('select').select({text: 'one'});
      }).then(function(){
        expect(blurred).to.be.true
      });
    });
  })

  it('eventually finds an element containing text', function () {
    var promise = browser.find('.element', {text: 'some t'}).shouldExist();
    eventuallyInsertHtml('<div class="element"><div>some text</div></div>');
    return promise;
  });

  it('eventually finds an element containing exactText', function () {
    var good = browser.find('.a', {exactText: '8'}).shouldExist();
    var bad = browser.find('.b', {exactText: '8'}).shouldExist();

    eventuallyInsertHtml('<div><div class="a">8</div><div class="b">28</div></div>');

    return Promise.all([
      good,
      expect(bad).to.be.rejected
    ]);
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

    it('allows trytryagain parameters to be used', function () {
      var good = browser.find('.element').shouldHave({text: 'some t', timeout: 400, interval: 100});
      var bad = browser.find('.element').shouldHave({text: 'sme t'});

      eventuallyInsertHtml('<div class="element"><div>some text</div></div>');

      return Promise.all([
        good,
        expect(bad).to.be.rejected
      ]);
    });

    it('eventually finds an element and asserts that it has value', function () {
      var good1 = browser.find('.element1 input').shouldHave({value: 'some t'});
      var good2 = browser.find('.element2 input').shouldHave({value: 0});
      var bad = browser.find('.element1 input').shouldHave({value: 'sme t'});

      eventuallyInsertHtml('<div class="element1"><input type=text value="some text" /></div>');
      eventuallyInsertHtml('<div class="element2"><input type=text value="0" /></div>');

      return Promise.all([
        good1,
        good2,
        expect(bad).to.be.rejected
      ]);
    });

    describe('checkboxes', function () {
      it('eventually finds a checked checkbox', function () {
        var good = browser.find('.checkbox').shouldHave({checked: true});

        var checkbox = $('<input class="checkbox" type=checkbox />').appendTo(div);
        setTimeout(function () {
          checkbox.prop('checked', true);
        }, 20);

        return Promise.all([
          good
        ]);
      });

      it('fails if only one of many checkboxes is checked', function () {
        var good = browser.find('.checkbox').shouldHave({checked: true});

        var checkbox = $('<input class="checkbox" type=checkbox /><input class="checkbox" type=checkbox />').appendTo(div);
        setTimeout(function () {
          checkbox[0].checked = true;
        }, 20);

        return Promise.all([
          expect(good).to.be.rejected
        ]);
      });

      it('ensures that each checkbox in the scope is either checked or unchecked', function () {
        var good = browser.find('.checkbox').shouldHave({checked: [true, false]});
        var bad = browser.find('.checkbox').shouldHave({checked: [false, true]});

        var checkbox = $('<input class="checkbox" type=checkbox /><input class="checkbox" type=checkbox />').appendTo(div);
        setTimeout(function () {
          checkbox[0].checked = true;
        }, 20);

        return Promise.all([
          good,
          expect(bad).to.be.rejected
        ]);
      });

      it('fails to find a checked checkbox', function () {
        var good = browser.find('.checkbox').shouldHave({checked: false});
        var bad = browser.find('.checkbox').shouldHave({checked: true});

        var checkbox = $('<input class="checkbox" type=checkbox />').appendTo(div);

        return Promise.all([
          good,
          expect(bad).to.be.rejected
        ]);
      });
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
      var good = browser.find('.element input').shouldHave({value: ['one', 2, 0]});
      var bad1 = browser.find('.element input').shouldHave({value: ['one']});
      var bad2 = browser.find('.element input').shouldHave({value: ['one', 'three']});

      eventuallyInsertHtml('<div class="element"><input type=text value="first one"><input type=text value="number 2"><input type="text" value="0"></div>');

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

  describe('shouldNotHave', function () {
    it('eventually finds an element and asserts that it does not have text', function () {
      var promise = browser.find('.element').shouldNotHave({text: 'sme t'});

      eventuallyInsertHtml('<div class="element"><div>some text</div></div>');

      return promise;
    });

    it('allows trytryagain parameters to be used', function () {
      var promise = browser.find('.element').shouldNotHave({text: 'sme t', timeout: 400, interval: 100});

      eventuallyInsertHtml('<div class="element"><div>some text</div></div>');

      return promise;
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
