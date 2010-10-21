/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/code/code",
    ["core/ide", 
     "core/ext", 
     "text!ext/code/code.xml",
     "text!ext/code/settings.xml",
     "ace/Document", 
     "ace/theme/TextMate" // preload default theme
    ],
    function(ide, ext, markup, settings, Document) {

apf.actiontracker.actions.aceupdate = function(undoObj, undo){
    var q = undoObj.args;
    
    if (!undoObj.initial) {
        undoObj.initial = true;
        return;
    }
    
    if (undo)
        q[1].undoChanges(q[0]);
    else
        q[1].redoChanges(q[0]);
};

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
    
    setDocument : function(doc, actiontracker){
        if (!doc.acedoc) {
            var _self = this;

            doc.isInited = doc.hasValue();
            doc.acedoc = new Document(doc.getValue() || "");
            doc.acedoc.setUndoManager(actiontracker);//new UndoManager());
            
            doc.addEventListener("prop.value", function(e){
                doc.acedoc.setValue(e.value || "");
                doc.isInited = true;
            });
            
            doc.addEventListener("retrievevalue", function(e){
                if (!doc.isInited) return e.value;
                else return doc.acedoc.toString();
            });
            
            doc.addEventListener("close", function(){
                //??? destroy doc.acedoc
            });
        }

        ceEditor.setProperty("value", doc.acedoc);
    },

    hook : function(){
        var commitFunc = this.onCommit.bind(this),
            name       = this.name;
        
        //Settings Support
        ide.addEventListener("init.ext/settings/settings", function(e){
            var page = e.ext.addSection("code", name, "editors", commitFunc);
            page.insertMarkup(settings);
        });
    },

    init : function(amlPage) {
        var def = ceEditor.getDefaults();
        //check default settings...
        var settings = require("ext/settings/settings"),
            model    = settings.model,
            base     = model.data.selectSingleNode("editors/code");
        if (!base)
            base = model.appendXml('<code name="' + this.name +'" page="' + settings.getSectionId(this.name) + '" />', "editors");
        // go through all default settings and append them to the XML if they're not there yet
        for (var prop in def) {
            if (!prop) continue;
            if (!base.getAttribute(prop))
                base.setAttribute(prop, def[prop]);
        }
        apf.xmldb.applyChanges("synchronize", base);

        amlPage.appendChild(ceEditor);
        ceEditor.show();

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

            /*mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Overwrite Mode",
                checked : "{ceEditor.overwrite}"
            })),*/

            mnuView.appendChild(new apf.divider()),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Select Full Line",
                checked : "{[{require('ext/settings/settings').model}::editors/code/@selectstyle] == 'line'}",
                onclick : function(){
                    _self.toggleSetting("selectstyle");
                }
            })),

            /*mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Read Only",
                checked : "{ceEditor.readonly}"
            })),*/

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Highlight Active Line",
                checked : "[{require('ext/settings/settings').model}::editors/code/@activeline]"
            })),

            mnuView.appendChild(new apf.divider()),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Show Invisibles",
                checked : "[{require('ext/settings/settings').model}::editors/code/@showinvisibles]"
            })),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Show Print Margin",
                checked : "[{require('ext/settings/settings').model}::editors/code/@showprintmargin]"
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
            var file = ide.getActivePageModel();
            if (file)
                apf.xmldb.setAttribute(file, "contenttype", e.relatedNode.value);
        };

        /*ide.addEventListener("clearfilecache", function(e){
            ceEditor.clearCacheItem(e.xmlNode);
        });*/

        ide.addEventListener("keybindingschange", function(e){
            if (typeof ceEditor == "undefined")
                return;
            var bindings = e.keybindings.code;
            ceEditor.$editor.keyBinding.setConfig(bindings);
        });
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

        if (self.ceEditor) {
            ceEditor.destroy(true, true);
            mnuSyntax.destroy(true, true);
        }

        this.nodes = [];
    }
});

});