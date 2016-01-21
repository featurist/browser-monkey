var createTestDom = require('./createTestDom');
var $ = require('jquery');
var expect = require('chai').expect;
var sendclick = require("../sendclick");

describe('sendclick', function() {
  var dom;
  beforeEach(function(){
    dom = createTestDom();
  });
  it('can navigate to an anchor href', function() {
    var a = document.createElement("a");
    window.location = "#";

    a.href = "#/haha";
    dom.insert(a);

    sendclick(a);

    expect(window.location.hash).to.equal("#/haha");
  });

  it('can click on an anchor which prevents default', function() {
    var a = document.createElement("a");

    window.location = "#";

    a.href = "#/haha";
    dom.insert(a);

    var clicked = false;

    dom.el.on('click',function(ev) {
      clicked = true;
      ev.preventDefault();
    });

    var hash = window.location.hash;

    // IE returns a pound even when there is no value after it
    if (hash === '#') hash = '';

    sendclick(a);
    expect(clicked).to.be.true;
    expect(hash).to.equal("");
  });
});
