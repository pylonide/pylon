var RubyRunner = require("./ruby-runner");
var ShellRunner = require("../cloud9.run.shell/shell").Runner;

module.exports = function setup(options, imports, register) {
    var pm = imports["process-manager"];
    var sandbox = imports.sandbox;

    RubyRunner.call(this, options.url, options.listenHint, imports.vfs, pm, sandbox, false, function (err) {
        if (err) return register(err);
        
        register(null, {
            "run-ruby": {
                Runner: RubyRunner.Runner
            }
        });
    });
};

(function() {

    this.name = "ruby";

    this.createChild = function(callback) {
        this.args = this.rubyArgs.concat(this.file, this.scriptArgs);
        ShellRunner.prototype.createChild.call(this, callback);
    };

}).call(RubyRunner.Runner.prototype);