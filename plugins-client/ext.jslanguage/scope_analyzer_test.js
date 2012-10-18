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
    
    "test jshint-style globals" : function(next) {
        disabledFeatures = { jshint: undefined };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 0);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.$analyzeInterval = {};
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "/*global foo:true*/ foo;");
    },
    "test unused variable" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            assert.equal(markers[0].message, 'Unused variable.');
            assert.equal(markers[0].pos.sl, 0);
            assert.equal(markers[0].pos.el, 0);
            assert.equal(markers[0].pos.sc, 4);
            assert.equal(markers[0].pos.ec, 9);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        assert.equal(worker.handlers.length, 2);
        worker.switchFile("test.js", "javascript", "var hello = false;");
    },
    "test unused const" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        assert.equal(worker.handlers.length, 2);
        worker.switchFile("test.js", "javascript", "const hello = false;");
    },
    "test unused variable scoped" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            assert.equal(markers[0].message, 'Unused variable.');
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        assert.equal(worker.handlers.length, 2);
        worker.switchFile("test.js", "javascript", "var hello = false; function noName() { var hello = true; hello = false; }");
    },
    "test unused variable scoped without var decl" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 0);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        assert.equal(worker.handlers.length, 2);
        worker.switchFile("test.js", "javascript", "var hello = false; function noName() { hello = false; }");
    },
    "test undeclared variable" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            assert.equal(markers[0].message, 'Assigning to undeclared variable.');
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        assert.equal(worker.handlers.length, 2);
        worker.switchFile("test.js", "javascript", "hello = false;");
    },
    "test undeclared iteration variable" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            assert.equal(markers[0].message, 'Using undeclared variable as iterator variable.');
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "for(p in {}) { }");
    },
    "test bad this call" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "var accept = function(){}; accept('evt', function(){this});");
    },
    "test bad this call (2)" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 2);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "var accept = function(){}; accept(function(err){this});");
    },
    "test bad this call (3)" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "function g(err){this};");
    },
    "test jump to definition should point to variable declaration" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("definition", function(def) {
            assert.equal(def.row, 0);
            assert.equal(def.column, 4);
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
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "var ab = 4; console.log(ab);");
    },
    "test jump to definition on a position without code should not throw" : function(next) {
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
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "var ab = 4; console.log(ab);                            ");
        
        // definition listener should not be called
        setTimeout(function () {
            sinon.assert.callCount(definitionListener, 0);
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
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "var ab = 4; console.log(ab);");
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
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "var ab = 4; console.log(ab);");
    },
    
    "test missing return in err handler" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "function doSomethingElse() { } function helloAsync(callback) {  doSomethingElse(function(err) { if(err) callback(err); }); }");
    },
    "test missing return in err handler without using err in call" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 0);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "function doSomethingElse() { } doSomethingElse(function(err) { if(err) console.log('sup'); });");
    },
    "test not reporting error when there is a return in err handler" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 0);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "function doSomethingElse() { } function helloAsync(callback) {  doSomethingElse(function(err) { if(err) return callback(err); }); }");
    },
    "test be less complainy" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "var foo = true ? false\n: { a : 1\n b : 2}");
    },
    "test be less complainy 2" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 0);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "for(;;) { [].forEach(function() {}) }");
    },
    "test be selectively complainy about functions in loops" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "for(;;) { [].bar(function() {}) }");
    },
    "test complain about functions in 'for in'" : function(next) {
        disabledFeatures = { jshint: true };
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "for(var x in []) { x.bar(function() {}) }");
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec();
}
