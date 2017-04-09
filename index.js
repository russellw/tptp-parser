'use strict'
var fs = require('fs')
var iop = require('iop')

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
			for (var j = i; iop.isalnum(text[j]) || text[j] === '$' || text[j] === '_'; j++)
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
var free
var functions

function annotated_formula() {
	lex()

	// Name
	expect('(')
	var nm = name()

	// Role
	expect(',')
	var role = formula_role()

	// Formula
	expect(',')
	free = new Map()
	formula()

	// Annotations
	// End
	expect(')')
	expect('.')
}

function defined_term(bound) {
	switch (tok) {
	case '$difference':
		return defined_term_arity(bound, '-', 2)
	case '$distinct':
		var args = term_args(bound)
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
		return defined_term_arity(bound, '>', 2)
	case '$greatereq':
		return defined_term_arity(bound, '>=', 2)
	case '$less':
		return defined_term_arity(bound, '<', 2)
	case '$lesseq':
		return defined_term_arity(bound, '<=', 2)
	case '$product':
		return defined_term_arity(bound, '*', 2)
	case '$quotient':
		return defined_term_arity(bound, '/', 2)
	case '$sum':
		return defined_term_arity(bound, '+', 2)
	case '$true':
		return {
			op: 'const',
			val: true,
		}
	case '$uminus':
		return defined_term_arity(bound, '-', 1)
	}
	err('Unknown term')
}

function defined_term_arity(bound, op, arity) {
	var args = term_args(bound)
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

function formula(bound) {
	var args = [unitary_formula(bound)]
	var op = tok
	switch (tok) {
	case '&':
	case '|':
		while (eat(op))
			args.push(unitary_formula(bound))
		break
	case '<=':
		lex()
		args.unshift(unitary_formula(bound))
		op = '=>'
		break
	case '<=>':
	case '<~>':
	case '=>':
	case '~&':
	case '~|':
		lex()
		args.push(unitary_formula(bound))
		break
	default:
		return args[0]
	}
	return {
		args,
		op,
	}
}

function infix_unary(bound) {
	var a = term(bound)
	switch (tok) {
	case '!=':
	case '=':
		var op = tok
		lex()
		return {
			args: [
				a,
				term(bound),
			],
			op,
		}
	}
	return a
}

function parse(t, f) {
	file = f
	functions = new Map()
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
			if (iop.islower(tok[0]))
				err('Unknown language')
			err('Expected input')
			break
		}
}

function term(bound) {
	switch (tok[0]) {
	case '$':
		return defined_term(bound)
	case "'":
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
		return plain_term(bound)
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
		var a = iop.get(bound, tok)
		if (a)
			return a
		a = free.get(tok)
		if (a)
			return a
		a = {
			name: tok,
			op: 'var',
		}
		free.set(tok, a)
		return a
	}
	err('Syntax error')
}

function term_args(bound) {
	expect(')')
	var a = [term(bound)]
	while (eat(','))
		a.push(term(bound))
	expect(')')
	return a
}

function unitary_formula(bound) {
	switch (tok) {
	case '(':
		lex()
		var a = formula(bound)
		expect(')')
		return a
	case '~':
		lex()
		return {
			args: [unitary_formula(bound)],
			op: '~',
		}
	}
	return infix_unary(bound)
}

exports.parse = parse
