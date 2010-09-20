var DevToolMessageTest = new TestCase("DevToolMessageTest", {
    "test: parse message" : function() {
        var msgString = ["Destination:", "Tool:DevToolsService",
                "Content-Length:45", "",
                '{"command":"version","data":"0.1","result":0}'].join("\r\n");

        var msg = DevToolsMessage.fromString(msgString);

        var headers = msg.getHeaders();

        assertEquals("", headers["Destination"]);
        assertEquals("45", headers["Content-Length"]);
        assertEquals("DevToolsService", headers["Tool"]);

        assertEquals('{"command":"version","data":"0.1","result":0}', msg
                .getContent());
    },

    "test: stringify message" : function() {
        var msg = new DevToolsMessage();
        msg.setHeader("Destination", "");
        msg.setHeader("Tool", "DevToolsService");
        msg.setContent('{"command":"version","data":"0.1","result":0}');

        var msgString = ["Destination:", "Tool:DevToolsService",
                "Content-Length:45", "",
                '{"command":"version","data":"0.1","result":0}'].join("\r\n");

        assertEquals(msgString, msg.stringify());
    }
});