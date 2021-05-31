/**
 * @jest-environment jsdom
 */
import {Query} from '../../lib/Query'

describe('jest', () => {
  test('can detect jsdom environment', async () => {
    document.body.insertAdjacentHTML('beforeend', '<div class="test"></div>')

    const query = new Query()

    await query.find('.test')
  })
})
