const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// Module to deal with paths.
const path = require('path')
// Module to communicated to renderer process.
const ipc = electron.ipcMain

// -------------- //
// WINDOW MANAGER //
// -------------- //

var windows = {
  main: {width: 800, height: 600, html: "index.html"},
  about: {width: 800, height: 600, html: "about.html", parent: "main", modal: true}
}

var current_windows = {}

// [function] Create window
function createWindow(name) {
  if ( windows[name] ) {
    var wanted = windows[name]

    wanted.icon = path.join(__dirname, 'img/typewriter.png')

    if ( wanted.parent && current_windows[wanted.parent] ) {
      wanted.parent = current_windows[wanted.parent]
    }

    current_windows[name] = new BrowserWindow(wanted)
    current_windows[name].loadURL(`file://${__dirname}/static/` + wanted.html)

    // On window close, deref window object
    current_windows[name].on('closed', function () {
      current_windows[name] = null
    })

    return true
  }
}

// [function] Close window
function closeWindow(name) {
  if ( current_windows[name] ) {
    current_windows[name].destroy()
    return true
  }
}

// [function] Load file in window
function loadFile(name, path) {
  if ( current_windows[name] ) {
    current_windows[name].loadURL(`file://${__dirname}/static/` + path)
  }
}

// When app ready, run prerequisites
app.on('ready', function() {
  createWindow("main")
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (current_windows.length === 0) {
    createWindow("main")
  }
})

// ------------------------- //
// ---------- IPC ---------- //
// ------------------------- //

// [event] request to open window
ipc.on('window-open', function(event, arg) {
  createWindow(arg)
})

// [event] request to close window
ipc.on('window-close', function(event, name) {
  closeWindow(name)
})

// [event] load new file in window
ipc.on('window-load', function(event, name, path) {
  loadFile(name, path)
})
