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
        // Escape args, we're going to join them
        this.args.map(function(a) {
            return "'" + a.replace("'", "\\'") + "'";
        });
        // killall apache httpd, then run it. we can't assume we can keep track of whether it's running
        this.args = [
            "-c",
            "(killall -u $USER httpd >/dev/null 2>/dev/null && sleep 1 && killall -9 httpd >/dev/null 2>/dev/null);" +
            this.command + " " + this.args.join(" ")
        ];
        this.command = "sh";
        ShellRunner.prototype.createChild.call(this, callback);
    };

}).call(ApacheRunner.Runner.prototype);