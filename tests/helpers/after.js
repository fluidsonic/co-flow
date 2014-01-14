'use strict';


module.exports = function after(delay) {
	return {
		fail: function(error) {
			return function(callback) {
				setTimeout(callback.bind(undefined, error), delay);
			};
		},

		succeed: function(result) {
			return function(callback) {
				setTimeout(callback.bind(undefined, null, result), delay);
			};
		}
	};
};
