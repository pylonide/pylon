/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
/**
 * Language Worker
 * This code runs in a WebWorker in the browser. Its main job is to
 * delegate messages it receives to the various handlers that have registered
 * themselves with the worker.
 */
define(function(require, exports, module) {

var oop = require("ace/lib/oop");
var Mirror = require("ace/worker/mirror").Mirror;
var tree = require('treehugger/tree');


// Leaking into global namespace of worker, to allow handlers to have access
disabledFeatures = {};

var LanguageWorker = exports.LanguageWorker = function(sender) {
    var _self = this;
    this.handlers = [];
    this.currentMarkers = [];
    this.$lastAggregateActions = {};
    
    Mirror.call(this, sender);
    this.setTimeout(500);
    
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
    
    sender.on("inspect", function(event) {
        _self.inspect(event);
    });
    
    sender.on("change", function() {
        _self.scheduledUpdate = true;
    });
    
    sender.on("fetchVariablePositions", function(event) {
        _self.sendVariablePositions(event);
    });
};

oop.inherits(LanguageWorker, Mirror);

(function() {
    
    this.getLastAggregateActions = function() {
        if(!this.$lastAggregateActions[this.$path])
            this.$lastAggregateActions[this.$path] = {markers: [], hint: null};
        return this.$lastAggregateActions[this.$path];
    };
    
    this.setLastAggregateActions = function(actions) {
        this.$lastAggregateActions[this.$path] = actions;
    };
    
    this.enableFeature = function(name) {
        disabledFeatures[name] = false;
    };

    this.disableFeature = function(name) {
        disabledFeatures[name] = true;
    };
    
    /**
     * Registers a handler by loading its code and adding it the handler array
     */
    this.register = function(path) {
        var handler = require(path);
        this.handlers.push(handler);
    };

    this.parse = function() {
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if (handler.handlesLanguage(this.$language)) {
                try {
                    var ast = handler.parse(this.doc.getValue());
                    if(ast) {
                        this.cachedAst = ast;
                        return ast;
                    }
                } catch(e) {
                    // Ignore parse errors
                }
            }
        }
        // No parser available
        this.cachedAst = null;
        return null;
    };

    this.scheduleEmit = function(messageType, data) {
        this.sender.emit(messageType, data);
    };
    
    /**
     * If the program contains a syntax error, the parser will try its best to still produce
     * an AST, although it will contain some problems. To avoid that those problems result in
     * invalid warning, let's filter out warnings that appear within a line or too after the
     * syntax error. 
     */
    function filterMarkersAroundError(ast, markers) {
        if(!ast)
            return;
        var error = ast.getAnnotation("error");
        if(!error)
            return;
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            if(marker.type !== 'error' && marker.pos.sl >= error.line && marker.pos.el <= error.line + 2) {
                markers.splice(i, 1);
                i--;
            }
        }
    }
    
    this.analyze = function() {
        var ast = this.parse();
        var markers = [];
        for(var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if (handler.handlesLanguage(this.$language) && (ast || !handler.analysisRequiresParsing())) {
                var result = handler.analyze(this.doc, ast);
                if (result)
                    markers = markers.concat(result);
            }
        }
        var extendedMakers = markers;
        filterMarkersAroundError(ast, markers);
        if (this.getLastAggregateActions().markers.length > 0)
            extendedMakers = markers.concat(this.getLastAggregateActions().markers);
        this.scheduleEmit("markers", extendedMakers);
        this.currentMarkers = markers;
        if (this.postponedCursorMove) {
            this.onCursorMove(this.postponedCursorMove);
        }
    };

    this.checkForMarker = function(pos) {
        var astPos = {line: pos.row, col: pos.column};
        for (var i = 0; i < this.currentMarkers.length; i++) {
            var currentMarker = this.currentMarkers[i];
            if (currentMarker.message && tree.inRange(currentMarker.pos, astPos)) {
                return currentMarker.message;
            }
        }
    };
    
    /**
     * Request the AST node on the current position
     */
    this.inspect = function (event) {
        var _self = this;
        
        if (this.cachedAst) {
            // find the current node based on the ast and the position data
            var ast = this.cachedAst;
            var node = ast.findNode({ line: event.data.row, col: event.data.col });
            
            // find a handler that can build an expression for this language
            var handler = this.handlers.filter(function (h) { 
                return h.handlesLanguage(_self.$language) && h.buildExpression;
            });
            
            // then invoke it and build an expression out of this
            if (handler && handler.length) {
                var expression = handler[0].buildExpression(node);
                this.scheduleEmit("inspect", expression);
            }
        }
    };

    this.onCursorMove = function(event) {
        if(this.scheduledUpdate) {
            // Postpone the cursor move until the update propagates
            this.postponedCursorMove = event;
            return;
        }
        var pos = event.data;
        var hintMessage = this.checkForMarker(pos) || "";
        // Not going to parse for this, only if already parsed successfully
        var aggregateActions = {markers: [], hint: null, enableRefactorings: []};
        if (this.cachedAst) {
            var ast = this.cachedAst;
            var currentNode = ast.findNode({line: pos.row, col: pos.column});
            if (currentNode !== this.lastCurrentNode || pos.force) {
                for (var i = 0; i < this.handlers.length; i++) {
                    var handler = this.handlers[i];
                    if (handler.handlesLanguage(this.$language)) {
                        var response = handler.onCursorMovedNode(this.doc, ast, pos, currentNode);
                        if (!response)
                            continue;
                        if (response.markers && response.markers.length > 0) {
                            aggregateActions.markers = aggregateActions.markers.concat(response.markers);
                        }
                        if (response.enableRefactorings && response.enableRefactorings.length > 0) {
                            aggregateActions.enableRefactorings = aggregateActions.enableRefactorings.concat(response.enableRefactorings);
                        }
                        if (response.hint) {
                            // Last one wins, support multiple?
                            aggregateActions.hint = response.hint;
                        }
                    }
                }
                if (aggregateActions.hint && !hintMessage) {
                    hintMessage = aggregateActions.hint;
                }
                this.scheduleEmit("markers", this.currentMarkers.concat(aggregateActions.markers));
                this.scheduleEmit("enableRefactorings", aggregateActions.enableRefactorings);
                this.lastCurrentNode = currentNode;
                this.setLastAggregateActions(aggregateActions);
            }
        } else {
            this.setLastAggregateActions(aggregateActions);
        }
        this.scheduleEmit("hint", hintMessage);
    };
    
    this.sendVariablePositions = function(event) {
        var pos = event.data;
        // Not going to parse for this, only if already parsed successfully
        if (this.cachedAst) {
            var ast = this.cachedAst;
            var currentNode = ast.findNode({line: pos.row, col: pos.column});
            for (var i = 0; i < this.handlers.length; i++) {
                var handler = this.handlers[i];
                if (handler.handlesLanguage(this.$language)) {
                    var response = handler.getVariablePositions(this.doc, ast, pos, currentNode);
                    if (response)
                        this.sender.emit("variableLocations", response);
                }
            }
        }
    };

    this.onUpdate = function() {
        this.scheduledUpdate = false;
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if (handler.handlesLanguage(this.$language)) {
                handler.onUpdate(this.doc);
            }
        }
        this.analyze();
    };
    
    this.switchFile = function(path, language, code) {
        var oldPath = this.$path;
        code = code || "";
        this.$path = path;
        this.$language = language;
        this.cachedAst = null;
        this.lastCurrentNode = null;
        this.setValue(code);
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            handler.path = path;
            handler.language = language;
            handler.onDocumentOpen(path, this.doc, oldPath);
        }
    };
    
    this.documentClose = function(event) {
        var path = event.data;
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            handler.onDocumentClose(path);
        }
    };
    
    // For code completion
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
            if (handler.handlesLanguage(this.$language) && handler.completionRequiresParsing()) {
                ast = this.parse();
                currentNode = ast.findNode({line: pos.row, col: pos.column});
                break;
            }
        }
        
        var matches = [];
        
        for (var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if (handler.handlesLanguage(this.$language)) {
                var completions = handler.complete(this.doc, ast, pos, currentNode);
                if (completions)
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
