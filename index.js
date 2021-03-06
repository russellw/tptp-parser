'use strict'
var cnf = require('clause-normal-form')
var fs = require('fs')
var iop = require('iop')
var path = require('path')

// Tokenizer
var file
var i
var status
var text
var tok
var value

function err(msg) {
	var r = []

	// File
	if (file)
		r.push(file + ':')

	// Line
	var line = 1
	for (var j = 0; j < i; j++)
		if (text[j] === '\n')
			line++
	r.push(line + ': ')

	// Token
	if (tok)
		r.push("'" + tok + "': ")

	// Message
	return r.join('') + msg
}

function lex() {
	tok = ''
	for (;;) {
		switch (text[i]) {
		case '\t':
		case '\n':
		case '\v':
		case '\f':
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
					throw new Error(err('Unclosed quote'))
				if (text[j] === '\\')
					switch (text[j + 1]) {
					case '\\':
					case q:
						j++
						break
					default:
						throw new Error(err('Unknown escape sequence'))
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
			for (var j = i; j < text.length && text[j] !== '\n'; j++)
				;
			if (!status) {
				var match = /^%\s*Status\s*:\s*(\w+)\s*$/.exec(text.slice(i, j))
				if (match)
					status = match[1]
			}
			i = j
			continue
		case '+':
		case '-':
			if (iop.isdigit(text[i + 1])) {
				number()
				return
			}
			break
		case '/':
			switch (text[i + 1]) {
			case '*':
				for (var j = i + 2; text.slice(j, j + 2) !== '*/'; j++)
					if (j === text.length)
						throw new Error(err('Unclosed comment'))
				i = j + 2
				continue
			}
			break
		case '0':
		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
		case '8':
		case '9':
			number()
			return
		case '<':
			switch (text[i + 1]) {
			case '=':
				switch (text[i + 2]) {
				case '>':
					tok = text.slice(i, i + 3)
					i += 3
					return
				}
				tok = text.slice(i, i + 2)
				i += 2
				return
			case '~':
				switch (text[i + 2]) {
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

function number() {
	var j = i

	function digits() {
		while (iop.isdigit(text[j]))
			j++
	}

	function sign() {
		switch (text[j]) {
		case '+':
		case '-':
			j++
			break
		}
	}

	sign()
	digits()
	switch (text[j]) {
	case '.':
		j++
		digits()
		switch (text[j]) {
		case 'E':
		case 'e':
			j++
			sign()
			digits()
			break
		}
		break
	case '/':
		j++
		digits()
		tok = text.slice(i, j)
		i = j
		value = cnf.rational(tok)
		return
	case 'E':
	case 'e':
		j++
		sign()
		digits()
		break
	default:
		tok = text.slice(i, j)
		i = j
		value = cnf.integer(tok)
		return
	}
	tok = text.slice(i, j)
	i = j
	value = cnf.real(tok)
}

// Parser
var bytes
var conjecture
var distinct_objs
var files
var formulas
var free
var funs
var selection

function annotated_formula() {
	lex()

	// Name
	expect('(')
	if (select(formula_name())) {
		// Role
		expect(',')
		if (!tok)
			throw new Error(err('Expected role'))
		if (!iop.islower(tok[0]))
			throw new Error(err('Expected role'))
		var role = tok
		lex()

		// Formula
		expect(',')
		free = new Map()
		var a = formula(cnf.empty)
		if (free.size)
			a = cnf.quant('!', Array.from(free.values()), a)
		if (role === 'conjecture') {
			if (conjecture)
				throw new Error(err('Multiple conjectures not supported'))
			a = cnf.term('~', a)
			conjecture = a
		}
		formulas.push(a)
	}

	// Annotations
	if (eat(','))
		while (tok !== ')')
			ignore()

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
		var clauses = cnf.term('&')
		for (var i = 0; i < args.length; i++)
			for (var j = 0; j < i; j++)
				clauses.push(cnf.term('!=', args[i], args[j]))
		return clauses
	case '$false':
		lex()
		return cnf.bool(false)
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
		lex()
		return cnf.bool(true)
	case '$uminus':
		return defined_term_arity(bound, '-', 1)
	}
	throw new Error(err('Unknown term'))
}

function defined_term_arity(bound, op, arity) {
	var args = term_args(bound)
	if (args.length !== arity)
		throw new Error(err('Expected ' + arity + ' arguments'))
	return cnf.term(op, ...args)
}

function eat(k) {
	if (tok === k) {
		lex()
		return true
	}
}

function expect(k) {
	if (!eat(k))
		throw new Error(err("Expected '" + k + "'"))
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
	return cnf.term(op, ...args)
}

function formula_name() {
	if (!tok)
		throw new Error(err('Expected formula name'))
	switch (tok[0]) {
	case "'":
		var name = unquote(tok)
		lex()
		return name
	case '0':
	case '1':
	case '2':
	case '3':
	case '4':
	case '5':
	case '6':
	case '7':
	case '8':
	case '9':
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
		var name = tok
		lex()
		return name
	}
	throw new Error(err('Expected name'))
}

function ignore() {
	if (!tok)
		throw new Error(err("Expected ')'"))
	switch (tok) {
	case '(':
		lex()
		while (!eat(')'))
			ignore()
		return
	case '[':
		lex()
		while (!eat(']')) {
			if (!tok)
				throw new Error(err("Expected ']'"))
			ignore()
		}
		return
	}
	lex()
}

function include() {
	lex()

	// File
	expect('(')
	if (!tok.startsWith("'"))
		throw new Error(err('Expected file'))
	var name = unquote(tok)
	lex()

	// Selection
	var selection1 = selection
	if (eat(',')) {
		expect('[')
		selection1 = new Set()
		do {
			var s = formula_name()
			if (select(s))
				selection1.add(s)
		} while (eat(','))
		expect(']')
	}

	// End
	expect(')')
	expect('.')

	// Absolute
	if (path.isAbsolute(name)) {
		var file1 = name
		var text1 = fs.readFileSync(file1, 'utf8')
		parse1(text1, file1, selection1)
		return
	}

	// Relative
	var tptp = process.env.TPTP
	if (!tptp)
		throw new Error(err('TPTP environment variable not defined'))
	var file1 = tptp + '/' + name
	var text1 = fs.readFileSync(file1, 'utf8')
	parse1(text1, file1, selection1)
}

function infix_unary(bound) {
	var a = term(bound)
	switch (tok) {
	case '!=':
	case '=':
		var op = tok
		lex()
		return cnf.term(op, a, term(bound))
	}
	return a
}

function parse(text, file) {
	bytes = 0
	conjecture = null
	distinct_objs = new Map()
	files = []
	formulas = cnf.term('&')
	funs = new Map()
	status = ''
	parse1(text, file)
	return {
		bytes,
		conjecture,
		files,
		formulas,
		status,
	}
}

function parse1(text1, file1, selection1) {
	bytes += text1.length
	files.push(file1)

	// Save
	var file0 = file
	var i0 = i
	var selection0 = selection
	var text0 = text
	var tok0 = tok
	var value0 = value

	// Load
	file = file1
	i = 0
	selection = selection1
	text = text1

	// Parse
	lex()
	while (tok)
		switch (tok) {
		case 'cnf':
		case 'fof':
			annotated_formula()
			break
		case 'include':
			include()
			break
		default:
			if (iop.islower(tok[0]))
				throw new Error(err('Unknown language'))
			throw new Error(err('Expected input'))
		}

	// Restore
	file = file0
	i = i0
	selection = selection0
	text = text0
	tok = tok0
	value = value0
}

function plain_term(bound, name) {
	lex()
	var f = funs.get(name)
	if (!f) {
		f = cnf.fun(name)
		funs.set(name, f)
	}
	if (tok !== '(')
		return f
	var args = term_args(bound)
	return cnf.call(f, args)
}

function select(name) {
	if (!selection)
		return true
	return selection.has(name)
}

function term(bound) {
	if (!tok)
		throw new Error(err('Expected term'))
	switch (tok[0]) {
	case '"':
		var name = unquote(tok)
		lex()
		a = distinct_objs.get(name)
		if (a)
			return a
		a = cnf.distinct_obj(name)
		distinct_objs.set(name, a)
		return a
	case '$':
		return defined_term(bound)
	case "'":
		return plain_term(bound, unquote(tok))
	case '+':
	case '-':
		if (!iop.isdigit(tok[1]))
			break
	case '0':
	case '1':
	case '2':
	case '3':
	case '4':
	case '5':
	case '6':
	case '7':
	case '8':
	case '9':
		var a = value
		lex()
		return a
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
		var name = tok
		lex()
		var a = bound.get(name)
		if (a)
			return a
		a = free.get(name)
		if (a)
			return a
		a = cnf.variable(name)
		free.set(name, a)
		return a
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
		return plain_term(bound, tok)
	}
	throw new Error(err('Expected term'))
}

function term_args(bound) {
	expect('(')
	var a = [term(bound)]
	while (eat(','))
		a.push(term(bound))
	expect(')')
	return a
}

function unitary_formula(bound) {
	switch (tok) {
	case '!':
	case '?':
		var op = tok
		lex()
		expect('[')
		var variables = []
		do {
			var a = cnf.variable(tok)
			bound = bound.add(tok, a)
			lex()
		} while (eat(','))
		expect(']')
		expect(':')
		return cnf.quant(op, variables, unitary_formula(bound))
	case '(':
		lex()
		var a = formula(bound)
		expect(')')
		return a
	case '~':
		lex()
		return cnf.term('~', unitary_formula(bound))
	}
	return infix_unary(bound)
}

function unquote(s) {
	s = s.slice(1, s.length - 1)
	var r = []
	for (var i = 0; i < s.length; i++) {
		if (s[i] === '\\')
			i++
		r.push(s[i])
	}
	return r.join('')
}

exports.parse = parse
