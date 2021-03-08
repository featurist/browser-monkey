#!/usr/bin/env node
const fs = require('fs')

function moveFileAndUpdateImports(path) {
  fs.copyFileSync(`./dist/lib/${path}`, `./${path}`)
  fs.copyFileSync(`./dist/lib/${path}.map`, `./${path}.map`)

  const jsFile = fs.readFileSync(`./${path}`, {encoding: 'utf-8'})
  const newJsFile = jsFile.replace(/require\("\.\//, 'require("./dist/lib/')
  fs.writeFileSync(`./${path}`, newJsFile)

  const mapFile = fs.readFileSync(`./${path}.map`, {encoding: 'utf-8'})
  const newMapFile = mapFile.replace('../..', '.')
  fs.writeFileSync(`./${path}.map`, newMapFile)
}

moveFileAndUpdateImports('HyperdomMount.js')
moveFileAndUpdateImports('ReactMount.js')
