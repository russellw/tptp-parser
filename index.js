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

function isalnum(c) {
	return isalpha(c) || isdigit(c);
}

function isalpha(c) {
	return islower(c) || isupper(c);
}

function isdigit(c) {
	return '0' <= c && c <= '9';
}

function isdigit(c) {
	return '0' <= c && c <= '9';
}

function islower(c) {
	return 'a' <= c && c <= 'z';
}

function isupper(c) {
	return 'A' <= c && c <= 'Z';
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
		case '"':
		case "'":
			var q = text[i];
			for (var j = i + 1; text[j] !== q; j++) {
				if (j === text.length) {
					err('unclosed quote');
				}
				if (text[j] === '\\') {
					switch (text[j + 1]) {
					case '\\':
					case q:
						j++;
						break;
					default:
						err('unknown escape sequence');
						break;
					}
				}
			}
			j++;
			tok = text.slice(i, j);
			i = j;
			return;
		case '$':
		case 'A':
		case 'B':
		case 'C':
		case 'D':
		case 'E':
		case 'F':
		case 'G':
		case 'H':
		case 'I':
		case 'J':
		case 'K':
		case 'L':
		case 'M':
		case 'N':
		case 'O':
		case 'P':
		case 'Q':
		case 'R':
		case 'S':
		case 'T':
		case 'U':
		case 'V':
		case 'W':
		case 'X':
		case 'Y':
		case 'Z':
		case 'a':
		case 'b':
		case 'c':
		case 'd':
		case 'e':
		case 'f':
		case 'g':
		case 'h':
		case 'i':
		case 'j':
		case 'k':
		case 'l':
		case 'm':
		case 'n':
		case 'o':
		case 'p':
		case 'q':
		case 'r':
		case 's':
		case 't':
		case 'u':
		case 'v':
		case 'w':
		case 'x':
		case 'y':
		case 'z':
			for (var j = i; isalnum(text[j]) || text[j] === '$' || text[j] === '_'; j++) {
			}
			tok = text.slice(i, j);
			i = j;
			return;
		case '%':
			while (i < text.length && text[i] !== '\n') {
				i++;
			}
			continue;
		case '/':
			switch (text[i + 1]) {
			case '*':
				var line1 = line;
				for (i += 2; !(text[i] === '*' && text[i + 1] === '/'); i++) {
					if (i === text.length) {
						line = line1;
						err('unclosed comment');
					}
					if (text[i] === '\n') {
						line++;
					}
				}
				continue;
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
