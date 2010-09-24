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
        this.txtFind.addEventListener("keydown", function(e) {
            if (e.keyCode == 13)
                _self.findNext();
        });
        this.txtReplace    = winSearchReplace.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        this.txtReplace.addEventListener("keydown", function(e) {
            if (e.keyCode == 13)
                _self.replace();
        });
        //bars
        this.barReplace    = winSearchReplace.selectSingleNode("a:vbox/a:hbox[2]");
        //buttons
        this.btnReplace    = winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[1]");
        this.btnReplace.onclick = this.replace.bind(this);
        this.btnReplaceAll = winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[2]");
        this.btnReplaceAll.onclick = this.replaceAll.bind(this);
        this.btnClose      = winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[3]");
        this.btnClose.onclick = this.toggleDialog.bind(this);
        this.btnFind       = winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[4]");
        this.btnFind.onclick = this.findNext.bind(this);

        plugins.registerCommand("find", function(editor, selection) {
            _self.setEditor(editor, selection).toggleDialog(false);
        });
        plugins.registerCommand("replace", function(editor, selection) {
            _self.setEditor(editor, selection).toggleDialog(true);
        });
    },

    toggleDialog: function(isReplace) {
        this.setupDialog(isReplace);
        if (!winSearchReplace.visible)
            winSearchReplace.show();
        else
            winSearchReplace.hide();
        return false;
    },

    search: function() {
        return this.setEditor().toggleDialog(false);
    },

    searchreplace: function() {
        return this.setEditor().toggleDialog(true);
    },

    setupDialog: function(isReplace) {
        // hide all 'replace' features
        this.barReplace.setProperty("visible", isReplace);
        this.btnReplace.setProperty("visible", isReplace);
        this.btnReplaceAll.setProperty("visible", isReplace);
        return this;
    },

    setEditor: function(editor, selection) {
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
        var options = this.getOptions();
        this.$editor.replace(this.txtReplace.getValue() || "", options);
        this.$editor.find(this.$crtSearch, options);
    },

    replaceAll: function() {
        if (!this.editor)
            this.setEditor();
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

    }
);