var assert = require('assert')
var cnf = require('clause-normal-form')
var fs = require('fs')
var index = require('./index')

function assertIso(a, b) {
	assert(cnf.isomorphic(a, b))
}

function read(file) {
	var text = fs.readFileSync(file, 'utf8')
	return index.parse(text, file)
}

it('formulas', function () {
	var formulas = cnf.term('&')
	formulas.push(cnf.term('=>', cnf.term('&', cnf.fun('p0'), cnf.term('~', cnf.fun('q0'))), cnf.term('|', cnf.fun('r0'), cnf.term('~', cnf.fun('s0')))))
	formulas.push(cnf.call(cnf.fun('p'), [cnf.fun('h')]))
	formulas.push(cnf.call(cnf.fun('p'), [cnf.integer(12)]), cnf.call(cnf.fun('p'), [cnf.integer(-12)]))
	assertIso(read('test.p').formulas, formulas)
})
it('status', function () {
	assert(read('test.p').status === 'Theorem')
})
