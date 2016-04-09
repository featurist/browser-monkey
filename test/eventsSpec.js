var retry = require('trytryagain');
var domTest = require('./domTest');

describe('events', function(){
  domTest('typeIn element should fire change', function(browser, dom){
    var firedEvents = [];

    dom.insert('<input type="text" class="input">')
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

  domTest('typeIn element should fire input on each character', function(browser, dom){
    var firedEvents = [];

    dom.insert('<input type="text" class="input">')
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

  domTest('typeIn element should fire change and then blur event on input', function(browser, dom){
    var firedEvents = [];

    dom.insert('<input type="text" class="input">');
    dom.insert('<input type="text" class="change">');

    dom.el.find('.input').on('blur', function(e){
      firedEvents.push('blur');
    }).on('change', function(){
      firedEvents.push('change');
    });

    return browser.find('.input').typeIn('first').then(function(){
      return browser.find('.change').typeIn('second');
    }).then(function () {
      return retry(function(){
        expect(firedEvents).to.eql([
          'change',
          'blur'
        ]);
      });
    });
  });

  domTest('click element should fire blur event on input', function(browser, dom){
    var blurred = false;

    dom.insert('<input type="text" class="input" />');
    dom.insert('<button>button</button>');

    dom.el.find('.input').on('blur', function(e){
      blurred = true;
    })

    return browser.find('.input').typeIn('first').then(function(){
      return browser.find('button').click();
    }).then(function(){
      expect(blurred).to.be.true
    });
  });

  domTest('select element should fire blur event on input', function(browser, dom, $){
    var blurred = false;

    dom.insert('<select><option>one</option></select>');
    dom.insert('<input type="text" class="input"></input>');
    dom.el.find('input').on('blur', function(e){
      blurred = true;
    });


    return browser.find('.input').typeIn('first').then(function(){
      return browser.find('select').select({text: 'one'});
    }).then(function(){
      expect(blurred).to.be.true
    });
  });

  describe('callbacks on interaction', function () {
    domTest('fires events on clicks', function (browser, dom) {
      var button = dom.insert('<button>a button</button>');

      var event;

      return browser.on(function (e) {
        event = e;
      }).find('button').click().then(function () {
        expect(event, 'expected event to fire').to.not.be.undefined;
        expect(event.type).to.equal('click');
        expect(event.element[0]).to.equal(button[0]);
      });
    });

    domTest('fires events on typeIn', function (browser, dom) {
      var input = dom.insert('<input></input>');

      var event;

      return browser.on(function (e) {
        event = e;
      }).find('input').typeIn('some text').then(function () {
        expect(event, 'expected event to fire').to.not.be.undefined;
        expect(event.type).to.equal('typing');
        expect(event.text).to.equal('some text');
        expect(event.element[0]).to.equal(input[0]);
      });
    });

    domTest('fires events on typeIn', function (browser, dom) {
      var editorDiv = dom.insert('<div class="editor"></div>');

      var event;

      return browser.on(function (e) {
        event = e;
      }).find('div.editor').typeInHtml('some <b>html</b>').then(function () {
        expect(event, 'expected event to fire').to.not.be.undefined;
        expect(event.type).to.equal('typing html');
        expect(event.html).to.equal('some <b>html</b>');
        expect(event.element[0]).to.equal(editorDiv[0]);
      });
    });

    domTest('fires events on select', function (browser, dom) {
      var select = dom.insert('<select><option>one</option></select>');

      var event;

      return browser.on(function (e) {
        event = e;
      }).find('select').select('one').then(function () {
        expect(event, 'expected event to fire').to.not.be.undefined;
        expect(event.type).to.equal('select option');
        expect(event.value).to.equal('one');
        expect(event.optionElement[0]).to.equal(select.find('option')[0]);
        expect(event.element[0]).to.equal(select[0]);
      });
    });
  });
})
