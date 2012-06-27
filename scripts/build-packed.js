var spawn = require('child_process').spawn;
var pack = spawn('make', ['package']);

pack.stderr.setEncoding("utf8");

pack.stderr.on('data', function (data) {
	if (data != "Failed to find module: core/ide") // we can ignore this from dryice
		console.error(data);
});

pack.on('exit', function (code) {
	if (code !== 0) {
		console.error('pack process exited with code ' + code);
		process.exit(code);
	}
});
