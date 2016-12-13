var Mount = require('./');
var createMonkey = require('../create');

module.exports = function() {
  return new Mount({
    stopApp: function(){},
    startApp: function(){
      var app = this.app;

      var div = Mount.createTestDiv();
      div.setAttribute(app.directiveName, '');
      angular.bootstrap(div, [app.moduleName]);

      return createMonkey(document.body);
    }
  });
}
