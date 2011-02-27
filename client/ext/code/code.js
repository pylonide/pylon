/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var EditSession = require("ace/edit_session").EditSession;
var HashHandler = require("ace/keyboard/hash_handler").HashHandler;
var Document = require("ace/document").Document;
var ProxyDocument = require("ext/code/proxydocument");
var markup = require("text!ext/code/code.xml");
var settings = require("text!ext/code/settings.xml");

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
        "application/xhtml+xml",
        "text/x-script.python",
        "text/x-script.coffeescript"
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
        return ceEditor.getSession();
    },
    
    setDocument : function(doc, actiontracker){
        if (!doc.acesession) {
            var _self = this;

            doc.isInited = doc.hasValue();
            doc.acedoc = doc.acedoc || new ProxyDocument(new Document(doc.getValue() || ""));
            doc.acesession = new EditSession(doc.acedoc);
            doc.acedoc = doc.acesession.getDocument();
            
            doc.acesession.setUndoManager(actiontracker);
            
            doc.addEventListener("prop.value", function(e) {
                doc.acesession.setValue(e.value || "");
                ceEditor.$editor.moveCursorTo(0, 0);
                doc.isInited = true;
            });
            
            doc.addEventListener("retrievevalue", function(e) {
                if (!doc.isInited) 
                    return e.value;
                else 
                    return doc.acesession.getValue();
            });
            
            doc.addEventListener("close", function(){
                //??? destroy doc.acesession
            });
        }

        ceEditor.setProperty("value", doc.acesession);
    },

    hook : function() {
        var commitFunc = this.onCommit.bind(this),
            name       = this.name;
        
        //Settings Support
        ide.addEventListener("init.ext/settings/settings", function(e){
            e.ext.addSection("code", name, "editors", commitFunc);
            barSettings.insertMarkup(settings);
        });
        
        ide.addEventListener("loadsettings", function(e) {
            // pre load theme
            var theme = e.model.queryValue("editors/code/@theme");
            if (theme) 
                require([theme], function() {});
        });
        
        // preload common language modes
        require(["ace/mode/javascript", "ace/mode/html", "ace/mode/css"], function() {});
    },

    init : function(amlPage) {
        /*var def = ceEditor.getDefaults();
        
        ide.addEventListener("loadsettings", function() {
            //check default settings...
            var settings = require("ext/settings/settings"),
                model    = settings.model,
                base     = model.data.selectSingleNode("editors/code");
            if (!base)
                base = model.appendXml('<code name="' + this.name +'" />', "editors");
                
            // go through all default settings and append them to the XML if they're not there yet
            for (var prop in def) {
                if (!prop) continue;
                if (!base.getAttribute(prop))
                    base.setAttribute(prop, def[prop]);
            }
            apf.xmldb.applyChanges("synchronize", base);
        });*/

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
                values  : "line|text",
                value   : "[{require('ext/settings/settings').model}::editors/code/@selectstyle]",
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
            ceEditor.$editor.setKeyboardHandler(new HashHandler(bindings));
        });
    },

    onCommit: function() {
        //console.log("commit func called!")
        //todo
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