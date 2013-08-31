
"use strict";

var util = require("util");
var Plugin = require("../cloud9.core/plugin");

var name = "terminal";
var tty = require('./tty.js');

module.exports = function setup(options, imports, register) {
    var conf, app;

    imports.ide.register(name, TerminalPlugin, register);

    var app = tty.createServer({
        shell: 'bash',
        port: 8000
    });

    app.listen();

    imports.log.info("I AM ALIIIIVE!");
};

var TerminalPlugin = function(ide, workspace) {

};

util.inherits(TerminalPlugin, Plugin);

(function() {

}).call(TerminalPlugin.prototype);