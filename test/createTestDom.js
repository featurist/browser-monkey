var $ = require('jquery')
var createTestDiv = require('../createTestDiv')

module.exports = function () {
  var div = createTestDiv()

  return {
    el: $(div),
    insert: function (html) {
      var append = $(html)
      this.el.append(append)
      return append
    },
    eventuallyInsert: function (html, after) {
      var self = this
      setTimeout(function () {
        self.insert(html)
      }, after || 10)
    }
  }
}
