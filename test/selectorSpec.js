var trytryagain = require('trytryagain')
const {expect} = require('chai')

describe.only('map', function () {
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

  Conditions.prototype.wait = function (input, {retry = trytryagain} = {}) {
    return retry(() => {
      return this.mappers.reduce((input, mapper) => {
        return mapper(input)
      }, input)
    })
  }

  it('can transform an input', async () => {
    const s = new Conditions()
    s.map(x => x + 1)
    s.map(x => x + 2)
    const result = await s.wait(1)
    expect(result).to.equal(4)
  })

  it('returns input when there are no mappers', async () => {
    const s = new Conditions()
    const result = await s.wait(1)
    expect(result).to.equal(1)
  })

  it('returns a result when there are no failures', async () => {
    const s = new Conditions()
    let ready = false

    s.map(x => {
      if (!ready) {
        ready = true
        throw new Error('not ready')
      }
      return x + 1
    })

    const result = await s.wait(1)

    expect(result).to.equal(2)
  })

  it('can override retry function', async () => {
    const s = new Conditions()
    let ready = false
    const events = []

    s.map(x => {
      if (!ready) {
        ready = true
        throw new Error('not ready')
      }
      return x + 1
    })

    const retry = fn => {
      events.push('retry')
      try {
        fn()
      } catch (e) {
        events.push('fail ' + e.message)
      }

      const result = fn()
      events.push('pass')
      return result
    }

    events.push('await')
    const result = await s.wait(1, {retry})

    expect(result).to.equal(2)
    expect(events).to.eql([
      'await',
      'retry',
      'fail not ready',
      'pass'
    ])
  })
})
