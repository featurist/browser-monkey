var browser = require('..')();
var createTestDom = require('./createTestDom');

describe('options', function () {
  it('can set an option that is inerhited by components', function(){
    var parentComponent = browser.find('div').component({});
    parentComponent.set({myOption: 'abc'});
    var childComponent = parentComponent.find('div').component({});
    expect(childComponent.get('myOption')).to.equal('abc');
  });
});
