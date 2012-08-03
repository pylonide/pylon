/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var editors = require("ext/editors/editors");
var PlaceHolder = require("ace/placeholder").PlaceHolder;
var marker = require("ext/language/marker");
var ide = require("core/ide");
var code = require("ext/code/code");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");

var ID_REGEX = /[a-zA-Z_0-9\$]/;
var oldCommandKey;

var retrieveFullIdentifier = function(text, pos) {
    var buf = [];
    var i = pos >= text.length ? (text.length - 1) : pos;
    while (i < text.length && ID_REGEX.test(text[i]))
        i++;
    // e.g edge semicolon check
    i = pos == text.length ? i : i-1;
    for (; i >= 0 && ID_REGEX.test(text[i]); i--) {
        buf.push(text[i]);
    }
    i++;
    text = buf.reverse().join("");
    if (text.length === 0)
        return null;
    return {
        sc: i,
        text: text
    };
};

module.exports = {
    renameVariableItem: null,
    worker: null,
    
    hook: function(ext, worker) {
        var _self = this;
        this.ext = ext;
        this.worker = worker;

        worker.on("enableRefactorings", function(event) {
            if(ext.disabled) return;

            _self.enableRefactorings(event);
        });

        worker.on("variableLocations", function(event) {
            if(ext.disabled) return;

            _self.enableVariableRefactor(event.data);
            worker.emit("onRenameBegin", {data: {}});
        });

        worker.on("refactorResult", function(event) {
            var data = event.data;
            if (! data.success) {
                console.log("REFACTOR ERROR & msg: ", data.body); // TODO pop up a dialog
                _self.onRenameCancel();
            } else {
                _self.placeHolder.detach();
            }
            _self.$cleanup();
        });

        this.mnuItem = new apf.item({
            disabled: true,
            command : "renameVar"
        });

        ext.nodes.push(
            menus.addItemByPath("Tools/~", new apf.divider(), 10000),
            menus.addItemByPath("Tools/Rename Variable", this.mnuItem, 20000)
        );
        
        var command = commands.addCommand({
            name: "renameVar",
            hint: "Rename variable",
            bindKey: {mac: "Option-Command-R", win: "Ctrl-Alt-R"},
            isAvailable : function(editor) {
                return editor && editor.amlEditor && _self.enableVariableRename;
            },
            exec: function(editor) {
                if(ext.disabled) return;
                _self.renameVariable();
            }
        });

    },
    
    enableRefactorings: function(event) {
        var names = event.data;
        var enableVariableRename = false;
        for (var i = 0; i < names.length; i++) {
            var name = names[i];
            if (name === 'renameVariable') {
                enableVariableRename = true;
            }
        }
        this.enableVariableRename = enableVariableRename;
    },
    
    enableVariableRefactor: function(data) {
        var _self = this;

        // Temporarily disable these markers, to prevent weird slow-updating events whilst typing
        marker.disableMarkerType('occurrence_main');
        marker.disableMarkerType('occurrence_other');
        var ace = editors.currentEditor.amlEditor.$editor;
        var cursor = ace.getCursorPosition();

        var mainPos = data.pos;
        // Exclude the main position from others
        var others = data.others.filter(function (o) {
            return !(o.row === mainPos.row && o.column === mainPos.column);
        });
        var p = this.placeHolder = new PlaceHolder(ace.session, data.length, mainPos, others, "language_rename_main", "language_rename_other");
        if(cursor.row !== mainPos.row || cursor.column < mainPos.column || cursor.column > mainPos.column + data.length) {
            // Cursor is not "inside" the main identifier, move it there
            ace.moveCursorTo(mainPos.row, mainPos.column);
        }
        p.showOtherMarkers();
        if(this.ext.isContinuousCompletionEnabled())
            this.ext.setContinuousCompletionEnabled(false);
        
        // Monkey patch
        if(!oldCommandKey) {
            oldCommandKey = ace.keyBinding.onCommandKey;
            ace.keyBinding.onCommandKey = this.onKeyPress.bind(this);
        }

        if(this.ext.isContinuousCompletionEnabled())
            this.ext.setContinuousCompletionEnabled(false);
        p.on("cursorLeave", function() {
            _self.commitRename();
        });
    },

    renameVariable: function() {
        var amlEditor = editors.currentEditor.amlEditor;
        var ace = amlEditor.$editor;

        ace.focus();
        var curPos = ace.getCursorPosition();
        var doc = amlEditor.getDocument();
        var line = doc.getLine(curPos.row);
        var oldId = retrieveFullIdentifier(line, curPos.column);
        this.oldIdentifier = {
            column: oldId.sc,
            row: curPos.row,
            text: oldId.text
        };
        this.worker.emit("fetchVariablePositions", {data: curPos});
    },

    commitRename: function() {
        // Finished refactoring in editor
        // -> continue with the worker giving the initial refactor cursor position
        var doc = editors.currentEditor.amlEditor.getDocument();
        var oPos = this.placeHolder.pos;
        var line = doc.getLine(oPos.row);
        var newIdentifier = retrieveFullIdentifier(line, oPos.column);
        this.worker.emit("commitRename", {data: { oldId: this.oldIdentifier, newName: newIdentifier.text } });
    },

    onRenameCancel: function() {
        if (this.placeHolder) {
            this.placeHolder.detach();
            this.placeHolder.cancel();
        }
        this.worker.emit("onRenameCancel", {data: {}});
    },

    $cleanup: function() {
        if(this.ext.isContinuousCompletionEnabled())
            this.ext.setContinuousCompletionEnabled(true);
        marker.enableMarkerType('occurrence_main');
        marker.enableMarkerType('occurrence_other');
        this.placeHolder = null;
        this.oldIdentifier = null;
        if(oldCommandKey) {
            editors.currentEditor.amlEditor.$editor.keyBinding.onCommandKey = oldCommandKey;
            oldCommandKey = null;
        }
    },

    onKeyPress : function(e, hashKey, keyCode) {
        var keyBinding = editors.currentEditor.amlEditor.$editor.keyBinding;

        switch(keyCode) {
            case 32: // Space can't be accepted as it will ruin the logic of retrieveFullIdentifier
            case 27: // Esc
                this.onRenameCancel();
                e.preventDefault();
                break;
            case 13: // Enter
                this.commitRename();
                e.preventDefault();
                break;
            default:
                oldCommandKey.apply(keyBinding, arguments);
                break;
        }
    },

    destroy : function(){
        commands.removeCommandByName("renameVar");
    }
};

});
