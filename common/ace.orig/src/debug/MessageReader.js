require.def("debug/MessageReader", ["ace/ace"], function(ace) {

var MessageReader = function(socket, callback) {
    this.$socket = socket;
    this.$callback = callback;

    this.$received = "";
    socket.onreceive = ace.bind(this.$onreceive, this);
};

(function() {

    this.$onreceive = function() {
        var lastChunk = this.$socket.receivedText;
        this.$socket.clearBuffer();
        this.$received += lastChunk;

        while (fullResponse = this.$checkForWholeMessage()) {
            this.$callback(fullResponse);
        }
    };

    this.$checkForWholeMessage = function() {
        var i, c, l;
        var responseLength;
        var fullResponse = false;
        var received = this.$received;

        if ((i = received.indexOf('\r\n\r\n')) != -1) {
            if ((c = received.indexOf('Content-Length:')) != -1) {
                l = received.substring(c + 15);
                l = l.substring(0, l.indexOf('\r\n'));
                responseLength = i + 4 + parseInt(l, 10);
                if (responseLength <= received.length) {
                    fullResponse = received.substring(0, responseLength);
                    this.$received = received.substring(responseLength);
                    this.$socket.setMinReceiveSize(0);
                } else {
                    this.$socket.setMinReceiveSize(responseLength - received.length);
                }
            }
        }
        return fullResponse;
    };

}).call(MessageReader.prototype);

return MessageReader;

});