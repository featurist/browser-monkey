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
      <input type="text" onChange={(e) => this.setState({message: e.target.value})}/>
      <div className='message'>{this.state.message}</div>
    </div>
  }
}

module.exports = WebApp
