require.def("debug/DevToolsMessage", function() {

var DevToolsMessage = function(headers, content) {
    this.$headers = {};
    this.$content = "";

    if (headers) {
        this.$headers = headers;
    }

    if (content) {
        this.setContent(content);
    }
};

(function() {

    this.setContent = function(content) {
        this.$content = content.toString();
    };

    this.getContent = function() {
        return this.$content;
    };

    this.setHeader = function(name, value) {
        this.$headers[name] = value;
    };

    this.parse = function(msgString) {
        var headers = this.$headers = {};
        var responseParts = msgString.split("\r\n\r\n");

        var headerText = responseParts[0];
        this.$content = responseParts[1];

        var re = /([\w\-\d]+):([\w\-\d]*)(\r\n|$)/g;
        headerText.replace(re, function(str, key, value) {
            headers[key] = value;
        });

        return this;
    };

    this.stringify = function() {
        var headers = this.getHeaders();

        var str = [];
        for ( var name in headers) {
            str.push(name, ":", headers[name], "\r\n");
        }
        if (this.$content) {
            str.push("\r\n", this.$content);
        }
        return str.join("");
    };

    this.getHeaders = function() {
        this.$headers["Content-Length"] = this.$content.length;
        this.$headers["Tool"] = this.$headers["Tool"] || "DevToolsService";

        return this.$headers;
    };

}).call(DevToolsMessage.prototype);

DevToolsMessage.fromString = function(msgString) {
    return new DevToolsMessage().parse(msgString);
};

return DevToolsMessage;

});