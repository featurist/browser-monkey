module.exports = {
  field: function (name) {
    return this.anyOf(this._options.definitions.field.map(function (definition) {
      return function (monkey) {
        return definition(name, monkey)
      }
    }))
  },

  defineField: function (definition) {
    this._options.definitions.field.push(definition)
  },

  defineFieldValue: function (definition) {
    this._options.definitions.fieldValue.push(definition)
  },

  setField: function (name, value) {
    return this.field(name).setValue(value)
  },

  setValue: function (value) {
    return this.element().then(function (element) {

    })
  }
}
