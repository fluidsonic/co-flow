'use strict';

const co = require('co');
const test = require('tap').test;
const wait = require('../lib/wait');


test('wait()', function(t) {
	t.plan(1);

	co(function*() {
		const startTime = new Date();
		yield wait(50);
		const timeTaken = new Date() - startTime;
		t.ok(timeTaken >= 50 && timeTaken <= 60, 'wait(50) should wait ~50ms - waited ' + timeTaken + 'ms');
	})();
});
