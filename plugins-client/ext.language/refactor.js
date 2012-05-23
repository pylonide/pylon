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

module.exports = {
    renameVariableItem: null,
    worker: null,
    
    hook: function(ext, worker123) {
        var _self = this;
        this.worker = worker123;
        this.ext = ext;
        
        worker123.on("enableRefactorings", function(event) {
            if(ext.disabled) return;
            _self.enableRefactorings(event);
        });
        
        worker123.on("variableLocations", function(event) {
            if(ext.disabled) return;
            _self.enableVariableRefactor(event.data);
        });

        this.mnuItem = new apf.item({
            disabled: true,
            command : "renameVar"
        })

        ext.nodes.push(
            menus.addItemByPath("Tools/~", new apf.divider(), 10000),
            menus.addItemByPath("Tools/Rename Variable", this.mnuItem, 20000)
        );
        
        commands.addCommand({
            name: "renameVar",
            hint: "Rename variable",
            bindKey: {mac: "Option-Command-R", win: "Ctrl-Alt-R"},
            isAvailable : function(editor){
                return editor && editor.ceEditor;
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

        this.mnuItem.setAttribute('disabled', !enableVariableRename);
    },
    
    enableVariableRefactor: function(data) {
        var _self = this;
        // Temporarily disable these markers, to prevent weird slow-updating events whilst typing
        marker.disableMarkerType('occurrence_main');
        marker.disableMarkerType('occurrence_other');
        var ace = editors.currentEditor.amlEditor.$editor;
        var cursor = ace.getCursorPosition();
        var mainPos = data.pos;
        var p = new PlaceHolder(ace.session, data.length, mainPos, data.others, "language_rename_main", "language_rename_other");
        if(cursor.row !== mainPos.row || cursor.column < mainPos.column || cursor.column > mainPos.column + data.length) {
            // Cursor is not "inside" the main identifier, move it there
            ace.moveCursorTo(mainPos.row, mainPos.column);
        }
        p.showOtherMarkers();
        var continuousCompletionWasEnabled = this.ext.isContinuousCompletionEnabled();
        if(continuousCompletionWasEnabled)
            this.ext.setContinuousCompletionEnabled(false);
        p.on("cursorLeave", function() {
            p.detach();
            if(continuousCompletionWasEnabled)
                _self.ext.setContinuousCompletion(true);
            marker.enableMarkerType('occurrence_main');
            marker.enableMarkerType('occurrence_other');
        });
    },
    
    renameVariable: function() {
        if(this.ext.disabled) return;
        this.worker.emit("fetchVariablePositions", {data: editors.currentEditor.amlEditor.$editor.getCursorPosition()});
    },
    
    destroy : function(){
        commands.removeCommandByName("renameVar");
    }
};

});
