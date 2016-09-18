const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// Module to create alert-like dialogs
const dialog = electron.dialog
// Module to register Application Menus
const Menu = electron.Menu
// Module to interact with system files
const fs = require('fs')
// Module to communicate between processes
const ipc = require('electron').ipcMain
// Module to deal with file paths
const path = require('path')

// mainwindow ref
let mainWindow

// mainmenu template
let template = [{
  label: 'File',
  submenu: [{
    label: 'Open',
    accelerator: 'CmdOrCtrl+O',
    click: openFile
  }, {
    label: 'Save',
    accelerator: 'CmdOrCtrl+S',
    click: saveFile
  }]
}, {
  label: 'View',
  submenu: [{
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        // on reload, start fresh and close any old
        // open secondary windows
        if (focusedWindow.id === 1) {
          BrowserWindow.getAllWindows().forEach(function (win) {
            if (win.id > 1) {
              win.close()
            }
          })
        }
        focusedWindow.reload()
      }
    }
  }, {
    label: 'Toggle Full Screen',
    accelerator: (function () {
      if (process.platform === 'darwin') {
        return 'Ctrl+Command+F'
      } else {
        return 'F11'
      }
    })(),
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
      }
    }
  }, {
    label: 'Toggle Developer Tools',
    accelerator: (function () {
      if (process.platform === 'darwin') {
        return 'Alt+Command+I'
      } else {
        return 'Ctrl+Shift+I'
      }
    })(),
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.toggleDevTools()
      }
    }
  }]
}, {
  label: 'Window',
  role: 'window',
  submenu: [{
    label: 'Minimize',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize'
  }, {
    label: 'Close',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  }, {
    type: 'separator'
  }, {
    label: 'Reopen Window',
    accelerator: 'CmdOrCtrl+Shift+T',
    enabled: false,
    key: 'reopenMenuItem',
    click: function () {
      app.emit('activate')
    }
  }]
}, {
  label: 'Help',
  role: 'help',
  submenu: [{
    label: 'Wiki',
    click: function () {
      electron.shell.openExternal('https://git.endev.xyz/octacian/writedown/wiki/')
    }
  }]
}]

// create window
function createWindow () {
  mainWindow = new BrowserWindow({width: 800, height: 600}) // window data
  mainWindow.loadURL(`file://${__dirname}/index.html`) // and load the index.html of the app.
  // on window close, deref window object
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

// when app ready, run prerequisites
app.on('ready', function() {
  createWindow() // create window

  // register menu
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
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

// ------------ //
// GENERAL CODE //
// ------------ //

// openfile
function openFile() {
  dialog.showOpenDialog(mainWindow, {
    filters: [{name: 'Markdown', extensions: ['md', 'markdown']}],
    properties: ['openFile']
   }, function(paths) {
    if (!paths) return false;
    var filepath = paths[0];
    var filename = path.basename(filepath);
    var filedata = fs.readFileSync(filepath, 'utf8');
    // send info
    mainWindow.webContents.send('set-input', filedata);
    setWorkingFile(filepath)
    console.log("Opened " + filepath)
   })
}

// write to file
function writeFile(path, data) {
  fs.writeFile(path, data, function(err) {
    if(err) {
      return console.log(err)
    }
  })
}

// set working file
function setWorkingFile(filepath) {
  mainWindow.webContents.send('set-workingFile', filepath, path.basename(filepath)) // send info
}

// save file
function saveFile() {
  // create dialog and save file
  function createSave() {
    // if path is blank, new file
    if (working[0] === '') {
      // dialog
      dialog.showSaveDialog({
        title: 'Save Markdown Document',
        filters: [
          { name: 'Markdown', extensions: ['md', 'markdown']}
        ]
      }, function(filename) {
        if (!filename) return false
        writeFile(filename, contents)
        setWorkingFile(filename)
        console.log('Saved new file.')
      })
    } else { // else, save in working file
      writeFile(working[0], contents)
      console.log('Saved file.')
    }
  }

  // check contents and time out if needed
  function checkContents() {
    // if contents blank, delay for reply
    if (!contents || !working) {
      console.log('Save File: Waiting for editor data.')
      setTimeout(function() { checkContents() }, 100)
    } else { createSave() }
  }

  // get working file
  var working
  // send request
  mainWindow.webContents.send('hello-workingFile')
  // listen for response
  ipc.on('reply-workingFile', function(event, path, name) {
    working = new Array(path, name)
  })

  // get editor contents
  var contents
  // send request
  mainWindow.webContents.send('hello-editorValue')
  // listen for response
  ipc.on('reply-editorValue', function(event, value) {
    contents = value
  })

  // call checkContents
  checkContents()
}
