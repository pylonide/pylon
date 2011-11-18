define(function(require, exports, module) {

var oop = require("ace/lib/oop");
var Mirror = require("ace/worker/mirror").Mirror;
var tree = require('treehugger/tree');

var LanguageWorker = exports.LanguageWorker = function(sender) {
    var _self = this;
    this.handlers = [];
    this.currentMarkers = [];
    this.lastAggregateActions = {markers: [], hint: null};
    
    this.emitCache = {};
    
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
        sender.on("cursormove", function(event) {
            _self.onCursorMove(event);
        });
        
        sender.on("change", function(e) {
            _self.scheduledUpdate = true;
        });
        
        sender.on("fetchVariablePositions", function(event) {
            _self.sendVariablePositions(event);
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
                    if(ast) {
                        this.cachedAst = ast;
                        return ast;
                    }
                } catch(e) {
                    console.log("Parse exception: " + e.message);
                }
            }
        }
        this.cachedAst = null;
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
    
    this.scheduleEmit = function(messageType, data) {
        this.sender.emit(messageType, data);
    };
    
    this.analyze = function() {
        var ast = this.parse();
        console.log("Analyzing");
        var markers = [];
        for(var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if(handler.handlesLanguage(this.$language) && (ast || !handler.analysisRequiresParsing())) {
                var result = handler.analyze(this.doc, ast);
                if(result)
                    markers = markers.concat(result);
            }
        }
        var extendedMakers = markers;
        if(this.lastAggregateActions.markers.length > 0)
            extendedMakers = markers.concat(this.lastAggregateActions.markers);
        this.scheduleEmit("markers", extendedMakers);
        this.currentMarkers = markers;
        if(this.postponedCursorMove) {
            this.onCursorMove(this.postponedCursorMove);
        }
    };

    this.checkForMarker = function(pos) {
        var astPos = {line: pos.row, col: pos.column};
        for (var i = 0; i < this.currentMarkers.length; i++) {
            var currentMarker = this.currentMarkers[i];
            if(currentMarker.message && tree.inRange(currentMarker.pos, astPos)) {
                return currentMarker.message;
            }
        }
    };

    // TODO: Combine these messages into a single one for efficiency
    this.onCursorMove = function(event) {
        if(this.scheduledUpdate) {
            // Postpone the cursor move until the update propagates
            this.postponedCursorMove = event;
            return;
        }
        var pos = event.data;
        var hintMessage = this.checkForMarker(pos) || "";
        // Not going to parse for this, only if already parsed successfully
        if(this.cachedAst) {
            var ast = this.cachedAst;
            var currentNode = ast.findNode({line: pos.row, col: pos.column});
            if(currentNode !== this.lastCurrentNode) {
                var aggregateActions = {markers: [], hint: null, enableRefactorings: []};
                for(var i = 0; i < this.handlers.length; i++) {
                    var handler = this.handlers[i];
                    if(handler.handlesLanguage(this.$language)) {
                        var response = handler.onCursorMovedNode(this.doc, ast, pos, currentNode);
                        if(!response) continue;
                        if(response.markers && response.markers.length > 0) {
                            aggregateActions.markers = aggregateActions.markers.concat(response.markers);
                        }
                        if(response.enableRefactorings && response.enableRefactorings.length > 0) {
                            aggregateActions.enableRefactorings = aggregateActions.enableRefactorings.concat(response.enableRefactorings);
                        }
                        if(response.hint) {
                            // Last one wins, support multiple?
                            aggregateActions.hint = response.hint;
                        }
                    }
                }
                if(aggregateActions.hint && !hintMessage) {
                    hintMessage = aggregateActions.hint;
                }
                this.scheduleEmit("markers", this.currentMarkers.concat(aggregateActions.markers));
                this.scheduleEmit("enableRefactorings", aggregateActions.enableRefactorings);
                this.lastCurrentNode = currentNode;
                this.lastAggregateActions = aggregateActions;
            }
        }
        this.scheduleEmit("hint", hintMessage);
    };
    
    this.sendVariablePositions = function(event) {
        var pos = event.data;
        // Not going to parse for this, only if already parsed successfully
        if(this.cachedAst) {
            var ast = this.cachedAst;
            var currentNode = ast.findNode({line: pos.row, col: pos.column});
            for(var i = 0; i < this.handlers.length; i++) {
                var handler = this.handlers[i];
                if(handler.handlesLanguage(this.$language)) {
                    var response = handler.getVariablePositions(this.doc, ast, pos, currentNode);
                    if(response)
                        this.sender.emit("variableLocations", response);
                }
            }
        }
    };

    this.onUpdate = function() {
        this.scheduledUpdate = false;
        for(var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if(handler.handlesLanguage(this.$language)) {
                handler.onUpdate(this.doc);
            }
        }
        this.analyze();
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
        this.cachedAst = null;
        this.setValue(code);
        console.log("Current file: " + path);
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
