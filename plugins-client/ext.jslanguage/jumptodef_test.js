if (typeof process !== "undefined") {
    require("amd-loader");
    require("../../test/setup_paths");
}

/*global disabledFeatures:true*/

define(function(require, exports, module) {
    
var sinon = require("sinon");
var assert = require("assert");
var LanguageWorker = require('../ext.language/worker').LanguageWorker;
var EventEmitter = require("ace/lib/event_emitter").EventEmitter;

module.exports = {
    timeout: 1000000,
    
    "test jump to definition should point to variable declaration" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("definition", function(def) {
            assert.equal(def.results[0].row, 0);
            assert.equal(def.results[0].column, 4);
            next();
        });
        emitter.once("markers", function(markers) {
            worker.jumpToDefinition({
                data: {
                    row: 0,
                    column: 26
                }
            });
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/jumptodef");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "var ab = 4; console.log(ab);", null, "");
    },
    "test jump to definition on a position without code should still return a result" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        var definitionListener = sinon.stub();
        emitter.on("definition", definitionListener);
        emitter.once("markers", function(markers) {
            worker.jumpToDefinition({
                data: {
                    row: 0,
                    column: 40
                }
            });
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/jumptodef");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "var ab = 4; console.log(ab);                            ", null, "");
        
        // definition listener should not be called
        setTimeout(function () {
            sinon.assert.callCount(definitionListener, 1);
            next();
        }, 500);
    },
    "test isJumpToDefinitionAvailable should return true when available" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("isJumpToDefinitionAvailableResult", function(res) {
            assert.equal(res.value, true);
            next();
        });
        emitter.once("markers", function(markers) {
            worker.isJumpToDefinitionAvailable({
                data: {
                    row: 0,
                    column: 26
                }
            });
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/jumptodef");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "var ab = 4; console.log(ab);", null, "");
    },
    "test isJumpToDefinitionAvailable should return false when not available" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("isJumpToDefinitionAvailableResult", function(res) {
            assert.equal(res.value, false);
            next();
        });
        emitter.once("markers", function(markers) {
            worker.isJumpToDefinitionAvailable({
                data: {
                    row: 0,
                    column: 15
                }
            });
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/jumptodef");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "var ab = 4; console.log(ab);", null, "");
    },
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec();
}
