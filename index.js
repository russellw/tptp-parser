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
		case '!':
			switch (text[i + 1]) {
			case '=':
				tok = text.slice(i, i + 2);
				i += 2;
				return;
			}
			break;
		case '<':
			switch (text[i + 1]) {
			case '=':
				switch (text[i + 1]) {
				case '>':
					tok = text.slice(i, i + 3);
					i += 3;
					return;
				}
				tok = text.slice(i, i + 2);
				i += 2;
				return;
			case '~':
				switch (text[i + 1]) {
				case '>':
					tok = text.slice(i, i + 3);
					i += 3;
					return;
				}
				err("expected '>'");
				break;
			}
			break;
		case '=':
			switch (text[i + 1]) {
			case '>':
				tok = text.slice(i, i + 2);
				i += 2;
				return;
			}
			break;
		case '~':
			switch (text[i + 1]) {
			case '&':
			case '|':
				tok = text.slice(i, i + 2);
				i += 2;
				return;
			}
			break;
		}
		tok = text[i++];
		return;
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
