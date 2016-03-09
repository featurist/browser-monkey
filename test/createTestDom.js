var $ = require('jquery');

module.exports = function() {
  var oldDivs = document.querySelectorAll("body > div.test");

  for(var n = 0; n < oldDivs.length; n++) {
    var oldDiv = oldDivs[n];
    oldDiv.parentNode.removeChild(oldDiv);
  }

  var div = document.createElement('div');

  div.className = 'test';

  document.body.appendChild(div);

  return {
    el: $(div),
    insert: function(html){
      var append = $(html);
      this.el.append(append);
      return append;
    },
    eventuallyInsert: function(html) {
      var self = this;
      setTimeout(function () {
        self.insert(html);
      }, 10);
    }
  };
};
