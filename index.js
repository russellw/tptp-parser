'use strict'
var fs = require('fs')

// Tokenizer
var file
var i
var text
var tok

function err(msg) {
	var loc = location()
	msg += ' (' + loc.line + ':' + loc.column + ')'
	var e = new SyntaxError(msg)
	e.file = file
	e.loc = loc
	e.pos = i
	e.raisedAt = i
	throw e
}

function isalnum(c) {
	return isalpha(c) || isdigit(c)
}

function isalpha(c) {
	return islower(c) || isupper(c)
}

function isdigit(c) {
	return '0' <= c && c <= '9'
}

function isdigit(c) {
	return '0' <= c && c <= '9'
}

function islower(c) {
	return 'a' <= c && c <= 'z'
}

function isupper(c) {
	return 'A' <= c && c <= 'Z'
}

function lex() {
	for (;;) {
		switch (text[i]) {
		case '\t':
		case '\n':
		case '\v':
		case '\r':
		case ' ':
			i++
			continue
		case '!':
			switch (text[i + 1]) {
			case '=':
				tok = text.slice(i, i + 2)
				i += 2
				return
			}
			break
		case '"':
		case "'":
			var q = text[i]
			for (var j = i + 1; text[j] !== q; j++) {
				if (j === text.length || text[j] < ' ')
					err('Unclosed quote')
				if (text[j] === '\\')
					switch (text[j + 1]) {
					case '\\':
					case q:
						j++
						break
					default:
						err('Unknown escape sequence')
						break
					}
			}
			j++
			tok = text.slice(i, j)
			i = j
			return
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
			for (var j = i; isalnum(text[j]) || text[j] === '$' || text[j] === '_'; j++)
				;
			tok = text.slice(i, j)
			i = j
			return
		case '%':
			while (i < text.length && text[i] !== '\n')
				i++
			continue
		case '/':
			switch (text[i + 1]) {
			case '*':
				for (var j = i + 2; text.slice(j, j + 2) !== '*/'; j++)
					if (j === text.length)
						err('Unclosed comment')
				i = j + 2
				continue
			}
			break
		case '<':
			switch (text[i + 1]) {
			case '=':
				switch (text[i + 1]) {
				case '>':
					tok = text.slice(i, i + 3)
					i += 3
					return
				}
				tok = text.slice(i, i + 2)
				i += 2
				return
			case '~':
				switch (text[i + 1]) {
				case '>':
					tok = text.slice(i, i + 3)
					i += 3
					return
				}
				break
			}
			break
		case '=':
			switch (text[i + 1]) {
			case '>':
				tok = text.slice(i, i + 2)
				i += 2
				return
			}
			break
		case '~':
			switch (text[i + 1]) {
			case '&':
			case '|':
				tok = text.slice(i, i + 2)
				i += 2
				return
			}
			break
		}
		tok = text[i++]
		return
	}
}

function location() {
	var column = 0
	var line = 1
	for (var j = 0; j < i; j++)
		if (text[j] === '\n') {
			column = 0
			line++
		} else
			column++
	return {
		column,
		line,
	}
}

// Parser

function annotated_formula() {
	lex()
	expect('(')
	var nm = name()
	expect(',')
	var role = formula_role()
	expect(',')
	formula()
	expect(')')
	expect('.')
}

function defined_term() {
	switch (tok) {
	case '$difference':
		return defined_term_arity('-', 2)
	case '$distinct':
		var args = term_args()
		var clauses = []
		for (var i = 0; i < args.length; i++)
			for (var j = 0; j < i; j++)
				clauses.push({
					args: [
						args[i],
						args[j],
					],
					op: '!=',
				})
		return {
			args: clauses,
			op: '&',
		}
	case '$false':
		return {
			op: 'const',
			val: false,
		}
	case '$greater':
		return defined_term_arity('>', 2)
	case '$greatereq':
		return defined_term_arity('>=', 2)
	case '$less':
		return defined_term_arity('<', 2)
	case '$lesseq':
		return defined_term_arity('<=', 2)
	case '$product':
		return defined_term_arity('*', 2)
	case '$quotient':
		return defined_term_arity('/', 2)
	case '$sum':
		return defined_term_arity('+', 2)
	case '$true':
		return {
			op: 'const',
			val: true,
		}
	case '$uminus':
		return defined_term_arity('-', 1)
	}
	err('Unknown term')
}

function defined_term_arity(op, arity) {
	var args = term_args()
	if (args.length !== arity)
		err('Expected ' + arity + ' arguments')
	return {
		args,
		op,
	}
}

function eat(k) {
	if (tok === k) {
		lex()
		return true
	}
}

function expect(k) {
	if (!eat(k))
		err("Expected '" + k + "'")
}

function formula() {
	var args = [unitary_formula()]
	var op = tok
	switch (tok) {
	case '&':
	case '|':
		while (eat(op))
			args.push(unitary_formula())
		break
	case '<=':
		lex()
		args.unshift(unitary_formula())
		op = '=>'
		break
	case '<=>':
	case '<~>':
	case '=>':
	case '~&':
	case '~|':
		lex()
		args.push(unitary_formula())
		break
	default:
		return args[0]
	}
	return {
		args,
		op,
	}
}

function infix_unary() {
	var a = term()
	switch (tok) {
	case '!=':
	case '=':
		var op = tok
		lex()
		return {
			args: [
				a,
				term(),
			],
			op,
		}
	}
	return a
}

function parse(t, f) {
	file = f
	i = 0
	text = t
	lex()
	while (tok)
		switch (tok) {
		case 'cnf':
		case 'fof':
			annotated_formula()
			break
		default:
			if (islower(tok[0]))
				err('Unknown language')
			err('Expected input')
			break
		}
}

function term() {
	switch (tok[0]) {
	case '$':
		return defined_term()
	}
	err('Syntax error')
}

function term_args() {
	expect(')')
	var a = [term()]
	while (eat(','))
		a.push(term())
	expect(')')
	return a
}

function unitary_formula() {
	switch (tok) {
	case '(':
		lex()
		var a = formula()
		expect(')')
		return a
	case '~':
		lex()
		return {
			args: [unitary_formula()],
			op: '~',
		}
	}
	return infix_unary()
}

exports.parse = parse
