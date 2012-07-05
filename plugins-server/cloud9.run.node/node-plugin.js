var NodeRunner = require("./node-runner");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;
var assert = require("assert");

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    var vfs = imports.vfs;
    var nodePath = options.nodePath || null;
    
    assert(options.listenHint, "Option 'listenHint' is required");

    NodeRunner.call(this, options.url, options.listenHint, vfs, pm, sandbox, false, nodePath, function (err) {
        if (err) return register(err);

        register(null, {
            "run-node": {
                Runner: NodeRunner.Runner
            }
        });
    });
};

(function() {

    this.name = "node";

    this.createChild = function(callback) {
        this.args = this.nodeArgs.concat(this.file, this.scriptArgs);
        ShellRunner.prototype.createChild.call(this, callback);
    };

}).call(NodeRunner.Runner.prototype);