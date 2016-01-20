var browser = require('..');
var createTestDom = require('./createTestDom');

describe('events', function(){
  var dom;

  beforeEach(function(){
    dom = createTestDom();
  });

  it('typeIn element should fire change', function(){
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

  it('typeIn element should fire input on each character', function(){
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

  it('typeIn element should fire change and then blur event on input', function(){
    var firedEvents = [];

    dom.insert('<input type="text" class="input"><input type="text" class="change">');

    dom.el.find('.input').one('blur', function(e){
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

    dom.insert('<input type="text" class="input"><button>button</button>');


    dom.el.find('.input').on('blur', function(e){
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

    dom.insert('<input type="text" class="input"><select><option>one</option></select>');


    dom.el.find('.input').on('blur', function(e){
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

  describe('callbacks on interaction', function () {
    it('fires events on clicks', function () {
      var button = dom.insert('<button>a button</button>')[0];

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
      var input = dom.insert('<input></input>')[0];

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
      var editorDiv = dom.insert('<div class="editor"></div>')[0];

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
      var select = dom.insert('<select><option>one</option></select>')[0];

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
})
