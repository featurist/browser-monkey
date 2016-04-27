var browser = require('..');
var createTestDom = require('./createTestDom');
var $ = require('jquery');

describe('actions', function(){
  var dom;

  beforeEach(function(){
    dom = createTestDom();
  });

  describe('clicking', function () {
    it('should eventually click an element', function () {
      var promise = browser.find('.element').click();
      var clicked = false;

      dom.eventuallyInsert(
        $('<div class="element"></div>').click(function () {
          clicked = true;
        })
      );

      return promise.then(function () {
        expect(clicked).to.equal(true);
      });
    });

    it('sends mousedown mouseup and click events', function () {
      var events = [];

      dom.insert('<div class="element"></div>').mousedown(function () {
        events.push('mousedown');
      }).mouseup(function () {
        events.push('mouseup');
      }).click(function () {
        events.push('click');
      });

      return browser.find('.element').click().then(function () {
        expect(events).to.eql(['mousedown', 'mouseup', 'click']);
      });
    });

    it('waits until checkbox is enabled before clicking', function () {
      var promise = browser.find('input[type=checkbox]').click();
      var clicked;
      var buttonState = 'disabled';

      var button = dom.insert('<input type=checkbox disabled></input>');
      button[0].addEventListener('click', function () {
        clicked = buttonState;
      });

      setTimeout(function () {
        button.prop('disabled', false);
        buttonState = 'enabled'
      }, 100);

      return promise.then(function () {
        expect(clicked).to.equal('enabled');
      });
    });

    it('waits until button is enabled before clicking', function () {
      var promise = browser.find('button', {text: 'a button'}).click();
      var clicked;
      var buttonState = 'disabled';

      var button = dom.insert('<button disabled>a button</button>');
      button[0].addEventListener('click', function () {
        clicked = buttonState;
      });

      setTimeout(function () {
        button.prop('disabled', false);
        buttonState = 'enabled'
      }, 100);

      return promise.then(function () {
        expect(clicked).to.equal('enabled');
      });
    });
  });

  describe('select', function(){
    describe('text', function(){
      it('respects timeout option', function(){
        var promise = browser.find('.element').select({text: 'Second', timeout: 100});
        var selectedItem = undefined;

        dom.eventuallyInsert(
          $('<select class="element"><option>First</option><option>Second</option></select>').change(function (e) {
            var el = e.target;
            selectedItem = el.options[el.selectedIndex].text;
          })
        );

        return expect(promise).to.be.rejected
      });

      it('eventually selects an option element using the text', function(){
        var promise = browser.find('.element').select({text: 'Second'});
        var selectedItem = undefined;

        dom.eventuallyInsert(
          $('<select class="element"><option>First</option><option>Second</option></select>').change(function (e) {
            var el = e.target;
            selectedItem = el.options[el.selectedIndex].text;
          })
        );

        return promise.then(function () {
          expect(selectedItem).to.equal('Second');
        });
      });

      it('eventually selects an option element using a partial match', function(){
        var promise = browser.find('.element').select({text: 'Seco'});
        var selectedItem = undefined;

        dom.eventuallyInsert(
          $('<select class="element"><option>First</option><option>Second</option></select>').change(function (e) {
            var el = e.target;
            selectedItem = el.options[el.selectedIndex].text;
          })
        );

        return promise.then(function () {
          expect(selectedItem).to.equal('Second');
        });
      });

      it('selects the first match if multiple available', function(){
        var selectedItem = undefined;

        var select = dom.insert('<select><option value="1">Item</option><option value="2">Item</option></select>').change(function (e) {
          selectedItem = select.val();
        });

        return browser.find('select').select({text: 'Item'}).then(function(){
          expect(selectedItem).to.equal('1');
        });
      });

      it('selects an option that eventually appears', function(){
        var promise = browser.find('.element').select({text: 'Second'});
        var selectedItem = undefined;

        var select = dom.insert('<select class="element"></select>').change(function (e) {
          var el = e.target;
          selectedItem = el.options[el.selectedIndex].text;
        });

        setTimeout(function () {
          $('<option>First</option><option>Second</option>').appendTo(select);
        }, 20);

        return promise.then(function () {
          expect(selectedItem).to.equal('Second');
        });
      });

      it('errors when the specified option does not exist', function(){
        var promise = browser.find('.element').select({text: 'Does not exist'});

        dom.eventuallyInsert('<select class="element"><option>First</option><option>Second</option></select>');

        return Promise.all([
          expect(promise).to.be.rejected
        ]);
      });

      it('errors when the input is not a select', function(){
        var promise = browser.find('.element').select({text: 'Whatevs'});
        dom.eventuallyInsert('<div class="element"></div>');
        return expect(promise).to.be.rejectedWith('Cannot select from a DIV');
      });

      it('selects an option using text that is falsy', function(){
        var promise = browser.find('.element').select({text: 0});
        var selectedItem = undefined;

        var select = dom.insert('<select class="element"><option>0</option><option>1</option></select>').change(function (e) {
          var el = e.currentTarget;
          selectedItem = el.options[el.selectedIndex].text;
        });


        return promise.then(function () {
          expect(selectedItem).to.equal('0');
        });
      });
    });

    describe('exactText', function(){
      it('should select an option using exact text that would otherwise match multiple options', function(){
        var promise = browser.find('.element').select({exactText: 'Mr'});
        var selectedItem = undefined;

        var select = dom.insert('<select class="element"><option>Mr</option><option>Mrs</option></select>').change(function (e) {
          var el = e.currentTarget;
          selectedItem = el.options[el.selectedIndex].text;
        });


        return promise.then(function () {
          expect(selectedItem).to.equal('Mr');
        });
      });

      it('should select an option using exact text that is falsy', function(){
        var promise = browser.find('.element').select({exactText: 0});
        var selectedItem = undefined;

        var select = dom.insert('<select class="element"><option>0</option><option>1</option></select>').change(function (e) {
          var el = e.currentTarget;
          selectedItem = el.options[el.selectedIndex].text;
        });


        return promise.then(function () {
          expect(selectedItem).to.equal('0');
        });
      });
    });
  });

  describe('submit', function () {
    it('should submit the form', function () {
      var submitted;
      var promise = browser.find('input').submit();

      dom.insert('<form><input type=text></form>').submit(function (ev) {
        submitted = true;
        ev.preventDefault();
      });

      return promise.then(function () {
        expect(submitted).to.be.true;
      });
    });
  });

  describe('typeIn', function(){
    [
      '<input class="element"></input>',
      '<input class="element" type="text"></input>',
      '<input class="element" type="email"></input>',
      '<input class="element" type="password"></input>',
      '<input class="element" type="search"></input>',
      '<input class="element" type="tel"></input>',
      '<input class="element" type="url"></input>',
      '<textarea class="element"></textara>'
    ].forEach(function(html) {
            
      it('eventually enters text into: ' + html, function () {
        var promise = browser.find('.element').typeIn('haha');
        dom.eventuallyInsert(html);
        return promise.then(function () {
          expect(dom.el.find('.element').val()).to.equal('haha');
        });
      });
      
    });
    
    [
      '<div class="element"></div>',
      '<input type="checkbox" class="element"></input>',
      '<select class="element"></select>'
    ].forEach(function(html) {
      
      it('rejects attempt to type into element: ' + html, function () {
        var promise = browser.find('.element').typeIn('whatevs');
        dom.eventuallyInsert(html);
        return expect(promise).to.be.rejectedWith('Cannot type into ' + $(html)[0].tagName);
      });

    });

    it('blanks out existing text when typing empty text', function () {
      var firedEvents = [];
      dom.insert('<input type="text" class="element" value="good bye">')
        .on('input', function(){ firedEvents.push('input'); });

      return browser.find('.element').typeIn('').then(function () {
        expect(dom.el.find('input.element').val()).to.equal('');
        expect(firedEvents).to.eql(['input'])
      });
    });
  });

  describe('checkboxes', function(){
    it('can check a checkbox by clicking it', function () {
      var checkbox = dom.insert('<input class="checkbox" type=checkbox>');

      expect(checkbox.prop('checked')).to.be.false;

      var clicked = browser.find('.checkbox').click();
      return clicked.then(function () {
        expect(checkbox.prop('checked')).to.be.true;
      }).then(function () {
        return browser.find('.checkbox').click();
      }).then(function () {
        expect(checkbox.prop('checked')).to.be.false;
      });
    });
  });

  describe('fill', function(){
    it('fills a component with the supplied values', function(){
      var component = browser.component({
        title: function(){
          return this.find('.title');
        },
        name: function(){
          return this.find('.name');
        }
      });
      dom.eventuallyInsert('<select class="title"><option>Mrs</option><option>Mr</option></select><input type="text" class="name"></input>');

      return component.fill([
        { name: 'title', action: 'select', options: {exactText: 'Mr'}},
        { name: 'name', action: 'typeIn', options: {text: 'Joe'}}
      ]).then(function(){
        expect(dom.el.find('.title').val()).to.equal('Mr');
        expect(dom.el.find('.name').val()).to.equal('Joe');
      });
    });

    it('can fill using shortcut syntax', function(){
      var component = browser.component({
        title: function(){
          return this.find('.title');
        },
        name: function(){
          return this.find('.name');
        },
        agree: function(){
          return this.find('.agree');
        }
      });
      dom.eventuallyInsert('<select class="title"><option>Mrs</option><option>Mr</option></select><input type="text" class="name"></input><label class="agree"><input type="checkbox"></label>');

      return component.fill([
        { select: 'title', text: 'Mrs'},
        { typeIn: 'name', options: {text: 'Joe'}},
        { click: 'agree' }
      ]).then(function(){
        expect(dom.el.find('.title').val()).to.equal('Mrs');
        expect(dom.el.find('.name').val()).to.equal('Joe');
        expect(dom.el.find('.agree input').prop('checked')).to.equal(true);
      });
    });

    it('can execute actions on a component', function(){
      var myActionRan = false;
      var component = browser.component({
        myAction: function(){
          myActionRan = true;

          return new Promise(function(success){
            success();
          });
        }
      }).component({
        title: function(){
          return this.find('.title');
        },
      });
      dom.eventuallyInsert('<select class="title"><option>Mrs</option></select>');

      return component.fill([
        { myAction: 'title' }
      ]).then(function(){
        expect(myActionRan).to.be.true;
      });
    });

    it('throws an error if the action cannot be found', function(){
      var component = browser.component({});
      var error;

      var promise = component.fill([
        { actionDoesNotExist: 'name'}
      ]);

      return expect(promise).to.be.rejectedWith('actionDoesNotExist');
    });

    it('throws an error when trying to call an action on a field which does not exist', function(){
      var component = browser.component({});

      var promise = component.fill([
        { typeIn: 'name'}
      ]);

      return expect(promise).to.be.rejectedWith("Field 'name' does not exist");
    });

    it('throws an error if the field does not exist', function(){
      var component = browser.component({});

      var promise = component.fill(
        { name: 'address', action: 'blah' }
      );

      return expect(promise).to.be.rejectedWith("No field 'address' exists on this component");
    });
  });
});
