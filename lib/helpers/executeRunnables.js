'use strict';

const co = require('co');


module.exports = function executeRunnables(runnables, options) {
	if (!runnables || !runnables.length) {
		return;
	}

	const context = options.this;
	const concurrency = options.concurrency || 1;
	const resultHandler = options.resultHandler;

	if (concurrency === 1) {
		return executeRunnablesSerially(runnables, context, resultHandler);
	}

	if (concurrency === true || runnables.count <= concurrency) {
		return executeRunnablesParallel(runnables, context, resultHandler);
	}

	return executeRunnablesThreaded(runnables, context, resultHandler, concurrency);
};


function executeRunnablesParallel(runnables, context, resultHandler) {
	let index = 0;
	runnables.forEach(function(runnable) {
		co(function*() {
			return yield runnable;
		}).call(context, resultHandler.bind(null, index));

		++index;
	});
}


function executeRunnablesSerially(runnables, context, resultHandler) {
	const count = runnables.length;

	co(function*() {
		for (let index = 0; index < count; ++index) {
			try {
				resultHandler(index, null, yield runnables[index]);
			}
			catch (error) {
				resultHandler(index, error);
			}
		}
	}).call(context);
}


function executeRunnablesThreaded(runnables, context, resultHandler, threadCount) {
	let nextIndexToRun = 0;
	function* threadFunction() {
		while (nextIndexToRun < runnables.length) {
			const index = nextIndexToRun++;
			const runnable = runnables[index];

			try {
				resultHandler(index, null, yield runnable);
			}
			catch (error) {
				resultHandler(index, error);
			}
		}
	}

	for (let thread = 1; thread <= threadCount; ++thread) {
		co(threadFunction).call(context);
	}
}
