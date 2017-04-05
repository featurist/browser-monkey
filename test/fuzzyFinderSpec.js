var demand = require('must')
var domTest = require('./domTest');

describe('fuzzy finders', function() {
  function domSetup(dom, $) {
    var clicks = [];
    dom.insert(
      '<div>' +
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
      '<input id="button_eight" type="button" value="Button Eight"></input> ' +
      '</div>'
    );
    dom.el.find('*').on('click', function(e) {
      if (!$(this).is('div')) {
        clicks.push($(this).attr('id'));
      }
      return false;
    });

    return clicks;
  };

  describe('.click(label)', function () {
    domTest('clicks links or buttons with the label', function(browser, dom, $) {
      var labels = ['Link One', 'button_seven', 'Button Six'];
      var clicks = domSetup(dom, $);
      return Promise.all(labels.map(function(label) {
        return browser.click(label);
      })).then(function() {
        demand(clicks.sort()).to.eql(['button_seven', 'button_six', 'link_one']);
      });
    });
  });

  describe('.linkOrButton(label)', function () {
    domTest('finds links or buttons with the label', function(browser, dom, $) {
      var labels = ['Link Four', 'button_two', 'Button Eight'];
      var clicks = domSetup(dom, $);
      return Promise.all(labels.map(function(label) {
        return browser.linkOrButton(label).click();
      })).then(function() {
        demand(clicks.sort()).to.eql(['button_eight', 'button_two', 'link_four']);
      });
    });
  });

  describe('.link(label)', function () {
    domTest('finds anchors by text', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.link('Link One').click().then(function() {
        demand(clicks).to.eql(['link_one']);
      });
    });

    domTest('finds anchors by id', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.link('link_two').click().then(function() {
        demand(clicks).to.eql(['link_two']);
      });
    });

    domTest('finds anchors by title', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.link('Link Three').click().then(function() {
        demand(clicks).to.eql(['link_three']);
      });
    });

    domTest('finds anchors by nested img alt', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.link('Link Four').click().then(function() {
        demand(clicks).to.eql(['link_four']);
      });
    });

    domTest('finds anchors inside elements', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.find('#container').link('Fifth Link').click().then(function() {
        demand(clicks).to.eql(['link_five']);
      });
    });

    domTest('does not find anchors by id', function (browser, dom, $) {
      domSetup(dom, $);
      return browser.link('omg').shouldNotExist();
    });

    domTest('does not find anchors inside elements', function (browser, dom, $) {
      domSetup(dom, $);
      return browser.find('#container').link('foo').shouldNotExist();
    });

  });

  describe('.button(label)', function () {

    domTest('finds button elements by text', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.button('Button One').click().then(function() {
        demand(clicks).to.eql(['button_one']);
      });
    });

    domTest('finds button elements by id', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.button('button_two').click().then(function() {
        demand(clicks).to.eql(['button_two']);
      });
    });

    domTest('does not find button elements by id', function (browser, dom, $) {
      domSetup(dom, $);
      return browser.button('button_666').shouldNotExist();
    });

    domTest('finds button elements by value substring', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.button('Three').click().then(function() {
        demand(clicks).to.eql(['button_three']);
      });
    });

    domTest('does not find button elements by value substring', function (browser, dom, $) {
      domSetup(dom, $);
      return browser.button('not a substring').shouldNotExist();
    });

    domTest('finds button elements by title substring', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.button('Four').click().then(function() {
        demand(clicks).to.eql(['button_four']);
      });
    });

    domTest('finds input elements by title substring', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.button('Five').click().then(function() {
        demand(clicks).to.eql(['button_five']);
      });
    });

    domTest('finds button elements by nested image alt substring', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.button('Six').click().then(function() {
        demand(clicks).to.eql(['button_six']);
      });
    });

    domTest('finds input[type=reset] elements', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.button('Seven').click().then(function() {
        demand(clicks).to.eql(['button_seven']);
      });
    });

    domTest('finds input[type=button] elements', function (browser, dom, $) {
      var clicks = domSetup(dom, $);
      return browser.button('Eight').click().then(function() {
        demand(clicks).to.eql(['button_eight']);
      });
    });
  });
});
