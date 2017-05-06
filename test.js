var assert = require('assert')
var cnf = require('clause-normal-form')
var fs = require('fs')
var index = require('./index')

function all(variables, arg) {
	if (variables.op)
		variables = [variables]
	return cnf.quant('!', variables, arg)
}

function and(a, b) {
	return cnf.term('&', a, b)
}

function assertIso(a, b) {
	assert(cnf.isomorphic(a, b))
}

function call(f, args) {
	if (args.op)
		args = [args]
	return cnf.call(f, args)
}

function exists(variables, arg) {
	if (variables.op)
		variables = [variables]
	return cnf.quant('?', variables, arg)
}

function implies(a, b) {
	return cnf.term('=>', a, b)
}

function not(a) {
	return cnf.term('~', a)
}

function or(a, b) {
	return cnf.term('|', a, b)
}

function read(file) {
	var text = fs.readFileSync(file, 'utf8')
	return index.parse(text, file)
}

it('formulas', function () {
	var formulas = cnf.term('&')
	formulas.push(cnf.term('=>', cnf.term('&', cnf.fun('p0'), cnf.term('~', cnf.fun('q0'))), cnf.term('|', cnf.fun('r0'), cnf.term('~', cnf.fun('s0')))))
	var X = cnf.variable('X')
	var Y = cnf.variable('Y')
	var Z = cnf.variable('Z')
	var a = cnf.fun('a')
	var b = cnf.fun('b')
	var f = cnf.fun('f')
	var g = cnf.fun('g')
	var p = cnf.fun('p')
	var q = cnf.fun('q')
	var r = cnf.fun('r')
	var s = cnf.fun('s')
	var form = all(X, implies(or(call(p, X), not(call(q, [X, a]))), exists([Y, Z], and(call(r, [
		X,
		call(f, Y),
		call(g, [
			X,
			call(f, Y),
			Z,
		]),
	]), not(call(s, call(f, call(f, call(f, b)))))))))
	formulas.push(form)
	formulas.push(cnf.call(cnf.fun('p'), [cnf.fun('h')]))
	formulas.push(cnf.term('|', cnf.call(cnf.fun('p'), [cnf.integer(12)]), cnf.call(cnf.fun('p'), [cnf.integer(-12)])))
	assertIso(read('test.p').formulas, formulas)
})
it('status', function () {
	assert(read('test.p').status === 'Theorem')
})
