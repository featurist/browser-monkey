var $ = require('../lib/vdom-query')

module.exports = function createVDOM (body) {
  return {
    el: $(body),
    insert: function (html) {
      var append = $(html)
      this.el.append(append)
      return append
    },
    eventuallyInsert: function (html) {
      var self = this
      setTimeout(function () {
        self.insert(html)
      }, 10)
    }
  }
}
