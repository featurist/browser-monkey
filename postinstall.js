var fs = require('fs')
var path = require('path')
var child_process = require('child_process')

var distDir = path.join(__dirname, 'dist')

if (!fs.existsSync(distDir)) {
  console.log('Compiling typescript...');
  try {
    child_process.execFileSync(
    path.join(__dirname, 'node_modules', '.bin', 'tsc'),
      ['-p', 'tsconfig.build.json'],
      { stdio: 'inherit' }
    )
  } catch (e) {
    fs.rmdirSync(distDir, { recursive: true })
    throw e
  }
}
