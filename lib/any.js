'use strict';

const executeRunnables = require('./helpers/executeRunnables');
const wrapResult = require('./helpers/wrapResult');


/**
 * Executes all runnables and returns the result data of the first function which completes successfully.
 * A result will be returned as soon as possible (depends on `options.failsWhenAnyFailed`).
 * 
 * @param  {*[]}               runnables                           An array of runnables to be executed. A runnable is anything you can yield in `co`.
 * @param  {(boolean|number)}  [options.concurrency=true]          Specifies the maximum number of runnables which will be executed concurrently (similar to tasks in a thread pool).
 *                                                                 `true` executes all runnables in parallel and `false` is like `1` and runs all runnables serially in order.
 * @param  {boolean}           [options.failsWhenAnyFailed=false]  If `true` then the function will fail as soon as any runnable failed.
 *                                                                 As a consequence a successful completion of the function will be delayed until all runnables have completed.
 *                                                                 The error of the first runnable which failed will be passed along.
 * @param  {boolean}           [options.failsWhenAllFailed=true]   If `true` then the function will fail if all runnables failed (instead of returning the error as result data).
 *                                                                 The error of the first runnable which failed will be passed along.
 * @param  {boolean}           [options.structured=false]          If `true` then the function's result data will be wrapped with `{ error: … }` or `{ data: … }`, respectively.
 * @param  {*}                 [options.this]                      Value for `this` when executing runnables or the `unusedResultHandler`.
 * @param  {function}          [options.unusedResultHandler]       Callback for each runnable whose result was not returned by the function.
 *                                                                 The callback will be called after the function returned and all runnables have completed. It will be called in the order of the runnables.
 * 
 * @return {*}  Returns the result data of the first runnable which completes successfully or else the error of the first runnable which failed if `options.failsWhen(Any/All)Failed` are both `false`.
 *              Returns the result data `undefined` if `runnables` evaluates to `false` or is an empty array.
 */
module.exports = function any(runnables, options) {
	options = options || {};
	if (!options.hasOwnProperty('concurrency')) {
		options.concurrency = true;
	}
	if (!options.hasOwnProperty('failsWhenAllFailed')) {
		options.failsWhenAllFailed = true;
	}

	return function(callback) {
		let completed = false;
		let firstError;
		let firstData;
		let runnableIndexOfFirstError = null;
		let runnableIndexOfFirstData = null;
		let unusedResults;

		if (!runnables || !runnables.length) {
			return complete();
		}

		let remainingCount = runnables.length;
		unusedResults = new Array(runnables.length);

		executeRunnables(runnables, {
			concurrency:   options.concurrency,
			resultHandler: onRunnableCompleted,
			this:          options.this
		});

		function complete() {
			if (completed) {
				return;
			}

			completed = true;

			const hasError = runnableIndexOfFirstError !== null;
			const hasData = runnableIndexOfFirstData !== null;

			if (hasError) {
				if (options.failsWhenAnyFailed || (options.failsWhenAllFailed && !hasData)) {
					unusedResults[runnableIndexOfFirstError] = null;
					return callback(firstError);
				}
			}

			let data;
			let error;
			let result;

			if (hasData) {
				result = data = firstData;
				unusedResults[runnableIndexOfFirstData] = null;
			}
			else if (hasError) {
				result = error = firstError;
				unusedResults[runnableIndexOfFirstError] = null;
			}

			if (options.structured) {
				result = wrapResult(error, data);
			}

			callback(null, result);
		}


		function handleUnusedResults() {
			const handler = options.unusedResultHandler;
			if (!handler) {
				return;
			}

			unusedResults.forEach(function iterator(result) {
				if (result) {
					try {
						handler.call(options.this, result.error, result.data);
					}
					catch (e) {
						console.error('Calling unusedResultHandler resulted in an error:', e.stack);
					}
				}
			});
		}


		function onRunnableCompleted(index, error, data) {
			// wrap multiple data arguments in an array
			if (arguments.length > 3) {
				data = Array.prototype.slice.call(arguments, 2);
			}

			let result = wrapResult(error, data);
			unusedResults[index] = result;  // set early - may be reverted in complete()

			if (error) {
				if (runnableIndexOfFirstError === null) {
					runnableIndexOfFirstError = index;
					firstError = error;

					if (options.failsWhenAnyFailed) {
						complete();
					}
				}
			}
			else {
				if (runnableIndexOfFirstData === null) {
					runnableIndexOfFirstData = index;
					firstData = data;

					if (!options.failsWhenAnyFailed) {
						complete();
					}
				}
			}

			--remainingCount;
			if (!remainingCount) {
				complete();
				handleUnusedResults();
			}
		}
	};
};
