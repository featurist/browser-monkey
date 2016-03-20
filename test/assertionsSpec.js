var domTest = require('./domTest');

describe('assertions', function(){

  describe.only('shouldNotExist', function () {
    domTest("should ensure that element eventually doesn't exists", function (browser, dom) {
      dom.insert('<div class="removing"></div>');
      dom.insert('<div class="staying"></div>');

      var good = browser.find('.removing').shouldNotExist();
      var bad = browser.find('.staying').shouldNotExist();

      setTimeout(function () {
        dom.el.find('.removing').remove();
      }, 50);

      return Promise.all([
        good,
        expect(bad).to.be.rejected
      ]);
    });

    domTest('allows trytryagain parameters to be used', function (browser, dom) {
      dom.insert('<div class="removing"></div>');

      var promise = browser.find('.removing').shouldNotExist({timeout: 500, interval: 100});

      setTimeout(function () {
        dom.el.find('.removing').remove();
      }, 50);

      return promise;
    });
  });

  describe('is', function () {
    it('should eventually find an element if it has a class', function () {
      var good = browser.find('.element').is('.good').shouldExist();
      var bad = browser.find('.element').is('.bad').shouldExist();

      setTimeout(function () {
        var element = dom.insert('<div class="element"></div>');

        setTimeout(function () {
          element.addClass('good');
        }, 100);
      }, 200);

      return Promise.all([good, expect(bad).to.be.rejected]);
    });
  });
  it('eventually finds an element containing text', function () {
    var promise = browser.find('.element', {text: 'some t'}).shouldExist();
    dom.eventuallyInsert('<div class="element"><div>some text</div></div>');
    return promise;
  });

  it('eventually finds an element containing text as it appears on the page', function () {
    var promise = browser.find('.element', {text: 'This is some text that is all on one line.\nAnd some more on another line'}).shouldExist();
    dom.eventuallyInsert('<div class="element"><div>\
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

    dom.eventuallyInsert('<div><div class="a">8</div><div class="b">28</div></div>');

    return Promise.all([
      good,
      expect(bad).to.be.rejected
    ]);
  });

  describe('shouldHave', function () {
    it('eventually finds an element and asserts that it has text', function () {
      var good = browser.find('.element').shouldHave({text: 'some t'});
      var bad = browser.find('.element').shouldHave({text: 'sme t'});

      dom.eventuallyInsert('<div class="element"><div>some text</div></div>');

      return Promise.all([
        good,
        expect(bad).to.be.rejected
      ]);
    });

    it('allows trytryagain parameters to be used', function () {
      var good = browser.find('.element').shouldHave({text: 'some t', timeout: 400, interval: 100});
      var bad = browser.find('.element').shouldHave({text: 'sme t'});

      dom.eventuallyInsert('<div class="element"><div>some text</div></div>');

      return Promise.all([
        good,
        expect(bad).to.be.rejected
      ]);
    });

    it('eventually finds an element and asserts that it has value', function () {
      var good1 = browser.find('.element1 input').shouldHave({value: 'some t'});
      var good2 = browser.find('.element2 input').shouldHave({value: 0});
      var bad = browser.find('.element1 input').shouldHave({value: 'sme t'});

      dom.eventuallyInsert('<div class="element1"><input type=text value="some text" /></div>');
      dom.eventuallyInsert('<div class="element2"><input type=text value="0" /></div>');

      return Promise.all([
        good1,
        good2,
        expect(bad).to.be.rejected
      ]);
    });

    it('finds an element with exact value', function () {
      var bad = browser.find('.element1 input').shouldHave({exactValue: 'some t'});
      var good = browser.find('.element1 input').shouldHave({exactValue: 'some text'});

      dom.eventuallyInsert('<div class="element1"><input type=text value="some text" /></div>');

      return Promise.all([
        good,
        expect(bad).to.be.rejected
      ]);
    });

    it("treats selects with no value as empty string", function(){
      dom.insert('<select></select>');

      var select = browser.find('select');

      return Promise.all([
        select.shouldHave({value: ''}),
        select.shouldHave({exactValue: ''}),
      ]);
    });

    it('recurses through a tree of assertions', function(){
      dom.insert('<div class="airport"><span class="date">Aug 2055</span><span class="text">LHR</span><span class="blank"></span></div>');
      return browser.component({
        airport: function(){
          return this.find('.airport').component({
            date: function(){ return this.find('.date'); },
            text: function(){ return this.find('.text'); },
            blank: function(){ return this.find('.blank'); }
          });
        }
      }).shouldHave({
        airport: {
          date: { exactText: 'Aug 2055' },
          text: { text: 'LHR' },
          blank: { text: undefined }
        }
      });
    });

    describe('exactText', function(){
      it('eventually finds elements that have the exact array of text', function(){
        var promise = browser.find('.element option').shouldHave({exactText: ['', 'Mr', 'Mrs']});

        dom.eventuallyInsert('<select class="element"><option></option><option>Mr</option><option>Mrs</option></select>');

        return promise;
      });
    });

    describe('checkboxes', function () {
      it('eventually finds a checked checkbox', function () {
        var good = browser.find('.checkbox').shouldHave({checked: true});

        var checkbox = dom.insert('<input class="checkbox" type=checkbox />');
        setTimeout(function () {
          checkbox.prop('checked', true);
        }, 20);

        return Promise.all([
          good
        ]);
      });


      it('fails if only one of many checkboxes is checked', function () {
        var good = browser.find('.checkbox').shouldHave({checked: true});

        var checkbox = dom.insert('<input class="checkbox" type=checkbox /><input class="checkbox" type=checkbox />');
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

        var checkbox = dom.insert('<input class="checkbox" type=checkbox /><input class="checkbox" type=checkbox />');
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

        var checkbox = dom.insert('<input class="checkbox" type=checkbox />');

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

      dom.eventuallyInsert('<div class="element"><div>\nfirst one</div><div>number 2\n</div></div>');

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

      dom.eventuallyInsert('<div class="element"><input type=text value="first one"><input type=text value="number 2"><input type="text" value="0"></div>');

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

      dom.eventuallyInsert('<div class="element the-class"><div class="not-the-class">some text</div></div>');

      return Promise.all([
        good,
        expect(bad1).to.be.rejected,
        expect(bad2).to.be.rejected
      ]);
    });

    it('eventually finds an element and asserts that it has n elements', function () {
      var good = browser.find('.element').shouldHave({length: 2});
      var bad1 = browser.find('.element').shouldHave({length: 1});

      dom.eventuallyInsert('<div class="element"></div><div class="element"></div>');

      return Promise.all([
        good,
        expect(bad1).to.be.rejected
      ]);
    });

    it('eventually finds an element and asserts that it passes an assertion', function () {
      var good1 = browser.find('.element').shouldHaveElement(function (element) {
        expect(element.innerText).to.equal('a');
      });

      var bad1 = browser.find('.multi').shouldHaveElement(function (element) {
        expect(element.innerText).to.equal('b');
      });

      var bad2 = browser.find('.element').shouldHaveElement(function (element) {
        expect(element.innerText).to.equal('b');
      });

      var element = dom.insert('<div class="element"></div>');
      dom.eventuallyInsert('<div class="multi"></div><div class="multi">b</div>');

      setTimeout(function () {
        element.text('a');
      }, 30);

      return Promise.all([
        good1,
        expect(bad1).to.be.rejectedWith('expected to find exactly one element'),
        expect(bad2).to.be.rejectedWith("expected 'a' to equal 'b'")
      ]);
    });

    it('eventually finds elements and asserts that they pass an assertion', function () {
      var good1 = browser.find('.element').shouldHaveElements(function (elements) {
        var xs = elements.map(function (element) {
          return element.dataset.x;
        });

        expect(xs).to.eql(['one', 'two', 'three']);
      });

      var bad1 = browser.find('.element').shouldHaveElements(function (elements) {
        var xs = elements.map(function (element) {
          return element.dataset.x;
        });

        expect(xs).to.eql(['one', 'two']);
      });

      dom.eventuallyInsert('<div class="element" data-x="one"></div><div class="element" data-x="two"></div><div class="element" data-x="three"></div>');

      return Promise.all([
        good1,
        expect(bad1).to.be.rejectedWith("expected [ 'one', 'two', 'three' ]")
      ]);
    });
  });

  describe('shouldNotHave', function () {
    it('eventually finds an element and asserts that it does not have text', function () {
      var promise = browser.find('.element').shouldNotHave({text: 'sme t'});

      dom.eventuallyInsert('<div class="element"><div>some text</div></div>');

      return promise;
    });

    it('allows trytryagain parameters to be used', function () {
      var promise = browser.find('.element').shouldNotHave({text: 'sme t', timeout: 400, interval: 100});

      dom.eventuallyInsert('<div class="element"><div>some text</div></div>');

      return promise;
    });
  });
});
