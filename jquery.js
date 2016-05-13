var jquery = require('jquery');
function dispatchEvent(element, eventType){
  var event;

  if (document.createEvent) {
    if (eventType === 'click' && (element.tagName === 'A' || element.tagName === 'LABEL')) {
      var event = document.createEvent("MouseEvents");
      event.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    }
    else {
      event = document.createEvent("Event");
      event.initEvent(eventType, true, true);
    }
  } else {
    event = document.createEventObject();
    event.eventType = eventType;
  }

  event.eventName = eventType;

  if (document.createEvent) {
    element.dispatchEvent(event);
  } else {
    element.fireEvent("on" + event.eventType, event);
  }
}

if (jquery.fn) {
  jquery.fn.extend({
    innerText: function(){
      return this[0].innerText || this[0].textContent;
    },

    trigger: function(eventType){
      for (var i=0; i<this.length; i++){
        var element = this[i];
        if (eventType === 'click' && element.type === 'checkbox') {
          element.checked = !element.checked;
          dispatchEvent(element, eventType);
        }
        else if (eventType === 'submit' && element.form) {
          if (!jquery.preventFormSubmit) {
            element.form.submit();
          }
          dispatchEvent(element.form, eventType);
        }
        else {
          dispatchEvent(element, eventType);
        }
      };

      return this;
    },

    on: function(eventType, cb){
      for (var i=0; i<this.length; i++){
        var element = this[i];
        element.addEventListener(eventType, cb, false);
      }
      return this;
    },

    focus: function(){
      for (var i=0; i<this.length; i++){
        var element = this[i];
        element.focus();
      }
      return this;
    }
  });
}

module.exports = jquery;
