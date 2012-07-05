/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var baseLanguageHandler = require("ext/language/base_handler");
var completeUtil = require("ext/codecomplete/complete_util");

var handler = module.exports = Object.create(baseLanguageHandler);

var getFilePath = function(filePath) {
  var idx;
    if ((idx = filePath.indexOf("/workspace/")) != -1)
        filePath = filePath.substr(idx + 11);
    return filePath;
};

var calculateOffset = function(doc, cursorPos) {
    var offset = 0, newLineLength = doc.getNewLineCharacter().length;
    var prevLines = doc.getLines(0, cursorPos.row - 1);

    for (var i=0; i < prevLines.length; i++) {
      offset += prevLines[i].length;
      offset += newLineLength;
    }
    offset += cursorPos.column;

    return offset;
};

var calculatePosition = function(doc, offset) {
    var row = 0, column, newLineLength = doc.getNewLineCharacter().length;;
    while (offset > 0) {
      offset -= doc.getLine(row++).length;
      offset -= newLineLength; // consider the new line character(s)
    }
    if (offset < 0) {
      row--;
      offset += newLineLength; // add the new line again
      column = doc.getLine(row).length + offset;
    } else {
      column = 0;
    }
    return {
      row: row,
      column: column
    };
};

var convertToOutlineTree = function(doc, root) {
  var items = root.items, newItems = [];
  var start = calculatePosition(doc, root.offset);
  var end = calculatePosition(doc, root.offset + root.length);
  var newRoot = {
    icon: root.type,
    name: root.name,
    items: newItems,
    meta: root.meta,
    pos: {
      sl: start.row,
      sc: start.column,
      el: end.row,
      ec: end.column
    },
    modifiers: root.modifiers
  };
  for (var i = 0; i < items.length; i++) {
    newItems.push(convertToOutlineTree(doc, items[i]));
  }
  return newRoot;
};

var convertToHierarchyTree = function(doc, root) {
  var items = root.items, newItems = [];
  var newRoot = {
    icon: root.type,
    name: root.name,
    items: newItems,
    meta: root.meta,
    src: root.src
  };
  for (var i = 0; i < items.length; i++) {
    newItems.push(convertToHierarchyTree(doc, items[i]));
  }
  return newRoot;
};

