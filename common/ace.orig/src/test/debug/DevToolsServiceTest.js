var DevToolsServiceTest = new TestCase("DevToolsServiceTest", {

    setUp : function() {
        this.$msgStream = new MsgStreamMock();
        this.$service = new DevToolsService(this.$msgStream);
    },

    sendMessage : function(content) {
        this.$msgStream.$send(null, content);
    },

    "test: ping" : function() {
        var called = false;
        this.$service.ping(function() {
            called = true;
        });
        this.sendMessage('{"command":"ping", "result":0, "data":"ok"}');

        assertTrue(called);
    },

    "test: getVersion" : function() {
        var called = false;
        this.$service.getVersion(function(version) {
            called = true;
            assertEquals("0.1", version);
        });
        this.sendMessage('{"command":"version","data":"0.1","result":0}');

        assertTrue(called);
    },

    "test: listTabs" : function() {
        var called = false;
        this.$service.listTabs(function(tabs) {
            called = true;
            assertEquals(1, tabs.length);
            assertEquals(2, tabs[0].length);
            assertEquals(2, tabs[0][0]);
            assertEquals("file:///index.html", tabs[0][1]);
        });
        this.sendMessage('{"command":"list_tabs","data":[[2,"file:///index.html"]],"result":0}');

        assertTrue(called);
    }
});