var PythonRunner = require("./python-runner");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    var vfs = imports.vfs;

    PythonRunner.call(this, options.url, options.listenHint, vfs, pm, sandbox, function (err) {
        if (err) return register(err);

        register(null, {
            "run-python": {
                Runner: PythonRunner.Runner
            }
        });
    });
};

(function() {

    this.name = "python";

    this.createChild = function(callback) {
        this.args = this.pythonArgs.concat(this.file, this.scriptArgs);
        ShellRunner.prototype.createChild.call(this, callback);
    };


}).call(PythonRunner.Runner.prototype);