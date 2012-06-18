/**
 * Ajax.org Code Editor (ACE)
 *
 * @copyright 2010, Ajax.org Services B.V.
 * @license LGPLv3 <http://www.gnu.org/licenses/lgpl-3.0.txt>
 * @author Fabian Jakobs <fabian AT ajax DOT org>
 */

"use strict";

var EventEmitter = require("events").EventEmitter;

var Socket = module.exports = function(vfs, port) {
    EventEmitter.call(this);
    // connection status flag
    this.connected = false;
    // the number of left connect retries
    // TODO: retrieve retry count from configuration
    this.connectRetryCount = 30;
    // the amount of interval in msec between each retry
    // TODO: retrieve retry count from configuration
    this.connectRetryInterval = 50; // 50 msec
    // note: total time for retry: 50msc * 30 = 1.5 sec

    this.$vfs = vfs;
    this.$port = port;
};

require("util").inherits(Socket, EventEmitter);

(function() {

    this.receivedText = "";

    this.close = function() {
        this.$stream.end();
    };

    this.clearBuffer = function() { };

    this.send = function(msg) {
        //console.log("> sent to socket:\n", msg)
        this.$stream.write(msg, "utf8");
    };

    this.setMinReceiveSize = function(minSize) { };

    this.$onData = function(data) {
        this.receivedText = data;
        //console.log("> received from socket:\n", this.receivedText, this.receivedText.length)
        this.emit("data", this.receivedText);
    };

    this.connect = function() {
        //console.log("Connecting to: " + this.$port);
        var self = this;
        this.$vfs.connect(this.$port, { encoding: "utf8"}, function(err, meta) {
            if (err)
                return onEnd(err);

            self.$stream = meta.stream;

            self.$stream.addListener("data", function(data) {
                self.$onData(data);
            });

            self.$stream.addListener("end", onEnd);
            self.$stream.addListener("error", onError);

            self.$stream.addListener("connect", function () {
                // set connection flag to true (connected)
                self.connected = true;
                self.emit("connect");
            });

            function onEnd(errorInfo) {
                // set connection flag to false (not connected)
                errorInfo && console.error("connect error", errorInfo);

                self.connected = false;
                self.$stream && self.$stream.end();
                self.state = "initialized";
                self.emit("end", errorInfo);
            }

            function onError() {
                // if currently not connected and there re-tries left to perform
                if (!self.connected && self.connectRetryCount > 0) {
                    // decrease number of re-tries
                    self.connectRetryCount--;
                    // since the connection has failed the entire connection object is dead.
                    // close the existing connection object
                    self.$stream && self.$stream.end();
                    // sleep and afterward try to connect again
                    setTimeout(function() {
                        //console.log("retrying. " + ( connectRetryCount + 1 ) + " attempts left");
                        self.connect();
                    }, self.connectRetryInterval);
                }
                else {
                    // TODO: replace error message with exception instance.
                    onEnd("Could not connect to the debugger");
                }
            }
        });
    };

}).call(Socket.prototype);