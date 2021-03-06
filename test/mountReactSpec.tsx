/* @jsx React.createElement */
import {Query} from '../lib/Query'
import ReactMount from '../lib/ReactMount'

import React from 'react'

describe('mount react', () => {
  let mount

  afterEach(() => {
    mount.unmount()
  })

  it('will check the dom every time react renders', async () => {
    // @ts-ignore
    class App extends React.Component {
      public constructor (props) {
        super(props)
      }

      // @ts-ignore
      public render (): React.ReactNode {
        return <div>
        </div>
      }
    }

    // @ts-ignore
    mount = new ReactMount(React.createElement(App, {}, null))
    const query = new Query().mount(mount)

    await query.shouldContain({'.text': 'Haha'})
    await query.clickButton('Click')
    await query.shouldContain({'.text': 'React'})
  })
})
