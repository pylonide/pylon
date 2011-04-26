/**
 * Debugger Factory Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var Plugin = require("cloud9/plugin"),
	sys    = require("sys");

var DebuggerFactory = module.exports = function(ide) {
    this.ide = ide;
    this.hooks = ["command"];
	this.name = "debugger";
};

sys.inherits(DebuggerFactory, Plugin);

DebuggerFactory.RUNTIMES = {
	"js": require("./node"),
	"py": require("./python")
};

(function() {
	
	this.$runners = {};
	
	this.getRuntime = function(runner) {
		return DebuggerFactory.RUNTIMES[runner || "js"];
	};

    this.command = function(user, message, client) {
		var runner = message.runner || "js";
		
		if(!this.$runners[runner]) {
			var DebuggerPlugin = this.getRuntime(runner);
			this.$runners[runner] = new DebuggerPlugin(this.ide);
		}
		
		return this.$runners[runner].command(user, message, client);
	};

}).call(DebuggerFactory.prototype);