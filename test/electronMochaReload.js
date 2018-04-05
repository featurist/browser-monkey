const {app, globalShortcut} = require('electron')

let rendererWindow
let rendererUrl

app.on('browser-window-created', (event, win) => {
  if (!rendererWindow) {
    rendererWindow = win
    win.webContents.on('dom-ready', () => {
      rendererUrl = win.webContents.getURL()
    })
  }
})

app.on('ready', () => {
  globalShortcut.register('CommandOrControl+R', () => {
    if (rendererWindow && rendererUrl) {
      rendererWindow.loadURL(rendererUrl)
    }
  })
})
