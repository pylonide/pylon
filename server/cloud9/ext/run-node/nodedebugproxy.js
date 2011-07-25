/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var net = require("net");
var sys = require("sys");
var NodeSocket = require("v8debug/NodeSocket");
var StandaloneV8DebuggerService = require("v8debug/StandaloneV8DebuggerService");

module.exports = DebugProxy = function(port) {
    process.EventEmitter.call(this);
    var _self = this;

    this.connected = false;

    var socket = new NodeSocket("localhost", port);
    socket.on("end", function(errorInfo) {
        _self.connected = false;
        _self.emit("end", errorInfo);
    });
    this.service = new StandaloneV8DebuggerService(socket);

    this.service.addEventListener("connect", function() {
        _self.connected = true;
        _self.emit("connection");
    });
    this.service.addEventListener("debugger_command_0", function(msg) {
        //console.log("REC ", msg.data);
        _self.emit("message", msg.data);
    });
};

sys.inherits(DebugProxy, process.EventEmitter);

(function() {

    this.connect = function() {
        this.service.attach(0, function() {});
    };

    this.send = function(msgJson) {
        //console.log("SEND " + JSON.stringify(msgJson))
        this.service.debuggerCommand(0, JSON.stringify(msgJson));
    };

}).call(DebugProxy.prototype);