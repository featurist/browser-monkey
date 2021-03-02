import {Query} from '../lib/Query'
import {DomAssembly} from './assemblies/DomAssembly'
import {ReactMount} from '..'
import IFrameMount from '../lib/IFrameMount'
import Mount from '../lib/Mount'
import ReactApp from './app/react'
import React from 'react'
import {HyperdomMount} from '..'
import HyperdomApp from './app/hyperdom'

describe('mount', () => {
  testMount('hyperdom', () => new HyperdomMount(new HyperdomApp()))
  testMount('react', () => new ReactMount(React.createElement(ReactApp, {}, null)))
  testMount('iframe', () => new IFrameMount(DomAssembly.localUrl('iframe-mount-test.html')))

  it('unmounts idempotently', function() {
    const mount  = new IFrameMount(DomAssembly.localUrl('iframe-mount-test.html'))
    mount.unmount()
    mount.unmount()
  })
})

function testMount (appType, createMount: () => Mount): void {
  describe(`mount ${appType}`, () => {
    let page
    let mount

    beforeEach(() => {
      mount = createMount()
      page = new Query().mount(mount)
    })

    afterEach(() => mount.unmount())

    it('loads some data', async () => {
      await page.find('.message').shouldContain('default')
      await page.find('button').click()
      await page.find('.message').shouldContain('hello browser-monkey')
    })

    it('can enter form fields', async () => {
      await page.set({'input': 'hi'})
      await page.shouldContain({'.message': 'hi'})
    })
  })
}
