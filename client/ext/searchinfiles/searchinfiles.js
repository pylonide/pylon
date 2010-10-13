/**
 * Searchinfiles Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/searchinfiles/searchinfiles",
    ["core/ide",
     "core/ext",
     "ace/PluginManager",
     "ace/Search",
     "ext/editors/editors", 
     "text!ext/searchinfiles/searchinfiles.xml"],
    function(ide, ext, plugins, search, editors, markup) {

return ext.register("ext/searchinfiles/searchinfiles", {
    name    : "Search in files",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    hotkeys : {"searchinfiles":1},
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Search in Files",
                onclick : function() {
                    _self.toggleDialog(false);
                }
            }))
        );
        
        this.hotitems["searchinfiles"] = [this.nodes[1]];
    },

    init : function(amlNode){
        this.txtFind       = txtFind;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        //this.txtReplace    = txtReplace;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        //bars
        //this.barReplace    = barReplace;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox[2]");
        //buttons
        //this.btnReplace    = btnReplace;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox/a:button[1]");
        //this.btnReplace.onclick = this.replace.bind(this);
        //this.btnReplaceAll = btnReplaceAll;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox/a:button[2]");
        //this.btnReplaceAll.onclick = this.replaceAll.bind(this);
        this.btnFind       = btnFind;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox/a:button[3]");
        this.btnFind.onclick = this.execFind.bind(this);
        winSearchInFiles.onclose = function() {
            ceEditor.focus();
        }
    },

    toggleDialog: function(isReplace, forceShow) {
        ext.initExtension(this);
        
        if (!winSearchInFiles.visible || forceShow || this.$lastState != isReplace) {
            //this.setupDialog(isReplace);

            var editor = editors.currentEditor;
    
            var value = editor.getDocument().getTextRange(editor.getSelection().getRange());
            if (value)
                this.txtFind.setValue(value);

            winSearchInFiles.show();
        }
        else
            winSearchInFiles.hide();
        return false;
    },

    onHide : function() {
        var editor = require('ext/editors/editors').currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.focus();
    },

    searchinfiles: function() {
        return this.toggleDialog(false, true);
    },

    setupDialog: function(isReplace) {
        this.$lastState = isReplace;
        
        // hide all 'replace' features
        //this.barReplace.setProperty("visible", isReplace);
        //this.btnReplace.setProperty("visible", isReplace);
        //this.btnReplaceAll.setProperty("visible", isReplace);
        return this;
    },

    getOptions: function() {
        return {
            backwards: chkSearchBackwards.checked,
            wrap: chkWrapAround.checked,
            caseSensitive: !chkMatchCase.checked,
            wholeWord: chkWholeWords.checked,
            regExp: chkRegEx.checked,
            scope: chkSearchSelection.checked ? search.SELECTION : search.ALL
        };
    },

    execFind: function() {
        //
    },

    replaceAll: function() {
        return;
        if (!this.editor)
            this.setEditor();
        if (!this.$editor)
            return;
        this.$crtSearch = null;
        var options = this.getOptions();
        this.$editor.replaceAll(this.txtReplace.getValue() || "", options);
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