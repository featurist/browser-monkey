/** @jsx */

const React = require('react')
const ReactDOM = require('react-dom')
const httpism = require('httpism')

class WebApp extends React.Component {
  constructor() {
    super()
    this.state = { frameworks: [] }
  }

  componentDidMount() {
    httpism.get('/api/frameworks').then(response => {
      this.setState({ frameworks: response.body })
    })
  }

  render() {
    return <ul>
      {this.state.frameworks.map(name => <li key={name}>{name}</li>)}
    </ul>
  }
}

module.exports = WebApp
