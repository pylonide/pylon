/**
 * Searchinfiles Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var Util = require("core/util");
var editors = require("ext/editors/editors");
var fs = require("ext/filesystem/filesystem");
var ideConsole = require("ext/console/console");
var skin = require("text!ext/searchinfiles/skin.xml");
var markup = require("text!ext/searchinfiles/searchinfiles.xml");

module.exports = ext.register("ext/searchinfiles/searchinfiles", {
    name     : "Search in files",
    dev      : "Ajax.org",
    type     : ext.GENERAL,
    alone    : true,
    offline  : false,
    replaceAll : false,
    markup   : markup,
    skin     : {
        id   : "searchinfiles",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/searchinfiles/images/"
    },
    commands  : {
        "searchinfiles": {hint: "search for a string through all files in the current workspace"}
    },
    pageTitle: "Search Results",
    pageID   : "pgSFResults",
    hotitems : {},

    nodes    : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Search in Files...",
                onclick : function() {
                    _self.toggleDialog(false);
                }
            }))
        );

        this.hotitems.searchinfiles = [this.nodes[1]];
    },

    init : function(amlNode){
        this.txtFind       = txtSFFind;
        this.btnFind       = btnSFFind;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox/a:button[3]");
        this.btnFind.onclick = this.execFind.bind(this, false);
        
        this.txtReplace     = txtReplace;
        this.btnReplaceAll = btnReplaceAll;
        this.btnReplaceAll.onclick = this.execFind.bind(this, true);

        var _self = this;
        
        this.txtFind.$ext.cols = this.txtFind.cols;
        
        winSearchInFiles.onclose = function() {
            if (typeof ceEditor != "undefined") {
                ceEditor.focus();
            }
            trFiles.removeEventListener("afterselect", _self.setSearchSelection);
        };
        winSearchInFiles.onshow = function() {
            trFiles.addEventListener("afterselect", _self.setSearchSelection);
            _self.setSearchSelection();
        };
        
        trSFHbox.addEventListener("afterrender", function(){
            trSFResult.addEventListener("afterselect", function(e) {
                var path,
                    root = trFiles.xmlRoot.selectSingleNode("folder[1]"),
                    node = trSFResult.selected,
                    line = 0,
                    text = "";
                if (node.tagName == "d:maxreached" || node.tagName == "d:querydetail")
                    return;
                if (node.tagName == "d:excerpt") {
                    path = node.parentNode.getAttribute("path");
                    line = node.getAttribute("line");
                    text = node.parentNode.getAttribute("query");
                }
                else {
                    path = node.getAttribute("path");
                    text = node.getAttribute("query");
                }
                editors.showFile(root.getAttribute("path") + "/" + path, line, 0, text);
            });
        });

        txtSFFind.addEventListener("keydown", function(e) {
            switch (e.keyCode){
                case 13: //ENTER
                    if (!e.shiftKey) {
                        _self.execFind(false);
                        return false;
                    }
                    break;
            }
        });
        //ideConsole.show();
    },
    
    setSearchSelection: function(e){
        var selectedNode;
        // If originating from an event
        if (e && e.selected)
            selectedNode = e.selected;
        else
            selectedNode = this.getSelectedTreeNode();
        
        var filepath = selectedNode.getAttribute("path").split("/");     	
        
        var name = "";
        // get selected node in tree and set it as selection
        if (selectedNode.getAttribute("type") == "folder") {
            name = filepath[filepath.length - 1];
        }
        else if (selectedNode.getAttribute("type") == "file") {
            name = filepath[filepath.length - 2];
        }
        
        if (name.length > 25) {
            name = name.substr(0, 22) + "...";
        }
        
        rbSFSelection.setAttribute("label", "Selection ( " + name + " )");
    },
    
    getSelectedTreeNode: function() {
        var node = self["trFiles"] ? trFiles.selected : fs.model.queryNode("folder[1]");
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder[1]");
        while (node.tagName != "folder")
            node = node.parentNode;
        return node;
    },

    toggleDialog: function(isReplace, forceShow) {
        ext.initExtension(this);

        if (apf.isWin && (location.host.indexOf("localhost") > -1 || location.host.indexOf("127.0.0.1") > -1)) {
            return Util.alert("Search in Files", "Not Supported",
                "I'm sorry, searching through files is not yet supported on the Windows platform.");
        }

        if (!winSearchInFiles.visible || forceShow || this.$lastState != isReplace) {
            var editor = editors.currentEditor;
            if (editor) {
                var value  = editor.getDocument().getTextRange(editor.getSelection().getRange());
                if (value)
                    this.txtFind.setValue(value);
            }

            ide.dispatchEvent("exitfullscreen");
            winSearchInFiles.show();
        }
        else {
            winSearchInFiles.hide();
        }
        return false;
    },

    onHide : function() {
        var editor = editors.currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.focus();
    },

    searchinfiles: function() {
        return this.toggleDialog(false, true);
    },

    getOptions: function() {
        var _self = this;

        var matchCase = "0";
        if (chkSFMatchCase.checked)
            matchCase = "1";
        var regex = "0";
        if (chkSFRegEx.checked)
            regex = "1";
            
        return {
            query: txtSFFind.value,
            needle: txtSFFind.value,
            pattern: ddSFPatterns.value,
            casesensitive: matchCase,
            regexp: regex,
            replaceAll: _self.replaceAll ? "true" : "false",
            replacement: txtReplace.value
        };
    },

    execFind: function(replaceEnabled) {
        var _self = this;
        _self.replaceAll = replaceEnabled;
        
        winSearchInFiles.hide();
        // show the console (also used by the debugger):
        ideConsole.show();
        if (!this.$panel) {
            this.$panel = tabConsole.add(this.pageTitle, this.pageID);
            this.$panel.setAttribute("closebtn", true);
            this.$panel.appendChild(trSFHbox);
            tabConsole.set(_self.pageID);
            trSFHbox.show();
            trSFResult.setProperty("visible", true);
            this.$model = trSFResult.getModel();
            // make sure the tab is shown when results come in
            this.$model.addEventListener("afterload", function() {
                tabConsole.set(_self.pageID);
            });

            this.$panel.addEventListener("afterclose", function(){
                this.removeNode();
                return false;
            });
        }
        else {
            tabConsole.appendChild(this.$panel);
        }
        // show the tab
        tabConsole.set(this.pageID);

        var node = this.$currentScope = grpSFScope.value == "projects"
            ? trFiles.xmlRoot.selectSingleNode("folder[1]")
            : this.getSelectedTreeNode();
            
        var options = this.getOptions();
        var query = txtSFFind.value;
        options.query = query.replace(/\n/g, "\\n");

        if (!_self.replaceAll) {
            options.replacement = ""; // even if there's text in the "replace" field, don't send it when not replacing   
        }
        
        var findValueSanitized = query.trim().replace(/([\[\]\{\}])/g, "\\$1");
        _self.$model.clear();
        trSFResult.setAttribute("empty-message", "Searching for '" + findValueSanitized + "'...");
        
        davProject.report(node.getAttribute("path"), "codesearch", options, function(data, state, extra){
            _self.replaceAll = false; // reset
            
            if (state !== apf.SUCCESS || !parseInt(data.getAttribute("count"), 10)) {
                var optionsDesc = [];
                if (Util.isTrue(options.casesensitive)) {
                    optionsDesc.push("case sensitive");
                }
                if (Util.isTrue(options.regexp)) {
                    optionsDesc.push("regexp");
                }
                
                if (optionsDesc.length > 0) {
                    optionsDesc = "(" + optionsDesc.join(", ") + ")";
                }
                else {
                    optionsDesc = "";
                }
                return trSFResult.setAttribute("empty-message", "No matches for '" + findValueSanitized + "' " + optionsDesc);
            }

            _self.$model.load(data);
        });

        ide.dispatchEvent("track_action", {type: "searchinfiles"});
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
