var promiseBuilder = require('promise-builder');

function apiForComponent(component) {
  component.within = function(selector, callback) {
    var api = this;
    return callback(apiForComponent(component.find(selector)))
      .then(function() { return api; });
  }
  return promiseBuilder(component);
}

module.exports = {
  builder: function() {
    return apiForComponent(this);
  }
}
