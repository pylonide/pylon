var MsgStreamMock = function() {

    ace.implement(this, ace.MEventEmitter);

    var self = this;
    this.requests = [];
    this.sendRequest = function(message) {
        self.requests.push(message);
    };

    this.$send = function(headers, content) {
        var msg = new DevToolsMessage(headers, content);
        this.$dispatchEvent("message", {data: msg});
    };
};