(function() {

    this.$saveFileAndDo = function(callback) {
      var todos = this.todos = this.todos || [];
      callback && todos.push(callback);

      if (this.refactorInProgress)
        return console.log("waiting refactor to finish");
      var sender = this.sender;
      var doCallbacks = function(status) {
        while (todos.length > 0)
          todos.pop()(status);
      };
      var checkSavingDone = function(event) {
        var data = event.data;
          if (data.command != "save")
            return;
          sender.removeEventListener("commandComplete", checkSavingDone);
          if (! data.success) {
            console.log("Couldn't save the file !!");
            return doCallbacks(false);
          }
          doCallbacks(true);
      };
      sender.addEventListener("commandComplete", checkSavingDone);
      sender.emit("commandRequest", { command: "save" });
    };

    this.handlesLanguage = function(language) {
        return language === "java";
    };

    this.complete = function(doc, fullAst, cursorPos, currentNode, callback) {
        var _self = this;
        var doComplete = function(savingDone) {
          if (! savingDone)
            return callback([]);
          // The file has been saved, proceed to code complete request
          var offset = calculateOffset(doc, cursorPos);
          var command = {
            command : "jvmfeatures",
            subcommand : "complete",
            project: _self.project,
            file : getFilePath(_self.path),
            offset: offset
          };
          _self.proxy.once("result", "jvmfeatures:complete", function(message) {
            callback(message.body || []);
          });
          _self.proxy.send(command);
        };

        this.$saveFileAndDo(doComplete);
    };

    this.onCursorMovedNode = function(doc, fullAst /*null*/, cursorPos, currentNode /*null*/, callback) {
        
        var _self = this;
        var markers = [];
        var enableRefactorings = [];

        var line = doc.getLine(cursorPos.row);
        var identifier = completeUtil.retrieveFullIdentifier(line, cursorPos.column);
        if (! identifier)
          return callback();

        var offset = calculateOffset(doc, { row: cursorPos.row, column: identifier.sc } );
        var length = identifier.text.length;
        // console.log("cursor: " + cursorPos.row + ":" + cursorPos.column + " & offset: " + offset + " & length: " + identifier.text.length);
        var command = {
          command : "jvmfeatures",
          subcommand : "get_locations",
          project: _self.project,
          file : getFilePath(_self.path),
          offset: offset,
          length: length
        };

        var doGetVariablePositions = function(savingDone) {
          if (! savingDone)
            return callback();

          _self.proxy.once("result", "jvmfeatures:get_locations", function(message) {
            if (! message.success)
              return callback();
            var v = message.body;
            highlightVariable(v);
            enableRefactorings.push("renameVariable");
            doneHighlighting();
          });
          console.log("command: " + JSON.stringify(command));
          _self.proxy.send(command);
        };

        function highlightVariable(v) {
            if (!v)
                return callback();
            v.declarations.forEach(function(match) {
                var pos = calculatePosition(doc, match.offset);
                markers.push({
                    pos: {
                      sl: pos.row, el: pos.row,
                      sc: pos.column, ec: pos.column + length
                    },
                    type: 'occurrence_main'
                });
            });
            v.uses.forEach(function(match) {
                var pos = calculatePosition(doc, match.offset);
                markers.push({
                    pos: {
                      sl: pos.row, el: pos.row,
                      sc: pos.column, ec: pos.column + length
                    },
                    type: 'occurrence_other'
                });
            });
        }

        function doneHighlighting() {
          /*if (! _self.isFeatureEnabled("instanceHighlight"))
            return callback({ enableRefactorings: enableRefactorings });*/

          callback({
              markers: markers,
              enableRefactorings: enableRefactorings
          });
        }

        this.$saveFileAndDo(doGetVariablePositions);
    };

    this.getVariablePositions = function(doc, fullAst /*null*/, pos, currentNode /*null*/, callback) {
        var _self = this;

        var line = doc.getLine(pos.row);
        var identifier = completeUtil.retrieveFullIdentifier(line, pos.column);
        var offset = calculateOffset(doc, { row: pos.row, column: identifier.sc } );
        var command = {
          command : "jvmfeatures",
          subcommand : "get_locations",
          project: _self.project,
          file : getFilePath(_self.path),
          offset: offset,
          length: identifier.text.length
        };

        var doGetVariablePositions = function(savingDone) {
          if (! savingDone)
            return callback();

            _self.proxy.once("result", "jvmfeatures:get_locations", function(message) {
            
            if (! message.success)
              return callback();
            var v = message.body;
            var elementPos = {column: identifier.sc, row: pos.row};
            var others = [];

            var appendToOthers = function(match) {
               if(offset !== match.offset) {
                  var pos = calculatePosition(doc, match.offset);
                  others.push(pos);
                }
            };

            v.declarations.forEach(appendToOthers);
            v.uses.forEach(appendToOthers);

            callback({
                length: identifier.text.length,
                pos: elementPos,
                others: others
            });
          });
          _self.proxy.send(command);
        };

        this.$saveFileAndDo(doGetVariablePositions);
    };

    this.commitRename = function(doc, oldId, newName, callback) {
        var _self = this;

        var offset = calculateOffset(doc, oldId);

        var command = {
          command : "jvmfeatures",
          subcommand : "refactor",
          project: _self.project,
          file : getFilePath(_self.path),
          offset: offset,
          newname: newName,
          length: oldId.text.length
        };

        // console.log("commitRename called");

        this.proxy.once("result", "jvmfeatures:refactor", function(message) {
          _self.refactorInProgress = false;
          _self.$saveFileAndDo(); // notify of ending the refactor
          // Error handling in the callback
          callback({success: message.success, body: message.body});
        });
        this.proxy.send(command);
    };

    this.onRenameCancel = function(callback) {
        this.refactorInProgress = false;
        this.$saveFileAndDo(); // notify of ending the refactor
        callback();
    };

    this.outline = function(doc, fullAst /*null*/, callback) {
        var _self = this;
        var command = {
          command : "jvmfeatures",
          subcommand : "outline",
          project: _self.project,
          file : getFilePath(_self.path)
        };

        var doGetOutline = function() {
          _self.proxy.once("result", "jvmfeatures:outline", function(message) {
            var outline = null;
            if (! message.success)
              console.log("FAILED: outline call");
            else
              outline = convertToOutlineTree(doc, message.body);
            // Error handling in the callback
            callback({error: !message.success, body: outline && outline.items});
          });
          _self.proxy.send(command);
        };

        this.$saveFileAndDo(doGetOutline);
    };

    this.hierarchy = function(doc, cursorPos, callback) {
        var _self = this;
        var offset = calculateOffset(doc, cursorPos);
        var command = {
          command : "jvmfeatures",
          subcommand : "hierarchy",
          project: _self.project,
          file : getFilePath(_self.path),
          offset: offset
        };

        var line = doc.getLine(cursorPos.row);
        var identifier = completeUtil.retrieveFullIdentifier(line, cursorPos.column);
        if (identifier)
          command.type = identifier.text;

        var doGetHierarchy = function() {
          _self.proxy.once("result", "jvmfeatures:hierarchy", function(message) {
            // Super and subtype hierarchies roots
            var result = message.body;
            var hierarchy;
            if (! message.success) {
              console.log("FAILED: hierarchy call");
            } else {
              hierarchy = [convertToHierarchyTree(doc, result[0]),
                convertToHierarchyTree(doc, result[1])];
            }
            // Error handling in the callback
            callback({success: message.success, body: hierarchy});
          });
          _self.proxy.send(command);
        };

        this.$saveFileAndDo(doGetHierarchy);
    };

    this.analysisRequiresParsing = function() {
        return false;
    };

     this.analyze = function(doc, fullAst /* null */, callback) {
        var _self = this;
        var command = {
          command : "jvmfeatures",
          subcommand : "analyze_file",
          project: _self.project,
          file : getFilePath(_self.path)
        };

        // console.log("analyze_file called");

        var doAnalyzeFile = function() {
          _self.proxy.once("result", "jvmfeatures:analyze_file", function(message) {
            if (message.success) {
              callback(message.body.map(function(marker) {
                var start = calculatePosition(doc, marker.offset);
                var end = calculatePosition(doc, marker.offset + marker.length);
                return {
                  pos: {
                    sl: start.row,
                    sc: start.column,
                    el: end.row,
                    ec: end.column
                  },
                  level: marker.level,
                  type: marker.type,
                  message: marker.message
                };
              }));
            } else {
              console.log("FAILED: analyze call");
              callback();
            }
          });
          _self.proxy.send(command);
        };

        this.$saveFileAndDo(doAnalyzeFile);
    };

    this.codeFormat = function(doc, callback) {
        var _self = this;
        var command = {
          command : "jvmfeatures",
          subcommand : "code_format",
          project: _self.project,
          file : getFilePath(_self.path)
        };

        var doGetNewSource = function() {
          _self.proxy.once("result", "jvmfeatures:code_format", function(message) {
            callback(message.success ? message.body : null);
          });
          _self.proxy.send(command);
        };

        this.$saveFileAndDo(doGetNewSource);
    };

}).call(handler);

});
