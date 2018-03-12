module.exports = function findOptionsToString (options) {
  return '(' + Object.keys(options).map(function (key) {
    return key + ' = ' + JSON.stringify(options[key])
  }) + ')'
}
