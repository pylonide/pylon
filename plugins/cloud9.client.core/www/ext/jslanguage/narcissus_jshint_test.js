if (typeof process !== "undefined") {
    require("../../../support/paths");
    require.paths.unshift(__dirname + "/../..");
    require.paths.unshift(__dirname + "/../../../support/treehugger/lib");
}

define(function(require, exports, module) {

var assert = require("ace/test/assertions");
//var handler = require('ext/jslanguage/narcissus_jshint');
var LanguageWorker = require('ext/language/worker').LanguageWorker;
var EventEmitter = require("ace/lib/event_emitter").EventEmitter;

module.exports = {

    "test integration base case" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 0);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/narcissus_jshint");
        assert.equal(worker.handlers.length, 1);
        worker.switchFile("test.js", "javascript", "hello();");
    },
    
    "test integration narcissus" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            assert.equal(markers[0].pos.sl, 1);
            assert.equal(markers[0].message, 'missing operand');
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/narcissus_jshint");
        worker.switchFile("test.js", "javascript", "console.log(1);\nhello(");
    },

    "test integration JSHint" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            assert.equal(markers[0].pos.sl, 1);
            assert.equal(markers[0].message, 'Missing semicolon.');
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/narcissus_jshint");
        worker.switchFile("test.js", "javascript", "console.log(1);\nhello()");
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}