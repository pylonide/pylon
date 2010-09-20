require.def("debug/O3Socket", function() {

var O3Socket = function(ip, port, o3) {
    this.$socket = o3.socketTCP();
    this.$socket.packetSize = 8192;
    this.$ip = ip;
    this.$port = port;
};

(function() {

    this.state = "initialized";
    this.receivedText = "";

    // TODO use events
    this.onconnect = null;
    this.onreceive = null;

    this.close = function() {
        this.$socket.close();
    };

    this.clearBuffer = function() {
        this.$socket.clearBuf();
    };

    this.send = function(msg) {
//        console.log("> sent to socket:\n", msg)
        this.$socket.send(msg);
    };

    this.receive = function() {
        this.$socket.receive();
    };

    this.setMinReceiveSize = function(minSize) {
        this.$socket.minReceiveSize = minSize;
    };
    
    this.connect = function() {
        var socket = this.$socket;
        var self = this;
        socket.onconnect = function() {
            self.state = "connected";
            socket.receive();
            self.onconnect && self.onconnect();
            try {
                socket.onconnect = 0;
            } catch(e) {}
        };

        socket.onreceive = function() {
            self.receivedText = socket.receivedText;
//            console.log("> received from socket:\n", self.receivedText, self.receivedText.length)
            self.onreceive && self.onreceive();
        };
        this.$socket.connect(this.$ip, this.$port);
    };

}).call(O3Socket.prototype);

return O3Socket;

});