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
var linereport = require("ext/linereport/linereport_base");
var SyntaxDetector = require("ext/language/syntax_detector");

var isInWebWorker = typeof window == "undefined" || !window.location || !window.document;

var WARNING_LEVELS = {
    error: 3,
    warning: 2,
    info: 1
};

// Leaking into global namespace of worker, to allow handlers to have access
/*global disabledFeatures: true*/
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
    linereport.sender = sender;
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
    sender.on("jumpToDefinition", applyEventOnce(function(event) {
        _self.jumpToDefinition(event);
    }));
    sender.on("isJumpToDefinitionAvailable", applyEventOnce(function(event) {
        _self.isJumpToDefinitionAvailable(event);
    }));
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
    this.register = function(path, contents) {
        var _self = this;
        function onRegistered(handler) {
            handler.$source = path;
            handler.proxy = _self.serverProxy;
            handler.sender = _self.sender;
            _self.$initHandler(handler, null, function() {
                // Note: may not return for a while for asynchronous workers,
                //       don't use this for queueing other tasks
                _self.handlers.push(handler);
            });
        }
        if (contents) {
            // In the context of this worker, we can't use the standard
            // require.js approach of using <script/> tags to load scripts,
            // but need to load them from the local domain or from text
            // instead. For now, we'll just load external plugins from text;
            // the UI thread'll have to provide them in that format.
            // Note that this indirect eval call evaluates in the (worker)
            // global context.
            try {
                eval.call(null, contents);
            } catch (e) {
                console.log("Could not load language handler " + path);
                throw e;
            }
        }
        try {
            var handler = require(path);
            onRegistered(handler);
        } catch (e) {
            if (isInWebWorker)
                throw new Error("Could not load language handler " + path, e);
            // In ?noworker=1 debugging mode, synchronous require doesn't work
            require([path], function(handler) {
                if (!handler)
                    throw new Error("Could not load language handler " + path, e);
                onRegistered(handler);
            });
        }
    };

    this.parse = function(part, callback, allowCached) {
        var _self = this;
        part = part || {
            language: _self.$language,
            value: _self.doc.getValue()
        };

        if (allowCached && this.cachedAsts) {
            var cached = this.cachedAsts[part.index];
            if (cached && cached.part.language === part.language)
                return callback(cached.ast);
        }

        var resultAst = null;
        asyncForEach(this.handlers, function(handler, next) {
            if (handler.handlesLanguage(part.language)) {
                handler.parse(part.value, function onParse(ast) {
                    if(ast)
                        resultAst = ast;
                    next();
                });
            }
            else {
                next();
            }
        }, function() {
            callback(resultAst);
        });
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
        var rowColPos = {row: pos.line, column: pos.col};
        var part = SyntaxDetector.getContextSyntaxPart(_self.doc, rowColPos, _self.$language);
        var language = part.language;
        var posInPart = SyntaxDetector.posToRegion(part.region, rowColPos);
        posInPart = {line: posInPart.row, col: posInPart.column};
        var result;
        asyncForEach(_self.handlers, function(handler, next) {
            if (handler.handlesLanguage(language)) {
                handler.findNode(ast, posInPart, function(node) {
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
        this.parse(null, function(ast) {
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
        });
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
        var parts = SyntaxDetector.getCodeParts(this.doc, this.$language);
        var markers = [];
        var cachedAsts = {};
        asyncForEach(parts, function(part, nextPart) {
            var partMarkers = [];
            _self.parse(part, function(ast) {
                cachedAsts[part.index] = {part: part, ast: ast};

                asyncForEach(_self.handlers, function(handler, next) {
                    if (handler.handlesLanguage(part.language)) {
                        handler.analyze(part.value, ast, function(result) {
                            if (result){
                                handler.getResolutions(part.value, ast, result, function(result2){
                                    if (result2){
                                        partMarkers = partMarkers.concat(result2);
                                    }else{
                                        partMarkers = partMarkers.concat(result);
                                    }
                                });
                            }
                            next();
                        });
                    }
                    else {
                        next();
                    }
                }, function () {
                    filterMarkersAroundError(ast, partMarkers);
                    var region = part.region;
                    partMarkers.forEach(function (marker) {
                        var pos = marker.pos;
                        pos.sl = pos.el = pos.sl + region.sl;
                        if (pos.sl === region.sl) {
                            pos.sc +=  region.sc;
                            pos.ec += region.sc;
                        }
                    });
                    markers = markers.concat(partMarkers);
                    nextPart();
                });
            });
        }, function() {
            var extendedMakers = markers;
            if (_self.getLastAggregateActions().markers.length > 0)
                extendedMakers = markers.concat(_self.getLastAggregateActions().markers);
            _self.cachedAsts = cachedAsts;
            _self.scheduleEmit("markers", _self.filterMarkersBasedOnLevel(extendedMakers));
            _self.currentMarkers = markers;
            if (_self.postponedCursorMove) {
                _self.onCursorMove(_self.postponedCursorMove);
                _self.postponedCursorMove = null;
            }
            callback();
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

    this.getPart = function (pos) {
        return SyntaxDetector.getContextSyntaxPart(this.doc, pos, this.$language);
    };
    
    /**
     * Request the AST node on the current position
     */
    this.inspect = function (event) {
        var _self = this;
        var part = this.getPart({ row: event.data.row, column: event.data.col });
        this.parse(part, function(ast) {
            // find the current node based on the ast and the position data
            _self.findNode(ast, { line: event.data.row, col: event.data.col }, function(node) {
                // find a handler that can build an expression for this language
                var handler = _self.handlers.filter(function (h) {
                    return h.handlesLanguage(part.language) && h.buildExpression;
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
        }, true);
    };

    this.onCursorMove = function(event) {
        if(this.scheduledUpdate) {
            // Postpone the cursor move until the update propagates
            this.postponedCursorMove = event;
            return;
        }
        var pos = event.data;
        var part = this.getPart(pos);

        var _self = this;
        var hintMessage = ""; // this.checkForMarker(pos) || "";

        var aggregateActions = {markers: [], hint: null, displayPos: null, enableRefactorings: []};
        
        function cursorMoved(ast, currentNode, currentPos) {
            asyncForEach(_self.handlers, function(handler, next) {
                if (handler.handlesLanguage(part.language)) {
                    handler.onCursorMovedNode(_self.doc, ast, currentPos, currentNode, function(response) {
                        if (!response)
                            return next();
                        if (response.markers && response.markers.length > 0) {
                            aggregateActions.markers = aggregateActions.markers.concat(response.markers.map(function (m) {
                                var start = SyntaxDetector.regionToPos(part.region, {row: m.pos.sl, column: m.pos.sc});
                                var end = SyntaxDetector.regionToPos(part.region, {row: m.pos.el, column: m.pos.ec});
                                m.pos = {
                                    sl: start.row,
                                    sc: start.column,
                                    el: end.row,
                                    ec: end.column
                                };
                                return m;
                            }));
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
        var posInPart = SyntaxDetector.posToRegion(part.region, pos);
        this.parse(part, function(ast) {
            _self.findNode(ast, currentPos, function(currentNode) {
                if (currentPos != _self.lastCurrentPos || currentNode !== _self.lastCurrentNode || pos.force) {
                    cursorMoved(ast, currentNode, posInPart);
                }
            });
        }, true);
    };

    this.$getDefinitionDeclarations = function (row, col, callback) {
        var pos = { row: row, column: col };
        var allResults = [];

        var _self = this;
        var part = this.getPart(pos);

        this.parse(part, function(ast) {
            _self.findNode(ast, {line: pos.row, col: pos.column}, function(currentNode) {
                if (!currentNode)
                    return callback();
                
                asyncForEach(_self.handlers, function(handler, next) {
                    if (handler.handlesLanguage(part.language)) {
                        handler.jumpToDefinition(_self.doc, ast, pos, currentNode, function(results) {
                            if (results)
                                allResults = allResults.concat(results);
                            next();
                        });
                    }
                    else {
                        next();
                    }
                }, function () {
                    callback(allResults.map(function (pos) {
                       return SyntaxDetector.regionToPos(part.region, pos);
                    }));
                });
            });
        }, true);
    };

    this.jumpToDefinition = function(event) {
        var _self = this;
        var pos = event.data;

        _self.$getDefinitionDeclarations(pos.row, pos.column, function(results) {
            _self.sender.emit("definition", { pos: pos, results: results || [] });
        });
    };

    this.isJumpToDefinitionAvailable = function(event) {
        var _self = this;
        var pos = event.data;

        _self.$getDefinitionDeclarations(pos.row, pos.column, function(results) {
            _self.sender.emit("isJumpToDefinitionAvailableResult", { value: !!(results && results.length) });
        });
    };

    this.sendVariablePositions = function(event) {
        var pos = event.data;
        var _self = this;
        
        var part = this.getPart(pos);

        function regionToPos (pos) {
            return SyntaxDetector.regionToPos(part.region, pos);
        }

        var regionPos = SyntaxDetector.posToRegion(part.region, pos);

        this.parse(part, function(ast) {
            _self.findNode(ast, {line: pos.row, col: pos.column}, function(currentNode) {
                asyncForEach(_self.handlers, function(handler, next) {
                    if (handler.handlesLanguage(part.language)) {
                        handler.getVariablePositions(_self.doc, ast, regionPos, currentNode, function(response) {
                            if (response) {
                                response.uses = response.uses.map(regionToPos);
                                response.declarations = response.declarations.map(regionToPos);
                                response.others = response.others.map(regionToPos);
                                response.pos = regionToPos(response.pos);
                                _self.sender.emit("variableLocations", response);
                            }
                            next();
                        });
                    }
                    else {
                        next();
                    }
                });
            });
        }, true);
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

    this.switchFile = function(path, language, code, pos, workspaceDir) {
        var _self = this;
        var oldPath = this.$path;
        code = code || "";
        linereport.workspaceDir = this.$workspaceDir = workspaceDir;
        linereport.path = this.$path = path;
        this.$language = language;
        this.lastCurrentNode = null;
        this.lastCurrentPos = null;
        this.cachedAsts = null;
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
        handler.workspaceDir = this.$workspaceDir;
        handler.doc = this.doc;
        handler.sender = this.sender;
        handler.$completeUpdate = this.completeUpdate.bind(this);
        var _self = this;
        if (!handler.$isInited) {
            handler.$isInited = true;
            handler.init(function() {
                // Note: may not return for a while for asynchronous workers,
                //       don't use this for queueing other tasks
                handler.onDocumentOpen(_self.$path, _self.doc, oldPath, callback);
            });
        } else {
            handler.onDocumentOpen(_self.$path, _self.doc, oldPath, callback);
        }
    };

    this.documentOpen = function(path, language, code) {
        var _self = this;
        var doc = {getValue: function() {return code;} };
        asyncForEach(this.handlers, function(handler, next) {
            handler.onDocumentOpen(path, doc, _self.path, next);
        });
    };
    
    this.documentClose = function(event) {
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

        var data = event.data;
        var pos = data.pos;
        var part = SyntaxDetector.getContextSyntaxPart(_self.doc, data.pos, _self.$language);
        var language = part.language;
        this.parse(part, function(ast) {
            var currentPos = { line: pos.row, col: pos.column };
            _self.findNode(ast, currentPos, function(node) {
                var currentNode = node;
                var matches = [];

                asyncForEach(_self.handlers, function(handler, next) {
                    if (handler.handlesLanguage(language)) {
                            handler.staticPrefix = data.staticPrefix;
                            handler.language = language;
                            handler.workspaceDir = _self.$workspaceDir;
                            handler.complete(_self.doc, ast, data.pos, currentNode, function(completions) {
                            if (completions)
                                matches = matches.concat(completions);
                            next();
                        });
                    }
                    else {
                        next();
                    }
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
                    _self.sender.emit("complete", {
                        pos: pos,
                        matches: matches,
                        isUpdate: event.data.isUpdate,
                        line: _self.doc.getLine(pos.row)
                    });
                });
            });
        });
    };
    
    /**
     * Retrigger completion if the popup is still open and new
     * information is now available.
     */
    this.completeUpdate = function(pos) {
        if (!isInWebWorker) { // Avoid making the stack too deep in ?noworker=1 mode
            var _self = this;
            setTimeout(function onCompleteUpdate() {
                _self.complete({data: {pos: pos, staticPrefix: _self.staticPrefix, isUpdate: true}});
            }, 0);
        }
        else {
            this.complete({data: {pos: pos, staticPrefix: this.staticPrefix, isUpdate: true}});
        }
    };

}).call(LanguageWorker.prototype);

});
