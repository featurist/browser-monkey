var monkey = require('..');
var plastiq = require('plastiq');
var h = plastiq.html;

xdescribe('plastiq integration', function(){
  it('should find things rendered by plastiq', function(){
    function render(model){
      function renderMessage(){
        if(model.show) {
          return h('div', 'hello');
        }
      }
      return h('div', [
          h('a.toggle'),
          renderMessage()
        ]
      );
    }
    var browser = monkey.create(render({}));
    var vquery = require('vdom-query')
    browser.set({$: vquery, visibleOnly: false});

    return browser.find('.toggle').click().then(function(){
      return browser.find('div', {text: 'hello'}).shouldExist;
    })
  });
});
