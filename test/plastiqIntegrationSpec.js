var monkey = require('..');
var plastiq = require('plastiq');
var h = plastiq.html;

describe('plastiq integration', function(){
  it('should find things rendered by plastiq', function(){
    function render(model){
      function renderMessage(){
        if(model.show) {
          return h('span', 'hello');
        }
      }
      return h('div', [
          h('a.toggle', {
            onclick: function(){
              model.show = !model.show;
            }
          }),
          renderMessage()
        ]
      );
    }

    var vdom = h('div');

    plastiq.appendVDom(vdom, render, {}, { requestRender: setTimeout, window: {} });
    var browser = monkey.create(vdom);
    var vquery = require('vdom-query')
    browser.set({$: vquery, visibleOnly: false, document: {}});

    return browser.find('.toggle').click().then(function(){
      return browser.find('span', {text: 'hello'}).shouldExist();
    })
  });
});
