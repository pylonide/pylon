var BaseRunner = require("./baseRunner").BaseRunner;

var term = require("../lib/terminal.js");

var NodeRunner = exports.NodeRunner = function() {
  this.init.apply(this, arguments);
};

NodeRunner.prototype = new BaseRunner();
NodeRunner.prototype._super = new BaseRunner();

NodeRunner.prototype.puts = function(s) { process.stderr.write(s + "\n"); };

NodeRunner.prototype.dumpSuccess = function(msg) {
  this.dumpResult("%gOK:   %n", msg);
};
NodeRunner.prototype.dumpSkip = function(msg) {
  this.dumpResult("%bSKIP: %n", msg);
};
NodeRunner.prototype.dumpFailure = function(msg) {
  this.dumpResult("%rFAIL: %n", msg);
};
NodeRunner.prototype.dumpError = function(msg) {
  this.dumpResult("%yERROR:%n", msg);
};
NodeRunner.prototype.dumpResult = function(status, message) {
  if(this.newGroup) {
    this.puts("\n - " + this.newGroup);
    this.newGroup = null;
  }
  this.puts("   " + term._colorize(status) + " " + message);
};


NodeRunner.prototype.report = function() {
  var summary = "--------------\n";
  summary += "Ran " + this.testCounter + " tests from " + this.testGroups.length + " files.\n";
  summary += term._colorize("%g" + this.numSuccess + " passed%n");
  if(this.numError > 0) {
    summary += term._colorize(", %y" + this.numError + " errors%n");
  }
  if(this.numFailure > 0) {
    summary += term._colorize(", %r" + this.numFailure + " failures%n");
  }
  summary += ".";
  this.puts(summary);
};

