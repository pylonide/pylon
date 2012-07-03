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

var WARNING_LEVELS = {
    error: 3,
    warning: 2,
    info: 1
};

// Leaking into global namespace of worker, to allow handlers to have access
disabledFeatures = {};
var currentPos;

var LanguageWorker = exports.LanguageWorker = function(sender) {
    var _self = this;
    this.handlers = [];
    this.currentMarkers = [];
    this.$lastAggregateActions = {};
    this.$warningLevel = "info";
    
    Mirror.call(this, sender);
    this.setTimeout(500);
    
    sender.on("outline", applyEventOnce(function(event) {
        _self.outline(event);
    }));
    sender.on("complete", applyEventOnce(function(data) {
        _self.complete(data);
    }));
    sender.on("documentClose", function(event) {
        _self.documentClose(event);
    });
    sender.on("analyze", applyEventOnce(function(event) {
        _self.analyze(function() { });
    }));
    sender.on("cursormove", function(event) {
        _self.onCursorMove(event);
    });
    sender.on("inspect", applyEventOnce(function(event) {
        _self.inspect(event);
    }));
    sender.on("change", applyEventOnce(function() {
        _self.scheduledUpdate = true;
    }));
    sender.on("jumpToDefinition", function(event) {
        _self.jumpToDefinition(event);
    });
    sender.on("fetchVariablePositions", function(event) {
        _self.sendVariablePositions(event);
    });
};

var isWorkerEnabled = exports.isWorkerEnabled = function() {
    return !window.location || !window.location.search.match(/[?&]noworker=1/);
};

exports.createUIWorkerClient = function() {
    var emitter = Object.create(require("ace/lib/event_emitter").EventEmitter);
    var result = new LanguageWorker(emitter);
    result.on = function(name, f) {
        emitter.on.call(result, name, f);
    };
    result.call = function(cmd, args, callback) {
        if (callback) {
            var id = this.callbackId++;
            this.callbacks[id] = callback;
            args.push(id);
        }
        this.send(cmd, args);
    };
    result.send = function(cmd, args) {
        setTimeout(function() { result[cmd].apply(result, args); }, 0);
    };
    result.emit = function(event, data) {
        emitter._dispatchEvent.call(emitter, event, data);
    };
    emitter.emit = function(event, data) {
        emitter._dispatchEvent.call(result, event, { data: data });
    };
    return result;
};

/**
 * Ensure that an event handler is called only once if multiple
 * events are received at the same time.
 **/
function applyEventOnce(eventHandler) {
    var timer;
    return function() {
        var _arguments = arguments;
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(function() { eventHandler.apply(eventHandler, _arguments); }, 0);
    };
}

oop.inherits(LanguageWorker, Mirror);

function asyncForEach(array, fn, callback) {
	array = array.slice(0); // Just to be sure
	function processOne() {
		var item = array.pop();
		fn(item, function(result, err) {
			if (array.length > 0) {
				processOne();
			}
			else {
				callback(result, err);
			}
		});
	}
	if (array.length > 0) {
		processOne();
	}
	else {
		callback();
	}
}

