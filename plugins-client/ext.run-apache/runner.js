/**
 * Console for the Cloud9 IDE
 *
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 * @contributor Sergi Mansilla <sergi AT c9 DOT io>
 */

define(function(require, exports, module) {

exports.Runner = function(options, callback) {
    var self = this;

    if (!options.sandbox) {
        return callback("No sandbox specified");
    }

    self.root = options.root;
    self.file = options.file || "";

    options.env = options.env || {};

    self.scriptArgs = options.args || [];
    self.apacheArgs = [];

    var url = options.url;
    self.apacheArgs.push(self.root);

    // a nice message for our users when we fire up the process
    var messageListener = function (msg) {
        // process dies? then we die as well
        if (msg.type === "apache-exit") {
            return options.eventEmitter.removeListener(options.eventName, messageListener);
        }

        if (msg.type === "apache-start") {
            var suffix = DIRECT_OPEN_FILES.test(self.file) ? "/" + self.file : "";
            var info = [
                "Your page is running at '" + url + suffix + "'."
            ];

            options.eventEmitter.emit(options.eventName, {
                type: "apache-data",
                stream: "stdout",
                data: info.join("\n"),
                extra: {tip: true},
                pid: msg.pid
            });
        }
    };
    options.eventEmitter.on(options.eventName, messageListener);

    options.cwd = options.cwd || options.root;
    options.command = "apache";

    ShellRunner.call(self, vfs, options, callback);
};
});