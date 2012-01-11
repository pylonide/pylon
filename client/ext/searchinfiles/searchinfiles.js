/**
 * Searchinfiles Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var editors = require("ext/editors/editors");
var ideConsole = require("ext/console/console");
var skin = require("text!ext/searchinfiles/skin.xml");
var markup = require("text!ext/searchinfiles/searchinfiles.xml");

module.exports = ext.register("ext/searchinfiles/searchinfiles", {
    name     : "Search in files",
    dev      : "Ajax.org",
    type     : ext.GENERAL,
    alone    : true,
    offline  : false,
    markup   : markup,
    skin     : {
        id   : "searchinfiles",
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
            rbSFSelection.setAttribute("label", "Selection ( " + name + " )");
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
        //ideConsole.show();
    },

    getSelectedTreeNode: function() {
        var node = self["trFiles"] ? trFiles.selected : require("ext/filesystem/filesystem").model.queryNode("folder[1]");
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder[1]");
        while (node.tagName != "folder")
            node = node.parentNode;
        return node;
    },

    toggleDialog: function(isReplace, forceShow) {
        ext.initExtension(this);

        if (apf.isWin && (location.host.indexOf("localhost") > -1 || location.host.indexOf("127.0.0.1") > -1)) {
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
        var editor = editors.currentEditor;
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
        var matchCase = "0";
        if (chkSFMatchCase.checked)
            matchCase = "1";
        var regex = "0";
        if (chkSFRegEx.checked)
            regex = "1";
        return {
            query: txtSFFind.value,
            pattern: ddSFPatterns.value,
            casesensitive: matchCase,
            regexp: regex
        };
    },

    execFind: function() {
        var _self = this;
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
            
        var findValueSanitized = txtSFFind.value.trim().replace(/([\[\]\{\}])/g, "\\$1");
        _self.$model.clear();
        trSFResult.setAttribute("empty-message", "Searching for '" + findValueSanitized + "'...");
        davProject.report(node.getAttribute("path"), "codesearch", this.getOptions(), function(data, state, extra){
            if (state !== apf.SUCCESS || !parseInt(data.getAttribute("count"), 10))
                return trSFResult.setAttribute("empty-message", "No results found for '" + findValueSanitized + "'");;

            _self.$model.load(data);
        });

        ide.dispatchEvent("track_action", {type: "searchinfiles"});
    },

    replaceAll: function() {
        return;
        /*if (!this.editor)
            this.setEditor();
        if (!this.$editor)
            return;
        this.$crtSearch = null;
        var options = this.getOptions();
        this.$editor.replaceAll(this.txtReplace.getValue() || "", options);
        ide.dispatchEvent("track_action", {type: "replace"});*/
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
