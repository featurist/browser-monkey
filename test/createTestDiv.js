module.exports = function() {
  var oldDivs = document.querySelectorAll("body > div.test");

  for(var n = 0; n < oldDivs.length; n++) {
    var oldDiv = oldDivs[n];
    oldDiv.parentNode.removeChild(oldDiv);
  }

  var div = document.createElement('div');

  div.className = 'test';

  document.body.appendChild(div);

  return div;
};
