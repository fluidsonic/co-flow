'use strict';

const after = require('./helpers/after');
const any = require('../lib/any');
const co = require('co');
const test = require('tap').test;

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

const runnablesWhereFastestFails = [
	after(firstTime).succeed(firstData),
	after(otherTime).succeed(otherData),
	after(secondFastestTime).succeed(secondFastestData),
	after(fastestTime).fail(fastestError)
];

const runnablesWhereAllSucceed = [
	after(firstTime).succeed(firstData),
	after(otherTime).succeed(otherData),
	after(secondFastestTime).succeed(secondFastestData),
	after(fastestTime).succeed(fastestData)
];


test('any() basic functionality', function(t) {
	t.plan(3);

	co(function*() {
		t.equal(yield any(runnablesWhereAllSucceed),   fastestData,       'data of first successful runnable is returned');
		t.equal(yield any(runnablesWhereFastestFails), secondFastestData, 'data of second successful runnable is returned when first fails');

		try {
			yield any(runnablesWhereAllFail);
			t.fail('fails when all runnables fail');
		}
		catch (e) {
			t.equal(e, fastestError, 'fails when all runnables fail');
		}
	});
});


test('any() options.concurrency', function(t) {
	t.plan(4);

	co(function*() {
		t.equal(yield any(runnablesWhereAllSucceed),                         fastestData, 'not set (= true) => parallel execution = fastest runnable must win');
		t.equal(yield any(runnablesWhereAllSucceed, { concurrency: true }),  fastestData, 'true => parallel execution = fastest runnable must win');
		t.equal(yield any(runnablesWhereAllSucceed, { concurrency: false }), firstData,   'false => serial execution = first runnable must win');
		t.equal(yield any(runnablesWhereAllSucceed, { concurrency: 2 }),     firstData,   '2 => threaded execution = fastest runnable in first batch must win');
	});
});


test('any() options.failsWhenAnyFailed', function(t) {
	t.plan(3);

	co(function*() {
		t.equal(yield any(runnablesWhereFastestFails),                                secondFastestData, 'not set (= false) + fastest fails => second fastest must win');
		t.equal(yield any(runnablesWhereFastestFails, { failsWhenAnyFailed: false }), secondFastestData, 'false + fastest fails => second fastest must win');

		try {
			yield any(runnablesWhereFastestFails, { failsWhenAnyFailed: true });
			t.fail('true + any fails => must fail with fastest error');
		}
		catch (e) {
			t.equal(e, fastestError, 'true + any fails => must fail with fastest error');
		}
	});
});


test('any() options.failsWhenAllFailed', function(t) {
	t.plan(6);

	co(function*() {
		t.equal(yield any(runnablesWhereFastestFails), secondFastestData, 'not set (= true) + fastest fails => second fastest must win');

		try {
			yield any(runnablesWhereAllFail, { failsWhenAllFailed: true });
			t.fail('not set (= true) + all fail => must fail with fastest error');
		}
		catch (e) {
			t.equal(e, fastestError, 'not set (= true) + all fail => must fail with fastest error');
		}

		t.equal(yield any(runnablesWhereFastestFails, { failsWhenAllFailed: true }), secondFastestData, 'true + fastest fails => second fastest must win');

		try {
			yield any(runnablesWhereAllFail, { failsWhenAllFailed: true });
			t.fail('true + all fail => must fail with fastest error');
		}
		catch (e) {
			t.equal(e, fastestError, 'true + all fail => must fail with fastest error');
		}

		t.equal(yield any(runnablesWhereFastestFails, { failsWhenAllFailed: false }), secondFastestData, 'false + fastest fails => second fastest must win');
		t.equal(yield any(runnablesWhereAllFail,      { failsWhenAllFailed: false }), fastestError,      'false + all fail => fastest error returned');
	});
});


test('any() options.structured', function(t) {
	t.plan(6);

	co(function*() {
		t.equal(yield any(runnablesWhereAllSucceed),                                                       fastestData,             'not set (= false) + all succeed => fastest data must be returned unwrapped');
		t.equal(yield any(runnablesWhereAllFail,        { failsWhenAllFailed: false }),                    fastestError,            'not set (= false) + all fail => fastest error must be returned unwrapped');
		t.equal(yield any(runnablesWhereAllSucceed,     { structured: false }),                            fastestData,             'false + all succeed => fastest data must be returned unwrapped');
		t.equal(yield any(runnablesWhereAllFail,        { structured: false, failsWhenAllFailed: false }), fastestError,            'false + all fail => fastest error must be returned unwrapped');
		t.deepEqual(yield any(runnablesWhereAllSucceed, { structured: true }),                             { data: fastestData },   'true + all succeed => fastest data must be returned wrapped');
		t.deepEqual(yield any(runnablesWhereAllFail,    { structured: true, failsWhenAllFailed: false }),  { error: fastestError }, 'true + all fail => fastest error must be returned wrapped');
	});
});


test('any() options.this', function(t) {
	t.plan(3);

	const context = {};
	const success = after(0).succeed(1);
	const failure = after(0).fail(new Error());

	const runnable = function(callback) {
		t.equal(this, context, 'runnable called with specific value for "this"');

		callback();
	};

	const unusedResultHandler = function() {
		t.equal(this, context, 'unusedResultHandler called with specific value for "this"');
	};

	co(function*() {
		yield any([runnable],         { this: context });
		yield any([success, success], { this: context, unusedResultHandler: unusedResultHandler });
		yield any([success, failure], { this: context, unusedResultHandler: unusedResultHandler });
	});
});


test('any() options.unusedResultHandler', function(t) {
	t.plan(1);

	const runnables = [
		after(30).succeed(30),
		after(20).fail(20),
		after(10).succeed(10),
	];

	const expectedResults = [
		{ data:  10 },  // returned by yield
		{ data:  30 },  // received by unusedResultHandler
		{ error: 20 }   // received by unusedResultHandler
	];

	const results = [];

	const unusedResultHandler = function(error, data) {
		results.push(error ? { error: error } : { data: data });

		if (results.length === runnables.length) {
			t.deepEqual(results, expectedResults, 'first result returned and remaining passed to unusedResultHandler');
		}
		else if (results.length > runnables.length) {
			t.fail('unusedResultHandler called (runnables.length - 1) times');
		}
	};

	co(function*() {
		results.push(yield any(runnables, { failsWhenAllFailed: false, structured: true, unusedResultHandler: unusedResultHandler }));
	});
});


test('any() with no runnables', function(t) {
	t.plan(2);

	co(function*() {
		t.equal(yield any(false), undefined, 'any(false) returns undefined');
		t.equal(yield any([]),    undefined, 'any([]) returns undefined');
	});
});
