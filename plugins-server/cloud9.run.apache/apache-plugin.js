var ApacheRunner = require("./apache-runner");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;
    
    ApacheRunner.call(this, options.url, imports.vfs, pm, sandbox, false, function (err) {
        if (err) return register(err);
        
        register(null, {
            "run-apache": {
                Runner: ApacheRunner.Runner
            }
        });
    });
};

(function() {

    this.name = "apache";

    this.createChild = function(callback) {
        this.args = (this.apacheArgs || []).concat(this.file, this.scriptArgs);
        ShellRunner.prototype.createChild.call(this, callback);
    };

}).call(ApacheRunner.Runner.prototype);