var {Query} = require('./lib/Query')

module.exports = function (rootSelector = document.body) {
  return new Query()
    .withScope(rootSelector)
    .component({
      v2: function () {
        var finders = require('./lib/finders')
        var actions = require('./lib/actions')
        var assertions = require('./lib/assertions')

        return this
          .component(finders)
          .component(actions)
          .component(assertions)
      },
    })
}
