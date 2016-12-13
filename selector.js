var elementTester = require('./elementTester');
var global = require('global');

function Selector(selector, finders, options) {
  this._selector = selector;
  this._finders = finders || [];
  this._options = options || { timeout: 1000, visibleOnly: true, $: require('./jquery'), document: global.document };
  this._handlers = [];
  this._elementTesters = elementTester;
}

Selector.prototype.set = function(options){
  var self = this;
  Object.keys(options).forEach(function(key){
    self._options[key] = options[key];
  });
  return this;
}

Selector.prototype.get = function(key){
  return this._options[key];
}

Selector.prototype.clone = function (extension) {
  var clone = new this.constructor();
  var self = this;

  Object.keys(self).forEach(function (key) {
    clone[key] = self[key];
  });

  Object.keys(extension).forEach(function (key) {
    clone[key] = extension[key];
  });

  return clone;
};

Selector.prototype.on = function (handler) {
  this._handlers.push(handler);
  return this;
};

Selector.prototype.handleEvent = function () {
  var args = arguments;

  this._handlers.forEach(function (handler) {
    handler.apply(undefined, args);
  });
};

Selector.prototype.scope = function (scope) {
  if (scope instanceof Selector) {
    return this.clone(scope);
  } else {
    return this.clone({_selector: scope});
  }
};

Selector.prototype.extend = function (methods) {
  return this.component(methods);
};

Selector.prototype.component = function (methods) {
  function Component() {
    Selector.apply(this, arguments);
  }

  Component.prototype = new this.constructor();
  Object.keys(methods).forEach(function (method) {
    Component.prototype[method] = methods[method];
  });
  Component.prototype.constructor = Component;

  return new Component().scope(this);
};

module.exports = Selector;
