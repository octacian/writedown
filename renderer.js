/* renderer.js */
// module to communicate with main process
const ipc = require('electron').ipcRenderer

// onload, register function
var showdown = require('./js/showdown.min.js')
var converter = new showdown.Converter()
var input = document.getElementsByClassName('input')
var output = document.getElementsByClassName('output')

// convert
var convert = function() {
  output[0].innerHTML = converter.makeHtml(input[0].value)
}

// add callbacks
input[0].onkeyup = convert
input[0].onblur = convert

// run function
convert()

// listen for IPC
ipc.on('set-input', function(event, value) {
  input[0].value = value
  convert()
})

// listen for value request
ipc.on('hello-editorValue', function(event) {
  console.log(input[0].value)
  event.sender.send('reply-editorValue', input[0].value)
})

// listen for working file request
ipc.on('hello-workingFile', function(event) {
  console.log('workingFile reply')
  event.sender.send('reply-workingFile', input[0].dataset.filePath, input[0].dataset.fileName)
})

// listen for set working file command
ipc.on('set-workingFile', function(event, filepath, name) {
  input[0].dataset.filePath = filepath
  input[0].dataset.fileName = name
  document.title = name + " - WriteDown"
})
