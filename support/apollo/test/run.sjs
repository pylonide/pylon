#!/usr/bin/env apollo

var path = require('path');
var fs   = require('fs');
var sys = require("sys");
var args = process.argv.slice(1);
var http = require("apollo:http");
var base = path.dirname(http.parseURL(module.id).relative);
var suite_dir = path.join(base, "suites");

var runOpts = {
  verbose: false
}
//TODO: proper optparse
var verboseIndex = args.indexOf("-v");
if(verboseIndex !== -1) {
  args.splice(verboseIndex, 1);
  runOpts.verbose = true;
}

var is_sjs_file = function(fname){
  return path.extname(fname) == ".sjs";
};

var path_to_test = function(fname) {
  return path.normalize(path.join(suite_dir, fname));
};

var test_files;
if(args.length > 0) {
  var cwd = process.cwd();
  test_files = args.map(function(arg) { return path.resolve(cwd, arg); });
} else {
  test_files = fs.readdirSync(suite_dir).filter(is_sjs_file).map(path_to_test).sort();
}

var NodeRunner = require("./runners/node").NodeRunner;

var runner = new NodeRunner(runOpts);

//TODO: could be runnable in-process with require, except rocket uses ARGV
var rocket_ctrl = require('./lib/rocket_ctrl');
var rocket_port = '7071'
var rocket_root = path.join(base, "..");
var rocket_base_url = 'http://localhost:' + rocket_port + '/test/';
require('./lib/testContext').setBaseURL(rocket_base_url);
var exitStatus = 2;

waitfor {
  if(!rocket_ctrl.is_running(rocket_port)) {
    rocket_ctrl.run(rocket_port, rocket_root);
  } else {
    sys.puts("using existing rocket instance on port " + rocket_port);
    // nothing to wait for
    hold();
  }
} or {
  rocket_ctrl.wait_until_running(rocket_port);

  //TODO: needs a sequantialMap operation (waitForAll does it in parallel, which breaks
  // filename-association because it uses global state).
  for(var i=0; i<test_files.length; i++) {
    runner.load(test_files[i]);
  }
  runner.run();
  runner.report();
  exitStatus = runner.success() ? 0 : 1;
}
process.exit(exitStatus);
