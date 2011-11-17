define(function(require, exports, module) {

var ide = require("core/ide");
var PlaceHolder = require("ace/placeholder").PlaceHolder;
var code = require("ext/code/code");
var marker = require("ext/language/marker");

module.exports = {
    refactorItem: null,
    worker: null,
    
    hook: function(ext, worker) {
        var _self = this;
        this.worker = worker;
        this.refactorItem = new apf.item({
            caption: "Rename variable",
            disabled: true,
            onclick: function() {
                _self.renameVariable();
            }
        });
        
        var nodes = [ide.mnuEdit.appendChild(new apf.divider()), ide.mnuEdit.appendChild(this.refactorItem)];
        
        worker.on("enableRefactorings", function(event) {
            _self.enableRefactorings(event);
        });
        
        worker.on("variableLocations", function(event) {
            _self.enableVariableRefactor(event.data);
        });
        
        code.commandManager.addCommand({
            name: "renameVar",
            exec: function(editor) {
                _self.renameVariable();
            }
        });
        
        ext.hotitems["renameVar"] = [nodes[1]];
        ext.nodes.push(nodes[0], nodes[1]);
    },
    
    enableRefactorings: function(event) {
        var names = event.data;
        var enableVariableRename = false;
        for (var i = 0; i < names.length; i++) {
            var name = names[i];
            if(name === 'renameVariable') {
                enableVariableRename = true;
            }
        }
        this.refactorItem.setAttribute('disabled', !enableVariableRename);
    },
    
    enableVariableRefactor: function(data) {
        console.log("Yeah!");
        marker.disableMarkerType('occurrence_main');
        marker.disableMarkerType('occurrence_other');
        var p = new PlaceHolder(ceEditor.$editor.session, data.length, data.pos, data.others, "language_rename_main", "language_rename_other");
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