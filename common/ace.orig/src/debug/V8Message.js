require.def("debug/V8Message", ["ace/ace"], function(ace) {

var V8Message = function(type) {
    this.seq = V8Message.$seq++;
    this.type = type;
};

(function() {

    this.$msgKeys = [
        "seq",
        "type",
        "command",
        "arguments",
        "request_seq",
        "body",
        "running",
        "success",
        "message",
        "event"
    ];

    this.parse = function(msgString) {
        var json = JSON.parse(msgString);
        ace.mixin(this, json);
        return this;
    };

    this.stringify = function() {
        var tmp = {};
        for (var i=0; i<this.$msgKeys.length; i++) {
            var name = this.$msgKeys[i];
            if (this[name]) {
                tmp[name] = this[name];
            }
        }
        return JSON.stringify(tmp);
    };

}).call(V8Message.prototype);

V8Message.$seq = 1;

V8Message.fromString = function(msgString) {
    return new V8Message().parse(msgString);
};

V8Message.fromObject = function(obj) {
    var msg = new V8Message();
    ace.mixin(msg, obj);
    return msg;
};

return V8Message;

});