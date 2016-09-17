/* renderer.js */

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
convert
