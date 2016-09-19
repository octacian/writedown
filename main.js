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
  label: 'Edit',
  submenu: [{
    label: 'Undo',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo'
  }, {
    label: 'Redo',
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo'
  }, {
    type: 'separator'
  }, {
    label: 'Cut',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut'
  }, {
    label: 'Copy',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  }, {
    label: 'Paste',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }, {
    label: 'Select All',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectall'
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

function addUpdateMenuItems (items, position) {
  if (process.mas) return

  const version = electron.app.getVersion()
  let updateItems = [{
    label: `Version ${version}`,
    enabled: false
  }, {
    label: 'Checking for Update',
    enabled: false,
    key: 'checkingForUpdate'
  }, {
    label: 'Check for Update',
    visible: false,
    key: 'checkForUpdate',
    click: function () {
      require('electron').autoUpdater.checkForUpdates()
    }
  }, {
    label: 'Restart and Install Update',
    enabled: true,
    visible: false,
    key: 'restartToUpdate',
    click: function () {
      require('electron').autoUpdater.quitAndInstall()
    }
  }]

  items.splice.apply(items, [position, 0].concat(updateItems))
}

function findReopenMenuItem () {
  const menu = Menu.getApplicationMenu()
  if (!menu) return

  let reopenMenuItem
  menu.items.forEach(function (item) {
    if (item.submenu) {
      item.submenu.items.forEach(function (item) {
        if (item.key === 'reopenMenuItem') {
          reopenMenuItem = item
        }
      })
    }
  })
  return reopenMenuItem
}

if (process.platform === 'darwin') {
  const name = electron.app.getName()
  template.unshift({
    label: name,
    submenu: [{
      label: `About ${name}`,
      role: 'about'
    }, {
      type: 'separator'
    }, {
      label: 'Services',
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      label: `Hide ${name}`,
      accelerator: 'Command+H',
      role: 'hide'
    }, {
      label: 'Hide Others',
      accelerator: 'Command+Alt+H',
      role: 'hideothers'
    }, {
      label: 'Show All',
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: function () {
        app.quit()
      }
    }]
  })

  // Window menu.
  template[3].submenu.push({
    type: 'separator'
  }, {
    label: 'Bring All to Front',
    role: 'front'
  })

  addUpdateMenuItems(template[0].submenu, 1)
}

if (process.platform === 'win32') {
  const helpMenu = template[template.length - 1].submenu
  addUpdateMenuItems(helpMenu, 0)
}

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
  // menu
  let reopenMenuItem = findReopenMenuItem()
  if (reopenMenuItem) reopenMenuItem.enabled = true
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('browser-window-created', function () {
  let reopenMenuItem = findReopenMenuItem()
  if (reopenMenuItem) reopenMenuItem.enabled = false
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
    // if check count is above 10, timeout
    if (checkCount > 10) { return console.log('Save File - Request for editor data timed out or editor is blank.') }
    // if contents blank, delay for reply
    if (!contents || !working) {
      // if check count is 0, display message
      if (checkCount === 1) {
        console.log('Save File - Waiting for editor data.')
      }
      setTimeout(function() { checkCount++; checkContents() }, 100)
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

  var checkCount = 1
  // call checkContents
  checkContents()
}
