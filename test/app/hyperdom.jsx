/** @jsx hyperdom.jsx */
var httpism = require('httpism/browser');
var hyperdom = require('hyperdom');
var html = hyperdom.html;

module.exports = class WebApp {
  constructor() {
    this.frameworks = []
  }

  onload() {
    return httpism.get('/api/frameworks').then(response => {
      this.frameworks = response.body
    })
  }

  render() {
    return <ul>
      {this.frameworks.map(name => <li>{name}</li>)}
    </ul>
  }
}
