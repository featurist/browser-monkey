var mountApp = require('mount-app');
var App = require('../lib/app');
var plastiq = require('plastiq');

module.exports = function(config, options){
  mountApp((testEl) => {
    plastiq.append(testEl, new App(config), undefined, {
      requestRender: setTimeout
    });
  }, {}, options);
};
