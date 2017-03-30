'use strict';
var fs = require('fs');

// Tokenizer
var file;
var i;
var line;
var text;
var tok;

function err(msg) {
	if (file) {
		console.log(file + ':' + line + ': ' + msg);
	} else {
		console.log(line + ': ' + msg);
	}
	process.exit(1);
}

function isdigit(c) {
	return '0' <= c && c <= '9';
}

function lex() {
	for (; ; ) {
		switch (text[i]) {
		case '\n':
			line++;
		case ' ':
		case '\t':
		case '\v':
		case '\r':
			i++;
			continue;
		default:
			tok = text[i++];
			return;
		}
	}
}

// Parser

function eat(k) {
	if (tok === k) {
		lex();
		return true;
	}
}

// API

function parse(t, f) {
	file = f;
	i = 0;
	line = 1;
	text = t;
	lex();
}

function read(file) {
	var text = fs.readFileSync(file, {
		encoding: 'utf8',
	});
	return parse(text);
}

exports.parse = parse;
exports.read = read;
