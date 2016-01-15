module.exports = 
  typeof $ === 'undefined'
    ? require("jquery")
    : window.$;
