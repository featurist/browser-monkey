/** @jsx hyperdom.jsx */
var httpism = require('httpism/browser');
var hyperdom = require('hyperdom');
var html = hyperdom.html;

module.exports = class WebApp {
  constructor() {
    var self = this;
    this.model = {
      frameworks: []
    };

    httpism.get('/api/frameworks').then(response => {
      self.model.frameworks = response.body;
      self.model.refresh();
    });
  }


  render() {
    this.model.refresh = html.refresh;

    return <ul>
      {this.model.frameworks.map(name => <li>{name}</li>)}
    </ul>
  }
}
