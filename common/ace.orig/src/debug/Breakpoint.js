require.def("debug/Breakpoint", ["ace/ace"], function(ace) {

var Breakpoint = function(source, line, column) {
    this.source = source;
    this.line = line;
    this.column = column;

    this.enabled = true;
    this.condition = "";
    this.ignoreCount = 0;

    this.state = "initialized";
};

(function() {

    this.attach = function(dbg, callback) {
        if (this.state !== "initialized")
            throw new Error("Already attached");

        this.$dbg = dbg;
        this.state = "connecting";

        var self = this;
        this.$onbreak = function(e) {
            if (this.state !== "connected")
                return;

            if (ace.arrayIndexOf(e.data.breakpoints, self.$id) !== -1) {
                self.$dispatchEvent("break");
            }
        };
        dbg.addEventListener("break", this.$onbreak);

        dbg.setbreakpoint("script", self.source, self.line, self.column, self.enabled, self.condition, self.ignoreCount, function(body) {
            self.state = "connected";
            self.$id = body.breakpoint;
            self.line = body.line;
            callback(self);
        });
    };

    this.clear = function(callback) {
        if (this.state !== "connected")
            throw new Error("Not connected!");

        var self = this;
        this.$dbg.clearbreakpoint(this.$id, function() {
            this.$id = null;
            this.$dbg = null;
            this.state = "initialized";
            callback && callback(self);
        });
    };

    this.setEnabled = function(enabled) {
      this.enabled = enabled;
    };

    this.setCondition = function(condition) {
        this.condition = condition;
    };

    this.setIgnoreCount = function(ignoreCount) {
        this.ignoreCount = ignoreCount;
    };

    this.flush = function(callback) {
        if (this.state !== "connected") {
            throw new Error("Not connected");
        }
        this.$dbg.changeBreakpoint(this.$id, this.enabled, this.condition, this.ignoreCount, callback);
    };

}).call(Breakpoint.prototype);

return BreakPoint;

});