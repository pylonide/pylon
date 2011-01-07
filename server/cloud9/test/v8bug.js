require("../../../support/paths");

var NodeSocket = require("v8debug/NodeSocket");
var StandaloneV8DebuggerService = require("v8debug/StandaloneV8DebuggerService");
var V8Debugger = require("v8debug/V8Debugger");

var socket = new NodeSocket("127.0.0.1", parseInt(process.argv[2]));
var service = new StandaloneV8DebuggerService(socket);
console.log("here")
service.attach(0, function() {
    console.log("attached");

    var dbg = new V8Debugger(0, service);
    dbg.version(function(version) {
        console.log(version);
        service.detach(0, function() {
            console.log("done");
        });
    });
});
