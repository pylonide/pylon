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
            // false color & empty selector
            assert.equal(markers.length, 2);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/csslanguage/css_handler");
        assert.equal(worker.handlers.length, 1);
        worker.switchFile("test.css", "css", "#hello { color: 1px; } #nonused{}", null, "");
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}
