require.def("debug/ChromeDebugMessageStream", 
    ["ace/ace", "ace/MEventEmitter"], 
    function(ace, MEventEmitter) {

var ChromeDebugMessageStream = function(socket) {
    this.$socket = socket;
};

(function() {

    ace.implement(this, MEventEmitter);

    this.$received = "";

    this.connect = function() {
        var socket = this.$socket;
        var self = this;
        socket.onconnect = function() {
            self.$onconnect();
        };
        socket.onreceive = function() {
            self.$onhandshake();
        };
        socket.connect();
    };

    this.sendRequest = function(message) {
//        console.log("> Sent to Chrome:\n", message.stringify());
        this.$socket.send(message.stringify());
    };

    this.$onconnect = function() {
        this.$socket.send(this.MSG_HANDSHAKE);
    };

    this.$onhandshake = function() {
        this.$received += this.$socket.receivedText;
        this.$socket.clearBuffer();

        if (this.$received.length < this.MSG_HANDSHAKE.length)
            return;
        
        if (this.$received.indexOf(this.MSG_HANDSHAKE) !== 0) {
            this.$socket.onreceive = null;
            return this.$onerror();
        }

        this.$received = this.$received.substring(this.MSG_HANDSHAKE.length); 
        this.$socket.onreceive = null;
        this.$reader = new MessageReader(this.$socket, ace.bind(this.$onMessage, this));

        this.$dispatchEvent("connect");
    };

    this.$onMessage = function(messageText) {
        var self = this;
        setTimeout(function() {
//            console.log("> Received from Chrome:\n", messageText);
            var response = new DevToolsMessage.fromString(messageText);
            self.$dispatchEvent("message", {data: response});
        }, 0);
    };

    this.$onerror = function() {
        this.$dispatchEvent("error");
    };

    this.MSG_HANDSHAKE = "ChromeDevToolsHandshake\r\n";

}).call(ChromeDebugMessageStream.prototype);

return ChromeDebugMessageStream;

});