var browser = require('..');
var createTestDom = require('./createTestDom');
var $ = require('jquery');

describe('fuzzy finders', function() {

  describe('.link(label)', function () {

    beforeEach(function() {
      createTestDom().eventuallyInsert(
        '<a href="#one">Link One</a> ' +
        '<a id="link_two" href="#two">Link Two</a> ' +
        '<a title="Link Three" href="#three">Another Link</a> ' +
        '<a href="#four"><img alt="Fourth Link" /></a> ' +
        '<div id="container"><a href="#five">Fifth Link</a></div>'
      );
    });

    it('finds anchors by text', function () {
      return browser.link('Link One').click().then(function() {
        expect(window.location.hash).to.equal('#one');
      });
    });

    it('finds anchors by id', function () {
      return browser.link('link_two').click().then(function() {
        expect(window.location.hash).to.equal('#two');
      });
    });
    
    it('finds anchors by title', function () {
      return browser.link('Link Three').click().then(function() {
        expect(window.location.hash).to.equal('#three');
      });
    });

    it('finds anchors by nested img alt', function () {
      return browser.link('Fourth Link').click().then(function() {
        expect(window.location.hash).to.equal('#four');
      });
    });

    it('finds anchors inside elements', function () {
      return browser.find('#container').link('Fifth Link').click().then(function() {
        expect(window.location.hash).to.equal('#five');
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

    var clicked;

    beforeEach(function() {
      clicked = [];
      createTestDom().eventuallyInsert(
        '<button id="button_one">Button One</a> ' +
        '<button id="button_two">Button T w o</a> ' +
        '<input id="button_three" type="submit" value="Button Three"></input> ' +
        '<button id="button_four" title="Button Four">F o u r</button> ' +
        '<input id="button_five" title="Button Five" value="F i v e"></button> ' +
        '<button id="button_six"><img alt="Button Six" /></button>' +
        '<input id="button_seven" type="reset" value="Button Seven"></input> ' +
        '<input id="button_eight" type="button" value="Button Eight"></input> '
      ).then(function(dom) {
        dom.on('click', '*', function() {
          clicked.push(this.id);
        });
      });
    });

    it('finds button elements by text', function () {
      browser.button('Button One').click().then(function() {
        expect(clicked).to.eql(['button_one']);
      });
    });

    it('finds button elements by id', function () {
      browser.button('button_two').click().then(function() {
        expect(clicked).to.eql(['button_two']);
      });
    });

    it('does not find button elements by id', function () {
      return browser.button('button_666').shouldNotExist();
    });

    it('finds button elements by value substring', function () {
      browser.button('Three').click().then(function() {
        expect(clicked).to.eql(['button_three']);
      });
    });

    it('does not find button elements by value substring', function () {
      return browser.button('not a substring').shouldNotExist();
    });

    it('finds button elements by title substring', function () {
      browser.button('Four').click().then(function() {
        expect(clicked).to.eql(['button_four']);
      });
    });

    it('finds input elements by title substring', function () {
      browser.button('Five').click().then(function() {
        expect(clicked).to.eql(['button_five']);
      });
    });

    it('finds button elements by nested image input alt substring', function () {
      browser.button('Six').click().then(function() {
        expect(clicked).to.eql(['button_six']);
      });
    });

    it('finds input[type=reset] elements', function () {
      browser.button('Seven').click().then(function() {
        expect(clicked).to.eql(['button_six']);
      });
    });

    it('finds input[type=button] elements', function () {
      browser.button('Eight').click().then(function() {
        expect(clicked).to.eql(['button_eight']);
      });
    });

  });
  
});
