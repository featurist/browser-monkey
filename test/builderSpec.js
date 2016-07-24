var domTest = require('./domTest');

describe('builder()', function(){

  domTest('returns a fluent interface bound to the component', function(browser, dom, $) {
    var promise = browser.builder()
      .click('omg')
      .click('omg')
      .click('omg');

    var clicks = 0;

    dom.insert('<button class="element">omg</button>').on('click', function () {
      clicks++;
    });

    return promise.then(function () {
      expect(clicks).to.equal(3);
    });
  });

  domTest('is compatible with nested components', function (browser, dom) {
    var user = browser.component({
      name: function () {
        return this.find('.user-name');
      },

      address: function () {
        return this.find('.user-address');
      }
    });

    var promise = user.builder().name().shouldExist().shouldExist();

    dom.eventuallyInsert('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>');

    return promise;
  });

  describe('.within(selector, actions)', function() {

    domTest('passes a new builder to the actions callback', function(browser, dom, $) {
      var promise = browser.builder()
        .within('#z', function(z) {
          return z.click('A').click('A');
        });

      var clicks = 0;

      var div = $('<div id="z"></div>');
      var button = $('<button>A</button>');
      button.on('click', function() {
        clicks++;
      })
      div.append(button);
      dom.insert(div);
      return promise.then(function () {
        expect(clicks).to.equal(2);
      });
    });

  })

});
