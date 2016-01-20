var browser = require('..');
var createTestDom = require('./createTestDom');

describe('component', function () {
  var dom;

  beforeEach(function(){
    dom = createTestDom();
  });

  it('can return new selectors by extending', function () {
    var user = browser.component({
      name: function () {
        return this.find('.user-name');
      },

      address: function () {
        return this.find('.user-address');
      }
    });

    var promise = user.name().shouldExist();

    dom.eventuallyInsert('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>');

    return promise;
  });

  it('components are independent', function () {
    var user = browser.component({
      name: function () {
        return this.find('.user-name');
      }
    });

    var bah = browser.component({
      name: function () {
        return this.find('.bah-name');
      }
    });

    var promise = user.name().shouldExist();

    dom.eventuallyInsert('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>');

    return promise;
  });

  it('can extend another component', function () {
    var user = browser.component({
      name: function () {
        return this.find('.user-name');
      },

      address: function () {
        return this.find('.user-address');
      }
    });

    var bossUser = user.component({
      secondAddress: function () {
        return this.find('.user-second-address');
      }
    });

    var name = bossUser.name().shouldExist();
    var secondAddress = bossUser.secondAddress().shouldExist();

    dom.eventuallyInsert('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div><div class="user-second-address">bob\'s second address</div></div>');

    return Promise.all([name, secondAddress]);
  });

  it('can return new scoped selectors', function () {
    var admin = browser.component({
      user: function () {
        return user.scope(this.find('.user'));
      }
    });

    var user = browser.component({
      name: function () {
        return this.find('.user-name');
      },

      address: function () {
        return this.find('.user-address');
      }
    });

    var promise = admin.user().name().shouldExist();

    dom.eventuallyInsert('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>');

    return promise;
  });

  it('components inherit scope', function () {
    var adminArea = browser.find('.admin');

    var admin = adminArea.component({
      user: function () {
        return this.find('.user');
      }
    });

    var promise = admin.user().shouldHave({text: ['Jane']});

    dom.eventuallyInsert(
        '<div class="user">Bob</div>'
      + '<div class="admin">'
        + '<div class="user">Jane</div>'
      + '</div>'
    );

    return promise;
  });
});
