module.exports = function (el) {
  if (!el.files.writeable) {
    el.files.writeable = true

    var length = 0
    el.files.add = function (file) {
      el.files[el.files.length] = file
      length++
    }

    el.files.item = function (index) {
      return el.files[index]
    }

    Object.defineProperty(el.files, 'length', {
      get: function () {
        return length
      }
    })
  }
}
