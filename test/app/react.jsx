/** @jsx */

const React = require('react')

class WebApp extends React.Component {
  constructor () {
    super()
    this.state = { message: 'default' }
  }

  hello () {
    this.setState({ message: 'hello browser-monkey' })
  }

  render () {
    return <div>
      <button onClick={() => this.hello()}>press me</button>
      <div className='message'>{this.state.message}</div>
    </div>
  }
}

module.exports = WebApp
