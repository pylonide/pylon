var sys = require('sys');
var http = require('apollo:http');
var common = require("apollo:common");

var is_running = exports.is_running = function(port) {
  var base_url = 'http://localhost:' + port + '/';
  try {
    http.get(base_url);
    return true;
  } catch (e) {
    if(e.toString().indexOf('ECONNREFUSED') == -1) {
      // this is not the error we expected!
      throw(e);
    }
    return false;
  }
};

var run = exports.run = function(port, basedir) {
  var child_process = require("apollo:node-child-process");
  try {
    child_process.run(basedir + "/rocket", ['--port', port], {
      cwd: basedir,
      customFds: [-1, -1, 2]
    });
  } catch(e) {
    throw new Error(common.supplant(
      "Rocket died: {message}\nstdout:{stdout}\nstderr:{stderr}", e));
  }
  throw new Error("Rocket complete (it should have run forever...");
};

var wait_until_running = exports.wait_until_running = function(port) {
  waitfor {
    while(!is_running(port)) {
      hold(100);
    }
  } or {
    hold(2000);
    sys.puts("waiting for rocket startup on port " + port);
    hold();
  }
};

