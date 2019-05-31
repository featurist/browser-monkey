import x from '../../browser-monkey/testA.ts'

it('x', async () => {
  console.log('x', await x())
})
