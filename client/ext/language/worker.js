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
        sender.on("complete", function(pos) {
            _self.complete(pos);
        });
        sender.on("documentClose", function(event) {
            _self.documentClose(event);
        });
        sender.on("analyze", function(event) {
            _self.analyze(event);
        });
    }
};

oop.inherits(LanguageWorker, Mirror);

(function() {
    
    
    this.parse = function() {
        // Parse first
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if(handler.handlesLanguage(this.$language)) {
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
                if(handler.handlesLanguage(this.$language)) {
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
    
    this.analyze = function() {
        var ast = this.parse();
        console.log(""+ast);
        if(!ast) return;
        var markers = [];
        for(var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if(handler.handlesLanguage(this.$language)) {
                var result = handler.analyze(this.doc, ast);
                if(result)
                    markers = markers.concat(result);
            }
        }
        console.log(JSON.stringify(markers));
        if(markers.length > 0) {
            this.sender.emit("markers", markers);
        }
    };

    this.onUpdate = function() {
        for(var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if(handler.handlesLanguage(this.$language)) {
                handler.onUpdate(this.doc);
            }
        }
    };
    
    this.register = function(path) {
        console.log("Registering: " + path);
        var handler = require(path);
        this.handlers.push(handler);
    };
    
    this.switchFile = function(path, language, code) {
        var oldPath = this.$path;
        this.$path = path;
        this.$language = language;
        this.setValue(code);
        for(var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            handler.path = path;
            handler.language = language;
            handler.onDocumentOpen(path, this.doc, oldPath);
        }
    };
    
    this.documentClose = function(event) {
        for(var i = 0; i < this.handlers.length; i++) {
            this.handlers[i].onDocumentClose(event.data);
        }
    };
    
    function removeDuplicateMatches(matches) {
        // First sort
        matches.sort(function(a, b) {
            if (a.name < b.name)
                return 1;
            else if (a.name > b.name)
                return -1;
            else
                return 0;
        });
        for (var i = 0; i < matches.length - 1; i++) {
            var a = matches[i];
            var b = matches[i + 1];
            if (a.name === b.name) {
                // Duplicate!
                if (a.priority < b.priority)
                    matches.splice(i, 1);
                else if (a.priority > b.priority)
                    matches.splice(i+1, 1);
                else if (a.score < b.score)
                    matches.splice(i, 1);
                else if (a.score > b.score)
                    matches.splice(i+1, 1);
                else
                    matches.splice(i, 1);
                i--;
            }
        }
    }
    
    this.complete = function(event) {
        var pos = event.data;
        // Check if anybody requires parsing for its code completion
        var ast, currentNode;
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if(handler.handlesLanguage(this.$language) && handler.completionRequiresParsing()) {
                ast = this.parse();
                currentNode = ast.findNode({line: pos.row, col: pos.column});
                break;
            }
        }
        
        var matches = [];
        
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if(handler.handlesLanguage(this.$language)) {
                var completions = handler.complete(this.doc, ast, pos, currentNode);
                if(completions)
                    matches = matches.concat(completions);
            }
        }

        removeDuplicateMatches(matches);
        // Sort by priority, score
        matches.sort(function(a, b) {
            if (a.priority < b.priority)
                return 1;
            else if (a.priority > b.priority)
                return -1;
            else if (a.score < b.score)
                return 1;
            else if (a.score > b.score)
                return -1;
            else
                return 0;
        });
        
        matches = matches.slice(0, 50); // 50 ought to be enough for everybody
        this.sender.emit("complete", matches);
    };

}).call(LanguageWorker.prototype);

});