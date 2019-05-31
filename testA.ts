async function a () {
  const x: number = 0
  await new Promise(r => setTimeout(r, 100))
  return x
}

export default a
