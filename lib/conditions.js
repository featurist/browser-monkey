var trytryagain = require('trytryagain')

function Conditions () {
  this.mappers = []
}

Conditions.prototype.clone = function (mapper) {
  const s = new Conditions()
  s.mappers = this.mappers.slice()
  s._input = this._input
  return s
}

Conditions.prototype.map = function (mapper) {
  this.mappers.push(mapper)
}

Conditions.prototype.result = function (input, {retry = trytryagain, reducer = (input, map) => map(input)} = {}) {
  return Promise.resolve(retry(() => {
    return this.mappers.reduce(reducer, input)
  }))
}

module.exports = Conditions
