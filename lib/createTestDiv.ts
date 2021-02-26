let div

export default function createTestDiv () {
  if (div && div.parentNode) {
    div.parentNode.removeChild(div)
  }

  div = window.document.createElement('div')
  window.document.body.appendChild(div)

  return div
}
