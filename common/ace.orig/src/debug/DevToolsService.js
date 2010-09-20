require.def("debug/DevToolsService", function() {
        
var DevToolsService = function(msgStream) {
    this.$msgStream = msgStream;
    this.$pending = [];

    var self = this;
    this.$msgStream.addEventListener("message", function(e) {
        var response = e.data;
        if (response.getHeaders()["Tool"] !== "DevToolsService") {
            return;
        }
        if (self.$pending.length) {
            self.$pending.shift()(JSON.parse(response.getContent()).data);
        }
    });
};

(function() {

    this.ping = function(callback) {
        this.$send("ping", callback);
    };

    this.getVersion = function(callback) {
        this.$send("version", callback);
    };

    this.listTabs = function(callback) {
        this.$send("list_tabs", callback);
    };

    this.$send = function(command, callback) {
        var msg = new DevToolsMessage(null, '{"command":"' + command + '"}');
        this.$msgStream.sendRequest(msg);
        this.$pending.push(callback);
    };

}).call(DevToolsService.prototype);

return DevToolsService;

});