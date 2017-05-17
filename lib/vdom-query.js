var vdomQuery = require('vdom-query')

vdomQuery.fn.extend({
  browserMonkeyInnerText: function () {
    return this.innerText()
  },

  browserMonkeyClick: function () {
    this.trigger('click')
  }
})

module.exports = vdomQuery
