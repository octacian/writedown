/* writedown.js */

// Main electron module
const electron = require('electron')
// Module to create native browser window.
const BrowserWindow = electron.remote.BrowserWindow
// Module to create alert-like dialogs
const dialog = electron.remote.dialog
// Module to interact with system files
const fs = require('fs')
// Module to deal with file paths
const path = require('path')
// Module to convert Markdown to HTML
var showdown = require('../../lib/js/showdown.min.js')

// New Converter
var converter = new showdown.Converter()
// Input element
var input = document.getElementById('input')
// Output element
var output = document.getElementById('output')

// --------- //
// FUNCTIONS //
// --------- //

// convert function
var convert = function() {
  output.innerHTML = converter.makeHtml(input.value)
}

// Write to file
function writeFile(path, data) {
  fs.writeFile(path, data, function(err) {
    if(err) {
      return console.log(err)
    }
  })
}

// Set working file
function setWorkingFile(path, name) {
  input.dataset.filePath = path
  input.dataset.fileName = name
  document.title = name + " - WriteDown"
}

// --------- //
// CALLBACKS //
// --------- //

input.onkeyup = function() { convert(input, output) }
input.onblur = function() { convert(input, output) }

// ----------------- //
// EXPOSED FUNCTIONS //
// ----------------- //

module.exports = {
  createAboutWindow: function() {
    aboutWindow = new BrowserWindow({width: 700, height: 500}) // window data
    aboutWindow.loadURL(`file://${__dirname}/../static/about.html`) // and load about.html of the app
    // on window close, deref window object
    aboutWindow.on('closed', function() {
      aboutWindow = null
    })
  },
  convert: convert(),
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
      input.value = filedata;
      setWorkingFile(filepath, filename)
      convert()
      console.log("Opened " + filepath)
     })
  },
  saveFile: function() {
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
        writeFile(filename, input.value)
        setWorkingFile(filename, path.basename(filename))
        console.log('Created and saved file. (' + input.dataset.filePath + ')')
      })
    } else { // else, save in working file
      writeFile(input.dataset.filePath, input.value)
      console.log('Saved file. (' + input.dataset.filePath + ')')
    }
  },
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
