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

it('status', function () {
	assert(read('test.p').status === 'Theorem')
})
