/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var net = require("net");
var sys = require("sys");

module.exports = DebugProxy = function(port) {
    process.EventEmitter.call(this);

    this.port = port;

    this.stream = new net.Stream();
    this.stream.setEncoding('utf8');

    this.received = "";
    this.connected = false;

    var _self = this;
    this.stream.addListener('data', function(data) {
        _self.onData(data);
    });

    this.stream.addListener('end', function (data) {
        _self.stream.end();
        this.connected = false;
        _self.emit("end");
    });
};

sys.inherits(DebugProxy, process.EventEmitter);

(function() {

    this.connect = function() {
        if (!this.connected)
            return this.stream.connect(this.port, "127.0.0.1");
    };

    this.send = function(msgJson) {
        if (!this.connected)
            return;

        var text = typeof msgJson === "string" ? msgJson : JSON.stringify(msgJson);
        var msg = ["Content-Length:", text.length, "\r\n\r\n", text].join("");
        this.stream.write(msg, 'utf8');
    };

    this.onData = function(data) {

        this.received += data;
        var fullResponse;
        while (fullResponse = this.checkForWholeMessage()) {

            if (!this.connected) {
                // discard first response
                this.connected = true;
                this.emit("connection");
            } else {
                var msgParts = fullResponse.split("\r\n\r\n");
                var headers = msgParts[0];
                var body = JSON.parse(msgParts[1] || "{}");
                this.emit("message", body, headers);
            }
        }
    };

    this.checkForWholeMessage = function() {
        var i, c, l;
        var responseLength;
        var fullResponse = false;

        if ((i = this.received.indexOf('\r\n\r\n')) != -1) {
            if ((c = this.received.indexOf('Content-Length:')) != -1) {
                l = this.received.substring(c + 15);
                l = l.substring(0, l.indexOf('\r\n'));
                responseLength = i + 4 + parseInt(l, 10);
                if (responseLength <= this.received.length) {
                    fullResponse = this.received.substring(0, responseLength);
                    this.received = this.received.substring(responseLength);
                }
            }
        }
        return fullResponse;
    };

}).call(DebugProxy.prototype);