function asyncParForEach(array, fn, callback) {
	var completed = 0;
	var arLength = array.length;
	if (arLength === 0) {
		callback();
	}
	for (var i = 0; i < arLength; i++) {
		fn(array[i], function(result, err) {
			completed++;
			if (completed === arLength) {
				callback(result, err);
			}
		});
	}
}

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
    
    this.setWarningLevel = function(level) {
        this.$warningLevel = level;
    };
    
    /**
     * Registers a handler by loading its code and adding it the handler array
     */
    this.register = function(path) {
        try {
            var handler = require(path);
            this.handlers.push(handler);
        } catch (e) {
            if (isWorkerEnabled())
                throw new Error("Could not load language handler " + path, e);
            // In ?noworker=1 debugging mode, synchronous require doesn't work
            var _self = this;
            require([path], function(handler) {
                _self.handlers.push(handler);
            });
        }   
    };

    this.parse = function(callback, allowCached) {
        var _self = this;
        if (allowCached && this.cachedAst) {
            callback(_self.cachedAst);
            return;
        }
        this.cachedAst = null;
        asyncForEach(this.handlers, function(handler, next) {
            if (handler.handlesLanguage(_self.$language)) {
                try {
                    handler.parse(_self.doc.getValue(), function(ast) {
                        if(ast)
                            _self.cachedAst = ast;
                        next();
                    });
                } catch(e) {
                    if (e instanceof TypeError)
                        throw e;
                    // Ignore parse errors
                    next();
                }
            } else {
                next();
            }
        }, function() {
            callback(_self.cachedAst);
        });
    };

    this.outline = function(event) {
        var _self = this;
        this.parse(function(ast) {
            asyncForEach(_self.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language)) {
                    handler.outline(_self.doc, ast, function(outline) {
                        if (outline) {
                            outline.ignoreFilter = event.data. ignoreFilter;
                            return _self.sender.emit("outline", outline);
                        }
                        else {
                            next();
                        }
                    });
                }
                else
                    next();
            }, function() {
            });
        }, true);
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
    
    this.analyze = function(callback) {
        var _self = this;
        this.parse(function(ast) {
            var markers = [];
            asyncForEach(_self.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language) && (ast || !handler.analysisRequiresParsing())) {
                    handler.analyze(_self.doc, ast, function(result) {
                        if (result)
                            markers = markers.concat(result);
                        next();
                    });
                }
                else {
                    next();
                }
            }, function() {
                var extendedMakers = markers;
                filterMarkersAroundError(ast, markers);
                if (_self.getLastAggregateActions().markers.length > 0)
                    extendedMakers = markers.concat(_self.getLastAggregateActions().markers);
                _self.scheduleEmit("markers", _self.filterMarkersBasedOnLevel(extendedMakers));
                _self.currentMarkers = markers;
                if (_self.postponedCursorMove) {
                    _self.onCursorMove(_self.postponedCursorMove);
                    _self.postponedCursorMove = null;
                }
                callback();
            });
        });
    };

