
module.exports = function dispatchEvent(el, type){
  var e;
  if (document.createEvent){
    e = document.createEvent('Event');
    e.initEvent(type, true, true);
  } else if (document.createEventObject){
    e = document.createEventObjet();
  }
  
  if (el.dispatchEvent){
    el.dispatchEvent(e);
  } else {
    el.fireEvent('on'+type, e);
  }
}
