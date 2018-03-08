const expect = require('must')
const Conditions = require('../lib/conditions')

describe('map', function () {
  describe('asynchronously', () => {
    it('can transform an input', async () => {
      const s = new Conditions()
      s.map(x => x + 1)
      s.map(x => x + 2)
      const result = await s.result(1)
      expect(result).to.equal(4)
    })

    it('will retry until there are no failures', async () => {
      const s = new Conditions()
      let ready = false
      const events = []

      s.map(x => {
        if (!ready) {
          ready = true
          events.push('fail')
          throw new Error('not ready')
        }
        events.push('pass')
        return x + 1
      })

      const result = await s.result(1)

      expect(result).to.equal(2)
      expect(events).to.eql([
        'fail',
        'pass'
      ])
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
      const result = await s.result(1, {retry})

      expect(result).to.equal(2)
      expect(events).to.eql([
        'await',
        'retry',
        'fail not ready',
        'pass'
      ])
    })
  })

  describe('synchronously', () => {
    it('can transform an input', () => {
      const s = new Conditions()
      s.map(x => x + 1)
      s.map(x => x + 2)
      const result = s.result(1, {wait: false})
      expect(result).to.equal(4)
    })

    it('will retry until there are no failures', () => {
      const s = new Conditions()
      let ready = false
      const events = []

      s.map(x => {
        if (!ready) {
          ready = true
          events.push('fail')
          throw new Error('not ready')
        }
        events.push('pass')
        return x + 1
      })

      expect(() => s.result(1, {wait: false})).to.throw('not ready')
      expect(events).to.eql([
        'fail'
      ])
    })
  })
})
