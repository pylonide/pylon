
"use strict";

var util = require("util");
var Plugin = require("../cloud9.core/plugin");

var name = "terminal";
var tty = require('./tty.js');

module.exports = function setup(options, imports, register) {
    var conf, app;

    // We are registering only for boot-time information presence
    imports.ide.register(name, TerminalPlugin, register);

    var server = imports.http.getServer();

    var app = tty.createServer({
        termName: 'xterm-color',
        shell: 'bash',
        server: server,
        localOnly: true,
        syncSession: true,
        sessionTimeout: 3600 // in seconds
    });

    imports.log.info("[tty.js] Cloud9 terminal started, serving requests on port: %s".green, server.address().port);

};

var TerminalPlugin = function(ide, workspace) {

};

util.inherits(TerminalPlugin, Plugin);