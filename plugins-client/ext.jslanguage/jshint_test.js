if (typeof process !== "undefined") {
    require("amd-loader");
    require("../../test/setup_paths");
}

define(function(require, exports, module) {

var assert = require("ace/test/assertions");
//var handler = require('ext/jslanguage/jshint');
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
        worker.register("ext/jslanguage/jshint");
        assert.equal(worker.handlers.length, 1);
        worker.switchFile("test.js", "javascript", "hello();", null, "");
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
        worker.register("ext/jslanguage/jshint");
        worker.switchFile("test.js", "javascript", "console.log(1);\nhello()", null, "");
    },
    
    "test JSHint output filtering" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            console.log(markers);
            assert.equal(markers.length, 0);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/jshint");
        worker.switchFile("no-errors.js", "javascript", "var foo = function() {};\nfoo && foo();", null, "");
    },
    
    "test JSHint const support" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            console.log(markers);
            assert.equal(markers.length, 0);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/jshint");
        worker.switchFile("no-errors.js", "javascript", "const foo = 1;", null, "");
    },
    
    "test JSHint globals" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            console.log(markers);
            assert.equal(markers.length, 0);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/jshint");
        worker.switchFile("no-errors.js", "javascript", "/*global foo:true*/ foo;", null, "");
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}
