module.exports = function (error) {
  return function (e) {
    e.stack = error.stack
    throw e
  }
}
