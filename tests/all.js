'use strict';

const after = require('./helpers/after');
const all = require('../lib/all');
const co = require('co');
const test = require('tap').test;
const wait = require('../lib/wait');

const fastestTime = 10;
const fastestData = fastestTime;
const fastestError = new Error('fastest');

const secondFastestTime = 20;
const secondFastestData = secondFastestTime;
const secondFastestError = new Error('second fastest');

const firstTime = 50;
const firstData = firstTime;
const firstError = new Error('firstError');

const otherTime = 100;
const otherData = otherTime;
const otherError = new Error('otherError');

// fastestTime < secondFastest < firstTime < otherTime < test case timeout

const runnablesWhereAllFail = [
	after(firstTime).fail(firstError),
	after(otherTime).fail(otherError),
	after(secondFastestTime).fail(secondFastestError),
	after(fastestTime).fail(fastestError)
];

const resultsWhereAllFail = [
	firstError,
	otherError,
	secondFastestError,
	fastestError
];

const runnablesWhereFastestFails = [
	after(firstTime).succeed(firstData),
	after(otherTime).succeed(otherData),
	after(secondFastestTime).succeed(secondFastestData),
	after(fastestTime).fail(fastestError)
];

const resultsWhereFastestFails = [
	firstData,
	otherData,
	secondFastestData,
	fastestError
];

const structuredResultsWhereFastestFails = [
	{ data: firstData },
	{ data: otherData },
	{ data: secondFastestData },
	{ error: fastestError }
];

const runnablesWhereAllSucceed = [
	after(firstTime).succeed(firstData),
	after(otherTime).succeed(otherData),
	after(secondFastestTime).succeed(secondFastestData),
	after(fastestTime).succeed(fastestData)
];

const resultsWhereAllSucceed = [
	firstData,
	otherData,
	secondFastestData,
	fastestData
];


test('all() basic functionality', function(t) {
	t.plan(2);

	co(function*() {
		t.deepEqual(yield all(runnablesWhereAllSucceed), resultsWhereAllSucceed, 'returns an array with the result data for each runnable');

		try {
			yield all(runnablesWhereFastestFails);
			t.fail('fails when any runnable fails');
		}
		catch (e) {
			t.equal(e, fastestError, 'fails when any runnable fails');
		}
	});
});


test('all() options.concurrency', function(t) {
	t.plan(4);

	co(function*() {
		// once JSHint fixed https://github.com/jshint/jshint/issues/1468 we can rename startTime/timeTaken(n) and drop the (n).

		{
			const startTime1 = new Date();
			yield all([ wait(20), wait(20), wait(20), wait(20), wait(20) ]);
			const timeTaken1 = new Date() - startTime1;
			t.ok(timeTaken1 < 40, 'not set (= true) => run in parallel (took ' + timeTaken1 + 'ms, expected ~20ms)');
		}

		{
			const startTime2 = new Date();
			yield all([ wait(20), wait(20), wait(20), wait(20), wait(20) ], { concurrency: true });
			const timeTaken2 = new Date() - startTime2;
			t.ok(timeTaken2 < 40, 'true => run in parallel (took ' + timeTaken2 + 'ms, expected ~20ms)');
		}

		{
			const startTime3 = new Date();
			yield all([ wait(20), wait(20), wait(20), wait(20), wait(20) ], { concurrency: 3 });
			const timeTaken3 = new Date() - startTime3;
			t.ok(timeTaken3 >= 40 && timeTaken3 < 60, '3 => run in parallel with at most 3 at once (took ' + timeTaken3 + 'ms, expected ~40ms)');
		}

		{
			const startTime4 = new Date();
			yield all([ wait(20), wait(20), wait(20), wait(20), wait(20) ], { concurrency: false });
			const timeTaken4 = new Date() - startTime4;
			t.ok(timeTaken4 >= 100 && timeTaken4 < 120, 'false => run serially (took ' + timeTaken4 + 'ms, expected ~100ms)');
		}
	});
});


test('all() options.failsWhenAnyFailed', function(t) {
	t.plan(3);

	co(function*() {
		try {
			yield all(runnablesWhereFastestFails);
			t.fail('not set (= true) + any fails => must fail with fastest error');
		}
		catch (e) {
			t.equal(e, fastestError, 'not set (= true) + any fails => must fail with fastest error');
		}

		try {
			yield all(runnablesWhereFastestFails, { failsWhenAnyFailed: true });
			t.fail('true + any fails => must fail with fastest error');
		}
		catch (e) {
			t.equal(e, fastestError, 'true + any fails => must fail with fastest error');
		}

		t.deepEqual(yield all(runnablesWhereFastestFails, { failsWhenAnyFailed: false }), resultsWhereFastestFails, 'false + any fails => no failure');
	});
});


