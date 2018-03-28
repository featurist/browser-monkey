module.exports = function normaliseText (text) {
  return text.replace(/ +/g, ' ').replace(/ *\r?\n */g, '\n').trim()
}
