'use strict';

const any = require('../lib/any');
const co = require('co');
const test = require('tap').test;

const mistake = new Error('mistakes happen');

const runnablesWhereAllFail = [
	after(50).fail(),
	after(100).fail(),
	after(10).fail()
];

const runnablesWhereFirstFails = [
	after(80).fail(),
	after(50).return(50),
	after(100).return(100),
	after(10).return(10)
];

const runnablesWhereFastestFails = [
	after(50).return(50),
	after(100).return(100),
	after(10).return(10),
	after(1).fail()
];

const runnablesWhereAllSucceed = [
	after(50).return(50),
	after(100).return(100),
	after(10).return(10)
];


test('any() options.concurrency', function(t) {
	t.plan(3);

	co(function*() {
		t.equals(10, yield any(runnablesWhereAllSucceed, { concurrency: true }),  'true (parallel) => fastest runnable (10ms) must win');
		t.equals(50, yield any(runnablesWhereAllSucceed, { concurrency: false }), 'false (serial) => first runnable (50ms) must win');
		t.equals(50, yield any(runnablesWhereAllSucceed, { concurrency: 2 }),     '2 (threaded) => fastest runnable in first batch (50ms) must win');
	})();
});


test('any() options.failsWhenAnyFailed', function(t) {
	t.plan(2);

	co(function*() {
		try {
			yield any(runnablesWhereFastestFails, { failsWhenAnyFailed: true });
			t.fail('true + any fails => must fail');
		}
		catch (e) {
			t.ok(e, 'true + any fails => must fail');
		}

		t.equals(10, yield any(runnablesWhereFastestFails, { failsWhenAnyFailed: false }), 'false + any fails => 10ms must win');
	})();
});


test('any() options.failsWhenAllFailed', function(t) {
	t.plan(4);

	co(function*() {
		t.equals(10,      yield any(runnablesWhereFastestFails, { failsWhenAllFailed: false }), 'false + one fails => 10ms must win');
		t.equals(10,      yield any(runnablesWhereFastestFails, { failsWhenAllFailed: true }),  'true + one fails => 10ms must win');
		t.equals(mistake, yield any(runnablesWhereAllFail,      { failsWhenAllFailed: false }), 'false + all fail => error returned');

		try {
			yield any(runnablesWhereAllFail, { failsWhenAllFailed: true });
			t.fail('true + all fail => must fail');
		}
		catch (e) {
			t.ok(e, 'true + all fail => must fail');
		}
	})();
});


function after(delay) {
	return {
		fail: function() {
			return function(callback) {
				setTimeout(callback.bind(undefined, mistake), delay);
			};
		},

		return: function(result) {
			return function(callback) {
				setTimeout(callback.bind(undefined, null, result), delay);
			};
		}
	};
}
