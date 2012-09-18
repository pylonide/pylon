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
var EventEmitter = require("ace/lib/event_emitter").EventEmitter;

var WARNING_LEVELS = {
    error: 3,
    warning: 2,
    info: 1
};

// Leaking into global namespace of worker, to allow handlers to have access
disabledFeatures = {};

EventEmitter.once = function(event, fun) {
  var _self = this;
  var newCallback = function() {
    fun && fun.apply(null, arguments);
    _self.removeEventListener(event, newCallback);
  };
  this.addEventListener(event, newCallback);
};

var ServerProxy = function(sender) {

  this.emitter = Object.create(EventEmitter);
  this.emitter.emit = this.emitter._dispatchEvent;

  this.send = function(data) {
      sender.emit("serverProxy", data);
  };
  
  this.once = function(messageType, messageSubtype, callback) {
    var channel = messageType;
    if (messageSubtype)
       channel += (":" + messageSubtype);
    this.emitter.once(channel, callback);
  };

  this.subscribe = function(messageType, messageSubtype, callback) {
    var channel = messageType;
    if (messageSubtype)
       channel += (":" + messageSubtype);
    this.emitter.addEventListener(channel, callback);
  };
  
  this.unsubscribe = function(messageType, messageSubtype, f) {
    var channel = messageType;
    if (messageSubtype)
       channel += (":" + messageSubtype);
    this.emitter.removeEventListener(channel, f);
  };

  this.onMessage = function(msg) {
    var channel = msg.type;
    if (msg.subtype)
      channel += (":" + msg.subtype);
    // console.log("publish to: " + channel);
    this.emitter.emit(channel, msg.body);
  };
};

