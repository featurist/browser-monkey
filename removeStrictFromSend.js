var util = require('util');
var through = require('through');
var path = require('path');

// in pre safari 10 send causes a strict mode bug to occur in safari
// and so can't load vinehill/express apps at all
// this removes strict mode so that doesn't happen
// it is a bit of a blunt tool because it won't run in strict mode
// in any browser anymore. will be able to remove this once
// older versions of safari are less used

function unstrictifySend(file, opts) {
  opts = opts || {};
  opts.exclude = ['json'].concat(opts.exclude||[]);

  var stream = through(write, end);
  var applied = false;

  var filetype = path.extname(file).replace('.', '');
  var excluded = (opts.exclude).some(function (excludedExt) {
    return filetype == excludedExt.replace('.', '');
  });

  return stream;

  function write(buf) {
    if (!applied && !excluded) {
      applied = true;
    }
    if (file.indexOf('send/index.js') != -1) {
      var output = buf.toString().replace(/'use strict'/, '')
      stream.queue(output)
    } else {
      stream.queue(buf);
    }
  }

  function end() {
    stream.queue(null);
  }
}

module.exports = unstrictifySend;
