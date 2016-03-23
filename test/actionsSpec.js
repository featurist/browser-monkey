var domTest = require('./domTest');

describe('actions', function(){
  describe('clicking', function () {
    domTest('should eventually click an element', function (browser, dom, $) {
      var promise = browser.find('.element').click();
      var clicked = false;

      dom.eventuallyInsert(
        $('<div class="element"></div>').on('click', function () {
          clicked = true;
        })
      );

      return promise.then(function () {
        expect(clicked).to.equal(true);
      });
    });

    domTest('sends mousedown mouseup and click events', function (browser, dom) {
      var events = [];

      dom.insert('<div class="element"></div>').on('mousedown', function () {
        events.push('mousedown');
      }).on('mouseup', function () {
        events.push('mouseup');
      }).on('click', function () {
        events.push('click');
      });

      return browser.find('.element').click().then(function () {
        expect(events).to.eql(['mousedown', 'mouseup', 'click']);
      });
    });

    domTest('waits until checkbox is enabled before clicking', function (browser, dom) {
      var promise = browser.find('input[type=checkbox]').click();
      var clicked;
      var buttonState = 'disabled';

      var button = dom.insert('<input type=checkbox disabled></input>');
      button.on('click', function () {
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

    domTest('waits until button is enabled before clicking', function (browser, dom) {
      var promise = browser.find('button', {text: 'a button'}).click();
      var clicked;
      var buttonState = 'disabled';

      button = dom.insert('<button disabled>a button</button>');
      button.on('click', function () {
        console.log('click handler')
        clicked = buttonState;
      });

      setTimeout(function () {
        console.log('enabled')
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
      domTest('should eventually select an option element using the text', function(browser, dom, $){
        var promise = browser.find('.element').select({text: 'Second'});
        var selectedItem = undefined;

        dom.eventuallyInsert(
          $('<select class="element"><option>First</option><option>Second</option></select>').on('change', function () {
            selectedItem = $(this).find('option[selected]').text();
          })
        );

        return promise.then(function () {
          expect(selectedItem).to.equal('Second');
        });
      });

      domTest('should eventually select an option element using a partial match', function(browser, dom, $){
        var promise = browser.find('.element').select({text: 'Seco'});
        var selectedItem = undefined;

        dom.eventuallyInsert(
          $('<select class="element"><option>First</option><option>Second</option></select>').on('change', function (e) {
            selectedItem = $(this).find('option[selected]').text();
          })
        );

        return promise.then(function () {
          expect(selectedItem).to.equal('Second');
        });
      });

      domTest('should select an option that eventually appears', function(browser, dom, $){
        var promise = browser.find('.element').select({text: 'Second'});
        var selectedItem = undefined;

        var select = dom.insert('<select class="element"></select>').on('change', function (e) {
          selectedItem = $(this).find('option[selected]').text();
        });

        setTimeout(function () {
          select.append('<option>First</option><option>Second</option>');
        }, 20);

        return promise.then(function () {
          expect(selectedItem).to.equal('Second');
        });
      });

      domTest('should error when the specified option does not exist', function(browser, dom){
        var promise = browser.find('.element').select({text: 'Does not exist'});

        dom.eventuallyInsert('<select class="element"><option>First</option><option>Second</option></select>');

        return Promise.all([
          expect(promise).to.be.rejected
        ]);
      });

      domTest('should select an option using text that is falsy', function(browser, dom, $){
        var promise = browser.find('.element').select({text: 0});
        var selectedItem = undefined;

        var select = dom.insert('<select class="element"><option>0</option><option>1</option></select>').on('change', function (e) {
          selectedItem = $(this).find('option[selected]').text();
        });


        return promise.then(function () {
          expect(selectedItem).to.equal('0');
        });
      });
    });

    describe('exactText', function(){
      domTest('should select an option using exact text that would otherwise match multiple options', function(browser, dom, $){
        var promise = browser.find('.element').select({exactText: 'Mr'});
        var selectedItem = undefined;

        var select = dom.insert('<select class="element"><option>Mr</option><option>Mrs</option></select>').on('change', function (e) {
          selectedItem = $(this).find('option[selected]').text();
        });


        return promise.then(function () {
          expect(selectedItem).to.equal('Mr');
        });
      });

      domTest('should select an option using exact text that is falsy', function(browser, dom, $){
        var promise = browser.find('.element').select({exactText: 0});
        var selectedItem = undefined;

        var select = dom.insert('<select class="element"><option>0</option><option>1</option></select>').on('change', function (e) {
          selectedItem = $(this).find('option[selected]').text();
        });


        return promise.then(function () {
          expect(selectedItem).to.equal('0');
        });
      });
    });
  });

  describe('submit', function () {
    domTest('should submit the form', function (browser, dom) {
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
    domTest('should eventually enter text into an element', function (browser, dom) {
      var promise = browser.find('.element').typeIn('haha');

      dom.eventuallyInsert('<input type="text" class="element"></input>');

      return promise.then(function () {
        expect(dom.el.find('input.element').val()).to.equal('haha');
      });
    });

    domTest('typing empty text blanks out existing text', function (browser, dom) {
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
    domTest('can check a checkbox by clicking it', function (browser, dom) {
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
    domTest('fills a component with the supplied values', function(browser, dom){
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

    domTest('can fill using shortcut syntax', function(browser, dom){
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

    domTest('can execute actions on a component', function(browser, dom){
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

    domTest('throws an error if the action cannot be found', function(browser, dom){
      var component = browser.component({});
      var error;

      var promise = component.fill([
        { actionDoesNotExist: 'name'}
      ]);

      return expect(promise).to.be.rejectedWith('actionDoesNotExist');
    });

    domTest('throws an error when trying to call an action on a field which does not exist', function(browser, dom){
      var component = browser.component({});

      var promise = component.fill([
        { typeIn: 'name'}
      ]);

      return expect(promise).to.be.rejectedWith("Field 'name' does not exist");
    });

    domTest('throws an error if the field does not exist', function(browser, dom){
      var component = browser.component({});

      var promise = component.fill(
        { name: 'address', action: 'blah' }
      );

      return expect(promise).to.be.rejectedWith("No field 'address' exists on this component");
    });
  });
})
