/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var net = require("net");
var sys = require("sys");
var NodeSocket = require("v8debug/NodeSocket");
var ChromeDebugMessageStream = require("v8debug/ChromeDebugMessageStream");
var DevToolsMessage = require("v8debug/DevToolsMessage");


module.exports = DebugProxy = function(port) {
    process.EventEmitter.call(this);
    var _self = this;

    this.connected = false;

    var socket = new NodeSocket("127.0.0.1", port);
    socket.on("end", function() {
        this.connected = false;
        _self.emit("end");
    });

    this.stream = new ChromeDebugMessageStream(socket);

    this.stream.addEventListener("connect", function(msg) {
        _self.connected = true;
        _self.emit("connection");
    });

    this.stream.addEventListener("message", function(msg) {
        _self.emit("message", msg.data.getContent());
    });
};

sys.inherits(DebugProxy, process.EventEmitter);

(function() {

    this.connect = function() {
        this.stream.connect();
    };

    this.send = function(msgJson) {
        this.service.sendRequest(DevToolsMessage.fromString(JSON.stringify(msgJson)));
    };

}).call(DebugProxy.prototype);