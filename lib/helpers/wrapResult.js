'use strict';


module.exports = function wrapResult(error, data) {
	return error ? { error: error } : { data: data };
};
