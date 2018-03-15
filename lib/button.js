const elementsFindElements = require('./elementsFindElements')

module.exports = {
  button: function (name) {
    var self = this

    return this.mapAll(function (elements) {
      return elementsFindElements(elements, 'button', {exactText: name}, self._options)
        .concat(elementsFindElements(elements, 'input[type=button]', {exactValue: name}, self._options))
        .concat(elementsFindElements(elements, 'a', {exactText: name}, self._options))
    }, 'button')
  }
}
