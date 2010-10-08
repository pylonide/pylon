/**
 * Gotoline Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/gotoline/gotoline",
    ["core/ide",
     "core/ext",
     "ace/PluginManager",
     "ace/Search",
     "text!ext/gotoline/skin.xml",
     "text!ext/gotoline/gotoline.xml"],
    function(ide, ext, plugins, search, skin, markup) {

return ext.register("ext/gotoline/gotoline", {
    name    : "Gotoline Window",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    skin    : skin,
    markup  : markup,
    
    hotkeys : {"gotoline":1},
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Go to Line",
                onclick : function(){
                    _self.toggleDialog(1);
                }
            }))
        );

        this.hotitems["gotoline"] = [this.nodes[1]];

        plugins.registerCommand("gotoline", function(editor, selection) {
            _self.toggleDialog(1);
        });
    },

    init : function(amlNode){
        var _self = this;
        lstLineNumber.addEventListener("afterchoose", function() {
            if (lstLineNumber.selected) {
                console.log();
                _self.gotoLine(parseInt(lstLineNumber.selected.getAttribute("nr")));
            }
            else
                _self.gotoLine();
        });
        lstLineNumber.addEventListener("afterselect", function() {
            if (this.selected)
                txtLineNr.setValue(this.selected.getAttribute("nr"));
        });
        
        var restricted = [38, 40, 36, 35]
        lstLineNumber.addEventListener("keydown", function(e) {
            if (e.keyCode == 13 && this.selected){
                return false;
            }
            else if (e.keyCode == 38) {
                if (this.selected == this.getFirstTraverseNode())
                    txtLineNr.focus();
            }
            else if (e.keyCode == 27){
                _self.toggleDialog(-1);
            }
            else if (restricted.indexOf(e.keyCode) == -1)
                txtLineNr.focus();
        }, true);
        
        txtLineNr.addEventListener("keydown", function(e) {
            if (e.keyCode == 13){
                _self.gotoLine();
                return false;
            }
            else if (e.keyCode == 27){
                _self.toggleDialog(-1);
                return false;
            }
            else if (e.keyCode == 40) {
                var first = lstLineNumber.getFirstTraverseNode();
                if (first) {
                    lstLineNumber.select(first);
                    lstLineNumber.focus();
                }
            }
            else if ((e.keyCode > 57 || e.keyCode == 32) && (e.keyCode < 96 || e.keyCode > 105))
                return false;
        });
        
        winGotoLine.addEventListener("blur", function(e){
            if (!apf.isChildOf(winGotoLine, e.toElement))
                _self.toggleDialog(-1);
        });
    },

    toggleDialog: function(force) {
        ext.initExtension(this);

        if (!force && !winGotoLine.visible || force > 0) {
            editorPage = tabEditors.getPage();
            if (!editorPage) return;
            
            var editor = require('ext/editors/editors').currentEditor;
            if (editor && editor.ceEditor) {
                var ace = editor.ceEditor.$editor;
                var cursor = ace.getCursorPosition();
                
                //Set the current line
                txtLineNr.setValue(cursor.row + 1);
                    
                //Determine the position of the window
                var pos = ace.renderer.textToScreenCoordinates(cursor.row, cursor.column);
                var epos = apf.getAbsolutePosition(editor.ceEditor.$ext);
                editor.ceEditor.parentNode.appendChild(winGotoLine);
                winGotoLine.setAttribute("left", 0);
                winGotoLine.setAttribute("top", pos.pageY - epos[1]);
            }
            
            winGotoLine.show();
            txtLineNr.focus();
        }
        else {
            winGotoLine.hide();
        }

        return false;
    },

    gotoLine: function(line) {
        var editor = require('ext/editors/editors').currentEditor;
        if (!editor || !editor.ceEditor)
            return;
        
        var ceEditor = editor.ceEditor;
        var ace      = ceEditor.$editor;

        winGotoLine.hide();

        if (typeof line != "number")
            line = parseInt(txtLineNr.getValue()) || 0;

        var history = lstLineNumber.$model;
        var gotoline, lineEl = history.queryNode("gotoline/line[@nr='" + line + "']");
        if (lineEl)
            gotoline = lineEl.parentNode;
        else {
            gotoline = apf.createNodeFromXpath(history.data, "gotoline") 
            lineEl   = apf.getXml("<line nr='" + line + "' />");
        }
        
        if (lineEl != gotoline.firstChild)
            apf.xmldb.appendChild(gotoline, lineEl, gotoline.firstChild);

        ace.gotoLine(line);
        ceEditor.focus();
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});