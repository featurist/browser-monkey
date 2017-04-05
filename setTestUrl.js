module.exports = function (options) {
  if (options) {
    if (options.hash !== undefined) {
      window.location.hash = options.hash
    } else if (options.url) {
      window.history.pushState(null, null, options.url)
    }
  }
}
