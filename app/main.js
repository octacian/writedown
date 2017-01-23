const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// Module to create alert-like dialogs
const dialog = electron.dialog
// Module to interact with system files
const fs = require('fs')
// Module to communicate between processes
const ipc = require('electron').ipcMain
// Module to deal with file paths
const path = require('path')

// mainwindow ref
let mainWindow

// create window
function createWindow () {
  mainWindow = new BrowserWindow({width: 800, height: 600, icon: path.join(__dirname, 'img/typewriter.png') }) // window data
  mainWindow.loadURL(`file://${__dirname}/static/index.html`) // and load the index.html of the app.
  // on window close, deref window object
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

// when app ready, run prerequisites
app.on('ready', function() {
  createWindow() // create window
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
  if (mainWindow === null) {
    createWindow()
  }
})
