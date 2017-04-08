var domTest = require('./domTest')

describe('component', function () {
  domTest('can return new selectors by extending', function (browser, dom) {
    var user = browser.component({
      name: function () {
        return this.find('.user-name')
      },

      address: function () {
        return this.find('.user-address')
      }
    })

    var promise = user.name().shouldExist()

    dom.eventuallyInsert('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>')

    return promise
  })

  domTest('components are independent', function (browser, dom) {
    var user = browser.component({
      name: function () {
        return this.find('.user-name')
      }
    })

    browser.component({
      name: function () {
        return this.find('.bah-name')
      }
    })

    var promise = user.name().shouldExist()

    dom.eventuallyInsert('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>')

    return promise
  })

  domTest('can extend another component', function (browser, dom) {
    var user = browser.component({
      name: function () {
        return this.find('.user-name')
      },

      address: function () {
        return this.find('.user-address')
      }
    })

    var bossUser = user.component({
      secondAddress: function () {
        return this.find('.user-second-address')
      }
    })

    var name = bossUser.name().shouldExist()
    var secondAddress = bossUser.secondAddress().shouldExist()

    dom.eventuallyInsert('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div><div class="user-second-address">bob\'s second address</div></div>')

    return Promise.all([name, secondAddress])
  })

  domTest('can return new scoped selectors', function (browser, dom) {
    var admin = browser.component({
      user: function () {
        return user.scope(this.find('.user'))
      }
    })

    var user = browser.component({
      name: function () {
        return this.find('.user-name')
      },

      address: function () {
        return this.find('.user-address')
      }
    })

    var promise = admin.user().name().shouldExist()

    dom.eventuallyInsert('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>')

    return promise
  })

  domTest('components inherit scope', function (browser, dom) {
    var adminArea = browser.find('.admin')

    var admin = adminArea.component({
      user: function () {
        return this.find('.user')
      }
    })

    var promise = admin.user().shouldHave({text: ['Jane']})

    dom.eventuallyInsert(
        '<div class="user">Bob</div>' +
      '<div class="admin">' +
        '<div class="user">Jane</div>' +
      '</div>'
    )

    return promise
  })
})
