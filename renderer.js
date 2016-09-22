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
  event.sender.send('reply-editorValue', input[0].value)
})

// listen for working file request
ipc.on('hello-workingFile', function(event) {
  event.sender.send('reply-workingFile', input[0].dataset.filePath, input[0].dataset.fileName)
})

// listen for set working file command
ipc.on('set-workingFile', function(event, filepath, name) {
  input[0].dataset.filePath = filepath
  input[0].dataset.fileName = name
  document.title = name + " - WriteDown"
})

// listen for toggle preview
ipc.on('set-preview', function(event, action) {
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
    if (document.getElementById('preview-toggle').classList.contains('button-active')) {
      document.getElementById('preview-expand').click()
    }
  }
})

// -------------- //
// TOGGLE BUTTONS //
// -------------- //
function createMultiple(button) {
  return button.onclick = function() {
    // if toggles class, class loop
    if (button.dataset.targetClass) {
      var custom_list = $(button).data('targetClass')
      // loop through entries
      for (var i=0; i<custom_list.length; i++) {
        var data = custom_list[i]
        var toggles_class = document.getElementsByClassName(data[0])
        // loop through class
        for (var i2=0; i2<toggles_class.length; i2++) {
          toggles_class[i2].classList.toggle(data[1]) // toggle class
        }
      }
    }
    if (button.dataset.targetId) { // else if toggles id, id loop
      var custom_list = $(button).data('targetId')
      // loop through entries
      for (var i=0; i<custom_list.length; i++) {
        var data = custom_list[i]
        document.getElementById(data[0]).classList.toggle(data[1]) // toggle
      }
    }
  }
}

function createNormal(button) {
  return button.onclick = function() {
    var button = button
    // if toggles class, cycle through classes
    if (button.dataset.targetClass) {
      var toggles_class = document.getElementsByClassName(button.dataset.targetClass) // get refs
      // loop
      for (var i2=0; i2<toggles_class.length; i2++) {
        var target = toggles_class[i2]
        // toggle class
        target.classList.toggle('hide-none')
      }
    } else { // else, use id
      document.getElementById(button.dataset.targetId).classList.toggle('hide-none')
    }
  }
}


var toggle_buttons = document.getElementsByClassName('toggle') // get refs
// loop through refs
for (var i0=0; i0<toggle_buttons.length; i0++) {
  var button = toggle_buttons[i0]
  // if button toggles multiple, different onclick
  if (button.classList.contains('toggle-custom')) {
    // register onclick
    createMultiple(button)
  } else { // else, assume hide/show
    // register onclick
    createNormal(button)
  }
}
