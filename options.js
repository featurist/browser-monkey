function Options(options){
  this.options = options;
  this.isOptionsObject = typeof options === 'object';
  this.validOptions = [];
}

Options.remove = function(options, propertyNames){
  var newOptions = {};

  if (typeof options === 'object') {
    propertyNames.forEach(function(propertyName){
      newOptions[propertyName] = options[propertyName];
      delete options[propertyName];
    });
  }

  return newOptions;
}

Options.default = function(options, defaults){
  var newOptions = typeof options === 'object' ? options : {};

  Object.keys(defaults).forEach(function(key){
    if (!newOptions.hasOwnProperty(key)) {
      newOptions[key] = defaults[key]
    }
  });

  return newOptions;
}

Options.prototype.option = function(name) {
  this.validOptions.push(name);
  if (this.isOptionsObject) {
    var value = this.options.hasOwnProperty(name)? this.options[name]: undefined;
    delete this.options[name];
    return value;
  }
}

Options.prototype.validate = function(){
  if (this.isOptionsObject) {
    var keys = Object.keys(this.options);

    if (keys.length > 0) {
      throw new Error('properties ' + keys.join(', ') + ' not recognised, try ' + this.validOptions.join(', '));
    }
  }
}

module.exports = Options
