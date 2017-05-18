module.exports = function (el) {
  if (!el.files.writeable) {
    el.files.writeable = true
    el.fileRegister = []

    el.files.add = function (file) {
      el.fileRegister[el.fileRegister.length] = file
    }

    el.files.item = function (index) {
      return el.fileRegister[index]
    }

    Object.defineProperty(el.files, 'length', {
      get: function () {
        return el.fileRegister.length
      }
    })
  }
}
