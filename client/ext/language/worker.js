define(function(require, exports, module) {

var oop = require("pilot/oop");
var Mirror = require("ace/worker/mirror").Mirror;
var parser = require("treehugger/js/parse");
var lang = require("pilot/lang");

var LanguageWorker = exports.LanguageWorker = function(sender) {
    var _self = this;
    this.handlers = [];
    
    if(sender) {
        Mirror.call(this, sender);
        this.setTimeout(500);
        
        sender.on("outline", function() {
            _self.outline();
        });
        
    }
};

oop.inherits(LanguageWorker, Mirror);

(function() {
    
    this.parse = function() {
        // Parse first
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if(handler.handlesPath(this.$path)) {
                try {
                    var ast = handler.parse(this.doc.getValue());
                    if(ast)
                        return ast;
                } catch(e) {
                    console.log("Parse exception: " + e.message);
                }
            }
        }
        return null;
    };

    this.outline = function() {
        var ast = this.parse();
        if(!ast)
            return;
        try {
            for (var i = 0; i < this.handlers.length; i++) {
                var handler = this.handlers[i];
                if(handler.handlesPath(this.$path)) {
                    var outline = handler.outline(ast);
                    if(outline) {
                        this.sender.emit("outline", outline);
                        return;
                    }
                }
            }
        } catch(e) {
            console.log("Outline exception: " + e.message);
        }
    };
    
    this.register = function(path, className) {
        console.log("Registering: " + path + " class: " + className);
        var module = require(path);
        var Handler = module[className];
        var handler = new Handler();
        this.handlers.push(handler);
    };
    
    this.setPath = function(path) {
        this.$path = path;
    };

}).call(LanguageWorker.prototype);

});