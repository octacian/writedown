/* renderer.js */
// module to communicate with main process
const ipc = require('electron').ipcRenderer

// onload, register function
var showdown = require('./js/showdown.min.js')
var converter = new showdown.Converter()
var input = document.getElementById('input')
var output = document.getElementById('output')

// convert
var convert = function() {
  output.innerHTML = converter.makeHtml(input.value)
}

// add callbacks
input.onkeyup = convert
input.onblur = convert

// run function
convert()

// listen for IPC
ipc.on('set-input', function(event, value) {
  input.value = value
  convert()
})

// listen for value request
ipc.on('hello-editorValue', function(event) {
  event.sender.send('reply-editorValue', input.value)
})

// listen for working file request
ipc.on('hello-workingFile', function(event) {
  console.log('workingFile reply')
  event.sender.send('reply-workingFile', input.dataset.filePath, input.dataset.fileName)
})

// listen for set working file command
ipc.on('set-workingFile', function(event, filepath, name) {
  input.dataset.filePath = filepath
  input.dataset.fileName = name
  document.title = name + " - WriteDown"
})
