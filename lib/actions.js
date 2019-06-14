var debug = require('debug')('browser-monkey')
var elementSelect = require('./elementSelect')
var elementClick = require('./elementClick')
var elementSubmit = require('./elementSubmit')
var elementEnterText = require('./elementEnterText')
var elementChecked = require('./elementChecked')
const elementInnerText = require('./elementInnerText')
var inputsSelector = require('./inputsSelector')

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

  enter: function (selector) {
    return this.query(selector).expectOneElement().action(function ([element]) {
      debug('enter', element)
      elementSubmit(element)
    })
  },

  click: function () {
    return this.enabled().expectOneElement().then(function ([element]) {
      debug('click', element)
      elementClick(element)
    })
  },

  select: function (value) {
    var criteria = typeof value === 'string'
      ? [{ exactText: value }, { exactValue: value }]
      : [value]

    return this.is('select').concat(criteria.map(function (c) {
      return function (monkey) {
        return monkey.find('option', c)
      }
    })).expectOneElement().action(function ([optionElement]) {
      var selectElement = optionElement.parentNode
      debug('select', selectElement)
      elementSelect(selectElement, optionElement)
    })
  },

  check: function (value) {
    return this.is('input[type=checkbox]').expectOneElement().action(function ([checkbox]) {
      if (elementChecked(checkbox) !== value) {
        elementClick(checkbox)
      }
    })
  },

  checked: function () {
    return this.is('input[type=checkbox]').expectOneElement().transform(function ([checkbox]) {
      return elementChecked(checkbox)
    })
  },

  selectValue: function () {
    return this.is('select').expectOneElement('expected to be select element').find('option').expectSomeElements('expected select options elements').transform(function (options) {
      var selectElement = options[0].parentNode
      var selectedOption = options[selectElement.selectedIndex]
      return elementInnerText(selectedOption)
    })
  },

  inputValue: function () {
    return this.is(inputsSelector).expectOneElement().transform(function ([element]) {
      return element.value
    })
  },

  typeIn: function (text) {
    return this.is(inputsSelector).expectOneElement().action(function ([element]) {
      if (typeof text !== 'string') {
        throw new Error('expected string as argument to typeIn')
      }
      debug('typeIn', element, text)
      elementEnterText(element, text)
    })
  },

  submit: function () {
    return this.expectOneElement().then(function ([element]) {
      debug('submit', element)
      elementSubmit(element)
    })
  },

  typeInHtml: function (html) {
    return this.expectOneElement().then(function ([element]) {
      debug('typeInHtml', element, html)
      element.focus()
      element.innerHTML = html
    })
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
  var ignoreActions = { constructor: true, _options: true }
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
