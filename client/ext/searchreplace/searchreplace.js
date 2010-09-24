/**
 * Searchreplace Module for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/searchreplace/searchreplace",
    ["core/ide",
     "core/ext",
     "ace/PluginManager",
     "ace/Search",
     "text!ext/searchreplace/searchreplace.xml"],
    function(ide, ext, plugins, search, markup) {

return ext.register("ext/searchreplace/searchreplace", {
    name    : "Searchreplace",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    hotkeys : {"search":1, "searchreplace":1},
    hotitems: {},

    nodes   : [],

    init : function(amlNode){
        var _self = this;

        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Search",
                onclick : function() {
                    _self.toggleDialog(false);
                }
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Search & Replace",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }))
        );

        this.hotitems["search"] = [this.nodes[1]];
        this.hotitems["searchreplace"] = [this.nodes[2]];

        this.txtFind       = winSearchReplace.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        this.txtReplace    = winSearchReplace.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        //bars
        this.barReplace    = winSearchReplace.selectSingleNode("a:vbox/a:hbox[2]");
        //buttons
        this.btnReplace    = winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[1]");
        this.btnReplace.onclick = this.replace.bind(this);
        this.btnReplaceAll = winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[2]");
        this.btnReplaceAll.onclick = this.replaceAll.bind(this);
        this.btnFind       = winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[3]");
        this.btnFind.onclick = this.findNext.bind(this);
        this.btnClose      = winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[4]");
        this.btnClose.onclick = this.toggleDialog.bind(this);

        plugins.registerCommand("find", function(editor, selection) {
            _self.setEditor(editor, selection).toggleDialog(false, true);
        });
        plugins.registerCommand("replace", function(editor, selection) {
            _self.setEditor(editor, selection).toggleDialog(true, true);
        });
    },

    toggleDialog: function(isReplace, forceShow) {
        this.setupDialog(isReplace);
        if (!winSearchReplace.visible || forceShow)
            winSearchReplace.show();
        else
            winSearchReplace.hide();
        return false;
    },

    search: function() {
        return this.setEditor().toggleDialog(false, true);
    },

    searchreplace: function() {
        return this.setEditor().toggleDialog(true, true);
    },

    setupDialog: function(isReplace) {
        // hide all 'replace' features
        this.barReplace.setProperty("visible", isReplace);
        this.btnReplace.setProperty("visible", isReplace);
        this.btnReplaceAll.setProperty("visible", isReplace);
        return this;
    },

    setEditor: function(editor, selection) {
        if (typeof ceEditor == "undefined")
            return;
        this.$editor = editor || ceEditor.$editor;
        this.$selection = selection || this.$editor.getSelection();
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

    findNext: function() {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;
        var txt = this.txtFind.getValue();
        if (!txt)
            return;
        var options = this.getOptions();

        if (this.$crtSearch != txt) {
            this.$crtSearch = txt;
            // structure of the options:
            // {
            //     needle: "",
            //     backwards: false,
            //     wrap: false,
            //     caseSensitive: false,
            //     wholeWord: false,
            //     regExp: false
            // }
            this.$editor.find(txt, options);
        }
        else {
            this.$editor.findNext(options);
        }
    },

    replace: function() {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;
        if (!this.barReplace.visible)
            return;
        var options = this.getOptions();
        this.$editor.replace(this.txtReplace.getValue() || "", options);
        this.$editor.find(this.$crtSearch, options);
    },

    replaceAll: function() {
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