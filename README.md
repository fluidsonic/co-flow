co-flow
=======

Flexible execution flow addons (all, any, wait) for [co](https://github.com/visionmedia/co).



Usage
--------

### all(runnables, [options])

#### Example

```javascript
const all = require('co-flow').all;
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
```

### any(runnables, [options])

#### Example

```javascript
const any = require('co-flow').any;
const co = require('co');
const request = require('co-request');


co(function*() {
	try {
		// request all URLs in parallel and wait for one of them to complete successfully
		const result = yield any([
			request('https://raw.github.com/fluidsonic/co-flow/master/README.md'),
			request('https://raw.github.com/fluidsonic/co-flow/master/README.md'),
			request('https://rawgithub.com/fluidsonic/co-flow/master/README.md'),
			request('http://rawgithub.com/fluidsonic/co-flow/master/README.md')
		]);

		console.log('\n  ###### %s responded first:\n', result.request.uri.href);
		console.log('%s', result.body);
	}
	catch (e) {
		// all requests failed
		console.error('Cannot load README:', e);
		return;
	}
})();
```

### wait(delay)

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
})();
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
