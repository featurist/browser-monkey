var browser = require('..');
var createTestDom = require('./createTestDom');
var $ = require('jquery');

describe('fuzzy finders', function() {
  
  var clicks;

  beforeEach(function() {
    clicks = [];
    createTestDom().eventuallyInsert(
      '<a id="link_one" href="#one">Link One</a> ' +
      '<a id="link_two" href="#two">Link Two</a> ' +
      '<a id="link_three" title="Link Three" href="#three">Another Link</a> ' +
      '<a id="link_four" href="#four"><img alt="Link Four" /></a> ' +
      '<div id="container"><a id="link_five" href="#five">Fifth Link</a></div>' +
      '<button id="button_one">Button One</button> ' +
      '<button id="button_two">Button T w o</button> ' +
      '<input id="button_three" type="submit" value="Button Three"></input> ' +
      '<button id="button_four" title="Button Four">F o u r</button> ' +
      '<input id="button_five" type="submit" title="Button Five" value="F i v e"></input> ' +
      '<button id="button_six"><img alt="Button Six" /></button>' +
      '<input id="button_seven" type="reset" value="Button Seven"></input> ' +
      '<input id="button_eight" type="button" value="Button Eight"></input> '
    ).then(function(dom) {
      dom.on('click', '*', function() {
        clicks.push(this.id);
        return false;
      });
    });
  });

  describe('.click(label)', function () {
    it('clicks links or buttons with the label', function() {
      var labels = ['Link One', 'button_seven', 'Button Six'];
      return Promise.all(labels.map(function(label) {
        return browser.click(label);
      })).then(function() {
        expect(clicks.sort()).to.eql(['button_seven', 'button_six', 'link_one']);
      });
    });
  });

  describe('.linkOrButton(label)', function () {
    it('finds links or buttons with the label', function() {
      var labels = ['Link Four', 'button_two', 'Button Eight'];
      return Promise.all(labels.map(function(label) {
        return browser.linkOrButton(label).click();
      })).then(function() {
        expect(clicks.sort()).to.eql(['button_eight', 'button_two', 'link_four']);
      });
    });
  });

  describe('.link(label)', function () {

    it('finds anchors by text', function () {
      return browser.link('Link One').click().then(function() {
        expect(clicks).to.eql(['link_one']);
      });
    });

    it('finds anchors by id', function () {
      return browser.link('link_two').click().then(function() {
        expect(clicks).to.eql(['link_two']);
      });
    });
    
    it('finds anchors by title', function () {
      return browser.link('Link Three').click().then(function() {
        expect(clicks).to.eql(['link_three']);
      });
    });

    it('finds anchors by nested img alt', function () {
      return browser.link('Link Four').click().then(function() {
        expect(clicks).to.eql(['link_four']);
      });
    });

    it('finds anchors inside elements', function () {
      return browser.find('#container').link('Fifth Link').click().then(function() {
        expect(clicks).to.eql(['link_five']);
      });
    });

    it('does not find anchors by id', function () {
      return browser.link('omg').shouldNotExist();
    });

    it('does not find anchors inside elements', function () {
      return browser.find('#container').link('foo').shouldNotExist();
    });

  });

  describe('.button(label)', function () {

    it('finds button elements by text', function () {
      return browser.button('Button One').click().then(function() {
        expect(clicks).to.eql(['button_one']);
      });
    });

    it('finds button elements by id', function () {
      return browser.button('button_two').click().then(function() {
        expect(clicks).to.eql(['button_two']);
      });
    });

    it('does not find button elements by id', function () {
      return browser.button('button_666').shouldNotExist();
    });

    it('finds button elements by value substring', function () {
      return browser.button('Three').click().then(function() {
        expect(clicks).to.eql(['button_three']);
      });
    });

    it('does not find button elements by value substring', function () {
      return browser.button('not a substring').shouldNotExist();
    });

    it('finds button elements by title substring', function () {
      return browser.button('Four').click().then(function() {
        expect(clicks).to.eql(['button_four']);
      });
    });

    it('finds input elements by title substring', function () {
      return browser.button('Five').click().then(function() {
        expect(clicks).to.eql(['button_five']);
      });
    });

    it('finds button elements by nested image alt substring', function () {
      return browser.button('Six').click().then(function() {
        expect(clicks).to.eql(['button_six']);
      });
    });

    it('finds input[type=reset] elements', function () {
      return browser.button('Seven').click().then(function() {
        expect(clicks).to.eql(['button_seven']);
      });
    });

    it('finds input[type=button] elements', function () {
      return browser.button('Eight').click().then(function() {
        expect(clicks).to.eql(['button_eight']);
      });
    });

  });
  
});
