#!/usr/bin/env node

'use strict';
var commander = require('commander');
var getStdin = require('get-stdin');
var glob = require('glob');
var index = require('./index');
var os = require('os');
var util = require('util');

function print(a) {
	console.log(util.inspect(a, {
		depth: null,
		maxArrayLength: null,
		showHidden: false,
	}));
}

// Command line
commander.usage('[options] <files>');
commander.version(require('./package.json').version);
commander.parse(process.argv);

// Files
var files = commander.args;
if (os.platform() === 'win32') {
	files = [];
	for (var pattern of commander.args) {
		for (var file of glob.sync(pattern, {
			nonull: true,
			nosort: true,
		})) {
			files.push(file);
		}
	}
}
if (files.length === 1 && files[0] === '-') {
	files = [];
}
switch (files.length) {
case 0:
	getStdin().then(function (text) {
		print(index.parse(text, 'stdin'));
	});
	break;
case 1:
	print(index.read(files[0]));
	break;
default:
	for (var file of files) {
		console.log(file);
		print(index.read(file));
	}
	break;
}
