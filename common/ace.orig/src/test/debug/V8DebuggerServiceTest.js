var V8DebuggerServiceTest = new TestCase("V8DebuggerServiceTest", {

    setUp : function() {
        this.$msgStream = new MsgStreamMock();
        this.$service = new V8DebuggerService(this.$msgStream);
    },

    sendMessage : function(destination, content) {
        var headers = {
            Tool: "V8Debugger",
            Destination: destination
        };
        this.$msgStream.$send(headers, content);
    },

    "test: attach" : function() {
        var called = false;
        this.$service.attach(2, function() {
            called = true;
        });
        this.sendMessage(2, '{"command":"attach","result":0}');

        assertTrue(called);
    },

    "test: detach" : function() {
        var called = false;
        this.$service.detach(2, function() {
            called = true;
        });
        this.sendMessage(2, '{"command":"detach", "result":0}');

        assertTrue(called);
    },

    "test: debugger command" : function() {
        var called = false;
        var data = '{"seq":1,"type":"request","command":"version"}';
        this.$service.debuggerCommand(2, data);
        this.sendMessage(2, '{"command":"debugger_command","result":0,"data":{"seq":1,"request_seq":1,"type":"response","command":"version","success":true,"body":{"V8Version":"2.1.10.5"},"refs":[],"running":true}}');
        assertEquals('{"command":"debugger_command","data":{"seq":1,"type":"request","command":"version"}}', this.$msgStream.requests[0].getContent());
    },

    "test: evaluate javascript" : function() {
        this.$service.evaluateJavaScript(2, "javascript:void(0);");
        assertEquals('{"command":"evaluate_javascript","data":"javascript:void(0);"}', this.$msgStream.requests[0].getContent());
    }
});