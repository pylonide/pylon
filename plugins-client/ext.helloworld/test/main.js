
define(function(require, exports, module) {

	exports.main = function(callback) {

		if (window.helloWorldPlugin !== true) {
			return callback(new Error("`window.helloWorldPlugin !== true`"));
		}
		callback(null);
	}

});
