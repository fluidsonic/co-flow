co-flow
=======

Flexible execution flow addons ([all](#all-runnables-options), [any](#any-runnables-options), [wait](#wait-delay)) for [co](https://github.com/visionmedia/co).

[![Build Status](https://travis-ci.org/fluidsonic/co-flow.png?branch=master)](https://travis-ci.org/fluidsonic/co-flow)



Quickstart
----------

```javascript
const all = require('co-flow').all;
const any = require('co-flow').any;
const wait = require('co-flow').wait;

const allResults = yield all([runnable1, runnable2, …]);  // returns an array with the results of all runnables
const anyResult  = yield any([runnable1, runnable2, …]);  // returns the result for the runnable which succeeded first

yield wait(500);  // just what you expect
```



Usage
--------

### all (runnables, [options])

Executes all runnables and waits for all of them to complete.

Returns an array with the result of each runnable, in the same order.  
If `options.failsWhenAnyFailed` is `false` then the returned array will also contain errors for each runnable which failed.

Returns an empty array if `runnables` evaluates to `false` or is an empty array.

#### Parameters

- `runnables` - An array of [runnables](https://github.com/visionmedia/co#yieldables) to be executed.

- `options.concurrency` - Specifies the maximum number of runnables which will be executed concurrently (similar to tasks in a thread pool).  
  `true` executes all runnables in parallel and `false` is like `1` and runs all runnables serially in order.  
  Defaults to `true`.

- `options.failsWhenAnyFailed` - If `true` then the function will fail if any runnable failed.  
  The error of the first runnable which failed will be passed along.  
  Defaults to `true`.

- `options.failsWhenAllFailed` - If `true` then the function will fail if all runnables failed.  
  The error of the first runnable which failed will be passed along.  
  Defaults to `false`.

- `options.structured` - If `true` then the function's result data will be wrapped with `{ error: … }` or `{ data: … }`, respectively.  
  Defaults to `false`.

- `options.this` - Value for `this` when executing runnables or `options.unusedResultHandler`.  

- `options.unusedResultHandler` - Callback for each runnable whose result was not returned by the function (due to `options.failsWhenAnyFailed` or `options.failsWhenAllFailed`).  
  The callback will be called after the function returned and in the order of the runnables.

#### Example

Load multiple URLs concurrently.

```javascript
const all = require('co-flow').all;
const co = require('co');
const request = require('co-request');

co(function*() {
	try {
		// request all URLs concurrently and wait for all of them to complete
		const results = yield all([
			request('https://raw.github.com/fluidsonic/co-flow/master/README.md'),
			request('https://raw.github.com/fluidsonic/co-flow/master/index.js'),
			request('https://raw.github.com/fluidsonic/co-flow/master/package.json')
		]);

		// output response of each request
		results.forEach(function(result) {
			console.log('\n  ###### %s responded:\n', result.request.uri.href);
			console.log('%s', result.body);
		});
	}
	catch (e) {
		// any request failed
		console.error('Cannot load request:', e);
	}
});
```

### any (runnables, [options])

Executes all runnables and only waits for one of them to complete successfully.

Returns the result data of the first runnable which completes successfully or else the error of the first runnable which failed if `options.failsWhen(Any/All)Failed` are both `false`.

Returns the result data `undefined` if `runnables` evaluates to `false` or is an empty array.

#### Parameters

- `runnables` - An array of [runnables](https://github.com/visionmedia/co#yieldables) to be executed.

- `options.concurrency` - Specifies the maximum number of runnables which will be executed concurrently (similar to tasks in a thread pool).  
  `true` executes all runnables in parallel and `false` is like `1` and runs all runnables serially in order.  
  Defaults to `true`.

- `options.failsWhenAnyFailed` - If `true` then the function will fail as soon as any runnable failed.  
  As a consequence a successful completion of the function will be delayed until all runnables have completed.  
  The error of the first runnable which failed will be passed along.  
  Defaults to `false`.

- `options.failsWhenAllFailed` - If `true` then the function will fail if all runnables failed (instead of returning the error as result data).  
  The error of the first runnable which failed will be passed along.  
  Defaults to `true`.

- `options.structured` - If `true` then the function's result data will be wrapped with `{ error: … }` or `{ data: … }`, respectively.  
  Defaults to `false`.

- `options.this` - Value for `this` when executing runnables or `options.unusedResultHandler`.  

- `options.unusedResultHandler` - Callback for each runnable whose result was not returned by the function.  
  The callback will be called after the function returned and all runnables have completed. It will be called in the order of the runnables.

#### Example

Request multiple URLs concurrently and only wait for one request complete successfully.

```javascript
const any = require('co-flow').any;
const co = require('co');
const request = require('co-request');

co(function*() {
	try {
		// request all URLs concurrently and wait for one of them to complete successfully
		const result = yield any([
			request('https://raw.github.com/fluidsonic/co-flow/master/README.md'),
			request('https://raw.github.com/fluidsonic/co-flow/master/README.md'),
			request('https://rawgithub.com/fluidsonic/co-flow/master/README.md'),
			request('http://rawgithub.com/fluidsonic/co-flow/master/README.md')
		]);

		// output response of the first request which finished
		console.log('\n  ###### %s responded first:\n', result.request.uri.href);
		console.log('%s', result.body);
	}
	catch (e) {
		// all requests failed
		console.error('Cannot load README:', e);
	}
});
```

### wait (delay)

Pauses execution for the given delay - like `setTimeout` in generator style.

#### Parameters

- `delay` - Time in milliseconds before the function returns and execution continues.

#### Example

```javascript
const co = require('co');
const wait = require('co-flow').wait;

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
```



Installation
------------

	$ npm install co-flow



Requirements
------------

Node 0.11+, run with `--harmony` flag.



Testing
-------

	$ npm install
	$ npm test



License
-------

MIT
