/**
 * jumptodef Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*global tabEditors mnuCtxEditor mnuCtxEditorJumpToDef */
define(function(require, exports, module) {

var ide = require("core/ide");
var editors = require("ext/editors/editors");
var commands = require("ext/commands/commands");
var util = require("ext/codecomplete/complete_util");
var menus = require("ext/menus/menus");

var CRASHED_JOB_TIMEOUT = 30000;

module.exports = {
    nodes : [],

    removeSpinnerNodes: [],

    hook : function(language, worker){
        var _self = this;
        _self.worker = worker;

        commands.addCommand({
            name : "jumptodef",
            bindKey: {mac: "F3", win: "F3"},
            hint: "jump to the definition of the variable or function that is under the cursor",
            isAvailable : function(editor){
                return editor && editor.path == "ext/code/code";
            },
            exec: function(){
                _self.jumptodef();
            }
        });

        // right click context item in ace
        ide.addEventListener("init.ext/code/code", function() {
            _self.nodes.push(
                mnuCtxEditor.insertBefore(new apf.divider({
                    visible : "{mnuCtxEditorJumpToDef.visible}"
                }), mnuCtxEditor.firstChild),
                mnuCtxEditor.insertBefore(new apf.item({
                    id : "mnuCtxEditorJumpToDef",
                    caption : "Jump to Definition",
                    command: "jumptodef"
                }), mnuCtxEditor.firstChild),
                menus.addItemByPath("Goto/Jump to Definition", new apf.item({
                    caption : "Jump to Definition",
                    command: "jumptodef"
                }), 899)
            );

            // when the context menu pops up we'll ask the worker whether we've
            // jumptodef available here
            apf.addListener(mnuCtxEditor, "prop.visible", function(ev) {
                // only fire when visibility is set to true
                if (ev.value) {
                    // because of delays we'll enable by default
                    mnuCtxEditorJumpToDef.enable();
                    _self.checkIsJumpToDefAvailable();
                }
            });
        });

        // listen to the worker's response
        worker.on("definition", function(e) {
            _self.onDefinitions(e);
        });

        // when the analyzer tells us if the jumptodef result is available
        // we'll disable/enable the jump to definition item in the ctx menu
        worker.on("isJumpToDefinitionAvailableResult", function(ev) {
            if (ev.data.value) {
                mnuCtxEditorJumpToDef.enable();
            }
            else {
                mnuCtxEditorJumpToDef.disable();
            }
        });
    },

    $getFirstColumn: function(row) {
        var editor = editors.currentEditor;
        if (!editor || editor.path != "ext/code/code" || !editor.amlEditor)
            return 0;
        var line = editor.getDocument().getLine(row);
        if (!line)
            return 0;
        return line.match(/^(\s*)/)[1].length;
    },

    /**
     * Fire an event to the worker that asks whether the jumptodef is available for the
     * current position.
     * Fires an 'isJumpToDefinitionAvailableResult' event on the same channel when ready
     */
    checkIsJumpToDefAvailable: function () {
        var editor = editors.currentEditor;
        if (!editor || editor.path != "ext/code/code" || !editor.amlEditor)
            return;

        this.worker.emit("isJumpToDefinitionAvailable", { data: editor.getSelection().getCursor() });
    },

    jumptodef: function() {
        var editor = editors.currentEditor;
        if (!editor || editor.path != "ext/code/code" || !editor.amlEditor)
            return;

        this.activateSpinner();

        var sel = editor.getSelection();
        var pos = sel.getCursor();

        this.worker.emit("jumpToDefinition", {
            data: pos
        });
    },

    onDefinitions : function(e) {
        this.clearSpinners();

        var results = e.data.results;

        var editor = editors.currentEditor;
        if (!editor || editor.path != "ext/code/code" || !editor.amlEditor)
            return;

        if (!results.length)
            return this.onJumpFailure(e, editor);

        // We have no UI for multi jumptodef; we just take the last for now
        var lastResult;
        for (var i = results.length - 1; i >=0; i--) {
            lastResult = results[results.length - 1];
            if (!lastResult.isDeferred)
                break;
        }

        var _self = this;
        var path = lastResult.path ? ide.davPrefix.replace(/[\/]+$/, "") + "/" + lastResult.path : undefined;

        editors.gotoDocument({
            getColumn: function() {
                return lastResult.column !== undefined ? lastResult.column : _self.$getFirstColumn(lastResult.row);
            },
            row: lastResult.row + 1,
            node: path ? undefined : ide.getActivePage().xmlRoot,
            animate: true,
            path: path
        });
    },

    onJumpFailure : function(event, editor) {
        var cursor = editor.getSelection().getCursor();
        var oldPos = event.data.pos;
        if (oldPos.row !== cursor.row || oldPos.column !== cursor.column)
            return;
        var line = editor.getDocument().getLine(oldPos.row);
        if (!line)
            return;
        var preceding = util.retrievePrecedingIdentifier(line, cursor.column);
        var column = cursor.column - preceding.length;
        if (column === oldPos.column)
            column = this.$getFirstColumn(cursor.row);
        var newPos = { row: cursor.row, column: column };
        editor.getSelection().setSelectionRange({ start: newPos, end: newPos });
    },

    activateSpinner : function() {
        try {
            var node = ide.getActivePage().$doc.getNode();
            apf.xmldb.setAttribute(node, "lookup", "1");
            this.removeSpinnerNodes.push(node);
            var _self = this;
            setTimeout(function() {
                _self.clearSpinners();
            }, CRASHED_JOB_TIMEOUT);
        } catch (e) {
            // Whatever, some missing non-critical UI
            console.error(e);
        }
    },

    clearSpinners : function() {
        this.removeSpinnerNodes.forEach(function(node) {
            apf.xmldb.removeAttribute(node, "lookup");
        });
        this.removeSpinnerNodes = [];
    }

};
});
