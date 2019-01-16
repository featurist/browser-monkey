const fs = require('fs')
const { escape } = require('querystring')
const { getParameters } = require('codesandbox/lib/api/define')

function generateExampleSandboxLink (exampleTemplateName, exampleCode) {
  const templatePath = `${process.cwd()}/docs/codesandbox/${exampleTemplateName}`
  const parameters = getParameters({
    files: {
      'package.json': {
        content: fs.readFileSync(`${templatePath}/package.json`, { encoding: 'utf-8' })
      },
      'src/app.spec.js': {
        content: exampleCode
      },
      'src/app.js': {
        content: fs.readFileSync(`${templatePath}/src/app.js`, { encoding: 'utf-8' })
      },
      'src/index.js': {
        content: fs.readFileSync(`${templatePath}/src/index.js`, { encoding: 'utf-8' })
      },
      'index.html': {
        content: fs.readFileSync(`${templatePath}/index.html`, { encoding: 'utf-8' })
      }
    }
  })
  const url = `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}&query=${escape('module=/src/app.spec.js')}`
  return `<a href="${url}" target="_blank" rel="noopener noreferrer">Run this example</a>`
}

const input = fs.readFileSync(`${process.cwd()}/readme.md`, { encoding: 'utf-8' })

const output = input.split('\n').reduce((result, line) => {
  if (!line.match('https://codesandbox.io/api/v1/sandboxes/define')) {
    result.lines.push(line)
  }

  if (result.currentExampleLines) {
    if (line.match(/``` *$/)) {
      const linkToExampleSandbox = generateExampleSandboxLink(
        result.currentExampleTemplateName,
        result.currentExampleLines.join('\n')
      )
      result.lines.push(linkToExampleSandbox)

      delete result.currentExampleLines
      delete result.currentExampleTemplateName
    } else {
      result.currentExampleLines.push(line)
    }
  }

  const [, exampleTemplateName] = line.match(/```js +codesandbox: +([\w-]+)/) || []

  if (exampleTemplateName) {
    result.currentExampleTemplateName = exampleTemplateName
    result.currentExampleLines = []
  }

  return result
}, { lines: [] })

fs.promises.truncate(`${process.cwd()}/readme.md`, 0).then(() => {
  return fs.writeFileSync(`${process.cwd()}/readme.md`, output.lines.join('\n'))
}).catch(e => {
  console.error(e)
  process.exit(1)
})
