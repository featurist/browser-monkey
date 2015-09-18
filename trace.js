module.exports = function(promise) {
  var stack = new Error().stack;

  return promise.then(undefined, function (error) {
    error.stack = stack;
    throw error;
  });
};
