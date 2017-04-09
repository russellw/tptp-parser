#!/usr/bin/env node

'use strict'
var commandFiles = require('command-files')
var commander = require('commander')
var fs = require('fs')
var getStdin = require('get-stdin')
var index = require('./index')
var iop = require('iop')
var util = require('util')

function read(file) {
	var text = fs.readFileSync(file, {
		encoding: 'utf8',
	})
	return index.parse(text)
}

// Command line
commander.usage('[options] <files>')
commander.version(require('./package.json').version)
commander.parse(process.argv)

// Files
var files = commandFiles.expand(commander.args, file => file.endsWith('.p'))
switch (files.length) {
case 0:
	getStdin().then(
		function (text) {
			print(index.parse(text))
		})
	break
case 1:
	print(read(files[0]))
	break
default:
	for (var file of files) {
		console.log(file)
		read(file)
	}
	break
}
