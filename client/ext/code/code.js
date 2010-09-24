/**
 * Code Editor for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/code/code",
    ["core/ide", "core/ext", "text!ext/code/code.xml", "text!ext/code/settings.xml"],
    function(ide, ext, markup, settings) {

return ext.register("ext/code/code", {
    name    : "Code Editor",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    contentTypes : [
        "application/javascript",
        "application/json",
        "text/css",
        "application/xml",
        "text/plain",
        "application/x-httpd-php",
        "text/html",
        "application/xhtml+xml"
    ],
    markup  : markup,

    nodes : [],

    getSelection : function(){
        if (typeof ceEditor == "undefined")
            return null;
        return ceEditor.getSelection();
    },

    getDocument : function(){
        if (typeof ceEditor == "undefined")
            return null;
        return ceEditor.getDocument();
    },

    hook : function(){
        var commitFunc = this.onCommit.bind(this);
        //Settings Support
        ide.addEventListener("init.ext/settings/settings", function(e){
            var page = e.ext.addSection("Code Editor", "section[@name='Editor']", commitFunc);
            page.insertMarkup(settings);
        });
    },

    init : function(amlPage){
        amlPage.appendChild(barEditor);
        barEditor.show();

        this.ceEditor = ceEditor;

        var _self = this;

        this.nodes.push(
            //Add a panel to the statusbar showing whether the insert button is pressed
            sbMain.appendChild(new apf.section({
                caption : "{ceEditor.insert}"
            })),

            //Add a panel to the statusbar showing the length of the document
            sbMain.appendChild(new apf.section({
                caption : "Length: {ceEditor.value.length}"
            })),

            mnuView.appendChild(new apf.item({
                caption : "Syntax Highlighting",
                submenu : "mnuSyntax"
            })),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Column Mode",
                onclick : function(){

                }
            })),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Overwrite Mode",
                checked : "{ceEditor.overwrite}"
            })),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Select Full Line",
                checked : "{ceEditor.selectstyle == 'line'}",
                onclick : function(){
                    _self.toggleSetting("selectstyle");
                }
            })),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Read Only",
                checked : "{ceEditor.readonly}"
            })),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Highlight Active Line",
                checked : "{ceEditor.activeline}"
            })),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Show Invisibles",
                checked : "{ceEditor.showinvisibles}"
            })),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Show Print Margin",
                checked : "{ceEditor.showprintmargin}"
            }))
            // Wrap Lines (none),
            // Overwrite mode (overwrite),
            // Full line selection (selectstyle),
            // Read only (readonly),
            // Highlight active line (activeline),
            // Show invisibles (showinvisibles),
            // Show print margin (showprintmargin)
        );

        mnuSyntax.onitemclick = function(e) {
            ceEditor.setAttribute("syntax", e.relatedNode.value);
        };

        ide.addEventListener("clearfilecache", function(e){
            ceEditor.clearCacheItem(e.xmlNode);
        });

        ide.addEventListener("keybindingschange", function(e){
            if (!e.ext || typeof ceEditor == "undefined")
                return;
            var bindings = e.ext.code;
            ceEditor.$editor.keyBinding.setConfig(bindings);
        })
    },

    onCommit: function() {
        //console.log("commit func called!")
        //todo
    },

    toggleSetting: function(name) {
        if (typeof ceEditor == "undefined")
            return;
        if (name == "selectstyle") {
            ceEditor.setAttribute("selectstyle", ceEditor.selectstyle == "line" ? "text" : "line");
        }
    },

    enable : function() {
        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function() {
        this.nodes.each(function(item){
            item.hide();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });

        if (self.barEditor) {
            barEditor.destroy(true, true);
            mnuSyntax.destroy(true, true);
        }

        this.nodes = [];
    }
});

});