const { session, app } = require('electron')

const omitHeaders = new Set([
  'x-frame-options',
  'content-security-policy'
])

app.on('ready', function () {
  app.commandLine.appendSwitch('disable-pushstate-throttle')

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    Object.keys(details.responseHeaders).forEach(header => {
      if (omitHeaders.has(header.toLowerCase())) {
        delete details.responseHeaders[header]
      }
    })
    callback({
      cancel: false,
      responseHeaders: details.responseHeaders,
      statusLine: details.statusLine
    })
  })
})
