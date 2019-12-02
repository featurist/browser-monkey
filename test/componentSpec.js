var describeAssemblies = require('./describeAssemblies')
const DomAssembly = require('./assemblies/DomAssembly')

describe('component', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey().v2()
    })

    it('can return new selectors by extending', function () {
      var user = browser.component({
        name: function () {
          return this.find('.user-name')
        }
      })

      var promise = user.name().shouldExist().then()

      assembly.eventuallyInsertHtml('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>')

      return promise
    })

    it('can define properties', function () {
      var user = browser.component({
        get name () {
          return this.find('.user-name')
        }
      })

      var promise = user.name.shouldExist().then()

      assembly.eventuallyInsertHtml('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>')

      return promise
    })

    it('components are independent', function () {
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

      var promise = user.name().shouldExist().then()

      assembly.eventuallyInsertHtml('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div></div>')

      return promise
    })

    it('can extend another component', function () {
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

      var name = bossUser.name().shouldExist().then()
      var secondAddress = bossUser.secondAddress().shouldExist().then()

      assembly.eventuallyInsertHtml('<div class="user"><div class="user-name">bob</div><div class="user-address">bob\'s address</div><div class="user-second-address">bob\'s second address</div></div>')

      return Promise.all([name, secondAddress])
    })

    it('components inherit scope', function () {
      var adminArea = browser.find('.admin')

      var admin = adminArea.component({
        user: function () {
          return this.find('.user')
        }
      })

      var promise = admin.user().shouldHave({ text: ['Jane'] }).then()

      assembly.eventuallyInsertHtml(
        '<div class="user">Bob</div>' +
        '<div class="admin">' +
          '<div class="user">Jane</div>' +
        '</div>'
      )

      return promise
    })
  })
})
