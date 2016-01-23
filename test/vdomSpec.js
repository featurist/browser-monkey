var h = require('virtual-dom/h');
var vquery = require('vdom-query')
function createBrowser(render){
  var browser = require('..').create(render);
  browser.set({$: vquery, visibleOnly: false});
  return browser;
}

describe('vdom', function(){
  describe('shouldHave', function(){
    it('passes when an element exists', function(){
      var browser = createBrowser(function(){
        return h('div', h('.element', h('div', 'some text')));
      });

      var good = browser.find('.element').shouldHave({text: 'some t'});
      var bad = browser.find('.element').shouldHave({text: 'sme t'});

      return Promise.all([
        good,
        expect(bad).to.be.rejected
      ]);
    });
  });
});
