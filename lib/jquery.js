var jquery = require('jquery')

if (jquery.fn) {
  jquery.fn.extend({
    browserMonkeyInnerText: function () {
      var el = this[0].body || this[0]
      return el.innerText || el.textContent
    },

    browserMonkeyClick: function () {
      this.each(function () {
        this.click()
      })
    }
  })
}

module.exports = jquery
