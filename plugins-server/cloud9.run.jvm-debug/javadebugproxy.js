/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var sys = require("sys");
var NodeSocket = require("v8debug").NodeSocket;
var StandaloneV8DebuggerService = require("v8debug").StandaloneV8DebuggerService;
var MessageReader = require("v8debug").MessageReader;

var DebugProxy = module.exports = function(port, options) {

    process.EventEmitter.call(this);
    var _self = this;

    this.connected = false;

    var socket = this.socket = new NodeSocket("localhost", port);
    socket.on("connect", function (argument) {
        _self.send({
            seq: 0,
            type: 'request',
            command: 'init',
            arguments: {
                address:  { port: options.port },
                sourcepath: options.sourcepath
            }
        });
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

sys.inherits(DebugProxy, process.EventEmitter);

(function() {

    this.connect = function() {
        this.service.attach(0, function() {});
    };

    this.send = function(msgJson) {
        this.service.debuggerCommand(0, JSON.stringify(msgJson));
    };

}).call(DebugProxy.prototype);