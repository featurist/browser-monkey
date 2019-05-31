module.exports = class Transformation {
  constructor (transform : Transform, parent? : Transformation) {
    this.transform = transform
    this.parent = parent
  }
}