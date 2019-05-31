module.exports = {
  field: function (name) {
    return this.all(this._options.definitions.field.map(function (definition) {
      return function (monkey) {
        return definition(monkey, name)
      }
    }))
  },

  defineField: function (definition) {
    return this.clone(function (clone) {
      clone._options.definitions.field.push(definition)
    })
  },

  defineFieldValue: function (definition) {
    return this.clone(function (clone) {
      clone._options.definitions.fieldValue.push(definition)
    })
  },

  setField: function (name, value) {
    return this.field(name).setValue(value)
  },

  valueOld: function () {
    var getters = this._options.definitions.fieldValue.map(function (definition) {
      return definition.get
    })

    return this.race(getters)
  },

  setValue: function (value) {
    var setters = this._options.definitions.fieldValue.map(function (definition) {
      return function (monkey) {
        return definition.set(monkey, value)
      }
    })

    return this.race(setters)
  }
}
