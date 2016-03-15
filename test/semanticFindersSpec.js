var browser = require('..');
var createTestDom = require('./createTestDom');
var $ = require('jquery');

describe('semantic finders', function() {
  
  describe.only('link', function () {
    var dom;

    beforeEach(function(){
      dom = createTestDom();
    });

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

  });
  
});
