var debug = require('debug')('browser-monkey');
var sendkeys = require('./sendkeys');
var Options = require('./options');

function blurActiveElement() {
  var activeElement;
  try {
    activeElement = document.activeElement;
  } catch ( err ) { }

  if (activeElement) {
    //dispatchEvent(activeElement, 'blur');
  }
}

module.exports = {
  click: function(options) {
    var self = this;

    return this.enabled().element(options).then(function(element) {
      debug('click', element);
      self.handleEvent({type: 'click', element: element});
      blurActiveElement();
      element.trigger('mousedown');
      element.trigger('mouseup');
      element.trigger('click');
    });
  },

  select: function(options) {
    var $ = this.get('$');
    var selectOptions = Options.remove(options, ['text', 'exactText']);
    var self = this;

    return this.find('option', selectOptions).element().then(function(optionElement) {
      optionElement.prop('selected', true);
      var selectElement = optionElement.parent();

      debug('select', selectElement);
      self.handleEvent({
        type: 'select option',
        value: optionElement.val(),
        element: selectElement,
        optionElement: optionElement
      });

      blurActiveElement();
      selectElement.trigger('change');
    });
  },

  typeIn: function(text, options) {
    if (typeof text === 'object'){
      text = text.text;
    }
    var self = this;

    return this.element(options).then(function(element) {
      debug('typeIn', element, text);
      self.handleEvent({type: 'typing', text: text, element: element});
      blurActiveElement();
      return sendkeys(element, text);
    });
  },

  submit: function(options) {
    var $ = this.get('$');
    var self = this;

    return this.element(options).then(function(element) {
      debug('submit', element);
      self.handleEvent({type: 'submit', element: element});
      blurActiveElement();
      return $(element).trigger('submit');
    });
  },

  typeInHtml: function(html, options) {
    var self = this;

    return this.element(options).then(function(element) {
      debug('typeInHtml', element, html);
      self.handleEvent({type: 'typing html', html: html, element: element});
      return sendkeys.html(element, html);
    });
  },


  fill: function(field){
    var isArray = Object.prototype.toString.call(field) === '[object Array]';
    var component = this;
    return new Promise(function(success, failure){
      if (isArray) {
        var fields = field;
          function fillField(){
            var field = fields.shift();
            if (field) {
              return component.fill(field).then(fillField).catch(failure);
            } else {
              success();
            }
          }

          fillField();
      } else {
        if (!field.name) {
          try {
            field = inferField(component, field);
          } catch(e) {
            failure(e.message);
            return;
          }
        }

        if (typeof component[field.name] === 'function') {
          var finder = component[field.name]()
          success(component[field.name]()[field.action](field.options));
        } else {
          failure("No field '"+field.name+"' exists on this component");
        }
      }
    });
  }
};

function inferField(component, field){
  var ignoreActions = {constructor: true, _options: true};
  for (var action in component) {
    if (field[action] && !ignoreActions[action]){
      var newField = {
        name: field[action],
        action: action,
        options: field
      };
      delete field[action];

      if (field.options) {
        newField.options = field.options;
      }

      if (typeof component[newField.name] !== 'function'){
        throw new Error("Field '"+newField.name+"' does not exist");
      }

      return newField;
    }
  };
  if (!field.name) {
    throw new Error('No action found for field: '+JSON.stringify(field));
  }
}
