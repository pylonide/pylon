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
var editors = require("ext/editors/editors");

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

var SupportedModes = {
    "application/javascript": "javascript",
    "application/json": "json",
    "text/css": "css",
    "text/x-scss": "scss",
    "text/html": "html",
    "application/xhtml+xml": "html",
    "application/xml": "xml",
    "application/rdf+xml": "xml",
    "application/rss+xml": "xml",
    "image/svg+xml": "svg",
    "application/wsdl+xml": "xml",
    "application/xslt+xml": "xml",
    "application/atom+xml": "xml",
    "application/mathml+xml": "xml",
    "application/x-httpd-php": "php",
    "text/x-script.python": "python",
    "text/x-script.ruby": "ruby",
    "text/x-script.perl": "perl",
    "text/x-c": "c_cpp",
    "text/x-java-source": "java",
    "text/x-csharp": "csharp",
    "text/x-script.coffeescript": "coffee",
    "text/x-markdown": "markdown",
    "text/x-web-textile": "textile",
    "text/x-script.ocaml": "ocaml",
    "text/x-script.clojure": "clojure"
};

var contentTypes = {
    "js": "application/javascript",
    "json": "application/json",
    "css": "text/css",
    "scss": "text/x-scss",
    "sass": "text/x-sass",
    
    "xml": "application/xml",
    "rdf": "application/rdf+xml",
    "rss": "application/rss+xml",
    "svg": "image/svg+xml",
    "wsdl": "application/wsdl+xml",
    "xslt": "application/xslt+xml",
    "atom": "application/atom+xml",
    "mathml": "application/mathml+xml",
    "mml": "application/mathml+xml",
    
    "php": "application/x-httpd-php",
    "html": "text/html",
    "xhtml": "application/xhtml+xml",
    "coffee": "text/x-script.coffeescript",
    "py": "text/x-script.python",
    
    "ru": "text/x-script.ruby",
    "gemspec": "text/x-script.ruby",
    "rake": "text/x-script.ruby",
    "rb": "text/x-script.ruby",
    
    "c": "text/x-c",
    "cc": "text/x-c",
    "cpp": "text/x-c",
    "cxx": "text/x-c",
    "h": "text/x-c",
    "hh": "text/x-c",
    
    "clj": "text/x-script.clojure",
    "ml": "text/x-script.ocaml",
    "mli": "text/x-script.ocaml",
    
    "md": "text/x-markdown",
    "markdown": "text/x-markdown"
};

module.exports = ext.register("ext/code/code", {
    name    : "Code Editor",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    contentTypes : Object.keys(SupportedModes),
    markup  : markup,
    deps    : [editors],
    
    nodes : [],
    
    getState : function(doc){
        var doc = doc ? doc.acesession : this.getDocument();
        if (!doc || typeof doc.getSelection != "function") 
            return;
        
        var sel = doc.getSelection();
        return {
            scrolltop  : ceEditor.$editor.renderer.getScrollTop(),
            scrollleft : ceEditor.$editor.renderer.getScrollLeft(),
            selection  : sel.getRange()
        };
    },
    
    setState : function(doc, state){
        var aceDoc = doc ? doc.acesession : this.getDocument();
        if (!aceDoc || !state || typeof aceDoc.getSelection != "function") 
            return;
        
        var sel = aceDoc.getSelection();
        
        //are those 3 lines set the values in per document base or are global for editor
        sel.setSelectionRange(state.selection, false);
        ceEditor.$editor.renderer.scrollToY(state.scrolltop)
        ceEditor.$editor.renderer.scrollToX(state.scrollleft)
    },

    getSyntax : function(node) {
        if(!node) return "";
        var customType = node.getAttribute("customtype");
        if (!customType)
            customType = contentTypes[node.getAttribute("name").split(".").pop()];

        if (customType) {
            var mime = customType.split(";")[0];

            return (SupportedModes[mime] || "text");
        }
        else {
            return "text";
        }
    },
    
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

            /*mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Select Full Line",
                values  : "line|text",
                value   : "[{require('ext/settings/settings').model}::editors/code/@selectstyle]",
            })),*/

            /*mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Read Only",
                checked : "{ceEditor.readonly}"
            })),*/

            /*mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Highlight Active Line",
                checked : "[{require('ext/settings/settings').model}::editors/code/@activeline]"
            })),

            mnuView.appendChild(new apf.divider()),*/

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Show Invisibles",
                checked : "[{require('ext/settings/settings').model}::editors/code/@showinvisibles]"
            })),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Wrap Lines",
                checked : "[{require('ext/settings/settings').model}::editors/code/@wrapmode]"
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
            if (file) {
                var value = e.relatedNode.value;
                if (value == "auto")
                    apf.xmldb.removeAttribute(file, "customtype", "");
                else
                    apf.xmldb.setAttribute(file, "customtype", value);
            }
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
