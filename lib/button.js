module.exports = {
  button: function (name) {
    return this.anyOf(this._options.definitions.button.map(function (definition) {
      return function (monkey) {
        return definition(monkey, name)
      }
    }))
  },

  defineButton: function (definition) {
    return this.clone(function (clone) {
      this._options.definitions.button.push(definition)
    })
  },

  clickButton: function (name) {
    return this.button(name).click()
  }
}
