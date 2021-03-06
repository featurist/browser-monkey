#!/usr/bin/env node

// I know this is crazy, but typescript generates invalid es javascript - https://github.com/microsoft/TypeScript/issues/40878
//
// There is a workaround - add `.js` extension to relative imports - e.g. `import blah from "./foo.js"` - but that somehow doesn't work with electron-mocha.
// This is all very boring, so this little script simply goes over js, generated by typescript and add `.js` extentions where necessary.

import glob from 'glob'
import fs from 'fs'

glob("dist/**/*.js", function (er, files) {
  files.forEach(file => {
    const contents = fs.readFileSync(file, {encoding: 'utf-8'})
    const newContents = contents.replace(/import(.*?['"])(\.[^'"]+)/g, 'import$1$2.js')
    fs.writeFileSync(file, newContents)
  })
})
