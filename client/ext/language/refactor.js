/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var PlaceHolder = require("ace/placeholder").PlaceHolder;
var marker = require("ext/language/marker");
var ide = require("core/ide");
var code = require("ext/code/code");

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

        var nodes = [];
        this.refactorItem = new apf.item({
            caption: "Rename variable",
            disabled: true,
            onclick: function() {
                _self.renameVariable();
            }
        });
        
        var mnuRefactor = new apf.menu({id: "mnuRefactor"});
        apf.document.body.appendChild(mnuRefactor);
        
        nodes.push(mnuRefactor.appendChild(this.refactorItem));
        var refactorItem = new apf.item({
            caption: "Refactor",
            submenu: "mnuRefactor"
        });
        nodes.push(ide.mnuEdit.appendChild(refactorItem));
        
        code.commandManager.addCommand({
            name: "renameVar",
            exec: function(editor) {
                _self.renameVariable();
            }
        });
        
        ext.hotitems.renameVar = [nodes[0]];
        ext.nodes.push(nodes[0], nodes[1]);
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
        this.refactorItem.setAttribute('disabled', !enableVariableRename);
    },
    
    enableVariableRefactor: function(data) {
        // Temporarily disable these markers, to prevent weird slow-updating events whilst typing
        marker.disableMarkerType('occurrence_main');
        marker.disableMarkerType('occurrence_other');
        var cursor = ceEditor.$editor.getCursorPosition();
        var mainPos = data.pos;
        var p = new PlaceHolder(ceEditor.$editor.session, data.length, mainPos, data.others, "language_rename_main", "language_rename_other");
        if(cursor.row !== mainPos.row || cursor.column < mainPos.column || cursor.column > mainPos.column + data.length) {
            // Cursor is not "inside" the main identifier, move it there
            ceEditor.$editor.moveCursorTo(mainPos.row, mainPos.column);
        }
        p.showOtherMarkers();
        p.on("cursorLeave", function() {
            p.detach();
            marker.enableMarkerType('occurrence_main');
            marker.enableMarkerType('occurrence_other');
        });
    },
    
    renameVariable: function() {
        this.worker.emit("fetchVariablePositions", {data: ceEditor.$editor.getCursorPosition()});
    }
};

});