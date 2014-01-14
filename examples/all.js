'use strict';

const all = require('../lib/all');
const co = require('co');
const request = require('co-request');


co(function*() {
	try {
		// request all URLs in parallel and wait for all of them to complete
		const results = yield all([
			request('https://raw.github.com/fluidsonic/co-flow/master/README.md'),
			request('https://raw.github.com/fluidsonic/co-flow/master/index.js'),
			request('https://raw.github.com/fluidsonic/co-flow/master/package.json')
		]);

		results.forEach(function(result) {
			console.log('\n  ###### %s responded:\n', result.request.uri.href);
			console.log('%s', result.body);
		});
	}
	catch (e) {
		// any request failed
		console.error('Cannot load request:', e);
		return;
	}
})();
