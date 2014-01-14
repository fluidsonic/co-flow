'use strict';

const any = require('../lib/any');
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
})();
