
const ASSERT = require("assert");
const PATH = require("path");
const SPAWN = require("child_process").spawn;
const ERROR = require("sourcemint-platform-nodejs/node_modules/sourcemint-util-js/lib/error");
const TERM = require("sourcemint-platform-nodejs/node_modules/sourcemint-util-js/lib/term");
const SERVER = require("../server");


function main(callback) {

	SERVER.main({
        configName: "default",
        args: []
    }, function(err, server, config) {
		if (err) return callback(err);

		server.once("close", function() {
			// All Done.
			callback(null);
		});

		// Wait for IDE to initialize.
		setTimeout(function() {

			var port = false;
          	config.forEach(function(plugin) {
          	    if (plugin.packagePath && /connect-architect\/connect\/[^\/]+$/.test(plugin.packagePath)) {
          	    	port = plugin.port;
                }
          	});

          	ASSERT(port !== false, "Could not determine `port` from config!");

			runPhantomTest(PATH.join(__dirname, "..", "test", "ui", "complete.js"), {
				args: [
					port
				]
			}, function(err) {
				if (err) return callback(err);

				console.log("Closing server.");
				// TODO: Force server to close even if websocket connection is open.
				server.close();
			});

		}, 200);
	});
}

function runPhantomTest(path, options, callback) {
	options = options || {};
    console.log("Start Phantomjs test: " + [path].concat(options.args || []).join(" "));
	var proc = SPAWN("phantomjs", [path].concat(options.args || []));
	proc.stderr.setEncoding("utf8");
	var lastStderr = false;
	proc.stdout.on("data", function (data) {		
	    process.stdout.write(data);
	    lastStderr = data.toString();
	});
	proc.stderr.on("data", function (data) {
	    TERM.stderr.write("\0red(" + data.toString() + "\0)");
	});
	proc.on("exit", function (code) {
	    if (code !== 0) {
	        return callback(new Error("Phantom test process exited with code: " + code));
	    }
	    else if (lastStderr && /ERROR\n?$/.test(lastStderr)) {
	        return callback(new Error("Phantom test process exited with error"));
	    }
	    console.log("Phantomjs tests ended.");
	    callback(null);
	});
}


if (require.main === module) {
	main(function(err) {
		if (err) {
			ERROR.exitProcessWithError(err);
			return;
		}
		TERM.stdout.writenl("\0bold(DONE\0)");
		// TODO: Figure out why process does not exit and remove `process.exit(0)` below.
		process.exit(0);
	});
}
