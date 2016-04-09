var jquery = require('jquery');
if (jquery.fn) {
  jquery.fn.extend({
    innerText: function(){
      return this[0].innerText || this[0].textContent;
    }
  });
}

module.exports = jquery;
