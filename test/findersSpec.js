var browser = require('..');
var createTestDom = require('./createTestDom');
var $ = require('jquery');

describe('find', function () {
  var dom;

  beforeEach(function(){
    dom = createTestDom();
  });

  it('should eventually find an element', function () {
    var promise = browser.find('.element').shouldExist();

    dom.eventuallyInsert('<div class="element"></div>');

    return promise;
  });

  it('should eventually find an element using a filter', function () {
    var promise = browser.find('.element').filter(function (element) {
      return element.classList.contains('correct');
    }, 'has class "correct"').element();

    dom.insert('<div class="element"></div>');
    dom.eventuallyInsert('<div class="element correct"></div>');

    return promise.then(function (element) {
      expect(element.className).to.equal('element correct');
    });
  });

  it('should eventually find an element with the right text', function () {
    var promise = browser.find('.element', {text: 'green'}).element();

    dom.insert('<div class="element"></div>');
    dom.eventuallyInsert('<div class="element">red</div><div class="element">blue</div><div class="element">green</div>');

    return promise.then(function (element) {
      expect(element.innerText).to.equal('green');
    });
  });

  it('filter fails with the right message', function () {
    var promise = browser.find('.element').filter(function (element) {
      return element.classList.contains('correct');
    }, 'has class "correct"').element();

    dom.insert('<div class="element"></div>');
    dom.eventuallyInsert('<div class="element"></div>');

    return expect(promise).to.be.rejectedWith('has class "correct"');
  });

  it('should eventually find an element in an iframe', function(){
    var iframe = document.createElement('iframe');
    iframe.src = '/base/test/page1.html';
    iframe.width = 700;
    iframe.height = 1000;
    dom.el.append(iframe);
    var iframeScope = browser.scope(iframe);
    return iframeScope.find('a', {text: 'page 2'}).click().then(function(){
      return Promise.all([
        iframeScope.find('h1').shouldHave({text: 'Hello World'}),
        iframeScope.shouldHave({text: 'Hello World'})
      ]);
    });
  });

  it('calls a function for each element found', function(){
    var promise = browser.find('span').elements();

    dom.eventuallyInsert('<div><span>a</span><span>b</span></div>');

    return promise.then(function(elements){
      expect(elements.length).to.equal(2);
    });
  });

  describe('visibility', function(){
    it('should not find an element that is visually hidden', function(){
      dom.insert('<div class="element">hello <span style="display:none;">world</span></div>');

      return browser.find('.element > span').shouldNotExist();
    });

    it('should find an element that is visually hidden when visibleOnly = false', function(){
      dom.insert('<div class="element">hello <span style="display:none;">world</span></div>');

      return browser.set({visibleOnly: false}).find('.element > span').shouldExist();
    });

    it('should find elements that are visually hidden because of how html renders them', function(){
      dom.insert('<select><option>First</option><option>Second</option></select>');
      return browser.find('select option').shouldHave({text: ['First', 'Second']});
    });
  });
  describe('containing', function () {
    it('eventually finds an element containing another element', function () {
      var promise = browser.find('.outer').containing('.inner').shouldExist();

      setTimeout(function () {
        dom.insert('<div class="outer"><div>bad</div></div>');
        dom.insert('<div class="outer"><div class="inner">good</div></div>');
      }, 200);

      return promise;
    });

    it('element returns the outer element', function () {
      var promise = browser.find('.outer').containing('.inner').element();

      setTimeout(function () {
        dom.insert('<div class="outer"><div>bad</div></div>');
        dom.insert('<div class="outer"><div class="inner">good</div></div>');
      }, 200);

      return promise.then(function (element) {
        expect($(element).is('.outer')).to.be.true;
      });
    });

    it("fails if it can't find an element containing another", function () {
      var promise = browser.find('.outer').containing('.inner').shouldExist();

      setTimeout(function () {
        dom.insert('<div class="outer"><div>bad</div></div>');
      }, 200);

      return expect(promise).to.be.rejected;
    });
  });
  describe('chains', function () {
    it('eventually finds the inner element, even if the outer element exists', function () {
      var promise = browser.find('.outer').find('.inner').shouldExist();

      setTimeout(function () {
        var outer = dom.insert('<div class="outer"></div>');
        setTimeout(function () {
          outer.append('<div class="inner">good</div>');
        }, 200);
      }, 200);

      return promise;
    });

    it('fails to find the inner element if it never arrives', function () {
      var promise = browser.find('.outer').find('.inner').shouldExist();

      setTimeout(function () {
        var outer = dom.insert('<div class="outer"></div>');
      }, 200);

      return expect(promise).to.be.rejected;
    });
  });
});