/*
    this.analyze = function() {
        var ast = this.parse();
        var markers = [];
        var handlerCount = 0;
        for(var i = 0; i < this.handlers.length; i++) {
            var handler = this.handlers[i];
            if (handler.handlesLanguage(this.$language) && (ast || !handler.analysisRequiresParsing())) {
                var result = handler.analyze(this.doc, ast);
                if (result)
                    markers = markers.concat(result);
                handlerCount++;
            }
        }
        var extendedMakers = markers;
        filterMarkersAroundError(ast, markers);
        if (this.getLastAggregateActions().markers.length > 0)
            extendedMakers = markers.concat(this.getLastAggregateActions().markers);
        if(handlerCount > 0)
            this.scheduleEmit("markers", extendedMakers);
        this.currentMarkers = markers;
        if (this.postponedCursorMove) {
            this.onCursorMove(this.postponedCursorMove);
        }
*/

    this.checkForMarker = function(pos) {
        var astPos = {line: pos.row, col: pos.column};
        for (var i = 0; i < this.currentMarkers.length; i++) {
            var currentMarker = this.currentMarkers[i];
            if (currentMarker.message && tree.inRange(currentMarker.pos, astPos)) {
                return currentMarker.message;
            }
        }
    };
    
    this.filterMarkersBasedOnLevel = function(markers) {
        for (var i = 0; i < markers.length; i++) {
            var marker = markers[i];
            if(marker.level && WARNING_LEVELS[marker.level] < WARNING_LEVELS[this.$warningLevel]) {
                markers.splice(i, 1);
                i--;
            }
        }
        return markers;
    }
    
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
        var _self = this;
        var hintMessage = ""; // this.checkForMarker(pos) || "";
        // Not going to parse for this, only if already parsed successfully
        var aggregateActions = {markers: [], hint: null, displayPos: null, enableRefactorings: []};
        
        function cursorMoved() {
            asyncForEach(_self.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language)) {
                    handler.onCursorMovedNode(_self.doc, ast, pos, currentNode, function(response) {
                        if (!response)
                            return next();
                        if (response.markers && response.markers.length > 0) {
                            aggregateActions.markers = aggregateActions.markers.concat(response.markers);
                        }
                        if (response.enableRefactorings && response.enableRefactorings.length > 0) {
                            aggregateActions.enableRefactorings = aggregateActions.enableRefactorings.concat(response.enableRefactorings);
                        }
                        if (response.hint) {
                            if (aggregateActions.hint)
                                aggregateActions.hint += "\n" + response.hint;
                            else
                                aggregateActions.hint = response.hint;
                        }
                        if (response.displayPos) {
                            aggregateActions.displayPos = response.displayPos;
                        }
                        next();
                    });
                }
                else
                    next();
            }, function() {
                if (aggregateActions.hint && !hintMessage) {
                    hintMessage = aggregateActions.hint;
                }
                _self.scheduleEmit("markers", _self.filterMarkersBasedOnLevel(_self.currentMarkers.concat(aggregateActions.markers)));
                _self.scheduleEmit("enableRefactorings", aggregateActions.enableRefactorings);
                _self.lastCurrentNode = currentNode;
                _self.lastCurrentPos = currentPos;
                _self.setLastAggregateActions(aggregateActions);
                _self.scheduleEmit("hint", {
                    pos: pos,
                    displayPos: aggregateActions.displayPos,
                    message: hintMessage
                });
            });

        }
        
        if (this.cachedAst) {
            var ast = this.cachedAst;
            var currentPos = {line: pos.row, col: pos.column};
            var currentNode = ast.findNode(currentPos);
            if (currentPos != this.lastCurrentPos || currentNode !== this.lastCurrentNode || pos.force) {
                cursorMoved();
            }
        } else {
            cursorMoved();
        }
    };


    this.jumpToDefinition = function(event) {
        var pos = event.data;
        // Not going to parse for this, only if already parsed successfully
        if (this.cachedAst) {
            var ast = this.cachedAst;
            var currentNode = ast.findNode({line: pos.row, col: pos.column});
            for (var i = 0; i < this.handlers.length; i++) {
                var handler = this.handlers[i];
                if (handler.handlesLanguage(this.$language)) {
                    var response = handler.jumpToDefinition(this.doc, ast, pos, currentNode);
                    if (response)
                        this.sender.emit("jumpToDefinition", response);
                }
            }
        }
    };

    this.sendVariablePositions = function(event) {
        var pos = event.data;
        var _self = this;
        // Not going to parse for this, only if already parsed successfully
        if (this.cachedAst) {
            var ast = this.cachedAst;
            var currentNode = ast.findNode({line: pos.row, col: pos.column});
            asyncForEach(this.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language)) {
                    handler.getVariablePositions(_self.doc, ast, pos, currentNode, function(response) {
                        if (response)
                            _self.sender.emit("variableLocations", response);
                        next();
                    });
                }
            }, function() {
            });
        }
    };

    this.onUpdate = function() {
        this.scheduledUpdate = false;
        var _self = this;
        asyncForEach(this.handlers, function(handler, next) { 
            if (handler.handlesLanguage(_self.$language))
                handler.onUpdate(_self.doc, next);
            else
                next();
        }, function() {
            _self.analyze(function() {});
        });
    };
    
    // TODO: BUG open an XML file and switch between, language doesn't update soon enough
    this.switchFile = function(path, language, code) {
        var oldPath = this.$path;
        code = code || "";
        this.$path = path;
        this.$language = language;
        this.cachedAst = null;
        this.lastCurrentNode = null;
        this.lastCurrentPos = null;
        this.setValue(code);
        var doc = this.doc;
        asyncForEach(this.handlers, function(handler, next) {
            handler.path = path;
            handler.language = language;
            handler.onDocumentOpen(path, doc, oldPath, next);
        }, function() { });
    };
    
    this.documentClose = function(event) {
        var path = event.data;
        asyncForEach(this.handlers, function(handler, next) {
            handler.onDocumentClose(path, next);
        }, function() { });
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
        var data = event.data;
        var pos = data.pos;
        // Check if anybody requires parsing for its code completion
        var ast, currentNode;
        var _self = this;
        
        asyncForEach(this.handlers, function(handler, next) {
            if (!ast && handler.handlesLanguage(_self.$language) && handler.completionRequiresParsing()) {
                _self.parse(function(hAst) {
                    if(hAst) {
                        ast = hAst;
                        currentPos = {line: pos.row, col: pos.column};
                        currentNode = ast.findNode(currentPos);
                    }
                    next();
                });
            }
            else
                next();
        }, function() {
            var matches = [];
            asyncForEach(_self.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language)) {
                    handler.complete(_self.doc, ast, data, currentNode, function(completions) {
                        if (completions)
                            matches = matches.concat(completions);
                        next();
                    });
                }
                else
                    next();
            }, function() {
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
                    else if (a.id && a.id === b.id) {
                        if (a.isFunction)
                            return -1;
                        else if (b.isFunction)
                            return 1;
                    }
                    if (a.name < b.name)
                        return -1;
                    else if(a.name > b.name)
                        return 1;
                    else
                        return 0;
                });
                
                matches = matches.slice(0, 50); // 50 ought to be enough for everybody
                _self.sender.emit("complete", {
                    pos: pos,
                    matches: matches
                });
            });
        });
    };

}).call(LanguageWorker.prototype);

});
