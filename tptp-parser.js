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
	var text = fs.readFileSync(file, 'utf8')
	return index.parse(text, file)
}

commander.usage('[options] <files>')
commander.version(require('./package.json').version)
commander.parse(process.argv)
if (!commander.lang && !commander.args.length && tty.isatty(process.stdin.fd))
	process.exit(0)
var files = commandFiles.expand(commander.args, file => file.endsWith('.p'))
switch (files.length) {
case 0:
	getStdin().then(function (text) {
		iop.print(index.parse(text))
	})
	break
case 1:
	console.log(read(files[0]).formulas + '')
	break
default:
	for (var file of files) {
		console.log(file)
		read(file)
	}
	break
}
