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
    "test parsing" : function() {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/parse");
        assert.equal(worker.handlers.length, 1);
        worker.switchFile("test.js", "javascript", "hello();");
        var ast = worker.parse();
        assert.equal(ast, '[Call(Var("hello"),[])]');
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}