const describeAssemblies = require('./describeAssemblies')
const {DomAssembly} = require('./assemblies/DomAssembly')
const demand = require('must')

describe('assertions', function () {
  describeAssemblies([DomAssembly], function (Assembly) {
    var assembly
    var browser

    beforeEach(function () {
      assembly = new Assembly()
      browser = assembly.browserMonkey().v2()
    })

    describe('shouldNotExist', function () {
      it("should ensure that element eventually doesn't exist", function () {
        assembly.insertHtml('<div class="removing"></div>')
        assembly.insertHtml('<div class="staying"></div>')

        var good = browser.find('.removing').shouldNotExist().then()
        var bad = browser.find('.staying').shouldNotExist().then()

        assembly.eventuallyDeleteHtml('.removing')

        return Promise.all([
          good,
          assembly.assertRejection(bad, 'expected no elements')
        ])
      })

      it('allows trytryagain parameters to be used', function () {
        assembly.insertHtml('<div class="removing"></div>')

        var promise = browser.find('.removing').shouldNotExist({ timeout: 500, interval: 100 }).then()

        assembly.eventuallyDeleteHtml('.removing')

        return promise
      })
    })

    describe('is', function () {
      it('should eventually find an element if it has a class', function () {
        var element = assembly.insertHtml('<div class="element"></div>')

        var good = browser.find('.element').is('.good').shouldExist().then()
        var bad = browser.find('.element').is('.bad').shouldExist().then()

        assembly.eventually(function () {
          element.classList.add('good')
        })

        return Promise.all([
          good,
          assembly.assertRejection(bad, 'expected one or more elements')
        ])
      })
    })

    it('eventually finds an element containing text', function () {
      var promise = browser.find('.element', { text: 'some t' }).shouldExist().then()
      assembly.eventuallyInsertHtml('<div class="element"><div>some text</div></div>')
      return promise
    })

    it('eventually finds an element containing text as it appears on the page', function () {
      var promise = browser.find('.element').shouldHave({ text: 'This is some text that is all on one line.\nAnd some more on another line.' }).then()
      /* eslint-disable no-multi-str */
      assembly.eventuallyInsertHtml('<div class="element"><div>\
      This\
      is\
      some\
      text\
      that is all on one line.\
      <br/>\
      And some more on another line.\
    </div></div>')
      /* eslint-enable no-multi-str */
      return promise
    })

    it('eventually finds an element containing exactText', function () {
      var good = browser.find('.a', { exactText: '8' }).shouldExist().then()
      var bad = browser.find('.b', { exactText: '8' }).shouldExist().then()

      assembly.eventuallyInsertHtml('<div><div class="a">8</div><div class="b">28</div></div>')

      return Promise.all([
        good,
        assembly.assertRejection(bad, 'expected one or more elements')
      ])
    })

    it("treats assertion of text: '' as exact text", function () {
      const promise = browser.find('.a', { text: 'something' }).shouldExist().then()

      assembly.eventuallyInsertHtml('<div><div class="a">something</div><div class="b"></div></div>')

      return promise.then(function () {
        return Promise.all([
          browser.find('.a', { text: '' }).shouldNotExist(),
          browser.find('.b', { text: '' }).shouldExist()
        ])
      })
    })

    describe('shouldHave', function () {
      it('eventually finds an element and asserts that it has text', function () {
        var good = browser.find('.element').shouldHave({ text: 'some t' }).then()
        var bad = browser.find('.element').shouldHave({ text: 'sme t' }).then()

        assembly.eventuallyInsertHtml('<div class="element"><div>some text</div></div>')

        return Promise.all([
          good,
          assembly.assertRejection(bad, "expected [ 'some text' ] to contain [ 'sme t' ]")
        ])
      })

      it('finds duplicate text when asserting array of text', function () {
        assembly.insertHtml('<div class="element1">a</div>')
        assembly.insertHtml('<div class="element1">a</div>')

        return browser.find('.element1').shouldHave({ text: ['a', 'a'] })
      })

      it('eventually finds an element and asserts that it has value', function () {
        var good1 = browser.find('.element1 input').shouldHave({ value: 'some t' }).then()
        var good2 = browser.find('.element2 input').shouldHave({ value: '0' }).then()
        var bad = browser.find('.element1 input').shouldHave({ value: 'sme t' }).then()

        assembly.eventuallyInsertHtml('<div class="element1"><input type=text value="some text" /></div>')
        assembly.eventuallyInsertHtml('<div class="element2"><input type=text value="0" /></div>')

        return Promise.all([
          good1,
          good2,
          assembly.assertRejection(bad, "expected [ 'some text' ] to contain [ 'sme t' ]")
        ])
      })

      it('error contains actual element text when no match found', function () {
        assembly.insertHtml('<span>abc</span>')
        assembly.insertHtml('<span>bac</span>')
        assembly.insertHtml('<span>c</span>')

        return browser.find('span').shouldHave({
          text: [
            'cba',
            'abc',
            'bac'
          ]
        }).catch(function (error) {
          demand(error.message).to.include("expected [ 'abc', 'bac', 'c' ]")
        })
      })

      it('finds an element with exact value', function () {
        var bad = browser.find('.element1 input').shouldHave({ exactValue: 'some t' }).then()
        var good = browser.find('.element1 input').shouldHave({ exactValue: 'some text' }).then()

        assembly.eventuallyInsertHtml('<div class="element1"><input type=text value="some text" /></div>')

        return Promise.all([
          good,
          assembly.assertRejection(bad, "expected [ 'some text' ] to have exact values [ 'some t' ]")
        ])
      })

      it("treats assertion of value: '' as exact value", function () {
        var bad = browser.find('.element1 input').shouldHave({ value: '' }).then()
        var good = browser.find('.element2 input').shouldHave({ value: '' }).then()

        assembly.eventuallyInsertHtml('<div>\n' +
                               '<div class="element1"><input type=text value="some text" /></div>\n' +
                               '<div class="element2"><input type=text value="" /></div>\n' +
                             '</div>')

        return Promise.all([
          good,
          assembly.assertRejection(bad, "expected [ 'some text' ] to contain [ '' ]")
        ])
      })

      it('cannot assert against selects with no options', function () {
        assembly.insertHtml('<select></select>')

        var select = browser.find('select')

        return Promise.all([
          select.shouldHave({ value: undefined }),
          select.shouldHave({ exactValue: undefined }),
        ])
      })

      it('verifies attributes are present', function () {
        assembly.insertHtml('<a id="abc" href="/home">hello</a>')
        var good = browser.find('a').shouldHave({
          attributes: {
            id: 'abc',
            href: '/home'
          }
        })
        var bad = browser.find('a').shouldHave({
          attributes: {
            'class': 'other'
          }
        })
        return Promise.all([
          good,
          assembly.assertRejection(bad, "expected [ { class: null } ] to have attributes [ { class: 'other' } ]")
        ])
      })

      it('verifies array of attributes are present', function () {
        assembly.insertHtml('<div><img src="/a"/><img src="/b"/><img src="/c"/></div>')
        var good = browser.find('img').shouldHave({
          attributes: [
            { src: '/a' },
            { src: '/b' },
            { src: '/c' }
          ]
        })
        var bad = browser.find('img').shouldHave({
          attributes: [
            { src: '/c' },
            { src: '/a' },
            { src: '/b' }
          ]
        })
        return Promise.all([
          good,
          assembly.assertRejection(bad, "expected [ { src: '/a' }, { src: '/b' }, { src: '/c' } ] to have attributes [ { src: '/c' }, { src: '/a' }, { src: '/b' } ]")
        ])
      })

      describe('exactText', function () {
        it('eventually finds elements that have the exact array of text', function () {
          var promise = browser.find('.element option').shouldHave({ exactText: ['', 'Mr', 'Mrs'] }).then()

          assembly.eventuallyInsertHtml('<select class="element"><option></option><option>Mr</option><option>Mrs</option></select>')

          return promise
        })

        it('fails to find exact text', function () {
          var promise = browser.find('option').shouldHave({ exactText: ['', 'Mr', 'Mrs'] }).then()

          assembly.eventuallyInsertHtml('<select><option>Optional</option><option>Mr</option><option>Mrs</option></select>')

          return assembly.assertRejection(promise, "expected [ 'Optional', 'Mr', 'Mrs' ] to have exact inner texts [ '', 'Mr', 'Mrs' ]")
        })
      })

      describe('checkboxes', function () {
        it('eventually finds a checked checkbox', function () {
          var good = browser.find('.checkbox').shouldHave({ checked: true }).then()

          var checkbox = assembly.insertHtml('<input class="checkbox" type=checkbox />')
          assembly.eventually(function () {
            checkbox.checked = true
          })

          return Promise.all([
            good
          ])
        })

        it('asserts that a checkbox is indeterminate', function () {
          var good = browser.find('.checkbox').shouldHave({ checked: 'indeterminate' }).then()

          var checkbox = assembly.insertHtml('<input class="checkbox" type=checkbox />')
          assembly.eventually(function () {
            checkbox.indeterminate = true
          })

          return Promise.all([
            good
          ])
        })

        it('fails if we expected one checkbox, but found many', function () {
          var bad = browser.find('.checkbox').shouldHave({ checked: true }).then()

          var checkbox = assembly.insertHtml('<input class="checkbox" type=checkbox />')
          assembly.insertHtml('<input class="checkbox" type=checkbox />')
          assembly.eventually(function () {
            checkbox.checked = true
          })

          return Promise.all([
            assembly.assertRejection(bad, 'expected checked properties [ true, false ] to equal [ true ]')
          ])
        })

        it('ensures that each checkbox in the scope is either checked or unchecked', function () {
          var good = browser.find('.checkbox').shouldHave({ checked: [true, false] }).then()
          var bad = browser.find('.checkbox').shouldHave({ checked: [false, true] }).then()

          var checkbox = assembly.insertHtml('<input class="checkbox" type=checkbox />')
          assembly.insertHtml('<input class="checkbox" type=checkbox />')
          assembly.eventually(function () {
            checkbox.checked = true
          })

          return Promise.all([
            good,
            assembly.assertRejection(bad, 'expected checked properties [ true, false ] to equal [ false, true ]')
          ])
        })

        it('fails to find a checked checkbox', function () {
          var good = browser.find('.checkbox').shouldHave({ checked: false })
          var bad = browser.find('.checkbox').shouldHave({ checked: true })

          assembly.insertHtml('<input class="checkbox" type=checkbox />')

          return Promise.all([
            good,
            assembly.assertRejection(bad, 'expected checked properties [ false ] to equal [ true ]')
          ])
        })
      })

      it('eventually finds elements and asserts that they each have text', function () {
        var good = browser.find('.element div').shouldHave({ text: ['one', 2] }).then()
        var bad1 = browser.find('.element div').shouldHave({ text: ['one'] }).then()
        var bad2 = browser.find('.element div').shouldHave({ text: ['one', 'three'] }).then()

        assembly.eventuallyInsertHtml('<div class="element"><div>\nfirst one</div><div>number 2\n</div></div>')

        return Promise.all([
          good,
          assembly.assertRejection(bad1, "expected [ 'first one', 'number 2' ] to contain [ 'one' ]"),
          assembly.assertRejection(bad2, "expected [ 'first one', 'number 2' ] to contain [ 'one', 'three' ]")
        ])
      })

      it('eventually finds elements and asserts that they each have value', function () {
        var good = browser.find('.element input').shouldHave({ value: ['one', 2, 0] }).then()
        var bad1 = browser.find('.element input').shouldHave({ value: ['one'] }).then()
        var bad2 = browser.find('.element input').shouldHave({ value: ['one', 'three'] }).then()

        assembly.eventuallyInsertHtml('<div class="element"><input type=text value="first one"><input type=text value="number 2"><input type="text" value="0"></div>')

        return Promise.all([
          good,
          assembly.assertRejection(bad1, "expected [ 'first one', 'number 2', '0' ] to contain [ 'one' ]"),
          assembly.assertRejection(bad2, "expected [ 'first one', 'number 2', '0' ] to contain [ 'one', 'three' ]")
        ])
      })

      it('eventually finds an element and asserts that it has css', function () {
        var good = browser.find('.element').shouldHave({ css: '.the-class' }).then()
        var bad1 = browser.find('.element').shouldHave({ css: '.not-the-class' }).then()
        var bad2 = browser.find('.element').shouldHave({ css: '.not-found' }).then()

        assembly.eventuallyInsertHtml('<div class="element the-class"><div class="not-the-class">some text</div></div>')

        return Promise.all([
          good,
          assembly.assertRejection(bad1, "expected [ 'div.element.the-class' ] to match css [ '.not-the-class' ]"),
          assembly.assertRejection(bad2, "expected [ 'div.element.the-class' ] to match css [ '.not-found' ]")
        ])
      })

      it('eventually finds an element and asserts that it has n elements', function () {
        var good = browser.find('.element').shouldHave({ length: 2 }).then()
        var bad1 = browser.find('.element').shouldHave({ length: 1 }).then()

        assembly.eventuallyInsertHtml('<div class="element"></div><div class="element"></div>')

        return Promise.all([
          good,
          assembly.assertRejection(bad1, 'expected number of elements found 2 to equal 1')
        ])
      })

      it('eventually finds an element and asserts that it passes an assertion', function () {
        var good1 = browser.find('.element').shouldHaveElement(function (element) {
          demand(element.innerText).to.eql('a')
        }).then()

        var bad1 = browser.find('.multi').shouldHaveElement(function (element) {
          demand(element.innerText).to.eql('b')
        }).then()

        var bad2 = browser.find('.element').shouldHaveElement(function (element) {
          demand(element.innerText).to.eql('b')
        }).then()

        var element = assembly.insertHtml('<div class="element"></div>')
        assembly.eventuallyInsertHtml('<div class="multi"></div>')
        assembly.eventuallyInsertHtml('<div class="multi">b</div>')

        assembly.eventually(function () {
          element.innerText = 'a'
        })

        return Promise.all([
          good1,
          assembly.assertRejection(bad1, 'expected just one element'),
          assembly.assertRejection(bad2, '"a" must be equivalent to "b"')
        ])
      })

      it('eventually finds elements and asserts that they pass an assertion', function () {
        var good1 = browser.find('.element').shouldHaveElements(function (elements) {
          var xs = elements.map(function (element) {
            return assembly.jQuery(element).attr('data-x')
          })

          demand(xs).to.eql(['one', 'two', 'three'])
        }).then()

        var bad1 = browser.find('.element').shouldHaveElements(function (elements) {
          var xs = elements.map(function (element) {
            return assembly.jQuery(element).attr('data-x')
          })

          demand(xs).to.eql(['one', 'two'])
        }).then()

        assembly.eventuallyInsertHtml(`
          <div class="element" data-x="one"></div>
          <div class="element" data-x="two"></div>
          <div class="element" data-x="three"></div>
        `)

        return Promise.all([
          good1,
          assembly.assertRejection(bad1, '["one","two","three"]')
        ])
      })

      it('copies error properly', function () {
        var errorThrown

        var good1 = browser.find('.element').shouldHaveElement(function (element) {
          try {
            demand(assembly.jQuery(element).text()).to.eql('not text')
          } catch (error) {
            errorThrown = error
            throw error
          }
        }).then()

        assembly.eventuallyInsertHtml('<div class="element">text</div>')

        return good1.catch(function (error) {
          demand(error).to.eql(errorThrown)
        })
      })
    })

    describe('shouldNotHave', function () {
      it('eventually finds an element and asserts that it does not have text', function () {
        var promise = browser.find('.element').shouldNotHave({ text: 'sme t' }).then()

        assembly.eventuallyInsertHtml('<div class="element"><div>some text</div></div>')

        return promise
      })

      it('allows trytryagain parameters to be used', function () {
        var promise = browser.find('.element').shouldNotHave({ text: 'sme t', timeout: 400, interval: 100 }).then()

        assembly.eventuallyInsertHtml('<div class="element"><div>some text</div></div>')

        return promise
      })
    })
  })
})
