/** @jsx plastiq.html */
var plastiq = require('plastiq');
var h = plastiq.html;
var detective = require('detective');
var httpism = require('httpism');
var ace = require('plastiq-ace-editor');

require('brace/mode/javascript');
require('brace/theme/monokai');

module.exports = class App {
  constructor(model){
    this.model = model = model || {};
    model.test = model.test || { source: '' };
    model.app  = model.app  || { source: '' };
    this.browserModules = {};
  }

  loadModule(name) {
    if (name === 'plastiq') return;
    var browserModules = this.browserModules;
    if (!browserModules.hasOwnProperty(name)) {
      var module = {
        exports: {}
      };
      return httpism.get('https://wzrd.in/standalone/' + name + '@latest').then(function(response) {
        new Function('module', 'exports', response.body)(module, module.exports);
        browserModules[name] = module;
      }, function (error) {
        browserModules[name] = false;
      });
    }
  }

  loadModules(model) {
    var refresh = this.model.refresh;
    var modulesRequired = detective(model.source);

    var modulesNotLoaded = modulesRequired.filter(m => {
      return !this.browserModules.hasOwnProperty(m);
    });

    var modulesNotFound = modulesRequired.filter(m => {
      return this.browserModules[m] === false;
    });

    if (modulesNotFound.length) {
      if (modulesNotFound.length == 1) {
        throw new Error('module ' + modulesNotFound[0] + " doesn't exist");
      } else {
        throw new Error('modules ' + modulesNotFound.join(', ') + " don't exist");
      }
    } else if (modulesNotLoaded.length) {
      model.loading = 'modules ' + modulesNotLoaded.join(', ') + ' still loading';
    }
    return Promise.all(
      modulesRequired.map(r => {
        var promise = this.loadModule(r);
        if (promise) {
          promise.then(refresh, refresh);
        }
        return promise;
      })
    );
  }

  parse(model){
    function handleError(e){
      model.state = 'Error';
      model.sourceError = e; 
      this.model.refresh();
    }
    try {
      if (model.lastSource !== model.source) {
        model.lastSource = model.source;
        model.state = 'Pending';
        delete model.sourceError;
        delete model.sourceFunction;
        if (model.source) {
          this.loadModules(model).then(() => {
            model.sourceFunction = new Function('require', model.source);
            this.model.refresh();
          }).catch(handleError.bind(this));
        }
      }
    } catch(e) {
      handleError(e);
    }
  }

  browserRequire(name){
    if (name === 'plastiq') {
      return plastiq;
    }
    if (this.browserModules.hasOwnProperty(name)) {
      return this.browserModules[name].exports;
    }
  }


  renderApp(){
    var self = this;
    var app = this.model.app;
    if (!app.sourceError && app.sourceFunction){
      app.state = 'Complete';
      app.appModel = app.appModel || {};
      return app.sourceFunction.call(null, self.browserRequire.bind(self))(app.appModel);
    }
  }

  runTest(){
    var self = this;
    var test = this.model.test;
    var app = this.model.app;

    if(!test.sourceError && test.sourceFunction && (test.state === 'Pending' || app.state === 'Pending')) {
      test.state = 'Running';
      return test.sourceFunction.call(null, self.browserRequire.bind(self)).then(() => {
        test.state = 'Passed';
        delete test.error;
        self.model.refresh();
      }).catch(e => {
        test.state = 'Failed';
        test.error = e;
        self.model.refresh();
      });
    }
  }

  render(){
    var model = this.model;
    model.refresh = h.refresh;
    this.parse(model.test);
    this.parse(model.app);
    this.runTest();
    return <div>
      <div class="test">
        <textarea class="source" binding={[model.test, 'source']}></textarea>
        <div class="errors">{model.test.sourceError}</div>
      </div>
      <div class="app">
        <textarea class="source" binding={[model.app, 'source']}></textarea>
        <div class="errors">{model.app.sourceError}</div>
      </div>
      <div class="rendered">{this.renderApp()}</div>
      <div class="results">{model.test.state} {model.test.error}</div>
    </div>
  }
}

