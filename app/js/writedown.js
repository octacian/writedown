/* writedown.js */

// Main electron module
const electron = require('electron')
// Module to access things from main process
const remote = electron.remote
// Module to create native browser window.
const BrowserWindow = electron.remote.BrowserWindow
// Module to create alert-like dialogs
const dialog = electron.remote.dialog
// Module to interact with system files
const fs = require('fs')
// Module to deal with file paths
const path = require('path')
// Module to communicate with main process
const ipc = electron.ipcRenderer
// Module to convert Markdown to HTML
var marked = require('marked')

// Input element
var input = document.getElementById('input')
// Output element
var output = document.getElementById('output')

// --------- //
// FUNCTIONS //
// --------- //

// [function] Close window
function closeWindow(name) {
  ipc.send('window-close', name)
}

// [function] Open window
function openWindow(name) {
  ipc.send('window-open', name)
}

// [function] Load HTML
function loadHTML(name, path) {
  ipc.send('window-load', name, path)
}

// [function] Convert markdown
var convert = function() {
  output.innerHTML = marked(input.innerHTML)
}

// [function] Write to file
function writeFile(path, data) {
  fs.writeFile(path, data, function(err) {
    if(err) {
      return console.log(err)
    }
  })
}

// [function] Set working file
function setWorkingFile(path, name, modified) {
  input.dataset.filePath = path
  input.dataset.fileName = name

  if ( modified ) {
    modified = " [modified]"
  } else { modified = "" }

  document.title = name + " - WriteDown" + modified
}

// [function] Save file
function saveFile(close_window) {
  // if path is blank, new file
  if ( input.dataset.filePath === '') {
    // Show dialog
    dialog.showSaveDialog({
      title: 'Save Markdown Document',
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown']}
      ]
    }, function(filename) {
      if (!filename) return false
      writeFile(filename, input.innerHTML)
      setWorkingFile(filename, path.basename(filename))
      console.log('Created and saved file. (' + input.dataset.filePath + ')')
      if ( close_window == true ) {
        closeWindow("main")
      }
    })
  } else { // else, save in working file
    writeFile(input.dataset.filePath, input.innerHTML)
    console.log('Saved file. (' + input.dataset.filePath + ')')
    if ( close_window == true ) {
      closeWindow("main")
    }
  }
}

// [function] Check for changes
function checkChanges(input) {
  var fpath = input.dataset.filePath
  var fname = path.basename(fpath)

  if ( fname == "" ) {
    fname = "Untitled"
  }

  if ( fpath != "" ) {
    fs.readFile(fpath, (e, data) => {
      if ( ! e && input.innerHTML != data.toString() ) {
        setWorkingFile(fpath, path.basename(fpath), true)
      }
    })
  } else if ( fpath == "" && input.innerHTML != "" ) {
    setWorkingFile(fpath, fname, true)
  } else {
    setWorkingFile(fpath, fname, false)
  }
}

// --------- //
// CALLBACKS //
// --------- //

input.onkeyup = function() { convert(input, output); checkChanges(input); }
input.onblur = function() { convert(input, output) }

window.onbeforeunload = function() {
  function showMsg() {
    dialog.showMessageBox(remote.getCurrentWindow(), {
      type: "warning",
      buttons: ['Cancel', 'Save', 'Don\'t Save'],
      defaultId: 0,
      title: "Close without saving?",
      message: "Are you sure you want to close WriteDown without saving your work?",
      cancelId: 0
    }, function(index) {
      if ( index == 1 ) {
        saveFile(true)
      } else if ( index == 2 ) {
        closeWindow("main")
      }
    })
  }

  if ( input.dataset.filePath != "" ) {
    fs.readFile(input.dataset.filePath, (e, data) => {
      if ( ! e && input.innerHTML != data.toString() ) {
        showMsg()
      }
    })
  } else if ( input.dataset.filePath == "" && input.innerHTML != "" ) {
    showMsg()
  } else {
    closeWindow("main")
  }

  return false
}

// ----------------- //
// EXPOSED FUNCTIONS //
// ----------------- //

module.exports = {
  convert: convert(),
  closeWindow: closeWindow,
  openWindow: openWindow,
  loadHTML: loadHTML,
  openFile: function() {
    dialog.showOpenDialog({
      filters: [{name: 'Markdown', extensions: ['md', 'markdown']}],
      properties: ['openFile']
     }, function(paths) {
      if (!paths) return false;
      var filepath = paths[0];
      var filename = path.basename(filepath);
      var filedata = fs.readFileSync(filepath, 'utf8');
      // Set values
      input.innerHTML = filedata;
      setWorkingFile(filepath, filename)
      convert()
      console.log("Opened " + filepath)
     })
  },
  saveFile: saveFile,
  changePreviewState: function(action) {
    var toggle = document.getElementById('preview-toggle')
    var expand = document.getElementById('preview-expand')
    // if toggle, toggle preview
    if (action === "toggle") {
      // if preview is on and expanded, click both
      if (toggle.classList.contains('button-active') && expand.classList.contains('button-active')) {
        expand.click()
        toggle.click()
      } else { // else, click only toggle
        toggle.click()
      }
    } else if (action === "expand") { // else if expand, expand preview
      // if preview toggle is on, expand
      if ( toggle.classList.contains('button-active') ) {
        expand.click()
      } else { // else, expand both
        toggle.click()
        expand.click()
      }
    }
  }
}
