#!/usr/bin/env node

'use strict';
var commandFiles = require('command-files');
var commander = require('commander');
var getStdin = require('get-stdin');
var index = require('./index');
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
var files = commandFiles.expand(commander.args);
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