test('all() options.failsWhenAllFailed', function(t) {
	t.plan(6);

	co(function*() {
		t.deepEqual(yield all(runnablesWhereFastestFails, { failsWhenAnyFailed: false }),                            resultsWhereFastestFails, 'not set (= false) + 1+ succeeds => success');
		t.deepEqual(yield all(runnablesWhereAllFail,      { failsWhenAnyFailed: false }),                            resultsWhereAllFail,      'not set (= false) + all fail => success');
		t.deepEqual(yield all(runnablesWhereFastestFails, { failsWhenAnyFailed: false, failsWhenAllFailed: false }), resultsWhereFastestFails, 'false + 1+ succeeds => success');
		t.deepEqual(yield all(runnablesWhereAllFail,      { failsWhenAnyFailed: false, failsWhenAllFailed: false }), resultsWhereAllFail,      'false + all fail => success');
		t.deepEqual(yield all(runnablesWhereFastestFails, { failsWhenAnyFailed: false, failsWhenAllFailed: true }),  resultsWhereFastestFails, 'true + 1+ succeeds => success');

		try {
			yield all(runnablesWhereAllFail, { failsWhenAnyFailed: false, failsWhenAllFailed: true });
			t.fail('true + all fail => failure with fastest error');
		}
		catch (e) {
			t.equal(e, fastestError, 'true + all fail => failure with fastest error');
		}
	});
});


test('all() options.structured', function(t) {
	t.plan(3);

	co(function*() {
		t.deepEqual(yield all(runnablesWhereFastestFails, { failsWhenAnyFailed: false }),                    resultsWhereFastestFails,           'false => results returned unwrapped');
		t.deepEqual(yield all(runnablesWhereFastestFails, { failsWhenAnyFailed: false, structured: false }), resultsWhereFastestFails,           'false => results returned unwrapped');
		t.deepEqual(yield all(runnablesWhereFastestFails, { failsWhenAnyFailed: false, structured: true }),  structuredResultsWhereFastestFails, 'true => results returned wrapped');
	});
});


test('all() options.this', function(t) {
	t.plan(5);

	const error = new Error();
	const context = {};
	const success = after(0).succeed(1);
	const failure = after(0).fail(error);

	const runnable = function(callback) {
		t.equal(this, context, 'runnable called with specific value for "this"');

		callback();
	};

	const unusedResultHandler = function() {
		// called twice
		t.equal(this, context, 'unusedResultHandler called with specific value for "this"');
	};

	co(function*() {
		yield all([runnable], { this: context });

		try {
			yield all([failure, success], { this: context, unusedResultHandler: unusedResultHandler });
			t.fail('failure is required');
		}
		catch (e) {
			t.equal(e, error, 'failure is required');
		}

		try {
			yield all([failure, failure], { this: context, unusedResultHandler: unusedResultHandler });
			t.fail('failure is required');
		}
		catch (e) {
			t.equal(e, error, 'failure is required');
		}
	});
});


test('all() options.unusedResultHandler', function(t) {
	t.plan(4);  // 2 per runWithConfiguration()

	function runWithConfiguration(configuration) {
		const testCase = configuration.testCase;
		const expectedCalls = configuration.expectedCalls;
		const expectedError = configuration.expectedError;
		const runnables = configuration.runnables;
		const calls = [];

		const unusedResultHandler = function(error, data) {
			calls.push(error ? { error: error } : { data: data });

			if (calls.length === expectedCalls.length) {
				t.deepEqual(calls, expectedCalls, testCase + ' => first result thrown and remaining passed to unusedResultHandler');
			}
			else if (calls.length > expectedCalls.length) {
				t.fail(testCase + ' => unusedResultHandler must be called (runnables.length - 1) times');
			}
		};

		co(function*() {
			try {
				yield all(runnables, { failsWhenAnyFailed: configuration.failsWhenAnyFailed, failsWhenAllFailed: true, unusedResultHandler: unusedResultHandler });
				t.fail(testCase + ' => fails with fastest error');
			}
			catch (e) {
				t.equal(e, expectedError, testCase + ' => fails with fastest error');
			}
		});
	}

	runWithConfiguration({
		testCase: 'any fails',
		runnables: [
			after(30).fail(30),
			after(20).fail(20),
			after(10).succeed(10),
		],
		expectedCalls: [
			{ error: 30 },
			{ data: 10 }
		],
		expectedError: 20,
		failsWhenAnyFailed: true
	});

	runWithConfiguration({
		testCase: 'all fail',
		runnables: [
			after(30).fail(30),
			after(20).fail(20),
			after(10).fail(10)
		],
		expectedCalls: [
			{ error: 30 },
			{ error: 20 }
		],
		expectedError: 10,
		failsWhenAnyFailed: false
	});
});


test('all() with no runnables', function(t) {
	t.plan(2);

	co(function*() {
		t.deepEqual(yield all(false), [], 'all(false) returns []');
		t.deepEqual(yield all([]),    [], 'all([]) returns []');
	});
});
