var PhpRunner = require("./php-runner");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    var vfs = imports.vfs;

    PhpRunner.call(this, options.url, vfs, pm, sandbox, function (err) {
        if (err) return register(err);

        register(null, {
            "run-php": {
                Runner: PhpRunner.Runner
            }
        });
    });
};

(function() {

    this.name = "php";

    this.createChild = function(callback) {
        this.args = (this.phpArgs || []).concat(this.file, this.scriptArgs);
        ShellRunner.prototype.createChild.call(this, callback);
    };

}).call(PhpRunner.Runner.prototype);