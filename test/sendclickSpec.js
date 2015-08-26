var createTestDiv = require('./createTestDiv');
var $ = require('jquery');
var expect = require('chai').expect;
var sendclick = require("../sendclick");

describe('sendclick', function() {
  it('can navigate to an anchor href', function() {
    var div = createTestDiv();

    var a = document.createElement("a");
    window.location = "#";

    a.href = "#/haha";
    div.appendChild(a);

    sendclick(a);

    expect(window.location.hash).to.equal("#/haha");
  });

  it('can click on an anchor which prevents default', function() {
    var div = createTestDiv();
    var a = document.createElement("a");

    window.location = "#";

    a.href = "#/haha";
    div.appendChild(a);

    var clicked = false;

    div.onclick = function(ev) {
      clicked = true;
      ev.preventDefault();
    };

    var hash = window.location.hash;

    // IE returns a pound even when there is no value after it
    if (hash === '#') hash = '';

    sendclick(a);
    expect(clicked).to.be.true;
    expect(hash).to.equal("");
  });
});
