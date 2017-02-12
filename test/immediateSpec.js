var domTest = require('./domTest');

describe('.set({ immediate: true })', function () {
  domTest('makes clicks happen immediately', function (browser, dom, $) {
    var clicked = false;

    dom.insert('<div class="element">red</div>').on('click', function () {
      clicked = true;
    })

    browser.set({ immediate: true });
    browser.find('.element').click();
    expect(clicked).to.equal(true);
  });

  domTest('fills a component with supplied values immediately', function(browser, dom){
    browser.set({ immediate: true });

    var component = browser.component({
      title: function(){
        return this.find('.title');
      },
      name: function(){
        return this.find('.name');
      }
    });
    dom.insert('<select class="title"><option>Mrs</option><option>Mr</option></select>');
    dom.insert('<input type="text" class="name"></input>');

    component.fill([
      { name: 'title', action: 'select', options: {exactText: 'Mr'}},
      { name: 'name', action: 'typeIn', options: {text: 'Joe'}}
    ])
    expect(dom.el.find('.title').val()).to.equal('Mr');
    expect(dom.el.find('.name').val()).to.equal('Joe');
  });

  domTest('throws errors immediately', function (browser, dom, $) {
    browser.set({ immediate: true });
    try {
      browser.find('.element').click();
    } catch (error) {
      expect(error.message).to.equal("expected to find: .element [disabled=false]")
      return
    }
    throw new Error("Expected an error")
  });
});
