'use strict';


/**
 * Pauses execution for the given delay.
 * 
 * @param  {number} delay  Time to pause execution in milliseconds.
 */
module.exports = function wait(delay) {
	return function(callback) {
		setTimeout(callback, delay);
	};
};
