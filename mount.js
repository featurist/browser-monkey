var window = require('global');
var document = window.document;

try {
  var VineHill = require('vinehill');
} catch(e) {
  console.warn('optional dependency vinehill was not found, to mount a server you will need to install it using `npm install vinehill --save-dev`');
}

function Mount(options) {
  if (VineHill) {
    this.vinehill = new VineHill();
  }
  this.startApp = options.startApp.bind(this);
  this.stopApp = options.stopApp.bind(this);
}

Mount.prototype.setOrigin = function(host) {
  if (VineHill) {
    this.vinehill.setOrigin(host);
  } else {
    throw new Error('to use this feature you must `npm install vinehill --save-dev`');
  }
  return this;
}

Mount.prototype.withServer = function(host, app) {
  if (VineHill) {
    this.vinehill.add(host, app);
  } else {
    throw new Error('to use this feature you must `npm install vinehill --save-dev`');
  }
  return this;
}

Mount.prototype.withApp = function(getApp) {
  this.getApp = getApp;
  return this;
}

Mount.prototype.start = function() {
  if (VineHill) {
    this.vinehill.start();
  }
  this.app = this.getApp();
  var monkey = this.startApp();
  monkey.set({
    app: this.app,
    mount: this,
  })
  return monkey;
}

Mount.prototype.stop = function(){
  this.stopApp();
  this.vinehill.stop();
}

var div;
Mount.createTestDiv = function(){
  if (div) {
    div.parentNode.removeChild(div);
  }
  div = document.createElement('div');
  document.body.appendChild(div);
  return div;
}
Mount.runningInNode =
  (typeof process !== 'undefined') &&
  (typeof process.versions.node !== 'undefined') &&
  (typeof process.versions.electron === 'undefined');

module.exports = Mount;

function addRefreshButton() {
  var refreshLink = document.createElement('a');
  refreshLink.href = window.location.href;
  refreshLink.innerText = 'refresh';
  document.body.appendChild(refreshLink);
  document.body.appendChild(document.createElement('hr'));
}

if (Mount.runningInNode) {
  require('./stubBrowser');
} else {
  if (/\/debug\.html$/.test(window.location.pathname)) {
    localStorage['debug'] = 'browser-monkey';
    addRefreshButton();
  }
}

