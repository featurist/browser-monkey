import {Query} from '../lib/Query'
import ReactMount from '../lib/ReactMount'

import React from 'react'

describe('mount react', () => {
  let mount

  afterEach(() => {
    mount.unmount()
  })

  it('will check the dom every time react renders', async () => {
    /* class App2 extends React.Component<{}, {text: string}> { */
    /*   public constructor (props) { */
    /*     super(props) */
    /*     this.state = { */
    /*       text: 'Haha' */
    /*     } */
    /*   } */

    /*   public render (): React.ReactNode { */
    /*     return <div> */
    /*       <div className="text">{this.state.text}</div> */
    /*       <button onClick={() => this.setState({text: 'React'})}>Click</button> */
    /*     </div> */
    /*   } */
    /* } */
    class App extends React.Component {
      public constructor (props) {
        super(props)
      }

      public render (): React.ReactNode {
        return <div>
        </div>
      }
    }

    mount = new ReactMount(React.createElement(App, {}, null))
    const query = new Query().mount(mount)

    await query.shouldContain({'.text': 'Haha'})
    await query.clickButton('Click')
    await query.shouldContain({'.text': 'React'})
  })
})
