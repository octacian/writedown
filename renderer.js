/* renderer.js */

// ------------- //
// COMMUNICATION //
// ------------- //

// module to communicate with main process
const ipc = require('electron').ipcRenderer

// set input
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

// ------------------- //
// MARKDOWN CONVERSION //
// ------------------- //

// refs
var showdown = require('./js/showdown.min.js')
var converter = new showdown.Converter()
var inputs = document.getElementsByClassName('markdown')

// convert function
var convert = function(input, output) {
  output.innerHTML = converter.makeHtml(input.value)
  console.log('converting')
}

// for inputs, register callbacks
for (var i=0; i<inputs.length; i++) {
  var input = inputs[i] // ref
  console.log(input)
  var output = document.getElementsByClassName(input.dataset.outputClass)[0]
  console.log(output)
  input.onkeyup = function() { convert(input, output) }
  input.onblur = function() { convert(input, output) }
}

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

// ---- //
// TABS //
// ---- //
function createControl(control, tabkey, siblings) {
  return control.onclick = function() {
    // remove hide-none from tab
    siblings[tabkey].classList.remove('hide-none')
    // for siblings, hide if not shown tab
    for (var k=0; k<siblings.length; k++) {
      var sibling = siblings[k]
      // if not shown tab, hide
      if (k !== tabkey) {
        sibling.classList.add('hide-none')
      }
    }
  }
}

var tab_containers = document.getElementsByClassName('tab-container') // get refs
// loop through refs
for (var i=0; i<tab_containers.length; i++) {
  var children = tab_containers[i].children
  // for children, check if tab
  for (var j=0; j<children.length; j++) {
    var child = children[j]
    // if is tab, check if active and register onclick for control
    if (child.classList.contains('tab')) {
      // if active, remove hide none if exists
      if (child.dataset.active === "true") {
        if (child.classList.contains('hide-none')) { child.classList.remove('hide-none') }
      } else { // else, hide if not already
        if (!child.classList.contains('hide-none')) { child.classList.add('hide-none') }
      }
      // register onclick for control
      createControl(document.getElementById(child.dataset.control), j, children)
    }
  }
}

// -------------- //
// EXTERNAL LINKS //
// -------------- //
const shell = require('electron').shell

function createLinkClick(button, href) {
  button.onclick = function() {
    shell.openExternal(href)
  }
}

var external_links = document.getElementsByClassName('link-external') // get refs
// for each ref, add onclick
for (var i=0; i<external_links.length; i++) {
  var button = external_links[i]
  // if not href, return console
  if (!button.dataset.href) { return console.log('Set data-href on elements with link-external to set link.') }
  createLinkClick(button, button.dataset.href)
}
