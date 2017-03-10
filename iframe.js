var debug = require('debug')('browser-monkey:angular')
var Mount = require('./mount');
var createMonkey = require('./create');

module.exports = function(url) {
  return new Mount(url, {
    stopApp: function(){},
    startApp: function(){
      debug('Mounting iframe: ' + url)
      var div = Mount.createTestDiv();
      var iframe = document.createElement('iframe');
      iframe.src = url;
      div.appendChild(iframe);

      return createMonkey(iframe);
    }
  }).start();
}

