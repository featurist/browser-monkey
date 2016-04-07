var App = require('./app');
var plastiq = require('plastiq');

var model = {
  test: {
    source: [
      "var browser = require('browser-monkey');",
      "return browser.find('input').typeIn('George').then(function(){",
      "  return browser.find('.greeting').shouldHave({text: 'Hello George', timeout: 3000});",
      "});"
    ].join('\n')
  },
  app: {
    source: [
      "var plastiq = require('plastiq');",
      "var h = plastiq.html;",
      "return function(model){",
      "  return h('div',",
      "    h('label', 'What is your name? ', h('input', {type: 'text', binding:[model, 'name']})),",
      "    h('.greeting', 'Hello '+ (model.name || '')),",
      "    h('pre', JSON.stringify(model))",
      "  );",
      "}"
    ].join('\n')
  }
};

plastiq.append(document.body, new App(model));
