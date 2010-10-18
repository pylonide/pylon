/**
 * Searchinfiles Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/searchinfiles/searchinfiles",
    ["core/ide",
     "core/ext",
     "core/util",
     "ace/PluginManager",
     "ace/Search",
     "ext/editors/editors",
     "ext/console/console",
     "text!ext/searchinfiles/searchinfiles.xml"],
    function(ide, ext, util, plugins, search, editors, console, markup) {

return ext.register("ext/searchinfiles/searchinfiles", {
    name     : "Search in files",
    dev      : "Ajax.org",
    type     : ext.GENERAL,
    alone    : true,
    markup   : markup,
    hotkeys  : {"searchinfiles":1},
    pageTitle: "Search Results",
    pageID   : "pgSFResults",
    hotitems : {},

    nodes    : [],

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
        this.txtFind       = txtSFFind;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        //this.txtReplace    = txtReplace;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        //bars
        //this.barReplace    = barReplace;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox[2]");
        //buttons
        //this.btnReplace    = btnReplace;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox/a:button[1]");
        //this.btnReplace.onclick = this.replace.bind(this);
        //this.btnReplaceAll = btnReplaceAll;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox/a:button[2]");
        //this.btnReplaceAll.onclick = this.replaceAll.bind(this);
        this.btnFind       = btnSFFind;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox/a:button[3]");
        this.btnFind.onclick = this.execFind.bind(this);

        var _self = this;
        winSearchInFiles.onclose = function() {
            ceEditor.focus();
        };
        winSearchInFiles.onshow = function() {
            // get selected node in tree and set it as selection
            var name = _self.getSelectedTreeNode().getAttribute("name");
            if (name.length > 25)
                name = name.substr(0, 22) + "...";
            rbSFSelection.setAttribute("label", "Selection ( " + name + " )")
        };
        trSFResult.addEventListener("afterselect", function(e) {
            var path,
                root = trFiles.xmlRoot.selectSingleNode("folder[1]"),
                node = trSFResult.selected,
                line = 0,
                text = "";
            if (node.tagName == "d:excerpt") {
                path = node.parentNode.getAttribute("path");
                line = node.getAttribute("line");
                text = node.parentNode.getAttribute("query");
            }
            else {
                path = node.getAttribute("path");
                text = node.getAttribute("query");
            }
            require("ext/debugger/debugger").showFile(root.getAttribute("path") + "/" + path, line, 0, text);
        });
    },

    getSelectedTreeNode: function() {
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder[1]");
        while (node.tagName != "folder")
            node = node.parentNode;
        return node;
    },

    toggleDialog: function(isReplace, forceShow) {
        ext.initExtension(this);

        if (apf.isWin) {
            return util.alert("Search in Files", "Not Supported",
                "I'm sorry, searching through files is not yet supported on the Windows platform.");
        }
        
        if (!winSearchInFiles.visible || forceShow || this.$lastState != isReplace) {
            //this.setupDialog(isReplace);
            var editor = editors.currentEditor;
            if (editor) {
                var value  = editor.getDocument().getTextRange(editor.getSelection().getRange());
                if (value)
                    this.txtFind.setValue(value);
            }
            winSearchInFiles.show();
        }
        else {
            winSearchInFiles.hide();
        }
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
            query: txtSFFind.value,
            pattern: ddSFPatterns.value,
            casesensitive: chkSFMatchCase.checked,
            regexp: chkSFRegEx.checked
        };
    },

    execFind: function() {
        winSearchInFiles.hide();
        // show the console (also used by the debugger):
        console.enable();
        if (!this.$panel) {
            this.$panel = tabConsole.add(this.pageTitle, this.pageID);
            this.$panel.appendChild(trSFResult);
            trSFResult.setProperty("visible", true);
            this.$model = trSFResult.getModel();
            var _self = this;
            // make sure the tab is shown when results come in
            this.$model.addEventListener("afterload", function() {
                tabConsole.set(_self.pageID);
            });
            // hide the debugger toolbar in the results tab
            tabConsole.addEventListener("beforeswitch", function(e) {
                tbDebug.setProperty("visible", (e.nextPage != _self.$panel));
            });
        }
        // show the tab
        tabConsole.set(this.pageID);
        var node = this.$currentScope = grpSFScope.value == "projects"
            ? trFiles.xmlRoot.selectSingleNode("folder[1]")
            : this.getSelectedTreeNode();
        this.$model.load("{davProject.report('" + node.getAttribute("path")
            + "', 'codesearch', " + JSON.stringify(this.getOptions()) + ")}");
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