module.exports = {
  button: function (name) {
    return this.all(this._options.definitions.button.map(function (definition) {
      return function (monkey) {
        return definition(monkey, name)
      }
    }))
  },

  defineButton: function (definition) {
    var self = this
    return this.clone(function (clone) {
      self._options.definitions.button.push(definition)
    })
  },

  clickButton: function (name) {
    return this.button(name).click()
  }
}
