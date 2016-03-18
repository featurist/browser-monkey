var browser = require('..');
var createTestDom = require('./createTestDom');
var $ = require('jquery');

describe('fuzzy finders', function() {

  var dom;

  beforeEach(function() {
    dom = createTestDom();
  });

  describe('.link(label)', function () {

    it('finds anchors by id', function () {
      dom.eventuallyInsert('<a id="foo" href="/somewhere"></a>');
      return browser.link('foo').shouldExist();
    });
    
    it('finds anchors by title', function () {
      dom.eventuallyInsert('<a title="bar" href="/somewhere"></a>');
      return browser.link('bar').shouldExist();
    });
    
    it('finds anchors by nested img alt', function () {
      dom.eventuallyInsert('<a href="/somewhere"><img alt="baz" /></a>');
      return browser.link('baz').shouldExist();
    });

    it('finds anchors inside elements', function () {
      dom.eventuallyInsert('<div id="x"><a id="foo" href="/somewhere"></a></div>');
      return browser.find('#x').link('foo').shouldExist();
    });

    it('fails to find anchors inside elements', function () {
      dom.eventuallyInsert('<div id="y"></div><a id="foo" href="/somewhere"></a>');
      return browser.find('#y').link('foo').shouldNotExist();
    });

  });
  
});
