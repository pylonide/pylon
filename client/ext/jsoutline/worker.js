define(function(require, exports, module) {

var oop = require("pilot/oop");
var Mirror = require("ace/worker/mirror").Mirror;
var parser = require("treehugger/js/parse");
require("treehugger/traverse");
var lang = require("pilot/lang");

var AnalysisWorker = exports.AnalysisWorker = function(sender) {
    var _self = this;
    this.$isJavascript = false;
    Mirror.call(this, sender);
    this.setTimeout(500);
    
    sender.on("outline", function() {
        _self.onOutline();
    });
};


oop.inherits(AnalysisWorker, Mirror);

(function() {

    this.onOutline = function() {
        if(!this.$enabled) return;
        try {
            var value = this.doc.getValue();
            var node = this.$ast = parser.parse(value);
            var outline = this.extractOutline(node);
            this.sender.emit("outline", outline);
        } catch(e) {
            console.log("Error: " + e.message);
        }
    };
    
    this.extractOutline = function(node) {
        var outline = [];
        var _self = this;
        node.traverseTopDown(
            'Assign(PropAccess(e, x), Function(name, fargs, body))', function(b) {
                outline.push({
                    type: 'function',
                    name: b.x.value,
                    pos: this[1].getPos(),
                    items: _self.extractOutline(b.body)
                });
                return this;
            },
            'PropertyInit(x, Function(name, fargs, body))', function(b) {
                outline.push({
                    type: 'function',
                    name: b.x.value,
                    pos: this[1].getPos(),
                    items: _self.extractOutline(b.body)
                });
                return this;
            },
            'Function(name, fargs, body)', function(b) {
                outline.push({
                    type: 'function',
                    name: b.name.value ? b.name.value : '(unnamed)',
                    pos: this.getPos(),
                    items: _self.extractOutline(b.body)
                });
                return this;
            }
        );
        return outline;
    };

    this.setEnabled = function(enabled) {
        this.$enabled = enabled;
    };

}).call(AnalysisWorker.prototype);

});