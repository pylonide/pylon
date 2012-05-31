var spawn = require('child_process').spawn;
var pack = spawn('make', ['package']);

pack.stderr.setEncoding("utf8");

pack.stderr.on('data', function (data) {
  console.error(data);
});

pack.on('exit', function (code) {
  if (code !== 0) {
    console.error('pack process exited with code ' + code);
    process.exit(code);
  }
});
