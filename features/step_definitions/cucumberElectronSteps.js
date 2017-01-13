const path = require('path')
const fs = require('fs-promise')
const rmfr = require('rmfr')
const mkdirp = require('mkdirp-promise')
const exec = require('child_process').exec
const tempDir = path.resolve(__dirname + '/../../tmp/cucumber-electron')

module.exports = function() {

  this.Before(function() {
    return rmfr(tempDir).then(() => mkdirp(tempDir))
  })

  this.Given(/^I have created the file "(.+)" with:$/, function (filePath, contents) {
    const pathToBrowserMonkey = path.resolve(__dirname + '/../../index.js')
    const replacedContents = contents.replace(/require\('browser\-monkey'\)/g, `require('${pathToBrowserMonkey}')`)
    const dir = path.resolve(tempDir + '/' + path.dirname(filePath))
    return mkdirp(dir).then(() => fs.writeFile(tempDir + '/' + filePath, replacedContents))
  })

  this.When(/^I run cucumber\-electron$/, function () {
    const cucumberElectronPath = path.resolve(__dirname + '/../../node_modules/.bin/cucumber-electron')
    return new Promise(resolve => {
      exec(cucumberElectronPath, { cwd: tempDir }, (error, stdout, stderr) => {
        this.execResult = { error, stdout, stderr }
        resolve()
      })
    })
  })

  this.Then(/^I should see the output:$/, function (expectedOutput) {
    if (this.execResult.stdout.indexOf(expectedOutput) == -1) {
      throw new Error(`Expected stdout to include:\n${expectedOutput}\nActual stdout:\n${this.execResult.stdout}`)
    }
  });

}
