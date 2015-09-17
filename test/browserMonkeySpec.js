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

  it('eventually finds an element containing text as it appears on the page', function () {
    var promise = browser.find('.element', {text: 'This is some text that is all on one line.\nAnd some more on another line'}).shouldExist();
    eventuallyInsertHtml('<div class="element"><div>\
    This\
    is\
    some\
    text\
    that is all on one line.\
    <br/>\
    And some more on another line.\
  </div></div>');
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

    describe('exactText', function(){
      it('eventually finds elements that have the exact array of text', function(){
        var promise = browser.find('.element option').shouldHave({exactText: ['', 'Mr', 'Mrs']});

        eventuallyInsertHtml('<select class="element"><option></option><option>Mr</option><option>Mrs</option></select>');

        return promise;
      });
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
      var good1 = browser.find('.element').shouldHaveElement(function (element) {
        expect(element.innerText).to.equal('a');
      });

      var bad1 = browser.find('.multi').shouldHaveElement(function (element) {
        expect(element.innerText).to.equal('b');
      });

      var bad2 = browser.find('.element').shouldHaveElement(function (element) {
        expect(element.innerText).to.equal('b');
      });

      var element = $('<div class="element"></div>').appendTo(div);
      eventuallyInsertHtml('<div class="multi"></div><div class="multi">b</div>');

      setTimeout(function () {
        element.text('a');
      }, 30);

      return Promise.all([
        good1,
        expect(bad1).to.be.rejectedWith('expected to find exactly one element'),
        expect(bad2).to.be.rejectedWith("expected 'a' to equal 'b'")
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

  describe('callbacks on interaction', function () {
    it('fires events on clicks', function () {
      var button = $('<button>a button</button>').appendTo(div)[0];

      var event;

      return browser.on(function (e) {
        event = e;
      }).find('button').click().then(function () {
        expect(event, 'expected event to fire').to.not.be.undefined;
        expect(event.type).to.equal('click');
        expect(event.element).to.equal(button);
      });
    });

    it('fires events on typeIn', function () {
      var input = $('<input></input>').appendTo(div)[0];

      var event;

      return browser.on(function (e) {
        event = e;
      }).find('input').typeIn('some text').then(function () {
        expect(event, 'expected event to fire').to.not.be.undefined;
        expect(event.type).to.equal('typing');
        expect(event.text).to.equal('some text');
        expect(event.element).to.equal(input);
      });
    });

    it('fires events on typeIn', function () {
      var editorDiv = $('<div class="editor"></div>').appendTo(div)[0];

      var event;

      return browser.on(function (e) {
        event = e;
      }).find('div.editor').typeInHtml('some <b>html</b>').then(function () {
        expect(event, 'expected event to fire').to.not.be.undefined;
        expect(event.type).to.equal('typing html');
        expect(event.html).to.equal('some <b>html</b>');
        expect(event.element).to.equal(editorDiv);
      });
    });

    it('fires events on select', function () {
      var select = $('<select><option>one</option></select>').appendTo(div)[0];

      var event;

      return browser.on(function (e) {
        event = e;
      }).find('select').select('one').then(function () {
        expect(event, 'expected event to fire').to.not.be.undefined;
        expect(event.type).to.equal('select option');
        expect(event.value).to.equal('one');
        expect(event.optionElement).to.equal(select.firstChild);
        expect(event.element).to.equal(select);
      });
    });
  });

  describe('fill', function(){
    it('fills a component with the supplied values', function(){
      var component = browser.component({
        title: function(){
          return this.find('.title');
        },
        name: function(){
          return this.find('.name');
        }
      });
      eventuallyInsertHtml('<select class="title"><option>Mrs</option><option>Mr</option></select><input type="text" class="name"></input>');

      return component.fill([
        { name: 'title', action: 'select', options: {exactText: 'Mr'}},
        { name: 'name', action: 'typeIn', options: {text: 'Joe'}}
      ]).then(function(){
        expect($(div).find('.title').val()).to.equal('Mr');
        expect($(div).find('.name').val()).to.equal('Joe');
      });
    });

    it('can fill using shortcut syntax', function(){
      var component = browser.component({
        title: function(){
          return this.find('.title');
        },
        name: function(){
          return this.find('.name');
        },
        agree: function(){
          return this.find('.agree');
        }
      });
      eventuallyInsertHtml('<select class="title"><option>Mrs</option><option>Mr</option></select><input type="text" class="name"></input><label class="agree"><input type="checkbox"></label>');

      return component.fill([
        { select: 'title', text: 'Mrs'},
        { typeIn: 'name', text: 'Joe'},
        { click: 'agree' }
      ]).then(function(){
        expect($(div).find('.title').val()).to.equal('Mrs');
        expect($(div).find('.name').val()).to.equal('Joe');
        expect($(div).find('.agree input').prop('checked')).to.equal(true);
      });
    });

    it('can execute actions on a component', function(){
      var myActionRan = false;
      var component = browser.component({
        myAction: function(){
          myActionRan = true;
          return new Promise(function(success){
            success();
          });
        }
      }).component({
        title: function(){
          return this.find('.title');
        },
      });
      eventuallyInsertHtml('<select class="title"><option>Mrs</option></select>');

      return component.fill([
        { myAction: 'title' }
      ]).then(function(){
        expect(myActionRan).to.be.true;
      });
    });

    it('throws an error if the action cannot be found', function(){
      var component = browser.component({});
      var error;

      return component.fill([
        { actionDoesNotExist: 'name'}
      ]).then(null, function(e){
        error = e;
      }).then(function(){
        expect(error.message).to.contain('actionDoesNotExist')
      });
    });

    it('throws an error when trying to call an action on a field which does not exist', function(){
      var component = browser.component({});
      var error;

      return component.fill([
        { typeIn: 'name'}
      ]).then(null, function(e){
        error = e;
      }).then(function(){
        expect(error.message).to.contain("Field 'name' does not exist");
      });
    });
  });
});
