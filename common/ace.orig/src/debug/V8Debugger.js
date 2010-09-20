require.def("debug/V8Debugger", 
    ["ace/ace", "ace/MEventEmitter"], 
    function(ace, MEventEmitter) {
        
var V8Debugger = function(tabId, v8service) {
    this.tabId = tabId;
    this.$running = true;
    this.$service = v8service;

    var pending = this.$pending = [];

    var self = this;
    this.$service.addEventListener("debugger_command_" + tabId, function(e) {
        var response = V8Message.fromObject(e.data);

        var requestSeq = response.request_seq;
        if (pending[requestSeq]) {
            pending[requestSeq](response.body, response.refs || null);
            delete pending[requestSeq];
        }
        else if (response.event) {
            self.$dispatchEvent(response.event, {data: response.body});
        }

        self.$updateRunning(response);
     });
};

(function() {

    ace.implement(this, MEventEmitter);

    this.$seq = 0;

    this.$updateRunning = function(response) {
        
        // workaround for V8 bug
        // http://code.google.com/p/v8/issues/detail?id=724
        if (response.event == "scriptCollected")
            return;
        
        var running = true;
        if (response.type == "response") {
            var running = response.running;
        } else if (response.type == "event") {
            if (response.event == "break" || response.event == "exception") {
                running = false;
            }
        }

        if (running !== this.$running) {
            this.$running = running;
            this.$dispatchEvent("changeRunning", {data: running});
        }
    };

    this.isRunning = function() {
        return this.$running;
    };

    this.continueScript = function(stepaction, stepcount, callback) {
        var msg = new V8Message("request");
        msg.command = "continue";
        if (stepaction) {
            msg.arguments = {
                stepcount: stepcount || 1,
                stepaction: stepaction
            };
        }
        this.$send(msg, callback);
    };

    this.lookup = function(handles, includeSource, callback) {
        var msg = new V8Message("request");
        msg.command = "lookup";
        msg.arguments = {
            inlineRefs: false,
            handles: handles
        };
        if (includeSource)
            msg.arguments.includesSource = includeSource;

        this.$send(msg, callback);
    };

    this.backtrace = function(fromFrame, toFrame, bottom, inlineRefs, callback) {
        var msg = new V8Message("request");
        msg.command = "backtrace";
        msg.arguments = {
                inlineRefs: !!inlineRefs
        };
        if (fromFrame)
            msg.arguments.fromFrame = fromFrame;

        if (toFrame)
            msg.arguments.toFrame = toFrame;

        if (typeof(bottom) == "boolean")
            msg.arguments.bottom = bottom;

        this.$send(msg, callback);
    };

    this.scope = function(number, frameNumber, inlineRefs, callback) {
        var msg = new V8Message("request");
        msg.command = "scope";
        msg.arguments = {
            number: number,
            inlineRefs: !!inlineRefs
        };

        if (typeof frameNumber == "number")
            msg.arguments.frameNumber = frameNumber;

        this.$send(msg, callback);
    };

    this.version = function(callback) {
        var msg = new V8Message("request");
        msg.command = "version";
        this.$send(msg, callback);
    };

    this.scripts = function(types, ids, includeSource, callback) {
        var msg = new V8Message("request");
        msg.command = "scripts";
        msg.arguments = {
            types: types || V8Debugger.NORMAL_SCRIPTS,
            includeSource: !!includeSource
        };
        if (ids) {
            msg.arguments.ids = ids;
        }
        this.$send(msg, callback);
    };

    this.setbreakpoint = function(type, target, line, column, enabled, condition, ignoreCount, callback) {
        var msg = new V8Message("request");
        msg.command = "setbreakpoint";
        msg.arguments = {
            type: type,
            target: target,
            line: line,
            enabled: enabled === undefined ? enabled : true
        };

        if (column)
            msg.column = column;

        if (condition)
            msg.condition = condition;

        if (ignoreCount)
            msg.ignoreCount = ignoreCount;

        this.$send(msg, callback);
    };

    this.changebreakpoint = function(breakpoint, enabled, condition, ignoreCount, callback) {
        var msg = new V8Message("request");
        msg.command = "changebreakpoint";
        msg.arguments = {
            enabled: enabled !== true ? false : true,
            breakpoint: breakpoint
        };

        if (condition)
            msg.condition = condition;

        if (ignoreCount)
            msg.ignoreCount = ignoreCount;

        this.$send(msg, callback);
    };

    this.clearbreakpoint = function(breakpoint, callback) {
        var msg = new V8Message("request");
        msg.command = "clearbreakpoint";
        msg.arguments = {
            breakpoint: breakpoint
        };
        this.$send(msg, callback);
    };

    this.suspend = function(callback) {
        var msg = new V8Message("request");
        msg.command = "suspend";
        this.$send(msg, callback);
    };

    this.$send = function(msg, callback) {
        this.$pending[msg.seq] = callback;
        this.$service.debuggerCommand(this.tabId, msg.stringify());
    };

}).call(V8Debugger.prototype);

V8Debugger.NATIVE_SCRIPTS = 1;
V8Debugger.EXTENSION_SCRIPTS = 2;
V8Debugger.NORMAL_SCRIPTS = 4;

return V8Debugger;

});