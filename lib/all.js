'use strict';

const executeRunnables = require('./helpers/executeRunnables');
const wrapResult = require('./helpers/wrapResult');


/**
 * Executes all runnables and waits for all of them to complete.
 * 
 * @param  {*[]}               runnables                           An array of runnables to be executed. A runnable is anything you can yield in `co`.
 * @param  {(boolean|number)}  [options.concurrency=true]          Specifies the maximum number of runnables which will be executed concurrently (similar to tasks in a thread pool).
 *                                                                 `true` executes all runnables in parallel and `false` is like `1` and runs all runnables serially in order.
 * @param  {boolean}           [options.failsWhenAnyFailed=true]   If `true` then the function will fail if any runnable failed.
 *                                                                 The error of the first runnable which failed will be passed along.
 * @param  {boolean}           [options.failsWhenAllFailed=false]  If `true` then the function will fail if all runnables failed.
 *                                                                 The error of the first runnable which failed will be passed along.
 * @param  {boolean}           [options.structured=false]          If `true` then the function's result data will be wrapped with `{ error: … }` or `{ data: … }`, respectively.
 * @param  {*}                 [options.this]                      Value for `this` when executing runnables or `options.unusedResultHandler`.
 * @param  {function}          [options.unusedResultHandler]       Callback for each runnable whose result was not returned by the function (due to `options.failsWhenAnyFailed` or `options.failsWhenAllFailed`).
 *                                                                 The callback will be called after the function returned and in the order of the runnables.
 * 
 * @return {*[]}  Returns an array with the result of each runnable, in the same order.
 *                If `options.failsWhenAnyFailed` is `false` then the returned array will also contain errors for each runnable which failed.
 *                Returns an empty array if `runnables` evaluates to `false` or is an empty array.
 */
module.exports = function all(runnables, options) {
	options = options || {};
	if (!options.hasOwnProperty('concurrency')) {
		options.concurrency = true;
	}
	if (!options.hasOwnProperty('failsWhenAnyFailed')) {
		options.failsWhenAnyFailed = true;
	}

	return function(callback) {
		let anyRunnableFailed = false;
		let anyRunnableSucceeded = false;
		let firstError;
		let results;
		let runnableIndexOfFirstError;

		if (!runnables || !runnables.length) {
			results = [];
			return complete();
		}

		let remainingCount = runnables.length;
		results = new Array(runnables.length);

		executeRunnables(runnables, {
			concurrency:   options.concurrency,
			resultHandler: onRunnableCompleted,
			this:          options.this
		});

		function complete() {
			if (anyRunnableFailed) {
				if (options.failsWhenAnyFailed || (options.failsWhenAllFailed && !anyRunnableSucceeded)) {
					callback(firstError);
					handleUnusedResults(runnableIndexOfFirstError);

					return;
				}
			}

			if (!options.structured) {
				results = results.map(function(result) {
					return (result.error || result.data);
				});
			}

			callback(null, results);
		}


		function handleUnusedResults(excludedIndex) {
			const handler = options.unusedResultHandler;
			if (!handler) {
				return;
			}

			let index = 0;
			results.forEach(function iterator(result) {
				if (index !== excludedIndex) {
					try {
						handler.call(options.this, result.error, result.data);
					}
					catch (e) {
						console.error('Calling unusedResultHandler resulted in an error:', e.stack);
					}
				}

				++index;
			});
		}


		function onRunnableCompleted(index, error, data) {
			// wrap multiple data arguments in an array
			if (arguments.length > 3) {
				data = Array.prototype.slice.call(arguments, 2);
			}

			results[index] = wrapResult(error, data);

			if (error) {
				if (!anyRunnableFailed) {
					anyRunnableFailed = true;
					firstError = error;
					runnableIndexOfFirstError = index;
				}
			}
			else {
				anyRunnableSucceeded = true;
			}

			--remainingCount;
			if (!remainingCount) {
				complete();
			}
		}
	};
};
