'use strict';

const co = require('co');
const wait = require('../lib/wait');


co(function*() {
	console.log('Wait');
	yield wait(500);
	console.log('just');
	yield wait(500);
	console.log('does');
	yield wait(500);
	console.log('what');
	yield wait(500);
	console.log('it');
	yield wait(500);
	console.log('says.');
});
