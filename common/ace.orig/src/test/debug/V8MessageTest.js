var V8MessageTest = new TestCase("V8MessageTest", {

    "test: create message": function() {
        var msg = new V8Message("request");
        assertEquals("request", msg.type);
    },

    "test: two messages have different sequence numbers": function() {
        var msg1 = new V8Message("request");
        var msg2 = new V8Message("request");

        assertTrue(msg1.seq !== msg2.seq);
    }

});