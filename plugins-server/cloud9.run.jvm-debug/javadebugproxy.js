/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var util = require("util");
var VfsSocket = require("../cloud9.run.node-debug/vfs_socket");
var StandaloneV8DebuggerService = require("v8debug").StandaloneV8DebuggerService;

var DebugProxy = module.exports = function(vfs, port, options) {

    process.EventEmitter.call(this);
    var _self = this;

    this.connected = false;

    var socket = this.socket = new VfsSocket(vfs, port);
    socket.on("connect", function initRequest() {
        _self.send({
            seq: 0,
            type: 'request',
            command: 'init',
            arguments: {
                address:  { port: options.port },
                sourcepath: options.sourcepath
            }
        });
        socket.removeListener("connect", initRequest);
    });
    socket.on("end", function(errorInfo) {
        _self.connected = false;
        _self.emit("end", errorInfo);
    });

    var service = this.service = new StandaloneV8DebuggerService(socket);

    service.addEventListener("connect", function() {
        _self.connected = true;
        _self.emit("connection");
    });

    service.addEventListener("debugger_command_0", function(msg) {
        _self.emit("message", msg.data);
    });
};

util.inherits(DebugProxy, process.EventEmitter);

(function() {

    this.connect = function() {
        this.service.attach(0, function() {});
    };

    this.send = function(msgJson) {
        this.service.debuggerCommand(0, JSON.stringify(msgJson));
    };

}).call(DebugProxy.prototype);