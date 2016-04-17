var debug = require('debug')('browser-monkey');
var sendkeys = require('./sendkeys');
var Options = require('./options');

module.exports = {
  activate: function (element) {
    var $ = this.get('$');
    var document = this.get('document');
    if (element && element.hasOwnProperty('length')) {
      element = element[0];
    }

    var activeElement = document.activeElement;

    if (activeElement) {
      $(activeElement).trigger('blur');
    }
    document.activeElement = element;
  },

  click: function(options) {
    var self = this;

    return this.enabled().element(options).then(function(element) {
      debug('click', element);
      self.handleEvent({type: 'click', element: element});
      self.activate(element);
      element.trigger('mousedown');
      element.trigger('mouseup');
      if (element[0] && element[0].click) {
        element[0].click();
      } else {
        element.trigger('click');
      }
    });
  },

  select: function(options) {
    var $ = this.get('$');
    var selectOptions = Options.remove(options, ['text', 'exactText']);
    var self = this;

    return this.find('option', selectOptions).element().then(function(optionElement) {
      var selectElement = optionElement.parent();
      self.activate(selectElement);
      optionElement.prop('selected', true);
      optionElement.attr('selected', 'selected');

      debug('select', selectElement);
      self.handleEvent({
        type: 'select option',
        value: selectElement.val(),
        element: selectElement,
        optionElement: optionElement
      });

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
      self.activate(element);
      self.handleEvent({type: 'typing', text: text, element: element});
      return sendkeys(element, text);
    });
  },

  submit: function(options) {
    var $ = this.get('$');
    var self = this;

    return this.element(options).then(function(element) {
      debug('submit', element);
      self.activate(element);
      self.handleEvent({type: 'submit', element: element});
      return $(element).trigger('submit');
    });
  },

  typeInHtml: function(html, options) {
    var self = this;

    return this.element(options).then(function(element) {
      self.activate(element);
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
