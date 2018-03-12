var debug = require('debug')('browser-monkey')
var sendkeys = require('./sendkeys')
var errorHandler = require('./errorHandler')
var elementSelect = require('./elementSelect')
var elementClick = require('./elementClick')
var elementSubmit = require('./elementSubmit')
var elementEnterText = require('./elementEnterText')

function notSillyBlankIEObject (element) {
  return Object.keys(element).length > 0
}
module.exports = {
  focus: function (element, options) {
    var focus = typeof options === 'object' && options.hasOwnProperty('focus') ? options.focus : true

    if (focus) {
      var $ = this.get('$')
      var document = this.get('document')
      if (element && element.length > 0) {
        element = element[0]
      }

      var activeElement = document.activeElement
      if (activeElement && !$(activeElement).is(':focus') && notSillyBlankIEObject(activeElement)) {
        $(activeElement).trigger('blur')
      }
      if (['[object Document]', '[object HTMLDocument]'].indexOf(document.toString()) === -1) {
        document.activeElement = element
      }
      $(element).focus()
    }
  },

  handleEvent: function (event) {
    if (this._options.eventHandler) {
      return Promise.resolve(this._options.eventHandler.call(undefined, event))
    } else {
      return Promise.resolve()
    }
  },

  click: function (options) {
    var self = this

    if (typeof options === 'string') {
      self = this.linkOrButton(options)
    }

    return self.enabled().element(options).then(function (element) {
      debug('click', element)
      return self.handleEvent({type: 'click', element: element}).then(function () {
        elementClick(element)
      })
    }).catch(errorHandler(new Error()))
  },

  select: function (options) {
    if (typeof options === 'string') {
      var o = arguments[1] || {}
      o.text = options
      return this.select(o)
    }

    var self = this

    return this.is('select').find('option', options).element().then(function (optionElement) {
      var selectElement = optionElement.parentNode
      debug('select', selectElement)

      return self.handleEvent({
        type: 'select option',
        value: selectElement.value,
        element: selectElement,
        optionElement: optionElement
      }).then(function () {
        elementSelect(selectElement, optionElement)
      })
    }).catch(errorHandler(new Error()))
  },

  typeIn: function (text, options) {
    if (typeof text === 'object') {
      text = text.text
    }
    var self = this

    return this.is(inputsSelector).element().then(function (element) {
      debug('typeIn', element, text)
      return self.handleEvent({type: 'typing', text: text, element: element}).then(function () {
        elementEnterText(element, text)
      })
    }).catch(errorHandler(new Error()))
  },

  submit: function () {
    var self = this

    return this.element().then(function (element) {
      debug('submit', element)
      return self.handleEvent({type: 'submit', element: element}).then(function () {
        elementSubmit(element)
      })
    }).catch(errorHandler(new Error()))
  },

  typeInHtml: function (html, options) {
    var self = this

    return this.element(options).then(function (element) {
      self.focus(element, options)
      debug('typeInHtml', element, html)
      self.handleEvent({type: 'typing html', html: html, element: element})
      return sendkeys.html(element, html)
    }).catch(errorHandler(new Error()))
  },

  fill: function (field) {
    var isArray = Object.prototype.toString.call(field) === '[object Array]'
    var component = this
    return new Promise(function (resolve, reject) {
      if (isArray) {
        fillField(component, field)
          .then(resolve)
          .catch(reject)
      } else {
        if (!field.name) {
          try {
            field = inferField(component, field)
          } catch (e) {
            reject(e)
            return
          }
        }

        if (typeof component[field.name] === 'function') {
          resolve(component[field.name]()[field.action](field.options))
        } else {
          reject(new Error("No field '" + field.name + "' exists on this component"))
        }
      }
    })
  }
}

function fillField (component, fields) {
  var field = fields.shift()
  if (field) {
    return component.fill(field).then(function () {
      return fillField(component, fields)
    })
  } else {
    return Promise.resolve()
  }
}

function inferField (component, field) {
  var ignoreActions = {constructor: true, _options: true}
  for (var action in component) {
    if (field[action] && !ignoreActions[action]) {
      var newField = {
        name: field[action],
        action: action,
        options: field
      }
      delete field[action]

      if (field.options) {
        newField.options = field.options
      }

      if (typeof component[newField.name] !== 'function') {
        throw new Error("Field '" + newField.name + "' does not exist")
      }

      return newField
    }
  };
  if (!field.name) {
    throw new Error('No action found for field: ' + JSON.stringify(field))
  }
}

var inputsSelector =
  'input:not([type]), ' +
  'input[type=text], ' +
  'input[type=email], ' +
  'input[type=password], ' +
  'input[type=search], ' +
  'input[type=tel], ' +
  'input[type=url], ' +
  'input[type=number],' +
  'textarea'

function canTypeIntoElement (element) {
  return element.is(inputsSelector)
}

function assertCanTypeIntoElement (element) {
  if (!canTypeIntoElement(element)) {
    throw new Error('Cannot type into ' + element.prop('tagName'))
  }
}