var LanguageWorker = exports.LanguageWorker = function(sender) {
    var _self = this;
    this.handlers = [];
    this.currentMarkers = [];
    this.$lastAggregateActions = {};
    this.$warningLevel = "info";
    sender.once = EventEmitter.once;
    this.serverProxy = new ServerProxy(sender);
    
    Mirror.call(this, sender);
    this.setTimeout(500);
    
    sender.on("hierarchy", function(event) {
        _self.hierarchy(event);
    });
    sender.on("code_format", function(event) {
        _self.codeFormat();
    });
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
    sender.on("onRenameBegin", function(event) {
        _self.onRenameBegin(event);
    });
    sender.on("commitRename", function(event) {
        _self.commitRename(event);
    });
    sender.on("onRenameCancel", function(event) {
        _self.onRenameCancel(event);
    });
    sender.on("serverProxy", function(event) {
        _self.serverProxy.onMessage(event.data);
    });
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
            else if (callback) {
				callback(result, err);
			}
		});
	}
	if (array.length > 0) {
		processOne();
	}
    else if (callback) {
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
            if (completed === arLength && callback) {
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
            handler.proxy = this.serverProxy;
            handler.sender = this.sender;
            this.handlers.push(handler);
            this.$initHandler(handler, null, function() {});
        } catch (e) {
            if (isWorkerEnabled())
                throw new Error("Could not load language handler " + path, e);
            // In ?noworker=1 debugging mode, synchronous require doesn't work
            var _self = this;
            require([path], function(handler) {
                if (!handler)
                    throw new Error("Could not load language handler " + path, e);
                handler.proxy = _self.serverProxy;
                handler.sender = _self.sender;
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
                    if (e instanceof TypeError || e instanceof ReferenceError || typeof e === 'AssertionError')
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

    this.isParsingSupported = function() {
        if (this.cachedAst)
            return true;
        var result;
        var _self = this;
        this.handlers.forEach(function(handler) {
            if (handler.handlesLanguage(_self.$language) &&
                handler.isParsingSupported())
                result = true;
        });
        return result;
    };
    
    /**
     * Finds the current node using the language handler.
     * This should always be preferred over the treehugger findNode()
     * method.
     */
    this.findNode = function(ast, pos, callback) {
        if (!ast)
            return callback();
        var _self = this;
        var result;
        asyncForEach(_self.handlers, function(handler, next) {
            if (handler.handlesLanguage(_self.$language) && handler.findNode) {
                handler.findNode(ast, pos, function(node) {
                    if (node)
                        result = node;
                    next();
                });
            }
            else {
                next();
            }
        }, function() { callback(result); });
    };

    this.outline = function(event) {
        var _self = this;
        var foundHandler = false;
        this.parse(function(ast) {
            asyncForEach(_self.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language)) {
                    handler.outline(_self.doc, ast, function(outline) {
                        if (outline) {
                            foundHandler = true;
                            outline.ignoreFilter = event.data.ignoreFilter;
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
                if (!foundHandler)
                    _self.sender.emit("outline", { body: [] });
            });
        }, true);
    };

    this.hierarchy = function(event) {
        var data = event.data;
        var _self = this;
        asyncForEach(this.handlers, function(handler, next) {
            if (handler.handlesLanguage(_self.$language)) {
                handler.hierarchy(_self.doc, data.pos, function(hierarchy) {
                    if(hierarchy)
                        return _self.sender.emit("hierarchy", hierarchy);
                    else
                        next();
                });
            }
            else
                next();
        });
    };

    this.codeFormat = function() {
        var _self = this;
        asyncForEach(_self.handlers, function(handler, next) {
            if (handler.handlesLanguage(_self.$language)) {
                handler.codeFormat(_self.doc, function(newSource) {
                    if(newSource)
                        return _self.sender.emit("code_format", newSource);
                });
            }
            else
                next();
        });
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
        if (!ast || !ast.getAnnotation)
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
                if (handler.handlesLanguage(_self.$language) && (ast || !_self.isParsingSupported())) {
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
    };
    
    /**
     * Request the AST node on the current position
     */
    this.inspect = function (event) {
        var _self = this;
        
        if (this.cachedAst || !this.isParsingSupported()) {
            // find the current node based on the ast and the position data
            this.findNode(this.cachedAst, { line: event.data.row, col: event.data.col }, function(node) {
                // find a handler that can build an expression for this language
                var handler = _self.handlers.filter(function (h) {
                    return h.handlesLanguage(_self.$language) && h.buildExpression;
                });
            
                // then invoke it and build an expression out of this
                if (node && handler && handler.length) {
                    var expression = {
                        pos: node.getPos(),
                        value: handler[0].buildExpression(node)
                    };
                    _self.scheduleEmit("inspect", expression);
                }
            });
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
        
        var aggregateActions = {markers: [], hint: null, displayPos: null, enableRefactorings: []};
        
        function cursorMoved(currentNode, currentPos) {
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
        
        var currentPos = {line: pos.row, col: pos.column};
        if (this.cachedAst) {
            var ast = this.cachedAst;
            this.findNode(ast, currentPos, function(currentNode) {
                if (currentPos != _self.lastCurrentPos || currentNode !== _self.lastCurrentNode || pos.force) {
                    cursorMoved(currentNode, currentPos);
            }
            });
        } else {
            cursorMoved(null, currentPos);
        }
    };

    this.jumpToDefinition = function(event) {
        var pos = event.data;
        var _self = this;
            var ast = this.cachedAst;
        if (!ast && this.isParsingSupported())
            return;
        this.findNode(ast, {line: pos.row, col: pos.column}, function(currentNode) {
            asyncForEach(this.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language)) {
                    handler.jumpToDefinition(_self.doc, ast, pos, currentNode, function(result) {
                        if (result)
                            _self.sender.emit("jumpToDefinition", result);
                        next();
                    });
                }
                else {
                    next();
            }
            });
        });
    };

    this.sendVariablePositions = function(event) {
        var pos = event.data;
        var _self = this;
            var ast = this.cachedAst;
        if (!ast && this.isParsingSupported())
            return;
        this.findNode(ast, {line: pos.row, col: pos.column}, function(currentNode) {
            asyncForEach(_self.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language)) {
                    handler.getVariablePositions(_self.doc, ast, pos, currentNode, function(response) {
                        if (response)
                            _self.sender.emit("variableLocations", response);
                        next();
                    });
                }
                else {
                    next();
                }
            });
        });
    };
    
    this.onRenameBegin = function(event) {
        var _self = this;
        this.handlers.forEach(function(handler) {
			if (handler.handlesLanguage(_self.$language))
				handler.onRenameBegin(_self.doc, function() {});
		});
    };

    this.commitRename = function(event) {
        var _self = this;
        var data = event.data;

        var oldId = data.oldId;
        var newName = data.newName;
        var commited = false;

        asyncForEach(this.handlers, function(handler, next) {
            if (handler.handlesLanguage(_self.$language)) {
                handler.commitRename(_self.doc, oldId, newName, function(response) {
                    if (response) {
                        commited = true;
                        _self.sender.emit("refactorResult", response);
                    } else {
                        next();
                    }
                });
            }
            else
                next();
            }, function() {
            if (!commited)
                _self.sender.emit("refactorResult", {success: true});
            });
    };

    this.onRenameCancel = function(event) {
        var _self = this;
        asyncForEach(this.handlers, function(handler, next) {
            if (handler.handlesLanguage(_self.$language)) {
                handler.onRenameCancel(function() {
                    next();
                });
        }
            else
                next();
        });
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
        var _self = this;
        if (!this.$analyzeInterval) {
            this.$analyzeInterval = setInterval(function() {
                _self.analyze(function(){});
            }, 2000);
        }
        var oldPath = this.$path;
        code = code || "";
        this.$path = path;
        this.$language = language;
        this.cachedAst = null;
        this.lastCurrentNode = null;
        this.lastCurrentPos = null;
        this.setValue(code);
        asyncForEach(this.handlers, function(handler, next) {
            _self.$initHandler(handler, oldPath, next);
        });
    };
    
    this.$initHandler = function(handler, oldPath, callback) {
        if (!this.$path) // switchFile not called yet
            return callback();
        handler.path = this.$path;
        handler.language = this.$language;
        handler.onDocumentOpen(this.$path, this.doc, oldPath, callback);
    };
    
    this.documentClose = function(event) {
        if (this.$analyzeInterval) {
            clearInterval(this.$analyzeInterval);
            this.$analyzeInterval = null;
        }
        var path = event.data;
        asyncForEach(this.handlers, function(handler, next) {
            handler.onDocumentClose(path, next);
        });
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
        var _self = this;
        
        this.parse(function(ast) {
        var data = event.data;
        var pos = data.pos;
            var currentPos = { line: pos.row, col: pos.column };
            _self.findNode(ast, currentPos, function(node) {
                var currentNode = node;
                var matches = [];
        
            asyncForEach(_self.handlers, function(handler, next) {
                if (handler.handlesLanguage(_self.$language)) {
                        handler.staticPrefix = data.staticPrefix;
                        handler.complete(_self.doc, ast, data.pos, currentNode, function(completions) {
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
                    // Removed for the java completion result caching cases
                    // matches = matches.slice(0, 50); // 50 ought to be enough for everybody
                _self.sender.emit("complete", {
                    pos: pos,
                    matches: matches
                });
            });
        });
        });
    };

}).call(LanguageWorker.prototype);

});
