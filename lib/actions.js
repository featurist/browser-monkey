var debug = require('debug')('browser-monkey')
var inputSelectors = require('./inputSelectors')

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

  select: function (value) {
    var criteria = typeof value === 'string'
      ? [{ exactText: value }, { exactValue: value }]
      : [value]

    return this.is('select').concat(criteria.map(c => {
      return monkey => {
        return monkey.find('option', c)
      }
    })).expectOneElement().action(([optionElement]) => {
      var selectElement = optionElement.parentNode
      debug('select', selectElement)
      this._dom.selectOption(selectElement, optionElement)
    })
  },

  check: function (value) {
    return this.is('input[type=checkbox]').expectOneElement().action(([checkbox]) => {
      if (this._dom.checked(checkbox) !== value) {
        this._dom.click(checkbox)
      }
    })
  },

  checked: function () {
    return this.is('input[type=checkbox]').expectOneElement().transform(([checkbox]) => {
      return this._dom.checked(checkbox)
    })
  },

  selectValue: function () {
    return this.is('select').expectOneElement('expected to be select element').find('option').expectSomeElements('expected select options elements').transform(options => {
      var selectElement = options[0].parentNode
      var selectedOption = options[selectElement.selectedIndex]
      return this._dom.elementInnerText(selectedOption)
    })
  },

  inputValue: function () {
    return this.is(inputSelectors.settable).expectOneElement().transform(([element]) => {
      return element.value
    })
  },

  typeIn: function (text) {
    return this.is(inputSelectors.settable).expectOneElement().action(([element]) => {
      if (typeof text !== 'string') {
        throw new Error('expected string as argument to typeIn')
      }
      debug('typeIn', element, text)
      this._dom.enterText(element, text)
    })
  },

  click: function (name) {
    const query = name === undefined
      ? this
      : this.button(name)

    return query.enabled().expectOneElement().action(([element]) => {
      debug('click', element)
      this._dom.click(element)
    })
  },

  submit: function () {
    return this.expectOneElement().action(([element]) => {
      debug('submit', element)
      this._dom.submit(element)
    })
  },

  typeInHtml: function (html) {
    return this.expectOneElement().then(([element]) => {
      debug('typeInHtml', element, html)
      element.focus()
      element.innerHTML = html
    })
  },

  fill: function (field) {
    var isArray = Object.prototype.toString.call(field) === '[object Array]'
    return new Promise((resolve, reject) => {
      if (isArray) {
        fillField(this, field)
          .then(resolve)
          .catch(reject)
      } else {
        if (!field.name) {
          try {
            field = inferField(this, field)
          } catch (e) {
            reject(e)
            return
          }
        }

        if (typeof this[field.name] === 'function') {
          resolve(this[field.name]()[field.action](field.options))
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
    return component.fill(field).then(() => {
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
