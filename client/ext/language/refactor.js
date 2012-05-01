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
    
    hook: function(ext, worker) {
        var _self = this;
        this.worker = worker;
        
        worker.on("enableRefactorings", function(event) {
            _self.enableRefactorings(event);
        });
        
        worker.on("variableLocations", function(event) {
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
        // Temporarily disable these markers, to prevent weird slow-updating events whilst typing
        marker.disableMarkerType('occurrence_main');
        marker.disableMarkerType('occurrence_other');
        var ace = Editors.currentEditor.amlEditor;
        var cursor = ace.getCursorPosition();
        var mainPos = data.pos;
        var p = new PlaceHolder(ace.session, data.length, mainPos, data.others, "language_rename_main", "language_rename_other");
        if(cursor.row !== mainPos.row || cursor.column < mainPos.column || cursor.column > mainPos.column + data.length) {
            // Cursor is not "inside" the main identifier, move it there
            ace.moveCursorTo(mainPos.row, mainPos.column);
        }
        p.showOtherMarkers();
        p.on("cursorLeave", function() {
            p.detach();
            marker.enableMarkerType('occurrence_main');
            marker.enableMarkerType('occurrence_other');
        });
    },
    
    renameVariable: function() {
        this.worker.emit("fetchVariablePositions", {data: editors.currentEditor.amlEditor.$editor.getCursorPosition()});
    },
    
    destroy : function(){
        commands.removeCommandByName("renameVar");
    }
};

});