var browser = require('browser-monkey');
var mount = require('./mount');

describe('demo', function(){
  describe('test code', function(){
    it('shows an error when bad syntax', function(){
      mount();

      var test = browser.find('.test');
      
      return test.find('textarea').typeIn('return {(').then(function(){
        return test.find('.errors').shouldHave({
          text: 'SyntaxError: Unexpected token ('
        });
      });
    });
  });

  describe('app code', function(){
    it('shows an error when bad syntax', function(){
      mount();

      var app = browser.find('.app');
      
      return app.find('.source').typeIn('return {(').then(function(){
        return app.find('.errors').shouldHave({
          text: 'SyntaxError: Unexpected token ('
        });
      });
    });
    
    it('renders the code as html', function(){
      mount();

      var appCode = [
        "var plastiq = require('plastiq');",
        "var h = plastiq.html;",
        "return function(){ return h('.message', 'hello'); }"
      ];
      
      var app = browser.find('.app');
      var rendered = browser.find('.rendered');
      return app.find('.source').typeIn(appCode.join('\n')).then(function(){
        return rendered.find('.message').shouldHave({text: 'hello'});
      });
    });
  });

  describe('run test', function(){
    it('runs a passing test', function(){
      mount();

      var appCode = [
        "var plastiq = require('plastiq');",
        "var h = plastiq.html;",
        "return function(){ return h('.message', 'hello'); }"
      ];

      var testCode = [
        "var browser = require('browser-monkey');",
        "return browser.find('.message').shouldHave({text: 'hello'})"
      ];
      
      var app = browser.find('.app');
      var test = browser.find('.test');
      var rendered = browser.find('.rendered');
      return app.find('.source').typeIn(appCode.join('\n')).then(function(){
        return test.find('.source').typeIn(testCode.join('\n'));
      }).then(function(){
        return browser.find('.results').shouldHave({text: 'Passed'});
      });
    });

    it('runs a failing test', function(){
      this.timeout(4000);
      mount();

      var appCode = [
        "var plastiq = require('plastiq');",
        "var h = plastiq.html;",
        "return function(){ return h('.message', 'goodbye'); }"
      ];

      var testCode = [
        "var browser = require('browser-monkey');",
        "return browser.find('.message').shouldHave({text: 'hello'})"
      ];
      
      var app = browser.find('.app');
      var test = browser.find('.test');
      var rendered = browser.find('.rendered');
      return app.find('.source').typeIn(appCode.join('\n')).then(function(){
        return test.find('.source').typeIn(testCode.join('\n'));
      }).then(function(){
        return browser.find('.results').shouldHave({text: 'Failed', timeout: 3000});
      });
    });
  });
});
