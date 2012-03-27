/**
 * auto test Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var noderunner = require("ext/noderunner/noderunner");
var fs = require("ext/filesystem/filesystem");

module.exports = ext.register("ext/autotest/autotest", {
    name    : "autotest",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,

    hook : function() {
        ide.addEventListener("afterfilesave", function(e) {
            var node = e.node;

            var path = node.getAttribute("path");
            var m = path.match(/^.*(_test|Test)\.js$/);
            if (m) {
                run(path);
            } else {
                var testPath = path.replace(/\.js$/, "_test.js");
                if (path == testPath) return;
                fs.exists(testPath, function(exists) {
                    if (exists)
                        run(testPath);
                        
                    testPath = path.replace(/\.js$/, "Test.js");
                    if (path == testPath) return;
                    fs.exists(testPath, function(exists) {
                        if (exists)
                            run(testPath);
                    });
                });
            }
            
            function run(path) {
                path = path.slice(ide.davPrefix.length + 1).replace("//", "/");
                //console.log("running test", path);
                noderunner.run(path, [], false);
            }
        });
    },

    init : function(amlNode) {
    },
    
    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

"use strict";

var ext = require("core/ext");

module.exports = ext.register("ext/clipboard/clipboard", {
    dev    : "Ajax.org",
    name   : "Clipboard",
    alone  : true,
    type   : ext.GENERAL,

    nodes : [],

    init : function(amlNode){
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Cut",
                onclick : this.cut
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Copy",
                onclick : this.copy
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Paste",
                onclick : this.paste
            }))
        );

        /*this.hotitems = {
            "cut" : [this.nodes[1]],
            "copy" : [this.nodes[2]],
            "paste" : [this.nodes[3]]
        };*/
    },

    cut: function() {
        if (apf.document.activeElement == trFiles)
            apf.clipboard.cutSelection(trFiles);
    },

    copy: function() {
        if (apf.document.activeElement == trFiles)
            apf.clipboard.copySelection(trFiles);
    },

    paste: function() {
        if (apf.document.activeElement == trFiles)
            apf.clipboard.pasteSelection(trFiles);
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

});/**
 * This plugin gives a 'close confirmation' when closing the IDE
 *
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/closeconfirmation/closeconfirmation", {
    name    : "Confirm closing",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : null,
    
    deps    : [ settings ],
    
    nodes : [],
    
    hook : function () {
        // when unloading the window
        window.onbeforeunload = this.onBeforeUnloadHandler;

        var _self = this;
        ide.addEventListener("init.ext/settings/settings", function (e) {
            // this is the checkbox
            var warnBeforeExiting = new apf.checkbox({
                "class" : "underlined",
                skin  : "checkbox_grey",
                value : "[general/@confirmexit]",
                label : "Warn before exiting"
            });
            
            // find the 'General' section in the settings plugin
            var heading = settings.getHeading("General");
            heading.appendChild(warnBeforeExiting);
    
            // add the checkbox to the node list of the plugin
            _self.nodes.push(warnBeforeExiting);
        });

        // init extension
        ext.initExtension(this);
    },
    
    init : function () {
    },
    
    onBeforeUnloadHandler : function () {
        // see what's in the settings
        var settingsNode = settings.model.queryNode("general/@confirmexit");
        if (settingsNode && apf.isTrue(settingsNode.value)) {
            return "Are you sure you want to leave Cloud9?";
        }        
    },

    enable : function() {
        this.nodes.each(function(item){
            item.enable();
        });
    },
    
    disable : function() {
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function() {
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
        
        // clean out the event handler
        if (window.onbeforeunload === this.onBeforeUnloadHandler) {
            window.onbeforeunload = null;
        }
    }
});

});/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

require("apf/elements/codeeditor");

var ide = require("core/ide");
var ext = require("core/ext");
var EditSession = require("ace/edit_session").EditSession;
var HashHandler = require("ace/keyboard/hash_handler").HashHandler;
var useragent = require("ace/lib/useragent");
var Document = require("ace/document").Document;
var Range = require("ace/range").Range;
var ProxyDocument = require("ext/code/proxydocument");
var CommandManager = require("ace/commands/command_manager").CommandManager;
var defaultCommands = require("ace/commands/default_commands").commands;
var markup = require("text!ext/code/code.xml");
var settings = require("ext/settings/settings");
var markupSettings = require("text!ext/code/settings.xml");
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
    "text/x-script.perl-module": "perl",
    "text/x-c": "c_cpp",
    "text/x-java-source": "java",
    "text/x-groovy": "groovy",
    "text/x-csharp": "csharp",
    "text/x-script.coffeescript": "coffee",
    "text/x-markdown": "markdown",
    "text/x-web-textile": "textile",
    "text/x-script.ocaml": "ocaml",
    "text/x-script.clojure": "clojure",
    "application/x-latex": "latex",
    "text/x-lua": "lua",
    "text/x-script.powershell": "powershell",
    "text/x-scala": "scala",
    "text/x-coldfusion": "coldfusion",
    "text/x-sql": "sql"
};

var contentTypes = {
    "js": "application/javascript",
    "json": "application/json",
    "css": "text/css",
    "less": "text/css",
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
    "phtml": "application/x-httpd-php",
    "html": "text/html",
    "xhtml": "application/xhtml+xml",
    "coffee": "text/x-script.coffeescript",
    "*Cakefile": "text/x-script.coffeescript",
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
    "hpp": "text/x-c",

    "cs": "text/x-csharp",

    "java": "text/x-java-source",
    "clj": "text/x-script.clojure",
    "groovy": "text/x-groovy",
    "scala": "text/x-scala",

    "ml": "text/x-script.ocaml",
    "mli": "text/x-script.ocaml",

    "md": "text/x-markdown",
    "markdown": "text/x-markdown",
    "textile": "text/x-web-textile",
    "latex": "application/x-latex",
    "tex": "application/x-latex",
    "ltx": "application/x-latex",

    "lua": "text/x-lua",

    "pl": "text/x-script.perl",
    "pm": "text/x-script.perl-module",

    "ps1": "text/x-script.powershell",
    "cfm": "text/x-coldfusion",
    "sql": "text/x-sql"
};

module.exports = ext.register("ext/code/code", {
    name    : "Code Editor",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    markup  : markup,
    deps    : [editors],

    nodes : [],

    fileExtensions : Object.keys(contentTypes),
    supportedModes: Object.keys(SupportedModes),
    commandManager : new CommandManager(useragent.isMac ? "mac" : "win", defaultCommands),

    getState : function(doc) {
        doc = doc ? doc.acesession : this.getDocument();
        if (!doc || typeof doc.getSelection != "function")
            return;

        var folds = doc.getAllFolds().map(function(fold) {
            return {
                start: fold.start,
                end: fold.end,
                placeholder: fold.placeholder
            };
        });

        var sel = doc.getSelection();
        return {
            scrolltop  : doc.getScrollTop(),
            scrollleft : doc.getScrollLeft(),
            selection  : sel.getRange(),
            folds      : folds
        };
    },

    setState : function(doc, state){
        var aceDoc = doc ? doc.acesession : this.getDocument();
        if (!aceDoc || !state || typeof aceDoc.getSelection != "function")
            return;

        var sel = aceDoc.getSelection();

        //are those 3 lines set the values in per document base or are global for editor
        sel.setSelectionRange(state.selection, false);

        aceDoc.setScrollTop(state.scrolltop);
        aceDoc.setScrollLeft(state.scrollleft);

        if (state.folds) {
            for (var i = 0, l=state.folds.length; i < l; i++) {
                var fold = state.folds[i];
                aceDoc.addFold(fold.placeholder, Range.fromPoints(fold.start, fold.end));
            }
        }

        // if newfile == 1 and there is text cached, restore it
        var node = doc.getNode && doc.getNode();
        if (node && parseInt(node.getAttribute("newfile") || 0, 10) === 1 && node.childNodes.length) {
            // the text is cached within a CDATA block as first childNode of the <file>
            if (doc.getNode().childNodes[0] instanceof CDATASection) {
                aceDoc.setValue(doc.getNode().childNodes[0].nodeValue);
            }
        }
    },

    getSyntax : function(node) {
        if (!node)
            return "";

        var mime = node.getAttribute("customtype");

        if (!mime) {
            var fileName = node.getAttribute("name");

            if (fileName.lastIndexOf(".") != -1)
                mime = contentTypes[fileName.split(".").pop()];
            else
                mime = contentTypes["*" + fileName];
        }

        if (mime) {
            mime = mime.split(";")[0];
            return (SupportedModes[mime] || "text");
        }

        return "text";
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
        var _self = this;

        if (!doc.acesession) {
            doc.isInited = doc.hasValue();
            doc.acedoc = doc.acedoc || new ProxyDocument(new Document(doc.getValue() || ""));
            doc.acesession = new EditSession(doc.acedoc);
            doc.acedoc = doc.acesession.getDocument();

            doc.acesession.setUndoManager(actiontracker);

            if (doc.isInited && doc.state)
                 _self.setState(doc, doc.state);

            doc.addEventListener("prop.value", function(e) {
                if (this.editor != _self)
                    return;

                doc.acesession.setValue(e.value || "");
                if (doc.state)
                    _self.setState(doc, doc.state);
                doc.isInited = true;
            });

            doc.addEventListener("retrievevalue", function(e) {
                if (this.editor != _self)
                    return;

                if (!doc.isInited)
                    return e.value;
                else
                    return doc.acesession.getValue();
            });

            doc.addEventListener("close", function(){
                if (this.editor != _self)
                    return;

                //??? destroy doc.acesession
            });
        }
        ceEditor.setProperty("value", doc.acesession);

        if (doc.editor && doc.editor != this) {
            var value = doc.getValue();
            if (doc.acesession.getValue() !== value) {
                doc.editor = this;
                doc.dispatchEvent("prop.value", {value : value});
            }
        }

        doc.editor = this;
    },

    hook: function() {
        var _self = this;

        //Settings Support
        ide.addEventListener("init.ext/settings/settings", function(e) {
            var heading = e.ext.getHeading("Code Editor");
            heading.insertMarkup(markupSettings);
        });

        ide.addEventListener("loadsettings", function(e) {
            var model = e.model;
            if (!model.queryNode("editors/code")) {
                var node = apf.n("<code />")
                  .attr("overwrite", "false")
                  .attr("selectstyle", "line")
                  .attr("activeline", "true")
                  .attr("showinvisibles", "false")
                  .attr("showprintmargin", "true")
                  .attr("printmargincolumn", "80")
                  .attr("softtabs", "true")
                  .attr("tabsize", "4")
                  .attr("scrollspeed", "2")
                  .attr("fontsize", "12")
                  .attr("wrapmode", "false")
                  .attr("wraplimitmin", "")
                  .attr("wraplimitmax", "")
                  .attr("gutter", "true")
                  .attr("folding", "true")
                  .attr("highlightselectedword", "true")
                  .attr("autohidehorscrollbar", "true").node();

                var editors = apf.createNodeFromXpath(model.data, "editors");
                apf.xmldb.appendChild(editors, node);
            }

            // pre load theme
            var theme = e.model.queryValue("editors/code/@theme");
            if (theme)
                require([theme], function() {});
            // pre load custom mime types
            _self.getCustomTypes(e.model);
        });

        ide.addEventListener("afteropenfile", function(e) {
            if (_self.setState)
                _self.setState(e.doc, e.doc.state);

            if (e.doc && e.doc.editor && e.doc.editor.ceEditor) {
                // check if there is a scriptid, if not check if the file is somewhere in the stack
                if (typeof mdlDbgStack != "undefined" && mdlDbgStack.data && e.node
                  && (!e.node.hasAttribute("scriptid") || !e.node.getAttribute("scriptid"))
                  && e.node.hasAttribute("scriptname") && e.node.getAttribute("scriptname")) {
                    var nodes = mdlDbgStack.data.selectNodes("//frame[@script='" + e.node.getAttribute("scriptname").replace(ide.workspaceDir + "/", "") + "']");
                    if (nodes.length) {
                        e.node.setAttribute("scriptid", nodes[0].getAttribute("scriptid"));
                    }
                }
                e.doc.editor.ceEditor.afterOpenFile(e.doc.editor.ceEditor.getSession());
            }
        });

        tabEditors.addEventListener("afterswitch", function(e) {
            ceEditor.afterOpenFile(ceEditor.getSession());
        });
    },

    init: function(amlPage) {
        amlPage.appendChild(ceEditor);
        ceEditor.show();

        this.ceEditor = this.amlEditor = ceEditor;
        ceEditor.$editor.commands = this.commandManager;

        // preload common language modes
        var noop = function() {};
        ceEditor.getMode("javascript", noop);
        ceEditor.getMode("html", noop);
        ceEditor.getMode("css", noop);

        var _self = this;

        var menuSyntaxHighlight = new apf.item({
            caption : "Syntax Highlighting",
            submenu : "mnuSyntax"
        });

        var menuShowInvisibles = new apf.item({
            type    : "check",
            caption : "Show Invisibles",
            checked : "[{require('ext/settings/settings').model}::editors/code/@showinvisibles]"
        });

        var menuWrapLines = new apf.item({
            type    : "check",
            caption : "Wrap Lines",
            checked : "{ceEditor.wrapmode}"
        });

        this.nodes.push(
            //Add a panel to the statusbar showing whether the insert button is pressed
            sbMain.appendChild(new apf.section({
                caption : "{ceEditor.insert}"
            })),

            //Add a panel to the statusbar showing the length of the document
            sbMain.appendChild(new apf.section({
                caption : "Length: {ceEditor.value.length}"
            })),

            mnuView.appendChild(new apf.divider()),
            mnuView.appendChild(menuSyntaxHighlight)
        );

        mnuSyntax.onitemclick = function(e) {
            var file = ide.getActivePageModel();

            if (file) {
                var value = e.relatedNode.value;

                if (value == "auto")
                    apf.xmldb.removeAttribute(file, "customtype", "");
                else
                    apf.xmldb.setAttribute(file, "customtype", value);

                if (file.getAttribute("customtype")) {
                    var fileName = file.getAttribute("name");

                    if (contentTypes["*" + fileName])
                        delete contentTypes["*" + fileName];

                    var mime = value.split(";")[0];
                    var fileExt = (fileName.lastIndexOf(".") != -1) ?
                        fileName.split(".").pop() : null;

                    if (fileExt && contentTypes[fileExt] !== mime)
                        delete contentTypes[fileExt];

                    var customType = fileExt ?
                        contentTypes[fileExt] : contentTypes["*" + fileName];

                    if (!customType)
                        _self.setCustomType(fileExt ? fileExt : file, mime);
                    ide.dispatchEvent("track_action", {
                        type: "syntax highlighting",
                        fileType: fileExt,
                        fileName: fileName,
                        mime: mime,
                        customType: customType
                    });
                }
            }
        };

        ide.addEventListener("init.ext/statusbar/statusbar", function (e) {
            // add preferences to the statusbar plugin
            e.ext.addPrefsItem(menuShowInvisibles.cloneNode(true), 0);
            e.ext.addPrefsItem(menuWrapLines.cloneNode(true), 1);
        });

        ide.addEventListener("keybindingschange", function(e) {
            if (typeof ceEditor == "undefined")
                return;

            var bindings = e.keybindings.code;
            ceEditor.$editor.setKeyboardHandler(new HashHandler(bindings));
            // In case the `keybindingschange` event gets fired after other
            // plugins that change keybindings have already changed them (i.e.
            // the vim plugin), we fire an event so these plugins can react to it.
            ide.dispatchEvent("code.ext:defaultbindingsrestored", {});
        });
    },

    /**
     * Saves custom syntax for extension type in settings.xml
     *
     * @param {String|xmlNode} ext Contains the extension type shorthand
     * @param {String} mime Mime type string the extension will be related to
     */
    setCustomType: function(ext, mime) {
        var node;

        if (typeof ext === "string") {
            node = settings.model.queryNode('auto/customtypes/mime[@ext="' + ext + '"]');
            if (!node)
                settings.model.appendXml('<mime name="' + mime + '" ext="' + ext + '" />', "auto/customtypes");
        } else {
            var name = ext.getAttribute("name") || "";
            node = settings.model.queryNode('auto/customtypes/mime[@filename="' + name + '"]');
            if (node)
                apf.xmldb.removeAttribute(node, "ext");
            else
                settings.model.appendXml('<mime name="' + mime + '" filename="' + name + '" />', "auto/customtypes");
        }

        apf.xmldb.setAttribute(node, "name", mime);
        settings.save();
    },

    /**
     * Retrieves custom syntax for extensions saved in settings.xml
     *
     * @param {Object} model Settings' model
     */
    getCustomTypes: function(model) {
        var customTypes = model.queryNode("auto/customtypes");
        if (!customTypes)
            customTypes = apf.createNodeFromXpath(model.data, "auto/customtypes");

        var mimes = customTypes.selectNodes("mime");
        mimes.forEach(function(n) {
            if (n.getAttribute("filename"))
                contentTypes["*" + n.getAttribute("filename")] = n.getAttribute("name");
            else
                contentTypes[n.getAttribute("ext")] = n.getAttribute("name");
        });
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
define(function (require, exports, module) {

var oop = require('ace/lib/oop');
var Document = require('ace/document').Document;

var ProxyDocument = function (document) {
    this.$onChange = this.onChange.bind(this);
    this.setDocument(document);
};

oop.inherits(ProxyDocument, Document);

(function() {
    this.getDocument = function () {
        return this.doc;
    };

    this.setDocument = function (newDocument) {
        if (this.doc == newDocument)
            return this.doc;
            
        if (this.doc) {
            this.doc.removeEventListener("change", this.$onChange);
        }
        
        this.doc = newDocument;
        this.doc.addEventListener("change", this.$onChange);
        
        return this.doc;
    };

    this.onChange = function(e) {
        this._dispatchEvent("change", e);
    };

    this.getNewLineCharacter = function () {
        return this.doc.getNewLineCharacter();
    };

    this.getLength = function () {
        return this.doc.getLength();
    };

    this.getLine = function (row) {
        return this.doc.getLine(row);
    };

    this.getLines = function (startRow, endRow) {
        return this.doc.getLines(startRow, endRow);
    };

    this.getTextRange = function (range) {
        return this.doc.getTextRange(range);
    };

    this.insertNewLine = function (position) {
        return this.doc.insertNewLine(position);
    };

    this.insertInLine = function (position, text) {
        return this.doc.insertInLine(position, text);
    };

    this.insertLines = function (row, lines) {
        return this.doc.insertLines(row, lines);
    };

    this.removeNewLine = function (row) {
        return this.doc.removeNewLine(row);
    };

    this.removeInLine = function (row, startColumn, endColumn) {
        return this.doc.removeInLine(row, startColumn, endColumn);
    };

    this.removeLines = function (startRow, endRow) {
        return this.doc.removeLines(startRow, endRow);
    };

    this.applyDeltas = function (deltas) {
        return this.doc.applyDeltas(deltas);
    };

    this.revertDeltas = function (deltas) {
        return this.doc.revertDeltas(deltas);
    };
}).call(ProxyDocument.prototype);

module.exports = ProxyDocument;

});/**
 * Code completion for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ext = require("core/ext");
var editors = require("ext/editors/editors");
var language = require("ext/language/language");

module.exports = ext.register("ext/codecomplete/codecomplete", {
    name    : "Code Complete",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, language],
    nodes   : [],
    alone   : true,

    init : function() {
        language.registerLanguageHandler('ext/codecomplete/local_completer');
        language.registerLanguageHandler('ext/codecomplete/snippet_completer');
        language.registerLanguageHandler('ext/codecomplete/open_files_local_completer');
    },

    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});
define(function(require, exports, module) {

var ID_REGEX = /[a-zA-Z_0-9\$]/;

function retrievePreceedingIdentifier(text, pos) {
    var buf = [];
    for (var i = pos-1; i >= 0; i--) {
        if(ID_REGEX.test(text[i]))
            buf.push(text[i]);
        else
            break;
    }
    return buf.reverse().join("");
}

function prefixBinarySearch(items, prefix) {
    var startIndex = 0;
    var stopIndex = items.length - 1;
    var middle = Math.floor((stopIndex + startIndex) / 2);
    
    while (stopIndex > startIndex && middle >= 0 && items[middle].indexOf(prefix) !== 0) {
        if (prefix < items[middle]) {
            stopIndex = middle - 1;
        }
        else if (prefix > items[middle]) {
            startIndex = middle + 1;
        }
        middle = Math.floor((stopIndex + stopIndex) / 2);
    }
    
    // Look back to make sure we haven't skipped any
    while (middle > 0 && items[middle-1].indexOf(prefix) === 0)
        middle--;
    return middle >= 0 ? middle : 0; // ensure we're not returning a negative index
}

function findCompletions(prefix, allIdentifiers) {
    allIdentifiers.sort();
    var startIdx = prefixBinarySearch(allIdentifiers, prefix);
    var matches = [];
    for (var i = startIdx; i < allIdentifiers.length &&
                          allIdentifiers[i].indexOf(prefix) === 0; i++) {
        matches.push(allIdentifiers[i]);
    }
    return matches;
}

exports.retrievePreceedingIdentifier = retrievePreceedingIdentifier;
exports.findCompletions = findCompletions;

});define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
var completeUtil = require("ext/codecomplete/complete_util");

var SPLIT_REGEX = /[^a-zA-Z_0-9\$]+/;

var completer = module.exports = Object.create(baseLanguageHandler);
    
completer.handlesLanguage = function(language) {
    return true;
};

// For the current document, gives scores to identifiers not on frequency, but on distance from the current prefix
function wordDistanceAnalyzer(doc, pos, prefix) {
    var text = doc.getValue().trim();
    
    // Determine cursor's word index
    var textBefore = doc.getLines(0, pos.row-1).join("\n") + "\n";
    var currentLine = doc.getLine(pos.row);
    textBefore += currentLine.substr(0, pos.column);
    var prefixPosition = textBefore.trim().split(SPLIT_REGEX).length;
    
    // Split entire document into words
    var identifiers = text.split(SPLIT_REGEX);
    var identDict = {};
    
    // Find prefix to find other identifiers close it
    for (var i = 0; i < identifiers.length; i++) {
        var ident = identifiers[i];
        var distance = Math.max(prefixPosition, i) - Math.min(prefixPosition, i);
        // Score substracted from 100000 to force descending ordering
        if (Object.prototype.hasOwnProperty.call(identDict, ident))
            identDict[ident] = Math.max(1000000-distance, identDict[ident]);
        else
            identDict[ident] = 1000000-distance;
        
    }
    return identDict;
}

function analyze(doc, pos) {
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    
    var analysisCache = wordDistanceAnalyzer(doc, pos, identifier);
    // Remove the word to be completed
    delete analysisCache[identifier];
    return analysisCache;
}

/**
 * Returns whether the completion engine requires an AST representation of the code
 */
completer.completionRequiresParsing = function() {
    return false;
};
    
completer.complete = function(doc, fullAst, pos, currentNode) {
    var identDict = analyze(doc, pos);
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    
    var allIdentifiers = [];
    for (var ident in identDict) {
        allIdentifiers.push(ident);
    }
    var matches = completeUtil.findCompletions(identifier, allIdentifiers);

    return matches.map(function(m) {
        return {
          name        : m,
          replaceText : m,
          icon        : null,
          score       : identDict[m],
          meta        : "",
          priority    : 1
        };
    });
};

});
if (typeof process !== "undefined") {
    require("../../../support/paths");
    //require("ace/test/mockdom");
    require.paths.unshift(__dirname + "/../..");
}

define(function(require, exports, module) {

var Document = require("ace/document").Document;
var assert = require("ace/test/assertions");

var completer = require("ext/codecomplete/local_completer");

function matchSorter(matches) {
    matches.sort(function(a, b) {
        if (a.score < b.score)
            return 1;
        else if (a.score > b.score)
            return -1;
        else
            return 0;
    });
}

function determineDistance(score) {
    return 1000000 - score;
}

module.exports = {
    "test basic completion" : function() {
        var doc = new Document("hel hello2 hello3  hello2 abc");
        var matches = completer.complete(doc, null, {row: 0, column: 3});

        matchSorter(matches);
        //console.log("Matches:", matches);
        assert.equal(matches.length, 2);
        assert.equal(matches[0].name, "hello2");
        assert.equal(determineDistance(matches[0].score), 0); // no distance
        assert.equal(matches[1].name, "hello3");
        assert.equal(determineDistance(matches[1].score), 1);
    },

    "test basic completion 2" : function() {
        var doc = new Document("assert.equal(matchers[0].name, matches[0].score);\nassert.eq(matches[0].name, mat[0].score);\n");
        var matches = completer.complete(doc, null, {row: 1, column: 9}); // .eq|
        matchSorter(matches);
        assert.equal(matches.length, 1);
        assert.equal(matches[0].name, "equal");
        assert.equal(determineDistance(matches[0].score), 9);

        matches = completer.complete(doc, null, {row: 1, column: 30});  // .mat|[0]
        matchSorter(matches);
        assert.equal(matches.length, 2);
        assert.equal(matches[0].name, "matches");
        assert.equal(determineDistance(matches[0].score), 4);
        assert.equal(matches[1].name, "matchers");
        assert.equal(determineDistance(matches[1].score), 12);
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}define(function(require, exports, module) {

var completeUtil = require("ext/codecomplete/complete_util");

var baseLanguageHandler = require('ext/language/base_handler');

var analysisCache = {}; // path => {identifier: 3, ...}
var globalWordIndex = {}; // word => frequency
var globalWordFiles = {}; // word => [path]

var completer = module.exports = Object.create(baseLanguageHandler);

completer.handlesLanguage = function(language) {
    return true;
};

function frequencyAnalyzer(path, text, identDict, fileDict) {
    var identifiers = text.split(/[^a-zA-Z_0-9\$]+/);
    for (var i = 0; i < identifiers.length; i++) {
        var ident = identifiers[i];
        if (!ident)
            continue;
            
        if (Object.prototype.hasOwnProperty.call(identDict, ident)) {
            identDict[ident]++;
            fileDict[ident][path] = true;
        }
        else {
            identDict[ident] = 1;
            fileDict[ident] = {};
            fileDict[ident][path] = true;
        }
    }
    return identDict;
}

function removeDocumentFromCache(path) {
    var analysis = analysisCache[path];
    if (!analysis) return;

    for (var id in analysis) {
        globalWordIndex[id] -= analysis[id];
        delete globalWordFiles[id][path];
        if (globalWordIndex[id] === 0) {
            delete globalWordIndex[id];
            delete globalWordFiles[id];
        }
    }
    delete analysisCache[path];
}

function analyzeDocument(path, allCode) {
    if (!analysisCache[path]) {
        // Delay this slightly, because in Firefox document.value is not immediately filled
        analysisCache[path] = frequencyAnalyzer(path, allCode, {}, {});
        // may be a bit redundant to do this twice, but alright...
        frequencyAnalyzer(path, allCode, globalWordIndex, globalWordFiles);
    }
}

completer.onDocumentOpen = function(path, doc) {
    if (!analysisCache[path]) {
        analyzeDocument(path, doc.getValue());
    }
};
    
completer.onDocumentClose = function(path) {
    removeDocumentFromCache(path);
};

completer.onUpdate = function(doc) {
    removeDocumentFromCache(this.path);
    analyzeDocument(this.path, doc.getValue());
};

completer.complete = function(doc, fullAst, pos, currentNode) {
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);
    var identDict = globalWordIndex;
    
    var allIdentifiers = [];
    for (var ident in identDict) {
        allIdentifiers.push(ident);
    }
    var matches = completeUtil.findCompletions(identifier, allIdentifiers);
    
    var currentPath = this.path;
    matches = matches.filter(function(m) {
        return !globalWordFiles[m][currentPath];
    });

    return matches.map(function(m) {
        var path = Object.keys(globalWordFiles[m])[0] || "[unknown]";
        var pathParts = path.split("/");
        var foundInFile = pathParts[pathParts.length-1];
        return {
          name        : m,
          replaceText : m,
          icon        : null,
          score       : identDict[m],
          meta        : foundInFile,
          priority    : 0
        };
    });
};

});
var globalRequire = require;

define(function(require, exports, module) {

var completeUtil = require("ext/codecomplete/complete_util");
var baseLanguageHandler = require('ext/language/base_handler');

var completer = module.exports = Object.create(baseLanguageHandler);

var snippetCache = {}; // extension -> snippets
    
completer.handlesLanguage = function(language) {
    return true;
};

completer.fetchText = function(path) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "/static/" + path, false);
    xhr.send();
    if(xhr.status === 200)
        return xhr.responseText;
    else
        return false;
};

completer.complete = function(doc, fullAst, pos, currentNode) {
    var line = doc.getLine(pos.row);
    var identifier = completeUtil.retrievePreceedingIdentifier(line, pos.column);

    var snippets = snippetCache[this.language];
    
    if (snippets === undefined) {
        var text = this.fetchText('ext/codecomplete/snippets/' + this.language + '.json');
        snippets = text ? JSON.parse(text) : {};
        // Cache
        snippetCache[this.language] = snippets;
    }
    
    var allIdentifiers = Object.keys(snippets);
    
    var matches = completeUtil.findCompletions(identifier, allIdentifiers);
    return matches.map(function(m) {
        return {
          name        : m,
          replaceText : snippets[m],
          icon        : null,
          meta        : "snippet",
          priority    : 2
        };
    });
};


});if (typeof process !== "undefined") {
    require("../../../support/paths");
    require.paths.unshift(__dirname + "/../..");
}

define(function(require, exports, module) {

var Document = require("ace/document").Document;
var assert = require("ace/test/assertions");
var Completer = require("ext/codecomplete/snippet_completer").Completer;

function matchSorter(matches) {
    matches.sort(function(a, b) {
        if (a.name < b.name)
            return -1;
        else if (a.name > b.name)
            return 1;
        else
            return 0;
    });
}

Completer.prototype.fetchText = function(path) {
    return require('fs').readFileSync(__dirname + "/../../" + path, 'ascii');
};

module.exports = {
    "test javascript found completions" : function() {
        var doc = new Document("while(true) {\n    fn\n}");
        var completer = new Completer();
        completer.path = 'bla.js';
        var matches = completer.complete(doc, null, {row: 1, column: 6});

        matchSorter(matches);
        assert.equal(matches.length, 1);
        assert.equal(matches[0].name, "fn");
    },

    "test javascript insertion" : function(next) {
        var doc = new Document("while(true) {\n    fn\n}");
        var completer = new Completer();
        completer.path = 'bla.js';
        var matches = completer.complete(doc, null, {row: 1, column: 6});
        matchSorter(matches);
        
        completeUtil.replaceText(editor, "fn", matches[0].replaceText);
        assert.equal(session.getValue(), "while(true) {\n    function () {\n        \n    }\n}");
        var pos = editor.getCursorPosition();
        assert.equal(pos.row, 1);
        assert.equal(pos.column, 13);
    },

    "test javascript insertion 2" : function(next) {
        var session = new EditSession("while(true) {\n    fnc\n}", new JavascriptMode());
        var editor = new Editor(new MockRenderer(), session);
        snippetCompleter.hook();
        editor.moveCursorTo(1, 7);

        snippetCompleter.analyze(editor, function() {
            snippetCompleter.complete(editor, function(matches) {
                matchSorter(matches);
                completeUtil.replaceText(editor, "fnc", matches[0].replaceText);
                assert.equal(session.getValue(), "while(true) {\n    (function() {\n        \n    })();\n}");
                var pos = editor.getCursorPosition();
                assert.equal(pos.row, 2);
                assert.equal(pos.column, 8);
                next();
            });
        });
    },

    "test html insertion" : function(next) {
        var session = new EditSession("divc", new HTMLMode());
        var editor = new Editor(new MockRenderer(), session);
        snippetCompleter.hook();
        editor.moveCursorTo(0, 4);

        snippetCompleter.analyze(editor, function() {
            snippetCompleter.complete(editor, function(matches) {
                completeUtil.replaceText(editor, "divc", matches[0].replaceText);
                assert.equal(session.getValue(), '<div class=""></div>');
                var pos = editor.getCursorPosition();
                assert.equal(pos.row, 0);
                assert.equal(pos.column, 12);
                next();
            });
        });
    }

};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}/**
 * Code Tools Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

module.exports = ext.register("ext/codetools/codetools", {
    dev    : "Ajax.org",
    name   : "Code Tools",
    alone  : true,
    type   : ext.GENERAL,

    nodes : [],

    hook : function(amlNode){
        var _self = this;
        
        ide.addEventListener("init.ext/code/code", function(e) {
            _self.attachEditorEvents(ceEditor);
        });
    },
    
    attachEditorEvents: function(amlEditor) {
        var editor = amlEditor.$editor;
        var prevRow, prevCol, multiClickTimer;

        editor.addEventListener("mousemove", function(e) {
            var pos = e.getDocumentPosition();
            var row = pos.row;
            var col = pos.column;
            var doc = editor.session.doc;
            var evObj = {
                amlEditor: amlEditor,
                editor: editor,
                pos: pos,
                doc: doc
            };
            
            if (prevRow !== row) {
                prevRow = row;
                ide.dispatchEvent("codetools.rowchange", evObj);
                // a row change is also considered a column change.
                ide.dispatchEvent("codetools.columnchange", evObj);
            }
            else if (prevCol !== col) {
                prevCol = col;
                ide.dispatchEvent("codetools.columnchange", evObj);
            }
        });
        
        editor.addEventListener("click", function(e) {
            clearTimeout(multiClickTimer);
            var pos = e.getDocumentPosition();
            var doc = editor.session.doc;
            
            multiClickTimer = setTimeout(function() {
                multiClickTimer = null;
                ide.dispatchEvent("codetools.codeclick", {
                    amlEditor: amlEditor,
                    editor: editor,
                    pos: pos,
                    doc: doc
                });
            }, 100);
        });
        
        editor.addEventListener("dblclick", function(e) {
            clearTimeout(multiClickTimer);
            multiClickTimer = null;

            var pos = e.getDocumentPosition();
            var doc = editor.session.doc;

            ide.dispatchEvent("codetools.codedblclick", {
                amlEditor: amlEditor,
                editor: editor,
                pos: pos,
                doc: doc
            });
        });
        
        function cursorChange() {
            var anchor = editor.session.selection.getSelectionAnchor();

            ide.dispatchEvent("codetools.cursorchange", {
                amlEditor: amlEditor,
                editor: editor,
                pos: {
                    row: anchor.row,
                    column: anchor.column
                },
                doc: editor.session.doc
            });
        }

        function selectionChange() {
            var anchor = editor.session.selection.getSelectionAnchor();
            var lead = editor.session.selection.getSelectionLead();

            if (anchor.row !== lead.row || Math.abs(anchor.column - lead.column) > 1) {
                ide.dispatchEvent("codetools.selectionchange", {
                    amlEditor: amlEditor,
                    editor: editor,
                    pos: {
                        start: lead,
                        end: anchor
                    },
                    doc: editor.session.doc
                });
            }
        }
        
        editor.addEventListener("changeSession", function(e) {
            if (e.oldsession) {
                e.oldsession.removeEventListener("changeCursor", cursorChange);
                e.oldsession.removeEventListener("changeSelection", selectionChange);
            }
            e.session.selection.addEventListener("changeCursor", cursorChange);
            e.session.selection.addEventListener("changeSelection", selectionChange);
        });
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

});/**
 * Code Tools Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var Editors = require("ext/editors/editors");

var Range = require("ace/range").Range;

var origArrowTop;
var Colors = {};

var Regexes = require("ext/colorpicker/colorpicker_regex");

var namedColors = apf.color.colorshex;

var css = require("text!ext/colorpicker/colorpicker.css");
var markup = require("text!ext/colorpicker/colorpicker.xml");
var skin = require("text!ext/colorpicker/skin.xml");

/**
 * Creates an ACE range object that points to the start of the color (row, column)
 * and the end of the color (row, column) inside the document.
 * 
 * @param {Number} row
 * @param {Number} col
 * @param {String} line
 * @param {String} color
 * @type {Range}
 */
function createColorRange(row, col, line, color) {
    if (col) {
        var str = line;
        var colorLen = color.length;
        var lastIdx;
        var atPos = false;
        while ((lastIdx = str.indexOf(color)) != -1) {
            str = str.substr(lastIdx + colorLen);
            if (lastIdx <= col && lastIdx + colorLen >= col) {
                atPos = true;
                col = lastIdx;
            }
        }
        if (!atPos)
            return null;
    }
    col = line.indexOf(color);
    return Range.fromPoints({
        row: row,
        column: col
    }, {
        row: row,
        column: col + color.length
    });
}

module.exports = ext.register("ext/colorpicker/colorpicker", {
    dev    : "Ajax.org",
    name   : "Colorpicker Code Tool",
    alone  : true,
    type   : ext.GENERAL,
    skin   : skin,

    nodes : [],

    /**
     * Initializes the plugin; inserts markup and adds event listeners to different
     * areas of the UI.
     * 
     * @type {void}
     */
    init: function() {
        apf.document.body.insertMarkup(markup);
        this.menu = mnuColorPicker;
        this.colorpicker = clrCodeTools;
        var divs = this.menu.$ext.getElementsByTagName("div");
        var _self = this;

        // fetch the colortool DOM node and that of the arrow of the menu.
        for (var i = 0, l = divs.length; i < l; ++i) {
            if (divs[i].className.indexOf("arrow") > -1)
                this.arrow = divs[i];
            else if (divs[i].className.indexOf("codetools_colorpicker_tools") > -1)
                this.colortools = divs[i];
        }

        // add listeners for interaction with the colortools element. This element
        // is propagated with colors used inside a document, which can be selected.
        apf.addListener(this.colortools, "mousemove", function(e) {
            var el = e.srcElement || e.target || e.element;
            if (!el || el.nodeType != 1 || el.className.indexOf("color") == -1)
                return;
            var cls;
            var spans = _self.colortools.getElementsByTagName("span");
            for (var i = 0, l = spans.length; i < l; ++i) {
                cls = spans[i].className;
                if (spans[i] !== el)
                    apf.setStyleClass(spans[i], null, ["color_hover"]);
                else if (cls.indexOf("color_hover") === -1 && spans[i] === el)
                    apf.setStyleClass(spans[i], "color_hover", []);
            }
        });

        apf.addListener(this.colortools, "mousedown", function(e) {
            var el = e.srcElement || e.target || e.element;
            if (el.nodeType != 1 || el.className.indexOf("color") == -1)
                return;

            var c = apf.color;
            var cp = _self.colorpicker;
            var hsb = c.hexToHSB(c.fixHex(el.getAttribute("data-color"), true));
            cp.setAttribute("hue", hsb.h);
            cp.setAttribute("saturation", hsb.s);
            cp.setAttribute("brightness", hsb.b);
        });

        // when a color was picked in the colorpicker, the 'hex' property changes.
        // we listen to 'hex', because we use this as the base format to convert
        // from and to.
        this.colorpicker.addEventListener("prop.hex", function(e) {
            _self.onColorPicked(e.oldvalue, e.value);
        });

        // when the menu (that contains the colorpicker) hides, do some housekeeping
        // like unregistering of event listeners.
        this.menu.addEventListener("prop.visible", function(e) {
            // when the the colorpicker hides, hide all tooltip markers
            if (!e.value) {
                var a = _self.$activeColor;
                if (a) {
                    apf.removeEventListener("keydown", a.listeners.onKeyDown);
                    a.editor.removeEventListener("mousewheel", a.listeners.onScroll);
                    ide.removeEventListener("codetools.cursorchange", a.listeners.onCursorChange);
                    ide.removeEventListener("codetools.selectionchange", a.listeners.onSelectionChange);
                    delete _self.$activeColor;
                    _self.hideColorTooltips(a.editor);
                    _self.colorpicker.$input.blur();
                    a.editor.focus();
                }
            }
        });
    },

    /**
     * In the hook function we load the CSS for the markers that appear on hover
     * and hook the event listeners of the codetools plugin.
     * The codetools plugin emits events when the user moves her mouse and we then
     * detect if the mouse pointer is hovering a color we recognize.
     * 
     * @type {void}
     */
    hook: function() {
        apf.importCssString(css || "");

        // detect and return a list of colors found on a line from an ACE document.
        function detectColors(pos, line) {
            var colors = line.match(Regexes.isColor);
            if (!colors || !colors.length)
                return [];
            var start, end;
            var col = pos.column;
            for (var i = 0, l = colors.length; i < l; ++i) {
                start = line.indexOf(colors[i]);
                end = start + colors[i].length;
                if (col >= start && col <= end)
                    return [colors, colors[i]];
            }
            return [colors];
        }

        var _self = this;
        var columnChangeTimer;

        ide.addEventListener("codetools.columnchange", function(e) {
            clearTimeout(columnChangeTimer);
            var doc = e.doc;
            var pos = e.pos;
            var editor = e.editor;

            var line = doc.getLine(1);
            if (!(e.amlEditor.syntax == "css" || e.amlEditor.syntax == "svg" 
              || e.amlEditor.syntax == "html" || (line && line.indexOf("<a:skin") > -1)))
                return;

            line = doc.getLine(pos.row);
            var colors = detectColors(pos, line);
            if (colors[0] && colors[0].length) {
                _self.showColorTooltip(pos, editor, line, colors[0]);
            }
            else {
                columnChangeTimer = setTimeout(function() {
                    _self.hideColorTooltips(editor);
                }, 100);
            }
        });

        ide.addEventListener("codetools.codeclick", function(e) {
            var doc = e.doc;
            var pos = e.pos;
            var editor = e.editor;

            var line = doc.getLine(1);
            if (!(e.amlEditor.syntax == "css" || e.amlEditor.syntax == "svg" 
              || e.amlEditor.syntax == "html" || (line && line.indexOf("<a:skin") > -1)))
                return;
            //do not show anything when a selection is made...
            var range = editor.selection.getRange();
            if (range.start.row !== range.end.row || range.start.column !== range.end.column)
                return;

            line = doc.getLine(pos.row);
            var colors = detectColors(pos, line);
            if (colors[1])
                _self.toggleColorPicker(pos, editor, line, colors[1]);
            else if (_self.menu && _self.menu.visible)
                _self.menu.hide();
        });

        ide.addEventListener("codetools.codedblclick", function(e) {
            _self.hideColorTooltips(e.editor);
        });

        function switchOrClose() {
            if (_self.menu && _self.menu.visible)
                _self.menu.hide();
            else
                _self.hideColorTooltips();
        }
        // hide all markers and the colorpicker upon tab-/ editorswitch
        ide.addEventListener("beforeeditorswitch", function() {
            switchOrClose();
        });

        ide.addEventListener("closefile", function(e) {
            var currentPage = tabEditors.getPage();
            if (currentPage) {
                if (e.page.name === currentPage.name)
                    switchOrClose();
            }
            else {
                switchOrClose();
            }
        });
    },

    /**
     * Show a marker/ tooltip on top of the code that is a color of the format
     * we recognize.
     * 
     * @param {Range} pos
     * @param {Editor} editor
     * @param {String} line
     * @param {Array} colors
     * @param {String} markerId
     * @type {void}
     */
    showColorTooltip: function(pos, editor, line, colors, markerId) {
        if (this.menu && this.menu.visible && !markerId)
            return;

        var markers = [];
        colors.forEach(function(color) {
            var id = markerId || color + (pos.row + "") + pos.column;
            var marker = Colors[id];
            // the tooltip DOM node is stored in the third element of the selection array
            if (!marker) {
                var range = createColorRange(pos.row, pos.column, line, color);
                if (!range)
                    return;
                marker = editor.session.addMarker(range, "codetools_colorpicker", function(stringBuilder, range, left, top, viewport) {
                    stringBuilder.push(
                        "<span class='codetools_colorpicker' style='",
                        "left:", left - 3, "px;",
                        "top:", top - 1, "px;",
                        "height:", viewport.lineHeight, "px;",
                        "' onclick='require(\'ext/codetools/codetools\').toggleColorPicker({row:",
                        pos.row, ",column:", pos.column, ",color:\'", color, "\'});'", (markerId ? " id='" + markerId + "'" : ""), ">", color, "</span>"
                    );
                }, true);
                Colors[id] = [range, marker, editor.session];
            }
            markers.push(marker);
        });

        this.hideColorTooltips(editor, markers);
    },

    /**
     * Hide all markers/ tooltips that are currently visible. Exceptions can be
     * provided via the [exceptions] argument.
     * 
     * @param {Editor} editor
     * @param {Array} exceptions
     * @type {void}
     */
    hideColorTooltips: function(editor, exceptions) {
        if (this.$activeColor)
            return;
        if (!exceptions && this.menu && this.menu.visible)
            this.menu.hide();
        if (exceptions && !apf.isArray(exceptions))
            exceptions = [exceptions];
        var marker, session;
        for (var mid in Colors) {
            marker = Colors[mid][1];
            session = editor ? editor.session : Colors[mid][2];
            if (exceptions && exceptions.indexOf(marker) > -1)
                continue;
            session.removeMarker(marker);
            delete Colors[mid];
        }
    },

    /**
     * Parses any color string and returns an object with the type of color (hex,
     * rgb or hsb), the color object or string (in the case of hex) and the hex
     * representation of that color.
     * 
     * @param {String} color
     * @type {Object}
     */
    parseColorString: function(color) {
        var ret = {
            orig: color
        };
        
        if (typeof namedColors[color] != "undefined")
            color = apf.color.fixHex(namedColors[color].toString(16));
        var rgb = color.match(Regexes.isRgb);
        var hsb = color.match(Regexes.isHsl);
        if (rgb && rgb.length >= 3) {
            ret.rgb = apf.color.fixRGB({
                r: rgb[1], 
                g: rgb[2], 
                b: rgb[3]
            });
            ret.hex = apf.color.RGBToHex(rgb);
            ret.type = "rgb";
        }
        else if (hsb && hsb.length >= 3) {
            ret.hsb = apf.color.fixHSB({
                h: hsb[1],
                s: hsb[2],
                b: hsb[3]
            });
            ret.hex = apf.color.HSBToHex(hsb);
            ret.type = "hsb";
        }
        else {
            ret.hex = apf.color.fixHex(color.replace("#", ""), true);
            ret.type = "hex";
        }

        return ret;
    },

    /**
     * Show or hide the colorpicker, depending on its current state (visible or not).
     * 
     * @param {Range} pos
     * @param {Editor} editor
     * @param {String} line
     * @param {String} color
     * @type {void}
     */
    toggleColorPicker: function(pos, editor, line, color) {
        ext.initExtension(this);
        var menu = this.menu;
        var cp = this.colorpicker;

        var parsed = this.parseColorString(color);

        if (menu.visible && parsed.hex == this.$activeColor.color.orig && pos.row == this.$activeColor.row)
            return menu.hide();

        // set appropriate event listeners, that will be removed when the colorpicker
        // hides.
        var onKeyDown, onScroll, onCursorChange, onSelectionChange;
        var _self = this;
        apf.addEventListener("keydown", onKeyDown = function(e) {
            var a = _self.$activeColor;

            if (!cp || !a || !cp.visible) 
                return;

            // when ESC is pressed, undo all changes made by the colorpicker
            if (e.keyCode === 27) {
                menu.hide();
                clearTimeout(_self.$colorPickTimer);
                var at = editor.session.$undoManager;
                if (at.undolength > a.start)
                    at.undo(at.undolength - a.start);
            }
        });

        ide.addEventListener("codetools.cursorchange", onCursorChange = function(e) {
            var a = _self.$activeColor;

            if (!cp || !a || !cp.visible) 
                return;

            var pos = e.pos;
            var range = a.marker[0];
            if (pos.row < range.start.row || pos.row > range.end.row 
              || pos.column < range.start.column || pos.column > range.end.column)
                menu.hide();
        });

        editor.addEventListener("mousewheel", onScroll = function(e) {
            var a = _self.$activeColor;

            if (!cp || !a || !cp.visible) 
                return;

            menu.hide();
        });

        var id = "colorpicker" + parsed.hex + pos.row;
        delete this.$activeColor;
        this.hideColorTooltips(editor);
        this.showColorTooltip(pos, editor, line, [parsed.orig], id);
        menu.show();
        cp.$input.focus();
        this.$activeColor = {
            color: parsed,
            hex: parsed.hex,
            markerNode: id,
            line: line,
            current: parsed.orig,
            pos: pos,
            marker: Colors[id],
            editor: editor,
            ignore: cp.value != color ? 2 : 1,
            start: editor.session.$undoManager.undolength,
            listeners: {
                onKeyDown: onKeyDown,
                onScroll: onScroll,
                onCursorChange: onCursorChange,
                onSelectionChange: onSelectionChange
            }
        };
        if (parsed.type == "rgb") {
            cp.setProperty("red", parsed.rgb.r);
            cp.setProperty("green", parsed.rgb.g);
            cp.setProperty("blue", parsed.rgb.b);
        }
        else if (parsed.type == "hsb") {
            cp.setProperty("hue", parsed.hsb.h);
            cp.setProperty("saturation", parsed.hsb.s);
            cp.setProperty("brightness", parsed.hsb.b);
        }
        else
            cp.setProperty("value", parsed.hex);

        this.updateColorTools(editor);

        this.resize();
    },

    /**
     * Scans the document for colors and generates the list as shown below the 
     * color picker for quick access to colors that are already in use.
     * 
     * @param {Editor} editor
     * @type {void}
     */
    updateColorTools: function(editor) {
        var lines = editor.session.getLines(0, 2000);
        var m;
        var colors = [];
        for (var i = 0, l = lines.length; i < l; ++i) {
            if (!(m = lines[i].match(Regexes.isColor)))
                continue;
            colors = colors.concat(m);
        }
        colors.makeUnique();

        var out = [];
        var parsed;
        for (i = 0, l = Math.min(colors.length, 11); i < l; ++i) {
            parsed = this.parseColorString(colors[i]);
            
            out.push('<span class="color" style="background-color: #', parsed.hex, 
                '" data-color="', parsed.hex, '" title="', parsed.orig, '">&nbsp;</span>');
        }
        this.colortools.innerHTML = "<span>Existing file colors:</span>" + out.join("");
    },

    /**
     * When a color is picked in the colorpicker, this function is called. It 
     * updates the color value inside the ACE document with the newly picked color.
     * Since the value change of the color picker is realtime and generates A LOT 
     * of calls to this function, we filter the calls and only apply the change
     * when no color was picked for 200ms.
     * 
     * @param {String} old
     * @param {String} color
     * @type {void}
     */
    onColorPicked: function(old, color) {
        var a = this.$activeColor;
        if (!a)
            return;
        if (a.ignore) {
            --a.ignore;
            return;
        }

        clearTimeout(this.$colorPickTimer);

        var doc = a.editor.session.doc;
        var line = doc.getLine(a.pos.row);
        if (typeof a.markerNode == "string") {
            var node = document.getElementById(a.markerNode);
            if (node)
                a.markerNode = node;
            else
                return;
        }
        var newLine, newColor;
        if (a.color.type == "hex") {
            newColor = "#" + color;
        }
        else if (a.color.type == "rgb") {
            var m = a.current.match(Regexes.isRgb);
            var regex = new RegExp("(rgba?)\\(\\s*" + m[1] + "\\s*,\\s*" + m[2] 
                + "\\s*,\\s*" + m[3] + "(\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)", "i");
            if (!line.match(regex))
                return;
            var rgb = apf.color.hexToRGB(color);
            newLine = line.replace(regex, function(m, prefix, suffix) {
                return (newColor = prefix + "(" + rgb.r + ", " + rgb.g + ", " + rgb.b + (suffix || "") + ")");
            });
        }
        else if (a.color.type == "hsb") {
            var m = a.current.match(Regexes.isHsl);
            var regex = new RegExp("hsl\\(\\s*" + m[1] + "\\s*,\\s*" + m[2] 
                + "\\s*,\\s*" + m[3] + "\\s*\\)", "i");
            if (!line.match(regex))
                return;
            var hsb = apf.color.hexToHSB(color);
            newLine = line.replace(regex, function() {
                return (newColor = "hsl(" + parseInt(hsb.h, 10) + ", " 
                    + parseInt(hsb.s, 10) + "%, " + parseInt(hsb.b, 10) + "%)");
            });
        }
        a.hex = color;

        a.markerNode.innerHTML = newColor;

        this.$colorPickTimer = setTimeout(function() {
            var range = createColorRange(a.pos.row, a.pos.column, line, a.current);
            if (!range)
                return;
            a.marker[0] = range;
            doc.replace(range, newColor);
            a.current = newColor;
        }, 200);
    },

    /**
     * When the browser window is resized and the colorpicker menu is opened, the
     * position of the colorpicker has to be adjusted to the correct value.
     * This function also takes window edges and menu arrow positioning into 
     * account.
     * 
     * @param {Object} color
     * @type {void}
     */
    resize: function(color) {
        if (!this.menu.visible)
            return;

        var a = color || this.$activeColor;
        var pos = a.pos;
        var orig = a.color.orig;
        var line = a.line;
        var renderer = Editors.currentEditor.amlEditor.$editor.renderer;
        var cp = this.colorpicker;
        var menu = this.menu;

        //default to arrow on the left side:
        menu.setProperty("class", "left");

        // calculate the x and y (top and left) position of the colorpicker
        var coordsStart = renderer.textToScreenCoordinates(pos.row, line.indexOf(orig) - 1);
        var coordsEnd = renderer.textToScreenCoordinates(pos.row, line.indexOf(orig) + orig.length);
        var origX, origY;
        var y = origY = coordsEnd.pageY - 24;
        var x = origX = coordsEnd.pageX + 30;
        var pOverflow = apf.getOverflowParent(cp.$ext);
        // we take a margin of 20px on each side of the window:
        var height = menu.$ext.offsetHeight + 10;
        var width = menu.$ext.offsetWidth + 10;

        var edgeY = (pOverflow == document.documentElement
            ? (apf.isIE 
                ? pOverflow.offsetHeight 
                : (window.innerHeight + window.pageYOffset)) + pOverflow.scrollTop
            : pOverflow.offsetHeight + pOverflow.scrollTop);
        var edgeX = (pOverflow == document.documentElement
            ? (apf.isIE 
                ? pOverflow.offsetWidth
                : (window.innerWidth + window.pageXOffset)) + pOverflow.scrollLeft
            : pOverflow.offsetWidth + pOverflow.scrollLeft);

        if (y + height > edgeY) {
            y = edgeY - height;
            if (y < 0)
                y = 10;
        }
        if (x + width > edgeX) {
            x = edgeX - width;
            // check if the menu will be positioned on top of the text
            if (coordsEnd.pageX > x && coordsEnd.pageX < x + width) {
                // take 20px for the arrow...
                x = coordsStart.pageX - width - 20;
                menu.setProperty("class", "right");
            }
            if (x < 10) {
                menu.setProperty("class", "noarrow");
                if (coordsStart.pageY > height)
                    y = coordsStart.pageY - height + 10;
                else
                    y = coordsStart.pageY + 40;

                x = 10;
            }
        }

        // position the arrow
        if (!origArrowTop)
            origArrowTop = parseInt(apf.getStyle(this.arrow, "top"), 10);
        if (y != origY)
            this.arrow.style.top = (origArrowTop + (origY - y)) + "px"
        else
            this.arrow.style.top = origArrowTop + "px";

        menu.$ext.style.zIndex = 10002;
        menu.$ext.style.top = y + "px";
        menu.$ext.style.left = x + "px";
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
        // hiding the menu also detaches all event listeners.
        if (this.menu.visible)
            this.menu.hide();

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
define(function(require, exports, module) {
    // use the apf one, when apf is avaialble. Otherwise use some mocked one
    var namedColors = typeof apf !== "undefined" ? apf.color.colorshex : { "black":0, "white":16777215 };
    var namedPart = Object.keys(namedColors).join("|");
    
    var patterns = {
        rgb: "rgba?\\(\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*,\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*,\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*(:?\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)",
        rgb_alt: "rgba?\\(\\s*\\b(\\d{1,2}|100)%\\s*,\\s*\\b(\\d{1,2}|100)%\\s*,\\s*\\b(\\d{1,2}|100)%\\s*(:?\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)",    
        hsl: "hsla?\\(\\s*\\b([1-2][0-9][0-9]|360|3[0-5][0-9]|[1-9][0-9]|[0-9])\\b\\s*,\\s*\\b(\\d{1,2}|100)%\\s*,\\s*\\b(\\d{1,2}|100)%\\s*(:?\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)"
    };
    
    var isColor = new RegExp("(#([0-9A-Fa-f]{3,6})\\b)"
        + "|\\b(" + namedPart + ")\\b"
        + "|(" + patterns.rgb + ")"
        + "|(" + patterns.rgb_alt + ")"
        + "|(" + patterns.hsl + ")", "gi");
    
    var isRgb = new RegExp("(?:" + patterns.rgb + ")"
        + "|(?:" + patterns.rgb_alt + ")");
    
    var isHsl = new RegExp(patterns.hsl);
    
    exports = module.exports = {
        isColor: isColor,
        isRgb: isRgb,
        isHsl: isHsl
    };
});if (typeof process !== "undefined") {
    require("amd-loader");
}


if (typeof process !== "undefined") {
    require("../../../support/paths");
    require.paths.unshift(__dirname + "/../..");
}

var regex = require("./colorpicker_regex");

define(function(require, exports, module) {
    var assert = require("assert");

    module.exports = {
        "test simple rgb": function(next) {
            var res = regex.isRgb("rgb(14, 235, 19)");
            
            assert.equal(!!res, true);
            assert.equal(res[1], "14");
            assert.equal(res[2], "235");
            assert.equal(res[3], "19");
            assert.equal(res[4], undefined);
            
            next();
        },
        "test simple rgba": function(next) {
            var res = regex.isRgb("rgba(14, 235, 19, .9)");
            
            assert.equal(!!res, true);
            assert.equal(res[1], "14");
            assert.equal(res[2], "235");
            assert.equal(res[3], "19");
            assert.equal(res[4], ", .9");
            
            next();
        },
        "test rgba with transparancy over 1": function(next) {
            var res = regex.isRgb("rgba(14, 235, 19, 1.9)");
            
            assert.equal(!!res, false);
            
            next();
        },
        "test rgb with values over 255": function(next) {
            var res = regex.isRgb("rgb(256, 19, 32)");
            
            assert.equal(!!res, false);
            
            next();
        },
        "test hsl": function(next) {
            var res = regex.isHsl("hsl(14, 99%, 33%)");
            
            assert.equal(!!res, true);
            assert.equal(res[1], "14");
            assert.equal(res[2], "99");
            assert.equal(res[3], "33");
            assert.equal(res[4], undefined);
            
            next();
        },
        "test hsla": function(next) {
            var res = regex.isHsl("hsla(14, 99%, 33%, .7)");
            
            assert.equal(!!res, true);
            assert.equal(res[1], "14");
            assert.equal(res[2], "99");
            assert.equal(res[3], "33");
            assert.equal(res[4], ", .7");
            
            next();
        },
        "test hsla positive transparancy": function(next) {
            var res = regex.isHsl("hsla(14, 99%, 33%, 3.7)");
            
            assert.equal(!!res, false);
            
            next();
        },
        "test hsla values too high": function(next) {
            var res = regex.isHsl("hsla(201, 101%, 00000411%, 0.7)");
            
            assert.equal(!!res, false);
            
            next();
        },
        "test hsla bullocks values": function(next) {
            var res = regex.isHsl("hsla(abc, def, geh, .9)");
            
            assert.equal(!!res, false);
            
            next();
        },
        "test text colors": function(next) {
            var res = regex.isColor("white");
            
            assert.equal(!!res, true);
            
            next();
        },
        "test text any string": function(next) {
            var res = regex.isColor("jan is cool");
            
            assert.equal(!!res, false);
            
            next();
        },  
    };
});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec();
}/**
 * Console for the Cloud9 IDE
 *
 * The console plugin takes care of rendering a CLI at the bottom of the IDE and
 * of sending user input and parsing and outputting stdout in the
 * console.
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 * @contributor Sergi Mansilla <sergi AT c9 DOT io>
 */

define(function(require, exports, module) {

var editors, parseLine, predefinedCmds; // These modules are loaded on demand
var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");
var Logger = require("ext/console/logger");
var css = require("text!ext/console/console.css");
var markup = require("text!ext/console/console.xml");
var theme = require("text!ext/console/themes/arthur.css");

// Some constants used throughout the plugin
var RE_band = /^\s*!/;
var KEY_TAB = 9, KEY_CR = 13, KEY_UP = 38, KEY_ESC = 27, KEY_DOWN = 40;
var actionCodes = [KEY_TAB, KEY_CR, KEY_UP, KEY_ESC, KEY_DOWN];

// Executes a command (presumably coming from the CLI).
var execAction = function(cmd, data) {
    ide.dispatchEvent("track_action", {
        type: "console",
        cmd: cmd,
        argv: data.argv
    });

    if (ext.execCommand(cmd, data) !== false) {
        var commandEvt = "consolecommand." + cmd;
        var consoleEvt = "consolecommand";
        var commandEvResult = ide.dispatchEvent(commandEvt, { data: data });
        var consoleEvResult = ide.dispatchEvent(consoleEvt, { data: data });

        if (commandEvResult !== false && consoleEvResult !== false) {
            if (!ide.onLine)
                this.write("Cannot execute command. You are currently offline.");
            else
                ide.send(data);
        }
        else {
            // If any of the `consolecommand` events returns false, it means
            // that we don't want the console to show up.
            return false;
        }
    }
    return true;
};

// This object is a simple FIFO queue that keeps track of the list of commands
// introduced by the user at any given time and allows the console to go back and forward.
var cmdHistory = {
    _history: [],
    _index: 0,

    push: function(cmd) {
        this._history.push(cmd);
        this._index = this.length();
    },
    length: function() {
        return this._history.length;
    },
    getNext: function() {
        this._index += 1;
        var cmd = this._history[this._index] || "";
        this._index = Math.min(this.length(), this._index);

        return cmd;
    },
    getPrev: function() {
        this._index = Math.max(0, this._index - 1);
        return this._history[this._index];
    }
};

module.exports = ext.register("ext/console/console", {
    name   : "Console",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    css    : css + theme,
    height : 200,
    hidden : true,
    nodes : [],
    minHeight : 150,

    autoOpen : true,
    excludeParent : true,
    allCommands: {},
    keyEvents: {},
    commands: {
        "help": {
            hint: "show general help information and a list of available commands"
        },
        "clear": {
            hint: "clear all the messages from the console"
        },
        "switchconsole": {
            hint: "toggle focus between the editor and the console"
        },
        "send": {
            hint: "send a message to the server"
        }
    },

    messages: {
        cd: function(message) {
            var res = message.body;
            if (res.cwd) {
                this.$cwd = res.cwd.replace(ide.workspaceDir, "/workspace");
                this.write("Working directory changed.");
            }
        },
        
        error: function(message) {
            Logger.log(message.body);
            Logger.log("", "divider");
        },
        
        /**
         * Info does the same as error in this case
         * but it's here for the future, we might want to distinguise these
         * on colors or something...
         */
        info: function (message) {
            Logger.log(message.body);
            Logger.log("", "divider");
        },
        
        __default__: function(message) {
            var res = message.body;
            if (res) {
                res.out && Logger.logNodeStream(res.out, null, null, ide);
                res.err && Logger.logNodeStream(res.err, null, null, ide);
                res.code && Logger.log("", "divider"); // End of command
            }
        }
    },

    help: function() {
        var words = Object.keys(this.allCommands);
        var tabs = "\t\t\t\t";
        var _self = this;

        Logger.logNodeStream(
            words.sort()
                .map(function(w) { return w + tabs + _self.allCommands[w].hint; })
                .join("\n"),
            null, null, ide
        );
    },

    clear: function() {
        if (txtConsole) {
            txtConsole.clear();
        }
        
        return false;
    },

    switchconsole : function() {
        if (apf.activeElement === txtConsoleInput) {
            if (window.ceEditor) {
                ceEditor.focus();
                this.hide();
            }
        }
        else {
            txtConsoleInput.focus()
        }
    },

    showOutput: function() {
        tabConsole.set(1);
    },

    getCwd: function() {
        return this.$cwd && this.$cwd.replace("/workspace", ide.workspaceDir);
    },

    write: function(lines) {
        if (typeof lines === "string")
            lines = lines.split("\n");

        lines.forEach(function(line) { Logger.log(line, "log"); });
        Logger.log("", "divider");
    },

    keyupHandler: function(e) {
        if (actionCodes.indexOf(e.keyCode) === -1)
            return this.commandTextHandler(e);
    },

    keydownHandler: function(e) {
        if (actionCodes.indexOf(e.keyCode) !== -1)
            return this.commandTextHandler(e);
    },

    evalCmd: function(line) {
        parseLine || (parseLine = require("ext/console/parser"));
        var argv = parseLine(line);
        if (!argv || argv.length === 0) // no commmand line input
            return;

        // Replace any quotes in the command
        argv[0] = argv[0].replace(/["'`]/g, "");
        cmdHistory.push(line);
        Logger.log(this.getPrompt(line), "prompt");
        tabConsole.set("console");

        var showConsole = true;
        var cmd = argv[0];

        predefinedCmds || (predefinedCmds = require("ext/console/output"));
        var defCmd = predefinedCmds.getPredefinedOutput(argv);
        if (defCmd !== "") {
            this.write(defCmd);
        }
        else {
            if (cmd.trim().charAt(0) === "!") {
                cmd = "bash";
                argv[0] = argv[0].replace(RE_band, "");
                line = line.replace(RE_band, "");
            }

            var data = {
                command: cmd,
                argv: argv,
                line: line,
                cwd: this.getCwd(),
                // the requireshandling flag indicates that this message cannot
                // be silently ignored by the server.
                // An error event should be thrown if no plugin handles this message.
                requireshandling: true
            };

            if (cmd.trim() === "npm")
                data.version = settings.model.queryValue("auto/node-version/@version") || "auto";

            showConsole = execAction(cmd, data);
        }
        if (showConsole === true) this.show();
    },

    commandTextHandler: function(e) {
        var code = e.keyCode;
        if (this.keyEvents[code])
            this.keyEvents[code](e.currentTarget);
    },

    onMessage: function(e) {
        var message = e.message;
        if (!message.type)
            return;
        if (message.type === "node-data")
            return Logger.logNodeStream(message.data, message.stream, true, ide);

        if (message.type === "node-exit")
            return Logger.log("", "divider", null, null, true);

        if (message.type.match(/-data$/))
            return Logger.logNodeStream(message.data, message.stream, false, ide);

        if (message.type.match(/-exit$/))
            return Logger.log("", "divider", false);

        if (message.type !== "result")
            return;

        if (this.messages[message.subtype])
            this.messages[message.subtype].call(this, message);
        else
            this.messages.__default__.call(this, message);

        ide.dispatchEvent("consoleresult." + message.subtype, { data: message.body });
    },

    getPrompt: function(suffix) {
        var u = this.username;
        if (!u)
            u = (ide.workspaceId.match(/user\/(\w+)\//) || [,"guest"])[1];

        return "[" + u + "@cloud9]:" + this.$cwd + "$" + ((" " + suffix) || "");
    },
    
    hook: function() {
        var _self = this;
        // Listen for new extension registrations to add to the
        // hints
        ide.addEventListener("ext.register", function(e){
            if (e.ext.commands)
                apf.extend(_self.allCommands, e.ext.commands);
        });

        ext.initExtension(this);
    },

    init: function(amlNode){
        var _self = this;
        this.panel = tabConsole;
        this.$cwd  = "/workspace"; // code smell

        apf.importCssString(this.css);
        // Append the console window at the bottom below the tab
        mainRow.appendChild(winDbgConsole);

        stProcessRunning.addEventListener("activate", function() {
            _self.showOutput();

            var autoshow = settings.model.queryValue("auto/console/@autoshow");
            if (_self.autoOpen && apf.isTrue(autoshow))
                _self.show();
        });

        // before the actual run target gets called we clear the console
        ide.addEventListener("beforeRunning", function () {
            _self.clear();
        });

        ide.addEventListener("socketMessage", this.onMessage.bind(this));
        ide.addEventListener("consoleresult.internal-isfile", function(e) {
            var data = e.data;
            var path = data.cwd.replace(ide.workspaceDir, ide.davPrefix);
            if (!editors)
                editors = require("ext/editors/editors");
            if (data.isfile)
                editors.showFile(path);
            else
                Logger.log("'" + path + "' is not a file.");
        });

        txtConsoleInput.addEventListener("keyup", this.keyupHandler.bind(this));
        txtConsoleInput.addEventListener("keydown", this.keydownHandler.bind(this));

        function kdHandler(e){
            if (!e.ctrlKey && !e.metaKey && !e.altKey
              && !e.shiftKey && apf.isCharacter(e.keyCode))
                txtConsoleInput.focus();
        }

        tabConsole.addEventListener("afterrender", function() {
            txtOutput.addEventListener("keydown", kdHandler);
            txtConsole.addEventListener("keydown", kdHandler);

            var activePage = settings.model.queryValue("auto/console/@active");
            if (activePage && !this.getPage(activePage))
                activePage = null;

            if (!activePage)
                activePage = this.getPages()[0].name;

            this.set(activePage);
        });

        tabConsole.addEventListener("afterswitch", function(e){
            settings.model.setQueryValue("auto/console/@active", e.nextPage.name)
        });

        winDbgConsole.previousSibling.addEventListener("dragdrop", function(e){
            settings.model.setQueryValue("auto/console/@height",
                _self.height = winDbgConsole.height)
        });

        this.nodes.push(
            winDbgConsole,
            mnuWindows.appendChild(new apf.item({
                id: "chkConsoleExpanded",
                caption: "Console",
                type: "check",
                "onprop.checked" : function(e) {
                    if (e.value)
                        _self.show();
                    else
                        _self.hide();
                }
            }))
        );

        ide.addEventListener("loadsettings", function(e){
            if (!e.model.queryNode("auto/console/@autoshow"))
                e.model.setQueryValue("auto/console/@autoshow", true);

            _self.height = e.model.queryValue("auto/console/@height") || _self.height;

            if (apf.isTrue(e.model.queryValue("auto/console/@maximized"))) {
                _self.show(true);
                _self.maximize();
            }
            else {
                if (apf.isTrue(e.model.queryValue("auto/console/@expanded")))
                    _self.show(true);
                else
                    _self.hide(true);
            }
        });

        this.keyEvents[KEY_UP] = function(input) {
            var newVal = cmdHistory.getPrev();
            if (newVal)
                input.setValue(newVal);
        };
        this.keyEvents[KEY_DOWN] = function(input) {
            var newVal = cmdHistory.getNext();
            if (newVal)
                input.setValue(newVal);
            else
                input.setValue("");
        };
        this.keyEvents[KEY_CR] = function(input) {
            _self.evalCmd(input.getValue());
            input.setValue("");
        };

        apf.extend(this.allCommands, ext.commandsLut);
    },

    maximize: function(){
        if (this.maximized)
            return;
        this.maximized = true;

        apf.document.body.appendChild(winDbgConsole);
        winDbgConsole.setAttribute('anchors', '0 0 0 0');
        this.lastZIndex = winDbgConsole.$ext.style.zIndex;
        winDbgConsole.removeAttribute('height');
        winDbgConsole.$ext.style.zIndex = 900000;

        settings.model.setQueryValue("auto/console/@maximized", true);
        btnConsoleMax.setValue(true);
    },

    restore : function(){
        if (!this.maximized)
            return;
        this.maximized = false;

        mainRow.appendChild(winDbgConsole);
        winDbgConsole.removeAttribute('anchors');
        winDbgConsole.setAttribute('height', this.height);
        winDbgConsole.$ext.style.zIndex = this.lastZIndex;

        settings.model.setQueryValue("auto/console/@maximized", false);
        btnConsoleMax.setValue(false);
    },

    show: function(immediate) { this._show(true, immediate); },
    hide: function(immediate) { this._show(false, immediate); },

    _show: function(shouldShow, immediate) {
        if (this.hidden != shouldShow)
            return;

        this.hidden = !shouldShow;

        if (this.$control)
            this.$control.stop();
        
        var _self = this;
        var cfg;
        if (shouldShow) {
            cfg = {
                height: this.height,
                dbgVisibleMethod: "show",
                chkExpandedMethod: "check",
                animFrom: 65,
                animTo: this.height > this.minHeight ? this.height : this.minHeight,
                animTween: "easeOutQuint"
            };

            tabConsole.show();
            apf.setStyleClass(btnCollapseConsole.$ext, "btn_console_openOpen");
        }
        else {
            cfg = {
                height: 41,
                dbgVisibleMethod: "hide",
                chkExpandedMethod: "uncheck",
                animFrom: this.height > this.minHeight ? this.height : this.minHeight,
                animTo: 65,
                animTween: "easeInOutCubic"
            };

            if (winDbgConsole.parentNode != mainRow)
                this.restore();

            apf.setStyleClass(btnCollapseConsole.$ext, "", ["btn_console_openOpen"]);
            winDbgConsole.$ext.style.minHeight = 0;
        }

        var finish = function() {
            if (!shouldShow)
                tabConsole.hide();
            else
                winDbgConsole.$ext.style.minHeight = _self.minHeight + "px";

            winDbgConsole.height = cfg.height + 1;
            winDbgConsole.setAttribute("height", cfg.height);
            winDbgConsole.previousSibling[cfg.dbgVisibleMethod]();
            apf.layout.forceResize();

            settings.model.setQueryValue("auto/console/@expanded", shouldShow);
            chkConsoleExpanded[cfg.chkExpandedMethod]();
        };

        var animOn = apf.isTrue(settings.model.queryValue("general/@animateui"));
        if (!immediate && animOn) {
            apf.tween.single(winDbgConsole.$ext, {
                control : this.$control = {},
                type  : "height",
                anim  : apf.tween[cfg.animTween],
                from  : cfg.animFrom,
                to    : cfg.animTo,
                steps : 8,
                interval : 5,
                onfinish : finish,
                oneach : function() { apf.layout.forceResize(); }
            });
        }
        else {
            finish();
        }
    },
    enable: function(){
        this.nodes.each(function(item) { item.enable(); });
    },

    disable: function(){
        this.nodes.each(function(item) { item.disable(); });
    },

    destroy: function(){
        this.nodes.each(function(item) { item.destroy(true, true); });
        this.nodes = [];
    }
});
});

/**
 * Logger
 * The logger outputs given messages into the console output, properly formatted.
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 * @contributor Sergi Mansilla <sergi AT c9 DOT io>
 */
define(function(require, exports, module) {
var editors = require("ext/editors/editors");

exports.test = {};
var MAX_LINES = 512;
var RE_relwsp = /(?:\s|^|\.\/)([\w\_\$-]+(?:\/[\w\_\$-]+)+(?:\.[\w\_\$]+))?(\:\d+)(\:\d+)*/g;
var RE_URL = /\b((?:(?:https?):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/i;
var RE_COLOR = /\u001b\[([\d;]+)?m/g;

// Remove as many elements in the console output area so that between
// the existing buffer and the stream coming in we have the right
// amount of lines according to MAX_LIMIT.
var balanceBuffer = function(elem) {
    var len = elem.childNodes.length;
    if (len <= MAX_LINES)
        return;

    len = len - MAX_LINES;
    for (var i = 0; i < len; i++)
        elem.removeChild(elem.firstChild);
};

var jump = function(path, row, column) {
    row = parseInt(row.slice(1), 10);
    column = column ? parseInt(column.slice(1), 10) : 0;
    editors.showFile(path, row, column);
};

// Maximum amount of buffer history
var bufferInterval = {};
var setBufferInterval = function(el, id) {
    bufferInterval[id] = setInterval(function() {
        balanceBuffer(el);
    }, 1000);
};

var strRepeat = function(s, t) { return new Array(t + 1).join(s); };
var escRegExp = function(s) { return s.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1'); };

var createItem = module.exports.test.createItem = function(line, ide) {
    if (!line) return "";

    var workspaceDir = ide.workspaceDir;
    var davPrefix = ide.davPrefix;
    var wsRe = new RegExp(escRegExp(workspaceDir) + "\\/([^:]*)(:\\d+)(:\\d+)*", "g");

    if ((line.search(RE_relwsp) !== -1) || (line.search(wsRe) !== -1)) {
        var html = "<a href='#' data-wsp='" + davPrefix + "/$1,$2,$3'>___$1$2$3</a>";
        line = line
            .replace(RE_relwsp, html.replace("___", ""))
            .replace(wsRe, html.replace("___", workspaceDir + "/"));
    }
    else if (line.search(RE_URL) !== -1) {
        line = line.replace(RE_URL, "<a href='$1' target='_blank'>$1</a>");
    }
    
    // escape HTML/ XML, but preserve the links:
    var links = [];
    var replacer = "###$#$#$##0";
    line = line.replace(/(<a.*?a>)/gi, function(m) {
        links.push(m);
        return replacer;
    });
    
    line = apf.escapeXML(line);
    
    line = line.replace(replacer, function() {
        return links.shift();
    });
    
    var open = 0;
    line = line
        .replace(/\s{2,}/g, function(str) { return strRepeat("&nbsp;", str.length); })
        .replace(RE_COLOR, function(m, style) {
            if (!style)
                return "";
            style = parseInt(style.replace(";", ""), 10);
            // check for end of style delimiters
            if (open > 0 && (style === 39 || (style < 30 && style > 20))) {
                --open;
                return "</span>";
            }
            else {
                if (style === 1) {
                    ++open;
                    return "<span class=\"term_boldColor\" style=\"font-weight:bold\">";
                }
                else if (style === 3) {
                    ++open;
                    return "<span style=\"font-style:italic\">";
                }
                else if (style === 4) {
                    ++open;
                    return "<span style=\"text-decoration:underline\">";
                }
                else if (style >= 30 && !(style > 40 && style < 50)) {
                    ++open;
                    var ansiColor = (style % 30);
                    if (ansiColor >= 10)
                        ansiColor -= 2;
                    return "<span class=\"term_ansi" + ansiColor + "Color\">";
                }
                else
                    return "";
            }
        })
        .replace(/(\u0007|\u001b)\[(K|2J)/g, "");

    if (open > 0)
        return line + (new Array(open + 1).join("</span>"));
    return line;
};

var childBuffer = {};
var childBufferInterval = {};
var eventsAttached;

var getOutputElement = function(choice) {
    var ret = {
        element: txtConsole.$ext,
        id: "console"
    };
    if (!choice)
        return ret;

    // legacy support: choice passed as Boolean TRUE means 'use txtOutput'.
    if (typeof choice == "boolean" && choice) {
        ret.element = txtOutput.$ext;
        ret.id = "output";
    }
    else if (choice.$ext && choice.id) {
        ret.element = choice.$ext;
        ret.id = choice.id;
    }

    return ret;
}

module.exports.logNodeStream = function(data, stream, useOutput, ide) {
    var out = getOutputElement(useOutput);
    var parentEl = out.element;
    var outputId = out.id;

    if (eventsAttached !== true) {
        parentEl.addEventListener("click", function(e) {
            var node = e.target;
            if (node.hasAttribute("data-wsp"))
                jump.apply(null, e.target.getAttribute("data-wsp").split(","));
        });
        eventsAttached = true;
    }

    if (!bufferInterval[outputId]) {
        setBufferInterval(parentEl, outputId);
    }

    // This is a bit cumbersome, but it solves the issue in which logging stuff
    // in the console at a high speed keeps the browser incredibly busy, and
    // sometimes it even crashes. An interval is created in which every 100ms
    // The lines stored in the document fragment are appended in the actual console
    // output.
    if (!childBuffer[outputId]) {
        childBuffer[outputId] = document.createDocumentFragment();
        childBufferInterval[outputId] = setInterval(function() {
            parentEl.appendChild(childBuffer[outputId]);
            childBuffer[outputId] = document.createDocumentFragment();
        }, 100);
    }

    var lines = (data.toString()).split("\n", MAX_LINES);
    var fragment = document.createDocumentFragment();
    for (var i=0, l = lines.length; i<l; i++) {
        var div = document.createElement("div");
        var divContent = createItem(lines[i], ide);
        if (divContent && divContent.length) {
            div.innerHTML = divContent;
            fragment.appendChild(div);
        }
    }
    childBuffer[outputId].appendChild(fragment);
};

var messages = {
    divider: "<span class='cli_divider'></span>",
    prompt: "<span style='color:#86c2f6'>__MSG__</span>",
    command: "<span style='color:#86c2f6'><span>&gt;&gt;&gt;</span><div>__MSG__</div></span>"
};

module.exports.log = function(msg, type, pre, post, useOutput) {
    msg = msg.toString().escapeHTML();
    if (!type)
        type = "log";

    if (messages[type]) {
        msg = messages[type].replace("__MSG__", msg);
    }

    var out = getOutputElement(useOutput);
    var parentEl = out.element;
    var outputId = out.id;

    if (!bufferInterval[outputId]) {
        setBufferInterval(parentEl, outputId);
    }

    parentEl.innerHTML +=
        "<div class='item console_" + type + "'>" +
            (pre || "") + msg + (post || "") +
        "</div>";
};

});
/**
 * Logger unit tests.
 *
 * @author Sergi Mansilla <sergi AT ajax DOT org>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

if (typeof process !== "undefined") {
    require("../../../support/paths");
    require.paths.unshift(__dirname + "/../..");
}

String.prototype.escapeHTML = function() { return this; };

define(function(require, exports, module) {
    var assert = require("assert");
    var createItem = require("ext/console/logger").test.createItem;
    console.log(createItem);

    var ide = {
        workspaceDir: "sergi/exampleProject",
        davPrefix: "sergi/exampleProject"
    };

    module.exports = {
        "test create item": function(next) {
            var line1 = "    This is just normal output business";
            var expected1 = "<div>&nbsp;&nbsp;&nbsp;&nbsp;This is just normal output business</div>";

            var line1Created = createItem(line1, ide);
            assert.equal(line1Created, expected1);

            next();
        },
        "test create item with color": function(next) {
            var line2 = "This one with a little bit of [32mcolor";
            var expected2 = "<div>This one with a little bit of <span style='color: green'>color</div>";

            var line2Created = createItem(line2, ide);
            assert.equal(line2Created, expected2);

            var line3 = "This one with a little bit of [32mcolor [31mand even a red bit";
            var expected3 = "<div>This one with a little bit of <span style='color: green'>color "
                + "<span style='color: red'>and even a red bit</div>";

            var line3Created = createItem(line3, ide);
            assert.equal(line3Created, expected3);

            next();
        },
    };
});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec();
}/**
 * Console output for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 * @contributor Sergi Mansilla <sergi AT c9 DOT io>
 */

define(function(require, exports, module) {
module.exports = {
    general: {
        "make me a sandwich": "What? Make it yourself!",
        "make love": "I put on my robe and wizard hat.",
        "i read the source code": "<3",
        "lpr": "PC LOAD LETTER",
        "hello joshua": "How about a nice game of Global Thermonuclear War?",
        "xyzzy": "Nothing happens.",
        "date": "March 32nd",
        "hello": "Why hello there!",
        "who": "Doctor Who?",
        "su": "God mode activated. Remember, with great power comes great ... aw, screw it, go have fun.",
        "fuck": "I have a headache.",
        "whoami": "You are Richard Stallman.",
        "nano": "Seriously? Why don't you just use Notepad.exe? Or MS Paint?",
        "top": "It's up there --^",
        "moo":"moo",
        "ping": "There is another submarine three miles ahead, bearing 225, forty fathoms down.",
        "find": "What do you want to find? Kitten would be nice.",
        "more":"Oh, yes! More! More!",
        "your gay": "Keep your hands off it!",
        "hi":"Hi.",
        "echo": "Echo ... echo ... echo ...",
        "bash": "You bash your head against the wall. It's not very effective.",
        "ssh": "ssh, this is a library.",
        "uname": "Illudium Q-36 Explosive Space Modulator",
        "finger": "Mmmmmm...",
        "kill": "Terminator deployed to 1984.",
        "use the force luke": "I believe you mean source.",
        "use the source luke": "I'm not luke, you're luke!",
        "serenity": "You can't take the sky from me.",
        "enable time travel": "TARDIS error: Time Lord missing.",
        "ed": "You are not a diety."
    },
    man: {
        "last": "Man, last night was AWESOME.",
        "help": "Man, help me out here.",
        "next": "Request confirmed; you will be reincarnated as a man next.",
        "cat":  "You are now riding a half-man half-cat.",
        "__default__": "Oh, I'm sure you can figure it out."
    },
    locate: {
        "ninja": "Ninja can not be found!",
        "keys": "Have you checked your coat pocket?",
        "joke": "Joke found on user.",
        "problem": "Problem exists between keyboard and chair.",
        "raptor": "BEHIND YOU!!!",
        "__default__": "Locate what?"
    },
    sudo: {
        "make me a sandwich": "Okay.",
        "apt-get moo": [" ",
            "        (__)",
            "        (oo)",
            "  /------\\/ ",
            " / |    ||  ",
            "*  /\\---/\\  ",
            "   ~~   ~~  ",
            "....\"Have you mooed today?\"...",
            " "],
        "__default__": "E: Invalid operation %s"
    },
    // If there is a predefined (i.e. hardcoded) output for the current
    // command being executed in the CLI, show that.
    getPredefinedOutput: function(argv) {
        var rest;
        var out = this[argv[0]];
        if (out) {
            rest = argv.slice(1).join(" ").trim();
            return out[rest] || out.__default__.replace("%s", argv[0]);
        }
        else {
            rest = argv.join(" ").trim();
            return this.general[rest] || "";
        }
    }
};
});

define(function(require, exports, module) {
// Parses a CLI instruction line and returns an array of its arguments, respecting
// quotes and special cases.
module.exports = function(lineBuffer) {
    var argv = [];
    var cursor = 0;
    var currentQuote = "";
    var inSpace = false;
    var len = lineBuffer.length;

    for (var i=0; i<len; i++) {
        var ch = lineBuffer.charAt(i);
        if (!argv[cursor])
            argv[cursor] = "";

        if (/["'`]/.test(ch)) {
            if (currentQuote.length) {
                if (currentQuote === ch)
                    currentQuote = "";
                else {
                    argv[cursor] += ch;
                }
            }
            else {
                currentQuote = ch;
            }
            inSpace = false;
        }
        else if (/\s/.test(ch)) {
            if (currentQuote.length) {
                inSpace = false;
                argv[cursor] += ch;
            }
            else if (!inSpace) {
                inSpace = true;
                cursor += 1;
            }
        }
        else {
            inSpace = false;
            argv[cursor] += ch;
        }
    }

    if (argv[argv.length - 1] === "")
        argv.pop();

    return argv;
};
});
/**
 * Console unit tests.
 *
 * @author Sergi Mansilla <sergi AT ajax DOT org>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

if (typeof process !== "undefined") {
    require("../../../support/paths");
    require.paths.unshift(__dirname + "/../..");
}
define(function(require, exports, module) {
    var assert = require("assert");
    var parseLine = require("ext/console/parser");
    module.exports = {
        "test normal cli": function(next) {
            var expected1 = ["this", "is", "-a", "test"];
            assert.equal(parseLine("this is -a test").toString(), expected1.toString());
            next();
        },
        "test quoted cli": function(next) {
            var expected = ["this", "is", "a", "test"];
            assert.equal(parseLine("this \"is\" 'a' `test`").toString(), expected.toString());
            next();
        },
        "test spaces in cli": function(next) {
            var expected = ["this", "is", "a", "test"];
            assert.equal(parseLine("this      is    a     test     ").toString(), expected.toString());
            next();
        },
        "test quoted spaces cli": function(next) {
            var expected = ["this", "is", "a really awesome", "test"];
            assert.equal(parseLine("this \"is\" 'a really awesome' `test`").toString(), expected.toString());
            next();
        }
    };
});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec();
}var Util = require("util");

var levels = {
    "info":  ["\033[1m\033[90m", "\033[39m\033[22m"], // grey
    "error": ["\033[31m", "\033[39m"], // red
    "fatal": ["\033[35m", "\033[39m"], // magenta
    "exit":  ["\033[36m", "\033[39m"]  // cyan
};
var _slice = Array.prototype.slice;


var log = function() {
    var args = _slice.call(arguments);
    var lastArg = args[args.length - 1];

    var level = levels[lastArg] ? args.pop() : "info";
    if (!args.length)
        return;

    var msg = args.map(function(arg) {
        return typeof arg != "string" ? Util.inspect(arg) : arg;
    }).join(" ");
    var pfx = levels[level][0] + "[" + level + "]" + levels[level][1];

    msg.split("\n").forEach(function(line) {
        console.log(pfx + " " + line);
    });
};

log("This is info");
log("This is error", "error");
log("This is fatal", "fatal");
log("This is exit", "exit");

console.log("");

// classic, additional test:
var T = "gYw";   // The test text

console.log("\n                 40m     41m     42m     43m\
     44m     45m     46m     47m");

['    m', '   1m', '  30m', '1;30m', '  31m', '1;31m', '  32m', '1;32m', '  33m', 
 '1;33m', '  34m', '1;34m', '  35m', '1;35m', '  36m', '1;36m', '  37m', 
 '1;37m'].forEach(function(FGs) {
    var FG = FGs.replace(/[\s\t]+/g, "");
    console.log(" " + FGs + " \033[" + FG + "  " + T + "  ");
    //["40m", "41m", "42m,", "43m", "44m", "45m", "46m", "47m"].forEach(function(BG) {
    //    console.log("\033[" + FG + "\033[" + BG + "  " + T + "  \033[0m");
    //});
});

log("<b>" + levels["fatal"][0] + "Lastly:" + levels["fatal"][1] + " some HTML!</b>");
/**
 * Console hints and autcompletion for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 * @contributor Sergi Mansilla <sergi AT c9 DOT io>
 */

define(function(require, exports, module) {

"use strict";

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/consolehints/consolehints.xml");
var css = require("text!ext/consolehints/consolehints.css");
var Console = require("ext/console/console");

var winHints, selectedHint, animControl, hintsTimer;
var RE_lastWord = /(\w+)$/;
var filterCommands = function(commands, word) {
    return commands.filter(function(cmd) {
        return cmd !== word && cmd.search(new RegExp("^" + word)) !== -1;
    }).sort();
};

var mouseHandler = function(e) {
    clearTimeout(hintsTimer);
    var el = e.target || e.srcElement;
    while (el && el.nodeType === 3 && el.tagName !== "A" && el !== winHints)
        el = el.parentNode;

    if (el.tagName !== "A") return;

    var self = this;
    hintsTimer = setTimeout(function() { self.select(el); }, 5);
};

var fontSize;
// This function is not accurate, but we don't care since we don't need precision.
var getFontSize = function(txtNode) {
    if (fontSize)
        return fontSize;

    var font = apf.getStyle(txtNode, "font");
    var el = document.createElement("span");
    el.style.font = font;
    el.innerHTML = "m";
    document.body.appendChild(el);
    fontSize = {
        width: el.offsetWidth,
        height: el.offsetHeight
    };
    document.body.removeChild(el);
    return fontSize;
};

var hintLink = function(data) {
    var dataAttr = [data.base, data.cmdName, data.cursorPos, !!data.cmd].join(",");
    if (!data.cmd)
        return '<a href="#" data-hint="'+ dataAttr + '">' + data.cmdName + '</a>';

    var spanHotkey = "";
    var key = data.cmd.hotkey;
    if (key) {
        var notation = apf.isMac ? apf.hotkeys.toMacNotation(key) : key;
        spanHotkey = '<span class="hints_hotkey">' + notation + '</span>';
    }
    var cmdText = '<span>' + data.cmd.hint + '</span>' + spanHotkey;
    return '<a href="#" data-hint="'+ dataAttr + '">' + data.cmdName + cmdText + '</a>';
};

module.exports = ext.register("ext/consolehints/consolehints", {
    name   : "ConsoleHints",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    css    : css,
    deps   : [Console],
    hidden : true,
    nodes  : [],
    autoOpen : true,
    excludeParent : true,

    init: function() {
        var _self = this;
        var initConsoleDeps = function() {
            apf.importCssString(_self.css);
            winHints = document.getElementById("barConsoleHints");
            apf.addListener(winHints, "mousemove", mouseHandler.bind(_self));
            apf.addListener(winHints, "click", _self.click.bind(_self));
            
            Console.messages.commandhints = function(message) {
                var cmds = message.body;
                for (var cmd in cmds)
                    Console.allCommands[cmd] = cmds[cmd];
            };
            Console.messages["internal-autocomplete"] = function(message) {
                var cmds = message.body;
                _self.show(txtConsoleInput, "", cmds.matches, txtConsoleInput.getValue().length - 1);
            };
    
            // Asynchronously retrieve commands that other plugins may have
            // registered, hence the (relatively) long timeout.
            setTimeout(function() {
                ide.send({
                    command: "commandhints",
                    cwd: Console.getCwd()
                });
            }, 1000);
            
            txtConsoleInput.addEventListener("blur", function(e) { _self.hide(); });
            txtConsoleInput.addEventListener("keyup", function(e) {
                // Ignore up/down cursor arrows here
                if (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 9) return;
                var getCmdMatches = function(filtered) {
                    var cli = e.currentTarget;
                    if (filtered.length && filtered[0] !== "[PATH]")
                        _self.show(cli, "", filtered, cli.getValue().length - 1);
                    else {
                        _self.hide();
                    }
                };
    
                var cliValue = e.currentTarget.getValue();
                if (cliValue)
                    _self.getCmdCompletion(cliValue, getCmdMatches);
                else
                    _self.hide();
            });
    
            // Below we are overwriting the Console default key events in function of
            // whether the hints are being displayed or not.
            var redefinedKeys = {
                38: "selectUp",
                40: "selectDown",
                27: "hide",
                13: "onEnterKey",
                9: "onTabKey"
            };
    
            Object.keys(redefinedKeys).forEach(function(keyCode) {
                var previousKey = Console.keyEvents[keyCode];
                Console.keyEvents[keyCode] = function(target) {
                    if (winHints.style.display === "none" && previousKey) {
                        previousKey(target);
                    }
                    else {
                        // try executing the redefined mapping
                        // if it returns false, then execute the old func
                        if (!_self[redefinedKeys[keyCode]].call(_self)) {
                            previousKey(target);
                            _self.hide();
                        }
                    }
                };
            });
        };
        
        if (Console && Console.messages) {
            initConsoleDeps();
        }
        else {
            ide.addEventListener("init.ext/console/console", initConsoleDeps);
        }
    },
    
    show: function(textbox, base, hints, cursorPos) {
        if (animControl && animControl.stop)
            animControl.stop();

        var content = hints.map(function(hint) {
            var cmdName = base ? base + hint.substr(1) : hint;
            return hintLink({
                base: base,
                cmdName: cmdName,
                cursorPos: cursorPos,
                cmd: Console.allCommands[cmdName]
            });
        }).join("");

        winHints.innerHTML = content;
        selectedHint = null;

        if (apf.getStyle(winHints, "display") === "none") {
            winHints.style.display = "block";
            winHints.visible = true;
        }

        var size = getFontSize(textbox.$ext);
        winHints.style.left = parseInt(cursorPos * size.width, 10) + "px";
    },
    hide: function() {
        winHints.style.display = "none";
        winHints.visible = false;
        selectedHint = null;
        
        return true;
    },
    click: function(e) {
        var node = e.target;
        if (node.parentNode != winHints && node != winHints)
            node = node.parentNode;

        var parts = node.getAttribute("data-hint").split(",");
        var cmdName = parts[1];
        var isCmd = (parts[3] === "true");

        if (isCmd)
            cmdName += " "; // for commands we suffix with whitespace

        var cliValue = txtConsoleInput.getValue();
        var index = cliValue.search(RE_lastWord);
        if (index !== -1) // If the command is partially there or not
            cliValue = cliValue.replace(RE_lastWord, cmdName);
        else
            cliValue += cmdName;

        txtConsoleInput.setValue(cliValue);
        txtConsoleInput.focus();

        var input = txtConsoleInput.querySelector("input");
        if (input)
            input.selectionStart = input.selectionEnd = index + cmdName.length;

        this.hide();
    },
    // Given a value and a function for subCommands `fn1` and a function for one
    // command `fn2`, calls the functions with the proper array of completions,
    // if any.
    getCmdCompletion: function(value, fn1, fn2) {
        var fullCmd = value.match(/(\w+)\s+(.*)$/);
        if (fullCmd) {
            // If we don't recognize the root command
            var rootCmd = Console.allCommands[fullCmd[1]];
            if (!rootCmd)
                return fn1([]);

            var subCommands = rootCmd.commands;
            var filtered;
            if (subCommands && subCommands["[PATH]"])
                filtered = ["[PATH]"];
            else if (subCommands)
                filtered = filterCommands(Object.keys(subCommands), fullCmd[2]);
            else
                filtered = [];

            fn1(filtered, fullCmd[1], fullCmd[2]);
        }
        else {
            (fn2 || fn1)(filterCommands(Object.keys(Console.allCommands), value));
        }
    },
    onTabKey: function() {
        this.hide();

        var cliValue = txtConsoleInput.getValue();
        if (!cliValue) return;

        this.getCmdCompletion(cliValue,
            function(cmds, cmd1, cmd2) {
                if (cmds.length) {
                    // This is legacy. Not the best way to determine if a command
                    // accepts filename inputs
                    if (cmds[0] === "[PATH]") {
                        ide.send({
                            command: "internal-autocomplete",
                            argv: [cmd1, cmd2],
                            cwd: Console.getCwd()
                        });
                    }
                    else {
                        cliValue = cliValue.replace(RE_lastWord, cmds[0]);
                    }
                }
            },
            function(cmds) {
                if (cmds.length) cliValue = cmds[0];
            }
        );

        txtConsoleInput.setValue(cliValue);
        // In order to avoid default blurring behavior for TAB
        setTimeout(function() { txtConsoleInput.focus(); }, 50);
        
        return true;
    },
    onEnterKey: function() {
        var handled = false;
        var hintNodes = winHints.childNodes;
        for (var i = 0, l = hintNodes.length; i < l; ++i) {
            if (hintNodes[i].className === "selected") {
                this.click({ target: hintNodes[i] });
                handled = true;
                break;
            }
        }
        
        return handled;
    },
    selectUp: function() {
        var newHint = selectedHint - 1;
        if (newHint < 0)
            newHint = winHints.childNodes.length - 1;

        this.select(newHint);
        return true;
    },
    selectDown: function() {
        var newHint = selectedHint + 1;
        if (newHint > winHints.childNodes.length)
            newHint = 0;

        this.select(newHint);
        return true;
    },
    select: function(hint) {
        clearTimeout(hintsTimer);
        var hintNodes = winHints.childNodes;

        if (typeof hint === "number")
            hint = hintNodes[hint];

        for (var i = 0, l = hintNodes.length; i < l; ++i) {
            if (hintNodes[i] === hint) {
                selectedHint = i;
                continue;
            }
            hintNodes[i].className = "";
        }

        hint && (hint.className = "selected");
    },
    visible: function() {
        return winHints && !!winHints.visible;
    },
    selected: function() {
        return selectedHint && winHints.childNodes
            ? winHints.childNodes[selectedHint]
            : false;
    }
});
});
/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

require("apf/elements/codeeditor");

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var dock   = require("ext/dockpanel/dockpanel");
var fs = require("ext/filesystem/filesystem");
var noderunner = require("ext/noderunner/noderunner");
var markup = require("text!ext/debugger/debugger.xml");
var inspector = require("ext/debugger/inspector");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/debugger/debugger", {
    name    : "Debug",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    offline : false,
    markup  : markup,
    buttonClassName : "debug1",
    deps    : [fs, noderunner],
    commands: {
        "resume"   : {hint: "resume the current paused process"},
        "stepinto" : {hint: "step into the function that is next on the execution stack"},
        "stepover" : {hint: "step over the current expression on the execution stack"},
        "stepout"  : {hint: "step out of the current function scope"}
    },

    nodesAll: [],
    nodes : [],
    hotitems: {},

    hook : function(){
        var _self = this;

        ide.addEventListener("consolecommand.debug", function(e) {
            ide.send({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "debugger"
            });
            return false;
        });

        ide.addEventListener("loadsettings", function (e) {
            // restore the breakpoints from the IDE settings
            var bpFromIde = e.model.data.selectSingleNode("//breakpoints");
            // not there yet, create element
            if (!bpFromIde) {
                bpFromIde = e.model.data.ownerDocument.createElement("breakpoints");
                e.model.data.appendChild(bpFromIde);
            }
            // bind it to the Breakpoint model
            mdlDbgBreakpoints.load(bpFromIde);
        });

        stDebugProcessRunning.addEventListener("activate", function() {
            _self.activate();
        });
        stProcessRunning.addEventListener("deactivate", function() {
            _self.deactivate();
        });

        ide.addEventListener("afteropenfile", function(e) {
            var doc = e.doc;
            var node = e.node;
            if (!node)
                return;
            var path = node.getAttribute("path");

            node.setAttribute("scriptname", ide.workspaceDir + path.slice(ide.davPrefix.length));
        });

        var name = "ext/debugger/debugger"; //this.name

        dock.addDockable({
            expanded : -1,
            width    : 300,
            sections : [
                {
                    height     : 30,
                    width      : 150,
                    noflex     : true,
                    draggable  : false,
                    resizable  : false,
                    skin       : "dockwin_runbtns",
                    noTab      : true,
                    position   : 1,

                    buttons : [{
                        id      : "btnRunCommands",
                        caption : "Run Commands",
                        "class" : "btn-runcommands",
                        ext     : [name, "pgDebugNav"],
                        draggable: false,
                        hidden  : true
                    }]
                },
                {
                    width : 250,
                    height : 300,
                    buttons : [
                        { caption: "Call Stack", ext : [name, "dbgCallStack"], hidden: true}
                    ]
                },
                {
                    width : 250,
                    height : 300,
                    buttons : [
                        { caption: "Interactive", ext : [name, "dbInteractive"], hidden: true},
                        { caption: "Variables", ext : [name, "dbgVariable"], hidden: true},
                        { caption: "Breakpoints", ext : [name, "dbgBreakpoints"], hidden: true}
                    ]
                }
            ]
        });

        dock.register(name, "pgDebugNav", {
            menu : "Run Commands",
            primary : {
                backgroundImage: ide.staticPrefix + "/style/images/debugicons.png",
                defaultState: { x: -6, y: -265 },
                activeState: { x: -6, y: -265 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return pgDebugNav;
        });

        dock.register(name, "dbgCallStack", {
            menu : "Debugger/Call Stack",
            primary : {
                backgroundImage: ide.staticPrefix + "/style/images/debugicons.png",
                defaultState: { x: -8, y: -47 },
                activeState: { x: -8, y: -47 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return dbgCallStack;
        });

        dock.register(name, "dbInteractive", {
            menu : "Debugger/Interactive",
            primary : {
                backgroundImage: ide.staticPrefix + "/style/images/debugicons.png",
                defaultState: { x: -8, y: -130 },
                activeState: { x: -8, y: -130 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return dbInteractive;
        });

        dock.register(name, "dbgVariable", {
            menu : "Debugger/Variables",
            primary : {
                backgroundImage: ide.staticPrefix + "/style/images/debugicons.png",
                defaultState: { x: -8, y: -174 },
                activeState: { x: -8, y: -174 }
            }
        }, function(type) {
            ext.initExtension(_self);

            // Why is this code here? This is super hacky and has lots of
            // unwanted side effects (Ruben)
            // when visible -> make sure to refresh the grid
            dbgVariable.addEventListener("prop.visible", function(e) {
                if (e.value && self.dgVars) {
                    dgVars.reload();
                }
            });

            return dbgVariable;
        });

        dock.register(name, "dbgBreakpoints", {
            menu : "Debugger/Breakpoints",
            primary : {
                backgroundImage: ide.staticPrefix + "/style/images/debugicons.png",
                defaultState: { x: -8, y: -88 },
                activeState: { x: -8, y: -88 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return dbgBreakpoints;
        });
    },

    init : function(amlNode){
        var _self = this;

        this.paths = {};

        mdlDbgSources.addEventListener("afterload", function() {
            _self.$syncTree();
        });
        mdlDbgSources.addEventListener("update", function(e) {
            if (e.action !== "add") return;

            // TODO: optimize this!
            _self.$syncTree();
        });
        fs.model.addEventListener("update", function(e) {
            if (e.action != "insert")
                return;
            // TODO: optimize this!
            _self.$syncTree();
        });

        //@todo move this to noderunner...
        dbg.addEventListener("changeframe", function(e) {
            e.data && _self.showDebugFile(e.data.getAttribute("scriptid"));
        });

        pgDebugNav.addEventListener("afterrender", function(){
            _self.hotitems["resume"]   = [btnResume];
            _self.hotitems["stepinto"] = [btnStepInto];
            _self.hotitems["stepover"] = [btnStepOver];
            _self.hotitems["stepout"]  = [btnStepOut];

            require("ext/keybindings/keybindings").update(_self);
        });

        dbgBreakpoints.addEventListener("afterrender", function(){
            lstBreakpoints.addEventListener("afterselect", function(e) {
                if (e.selected && e.selected.getAttribute("scriptid"))
                    _self.showDebugFile(e.selected.getAttribute("scriptid"),
                        parseInt(e.selected.getAttribute("line"), 10) + 1);
                // TODO sometimes we don't have a scriptID
            });
        });

        dbgBreakpoints.addEventListener("dbInteractive", function(){
            lstScripts.addEventListener("afterselect", function(e) {
                e.selected && require("ext/debugger/debugger")
                    .showDebugFile(e.selected.getAttribute("scriptid"));
            });
        });

        ide.addEventListener("afterfilesave", function(e) {
            var node = e.node;
            var doc = e.doc;

            var scriptId = node.getAttribute("scriptid");
            if (!scriptId)
                return;

            var value = e.value || doc.getValue();
            var NODE_PREFIX = "(function (exports, require, module, __filename, __dirname) { ";
            var NODE_POSTFIX = "\n});";
            dbg.changeLive(scriptId, NODE_PREFIX + value + NODE_POSTFIX, false, function(e) {
                //console.log("v8 updated", e);
            });
        });

        // we're subsribing to the 'running active' prop
        // this property indicates whether the debugger is actually running (when on a break this value is false)
        stRunning.addEventListener("prop.active", function (e) {
            // if we are really running (so not on a break or something)
            if (e.value) {
                // we clear out mdlDbgStack
                mdlDbgStack.load("<frames></frames>");
            }
        });
    },

    showDebugFile : function(scriptId, row, column, text) {
        var file = fs.model.queryNode("//file[@scriptid='" + scriptId + "']");

        // check prerequisites
        if (self.ceEditor && !ceEditor.$updateMarkerPrerequisite()) {
            return;
        }

        if (file) {
            editors.jump(file, row, column, text, null, true);
        }
        else {
            var script = mdlDbgSources.queryNode("//file[@scriptid='" + scriptId + "']");
            if (!script)
                return;

            var name = script.getAttribute("scriptname");
            var value = name.split("/").pop();

            if (name.indexOf(ide.workspaceDir) === 0) {
                var path = ide.davPrefix + name.slice(ide.workspaceDir.length);
                // TODO this has to be refactored to support multiple tabs
                var page = tabEditors.getPage(path);
                if (page)
                    var node = page.xmlRoot;
                else {
                    var node = apf.n("<file />")
                        .attr("name", value)
                        .attr("path", path)
                        .attr("contenttype", "application/javascript")
                        .attr("scriptid", script.getAttribute("scriptid"))
                        .attr("scriptname", script.getAttribute("scriptname"))
                        .attr("lineoffset", "0").node();
                }
                editors.jump(node, row, column, text, null, page ? true : false);
            }
            else {
                var page = tabEditors.getPage(value);
                if (page)
                    editors.jump(page.xmlRoot, row, column, text, null, true);
                else {
                    var node = apf.n("<file />")
                        .attr("name", value)
                        .attr("path", name)
                        .attr("contenttype", "application/javascript")
                        .attr("scriptid", script.getAttribute("scriptid"))
                        .attr("scriptname", script.getAttribute("scriptname"))
                        .attr("debug", "1")
                        .attr("lineoffset", "0").node();

                    dbg.loadScript(script, function(source) {
                        var doc = ide.createDocument(node, source);
                        editors.jump(node, row, column, text, doc);
                    });
                }
            }
        }
    },

    count : 0,
    $syncTree : function() {
        if (this.inSync) return;
        this.inSync = true;
        var dbgFiles = mdlDbgSources.data.childNodes;

        var workspaceDir = ide.workspaceDir;
        for (var i=0,l=dbgFiles.length; i<l; i++) {
            var dbgFile = dbgFiles[i];
            var name = dbgFile.getAttribute("scriptname");
            if (name.indexOf(workspaceDir) !== 0)
                continue;
            this.paths[name] = dbgFile;
        }
        var treeFiles = fs.model.data.getElementsByTagName("file");
        var tabFiles = ide.getAllPageModels();
        var files = tabFiles.concat(Array.prototype.slice.call(treeFiles, 0));

        var davPrefix = ide.davPrefix;
        for (var i=0,l=files.length; i<l; i++) {
            var file = files[i];
            var path = file.getAttribute("scriptname");

            var dbgFile = this.paths[path];
            if (dbgFile)
                apf.b(file).attr("scriptid", dbgFile.getAttribute("scriptid"));
        }
        this.inSync = false;
    },

    activate : function(){
        ext.initExtension(this);

        this.nodes.each(function(item){
            if (item.show)
                item.show();
        });
    },

    deactivate : function(){
        this.nodes.each(function(item){
            if (item.hide)
                item.hide();
        });
    },

    enable : function(){
        if (!this.disabled) return;

        this.nodesAll.each(function(item){
            item.setProperty("disabled", item.$lastDisabled !== undefined
                ? item.$lastDisabled
                : true);
            delete item.$lastDisabled;
        });
        this.disabled = false;
    },

    disable : function(){
        if (this.disabled) return;

        //stop debugging
        require('ext/runpanel/runpanel').stop();
        this.deactivate();

        //loop from each item of the plugin and disable it
        this.nodesAll.each(function(item){
            if (!item.$lastDisabled)
                item.$lastDisabled = item.disabled;
            item.disable();
        });

        this.disabled = true;
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
            dock.unregisterPage(item);
        });

        tabDebug.destroy(true, true);
        this.$layoutItem.destroy(true, true);

        this.nodes = [];
    }
});

});
/**
 * Live object inspection for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var Console = require("ext/console/console");
var Logger  = require("ext/console/logger");

exports.evaluate = function(expression, callback){
    var _self = this;
    var frame = (self.dgStack && dgStack.selected && dgStack.selected.getAttribute("ref")) || null;

    dbg.evaluate(expression, frame, null, null, callback || exports.showObject);
};

exports.checkChange = function(xmlNode){
    var value = xmlNode.getAttribute("value");
    if (xmlNode.tagName == "method" || "Boolean|String|undefined|null|Number".indexOf(xmlNode.getAttribute("type")) == -1)
        return false;
};

exports.applyChange = function(xmlNode){
    var value = xmlNode.getAttribute("value");
    var name = exports.calcName(xmlNode);
    try {
        if (name.indexOf(".") > -1) {
            var prop, obj = self.parent.eval(name.replace(/\.([^\.\s]+)$/, ""));
            if (obj && obj.$supportedProperties && obj.$supportedProperties.contains(prop = RegExp.$1)) {
                obj.setProperty(prop, self.parent.eval(value));
                return;
            }
        }

        self.parent.eval(name + " = " + value);

        //@todo determine new type
    }
    catch(e) {
        trObject.getActionTracker().undo();
        alert("Invalid Action: " + e.message);
        //@todo undo
    }
};

exports.consoleTextHandler = function(e) {
    if (!(e.keyCode == 13 && e.ctrlKey))
        return;

    var _self = this;

    var expression = txtCode.getValue().trim();
    if (!expression)
        return;

    Console.showOutput();
    Logger.log(expression, "command", null, null, true);

    this.evaluate(expression, function(xmlNode, body, refs, error){
        if (error) {
            Logger.log(error.message, "error");
        }
        else {
            var type      = body.type,
                value     = body.value || body.text,
                ref       = body.handle,
                className = body.className;

            if (className == "Function") {
                var pre = "<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='require(\"ext/debugger/inspector\").showObject(null, ["
                    + body.scriptId + ", " + body.line + ", " + body.position + ", "
                    + body.handle + ",\"" + (body.name || body.inferredName) + "\"], \""
                    + (expression || "").split(";").pop().replace(/"/g, "\\&quot;") + "\")'>";
                var post = "</a>";
                var name = body.name || body.inferredName || "function";
                Logger.log(name + "()", "log", pre, post, true);
            }
            else if (className == "Array") {
                var pre = "<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='require(\"ext/debugger/inspector\").showObject(\""
                    + apf.escapeXML(xmlNode.xml.replace(/"/g, "\\\"")) + "\", "
                    + ref + ", \"" + apf.escapeXML((expression || "").trim().split(/;|\n/).pop().trim().replace(/"/g, "\\\"")) + "\")'>";
                var post = " }</a>";

                Logger.log("Array { length: "
                    + (body.properties && body.properties.length - 1), "log", pre, post, txtOutput);
            }
            else if (type == "object") {
                var refs = [], props = body.properties;
                for (var i = 0, l = body.properties.length; i < l; i++)
                    refs.push(props[i].ref);

                var pre = "<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='require(\"ext/debugger/inspector\").showObject(\""
                    + apf.escapeXML(xmlNode.xml.replace(/"/g, "\\\"")) + "\", "
                    + ref + ", \"" + apf.escapeXML((expression || "").trim().split(/;|\n/).pop().trim().replace(/"/g, "\\\"")) + "\")'>";
                var post = " }</a>";

                dbg.$debugger.$debugger.lookup(refs, false, function(body) {
                    var out = [className || value, "{"];
                    for (var item, t = 0, i = 0; i < l; i++) {
                        item = body[refs[i]];
                        if (item.className == "Function" || item.className == "Object")
                            continue;
                        if (t == 5) {
                            out.push("more...");
                            break;
                        }
                        var name = props[i].name || (props[i].inferredName || "Unknown").split(".").pop();
                        out.push(name + "=" + item.value, ", ");
                        t++;
                    }
                    if (t) out.pop();

                    Logger.log(out.join(" "), "log", pre, post, true);
                });
            }
            else
                Logger.log(value, "log", null, null, true);
        }
    });

    require("ext/settings/settings").save();
    return false;
};

exports.showObject = function(xmlNode, ref, expression) {
    if (ref && ref.dataType == apf.ARRAY) {
        require(["ext/debugger/debugger"], function(dbg) {
            dbg.showDebugFile(ref[0], ref[1] + 1, 0, ref[4]);
        });
    }
    else {
        require(["ext/quickwatch/quickwatch"], function(quickwatch) {
            quickwatch.toggleDialog(1);

            if (xmlNode && typeof xmlNode == "string")
                xmlNode = apf.getXml(xmlNode);

            var name = xmlNode && xmlNode.getAttribute("name") || expression;
            txtCurObject.setValue(name);
            dgWatch.clear("loading");

            if (xmlNode) {
                setTimeout(function(){
                    var model = dgWatch.getModel();
                    var root  = apf.getXml("<data />");
                    apf.xmldb.appendChild(root, xmlNode);
                    model.load(root);
                    //model.appendXml(xmlNode);
                }, 10);
            }
            else if (ref) {

            }
            else {
                exports.evaluate(expression);
            }
        });

    }
};

var types    = ["Object", "Number", "Boolean", "String", "Array", "Date", "RegExp", "Function", "Object"];
var domtypes = [
    null, "Element", "Attr", "Text", "CDataSection",
    "EntityReference", "Entity", "ProcessingInstruction", "Comment",
    "Document", "DocumentType", "DocumentFragment", "Notation"
];

exports.calcName = function(xmlNode, useDisplay){
    var isMethod = xmlNode.tagName == "method";
    var name, loopNode = xmlNode, path = [];
    do {
        name = useDisplay
            ? loopNode.getAttribute("display") || loopNode.getAttribute("name")
            : loopNode.getAttribute("name");

        if (!name)
            break;

        var xmlDecode = function (input) {
            var e = document.createElement('div');
            e.innerHTML = input;
            return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
        }

        name = xmlDecode(name);

        path.unshift(!name.match(/^[a-z_\$][\w_\$]*$/i)
            ? (parseInt(name, 10) == name
                ? "[" + name + "]"
                : "[\"" + name + "\"]")
            : name);
        loopNode = loopNode.parentNode;
        if (isMethod) {
            loopNode = loopNode.parentNode;
            isMethod = false;
        }
    }
    while (loopNode && loopNode.nodeType == 1);

    if (!path[0])
        return "";
    else if (path[0].charAt(0) == "[")
        path[0] = path[0].substr(2, path[0].length - 4);

    return path.join(".").replace(/\.\[/g, "[");
};

/**
 * Given an xmlNode determines whether this item can be edited in realtime
 */
exports.isEditable = function(xmlNode) {
    if (!xmlNode) return false;

    var type = xmlNode.getAttribute("type");

    // we can edit these types
    switch (type) {
        case "string":
        case "null":
        case "number":
        case "boolean":
            break;
        default:
            return false;
    }

    // V8 debugger cannot change variables that are locally scoped, so we need at least
    // one parent property.
    if (exports.calcName(xmlNode, true).indexOf(".") === -1) {
        return false;
    }

    // ok, move along
    return true;
};

/**
 * Determines whether a new value is valid to pass into an attribute
 */
exports.validateNewValue = function(xmlNode, value) {
    var type = xmlNode.getAttribute("type");
    var validator;

    switch (type) {
        case "string":
        case "null":
            validator = /(.*|^$)/;
            break;
        case "number":
            validator = /^\d+(\.\d+)?$/;
            break;
        case "boolean":
            validator = /^(true|false)$/;
            break;
        default:
            return false; // other types cannot be edited
    }

    return validator.test(value);
};

/**
 * Updates the value of a property to a new value
 */
exports.setNewValue = function(xmlNode, value, callback) {
    // find the prop plus its ancestors
    var expression = exports.calcName(xmlNode, true);

    // build an instruction for the compiler
    var instruction;
    switch (xmlNode.getAttribute("type")) {
        case "string":
        case "null":
            // escape strings
            instruction = expression + " = \"" + value.replace(/"/g, "\\\"") + "\"";
            break;
        default:
            instruction = expression + " = " + value;
            break;
    }

    // dispatch it to the debugger
    exports.evaluate(instruction, callback);
};

});
/**
 * Dock Panel for the Cloud9 IDE client
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var DockableLayout = require("ext/dockpanel/libdock");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/dockpanel/dockpanel", {
    name           : "Dock Panel",
    dev            : "Ajax.org",
    alone          : true,
    type           : ext.GENERAL,

    defaultState   : {
        bars : []
    },

    nodes          : [],
    dockpanels     : [],
    
    loaded : false,
    
    /**
     * Standard Extension functionality
     */
    init : function(amlNode){
        var _self = this;

        var vManager = new apf.visibilitymanager();
        this.layout = new DockableLayout(hboxDockPanel, 
            //Find Page
            function(arrExtension){
                if (!arrExtension || !_self.dockpanels[arrExtension[0]])
                    return false;

                var item = _self.dockpanels[arrExtension[0]][arrExtension[1]];
                if (item.page)
                    return item.page;

                var page = item.getPage();
                
                if (page)
                    page.$arrExtension = arrExtension;
                
                vManager.permanent(page, function(e){
                    item.mnuItem.check();
                }, function(){
                    item.mnuItem.uncheck();
                });

                return page;
            }, 
            //Store Page
            function(amlPage){
                var arrExtension = amlPage.$arrExtension;
                var item = _self.dockpanels[arrExtension[0]][arrExtension[1]];
                
                item.page = amlPage;
                item.mnuItem.uncheck();

                _self.saveSettings();
            },
            //@todo This can be deprecated
            //Find Button Options
            function(arrExtension){
                if (!arrExtension || !_self.dockpanels[arrExtension[0]])
                    return false;

                return _self.dockpanels[arrExtension[0]][arrExtension[1]].options;
            },
            //Change State Handler
            function(){
                _self.saveSettings();
            },
            //Animate Settings
            function(){
                return apf.isTrue(settings.model.queryValue('general/@animateui'));
            }
        );

        //@todo was loadsettings
        ide.addEventListener("extload", function(e){
            var model = settings.model;
            var strSettings = model.queryValue("auto/dockpanel/text()");

            var state = _self.defaultState;
            if (strSettings) {
                // JSON parse COULD fail
                try {
                    state = JSON.parse(strSettings);
                }
                catch (ex) {}
            }
            
            ide.dispatchEvent("dockpanel.load.settings", {state: state});
            
            _self.layout.loadState(state);
            _self.loaded = true;
        });

        mnuToolbar.appendChild(new apf.item({
            caption : "Restore Default",
            onclick : function(){
                var defaultSettings = _self.defaultState,//settings.model.queryValue("auto/dockpanel_default/text()"),
                    state;
                    
                if (defaultSettings) {
                    // JSON parse COULD fail
                    try {
                        state = defaultSettings;//objSettings.state;
                    }
                    catch (ex) {}
                    _self.layout.loadState(state);
                    
                    settings.model.setQueryValue("auto/dockpanel/text()", state)
                    
                    _self.saveSettings();
                    
                    ide.dispatchEvent("restorelayout");
                }
            }
        }));
        
        mnuToolbar.appendChild(new apf.divider());
    },
    
    saveSettings : function(){
        clearTimeout(this.$timer);
        
        var _self = this;;
        this.$timer = setTimeout(function(){
            var state = _self.layout.getState();
            
            settings.model.setQueryValue(
                "auto/dockpanel/text()",
                JSON.stringify(state)
            );
        });
    },

    enable : function(){
        if (this.$lastState)
            this.layout.loadState(this.$lastState);
    },

    disable : function(){
        this.$lastState = this.layout.getState();
        this.layout.clearState();
    },

    destroy : function(){
        this.layout.clearState();
    },

    register : function(name, type, options, getPage){
        var panel = this.dockpanels[name] || (this.dockpanels[name] = {});
        panel[type] = {
            options : options,
            getPage : getPage
        };

        var layout = this.layout, _self = this;

        panel[type].mnuItem = mnuToolbar.appendChild(new apf.item({
            caption : options.menu.split("/").pop(),
            id      : "mnu" + type,
            type    : "check",
            onclick : function(){
                var page = getPage();

                var uId = _self.getButtons(name, type)[0].uniqueId;
                layout.show(uId, true);
                if (layout.isExpanded(uId) < 0)
                    layout.showMenu(uId);
                
                page.parentNode.set(page);
            }
        }));        
    },

    addDockable : function(def){        
        var state = this.defaultState;
            
        if (!def.barNum)
            def.barNum = 0;
        
        if (def.sections) {
            if (def.barNum || def.barNum === 0) {
                if (state.bars[def.barNum])
                    state.bars[def.barNum].sections.merge(def.sections);
                else
                    state.bars[def.barNum] = def;
            }
            else
                state.bars.push(def);
            
            return;
        }

        if (!state.bars[def.barNum || 0])
            state.bars[def.barNum || 0] = {expanded: false, width: 230, sections: []};

        var bar = state.bars[def.barNum || 0];
        
        if (def.buttons) {
            bar.sections.push(def);
        }
        else {
            bar.sections.push({
                flex    : 2,
                width   : 260,
                height  : 350,
                buttons : [def]
            });
        }
        
        return bar.sections.slice(-1);
    }, //properties.forceShow ??
    
    getButtons : function(name, type, state){
        state = state || this.layout.getState(true);
        var list  = [];
        
        if(!state)
            return;
        
        if(!state.bars)
            state = state.state;
            
        state.bars.each(function(bar){
            bar.sections.each(function(section){
                section.buttons.each(function(button){
                    if ((!name || button.ext[0] == name)
                      && (!type || button.ext[1] == type))
                        list.push(button);
                });
            });
        });
        
        return list;
    },
    
    getBars : function(name, type, state){
        var state = state || this.layout.getState(true);
        var list  = [];
        
        if(!state)
            return;
        
        if(!state.bars)
            state = state.state;
        
        if (!state.bars)
            return list;
        
        state.bars.each(function(bar){
            var found = false;
            bar.sections.each(function(section){
                section.buttons.each(function(button){
                    if ((!name || button.ext[0] == name)
                      && (!type || button.ext[1] == type))
                        found = true;
                });
            });
            
            if (found)
                list.push(bar);
        });
        
        return list;
    },
    
    hideSection: function(name, collapse){
        var buttons = this.getButtons(name);
        var bars = [];
        var _self = this;
        
        buttons.each(function(button){
            if (button.hidden < 0)
                bars.pushUnique(_self.layout.findBar(button.uniqueId));
            if (button.hidden == -1)
                _self.layout.hide(button.uniqueId);
        });
        
        if (collapse) {
            bars.each(function(bar){
                if (bar.expanded == 1)
                    _self.layout.collapseBar(bar.uniqueId);
            });
        }
    },
    
    showSection: function(name, expand){
        var buttons = this.getButtons(name);
        var _self = this;
        var bars = [];
        
        buttons.each(function(button){
            if (button.hidden && button.hidden == 1) {
                _self.layout.show(button.uniqueId);
                bars.pushUnique(_self.layout.findBar(button.uniqueId));
            }
        });
        
        bars.each(function(bar){
            if (expand && bar.expanded < 0)
                _self.layout.expandBar(bar.uniqueId);
        });
    },
    
    showBar : function(bar){
        if (bar.cache) {
            bar.cache.show();
            return;
        }
        
        var _self = this;
        bar.sections.each(function(section){
            section.buttons.each(function(button){
                _self.layout.show(button.uniqueId);
            });
        });
    },
    
    hideBar : function(bar){
        if (bar.cache)
            bar.cache.hide();
    },
    
    expandBar : function(bar){
        this.layout.expandBar(bar.cache);
    },
    
    //@todo removal of pages
    
    /**
     * Increases the notification number count by one
     * 
     * @windowIdent identifier of the dock object
     */
    increaseNotificationCount: function(windowIdent){
        /*for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if (this.dockObjects[doi].ident == windowIdent) {
                // Only increase notification count if window is hidden
                if (this.dockObjects[doi].btn.value == false) {
                    if (this.dockObjects[doi].notCount >= 99)
                        return true;

                    this.dockObjects[doi].notCount++;
                    this.updateNotificationElement(
                            this.dockObjects[doi].btn
                            , this.dockObjects[doi].notCount
                    );
                }
                
                return true;
            }
        }
        
        return false;*/
    },

    /**
     * Resets the notification count to 0
     */
    resetNotificationCount: function(windowIdent){
        if (windowIdent == -1) return;

        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if (this.dockObjects[doi].ident == windowIdent) {
                this.dockObjects[doi].notCount = 0;
                this.updateNotificationElement(this.dockObjects[doi].btn, 0);
                return true;
            }
        }
        
        return false;
    },
    
    /**
     * Updates the notification element to visually reflect notCount
     */
    updateNotificationElement: function(btnObj, count){
        var countInner = count === 0 ? "" : count;

        if (apf.isGecko)
            btnObj.$ext.getElementsByClassName("dock_notification")[0].textContent = countInner;
        else
            btnObj.$ext.getElementsByClassName("dock_notification")[0].innerText = countInner;
        
        return true;
    }
});

    }
);
var testState = {
    bars : [
        {
            expanded : false,
            width : 300,
            sections : [
                {
                    flex : 1,
                    width : 300,
                    height : 200,
                    buttons : [
                        {
                            caption: "Test4",
                            ext    : ""
                        },
                        {
                            caption: "Test3",
                            ext    : ""
                        }
                    ]
                },
                {
                    flex : 1,
                    width : 200,
                    height : 300,
                    buttons : [
                        {
                            caption: "Test2",
                            ext    : ""
                        }
                    ]
                },
                {
                    flex : 1,
                    width : 200,
                    height : 200,
                    buttons : [
                        {
                            caption: "Test1",
                            ext    : ""
                        }
                    ]
                }
            ]
        },
        {
            expanded : true,
            width : 200,
            sections : [
                {
                    flex : 1,
                    width : 300,
                    height : 200,
                    buttons : [
                        {
                            caption: "Test4",
                            ext    : ""
                        },
                        {
                            caption: "Test3",
                            ext    : ""
                        }
                    ]
                },
                {
                    flex : 1,
                    width : 200,
                    height : 200,
                    buttons : [
                        {
                            caption: "Test1",
                            ext    : ""
                        }
                    ]
                }
            ]
        }
    ]
};

require(["libdock.js"], function(DockableLayout){
    var layout = new DockableLayout(hboxMain, function(){}, function(){}, function(){}, function(){});
    layout.loadState(testState);
    //layout.loadState(layout.getState());
});/*
    TODO:    
    - floating sections or menus
    
    - single page should drag whole tab like button to section does
    - anim should wait x00ms before playing
    
    - tweak tab animations
    - menu should appear onmouseup not down
    
    INTEGRATION
    - add conditional availability of buttons
    - add right click menu to buttons/sections
*/

define(function(require, exports, module) {

var DockableLayout = module.exports = function(parentHBox, cbFindPage, cbStorePage, cbFindOptions, cbChange, cbAnimate) {
    this.columnCounter  = 0;
    this.$parentHBox    = parentHBox;
    this.$cbFindPage    = cbFindPage;
    this.$cbStorePage   = cbStorePage;
    this.$cbChange      = cbChange;
    this.$cbFindOptions = cbFindOptions;
    this.$cbAnimate     = cbAnimate;
    
    var indicator = this.indicator = document.body.appendChild(document.createElement("div"));
    indicator.style.position = "absolute";
    indicator.style.display = "none";
    indicator.style.border = "3px solid #5c5c5c";
    indicator.style.zIndex = 1000000;
};

(function(){
    var whiledrag, lastInfo, diffPixel = 3;
    var menuCounter = 100;
    var state, lookup; //@todo wrong use of scope. 
    
    function findParentState(data, forceSearch){
        var uniqueId = data.uniqueId;
        if (!uniqueId)
            return;
        var node = lookup[uniqueId].node;
        
        if (!forceSearch && node && node.parentNode)
            return node.parentNode.$dockData;
        else {
            var found;
            state.bars.each(function(bar){
                if (found) return;
                    
                bar.sections.each(function(section){
                    if (found) return;

                    if (section.uniqueId == uniqueId)
                        found = bar;
                    
                    section.buttons.each(function(button){
                        if (found) return;
                        
                        if (button.uniqueId == uniqueId)
                            found = section;
                    });
                    
                });
            });
            
            return found;
        }
    }
    
    function hasVisibleChildren(list){
        for (var i = 0; i < list.length; i++) {
            var l2 = list[i].buttons || list[i].sections;
            if (l2) {
                if (hasVisibleChildren(l2))
                    return true;
            }
            else if (list[i].hidden < 0)
                return true;
        }
        return false;
    }
    
    function findNextKnownNode(list, index){
        for (var i = index; i < list.length; i++) {
            if (list[i].uniqueId 
              && lookup[list[i].uniqueId].node
              && lookup[list[i].uniqueId].node.parentNode)
                return lookup[list[i].uniqueId].node;
        }
    }
    
    function tableCleanup(pNode, btnPNode, oldMenu, b){
        if (!pNode.getPages || !pNode.getPages().length) { //@todo move this to addPage

            if (b) {
                var buttons = btnPNode.$dockData.buttons;
                for (var i = 0; i < buttons.length; i++) {
                    b.insertIndex(buttons[i].$dockData, i);
                }
            }
            
            var barParent = btnPNode.parentNode;
            oldMenu.removeNode();//destroy(true, true);
            
            if (pNode.parentNode)
                oldMenu.appendChild(pNode);
                //pNode.removeNode();//destroy(true, true);
            
            btnPNode.removeNode();//destroy(true, true);
            //lookup[btnPNode.$dockData.uniqueId].node = undefined;
            
            if (!barParent.selectNodes("vbox").length) {
                barParent.removeNode();//destroy(true, true);
                //lookup[barParent.$dockData.uniqueId].node = undefined;
                
                if (barParent.vbox) {
                    barParent.vbox.removeNode();//destroy(true, true);
                    barParent.splitter.removeNode();//destroy(true, true);
                }
            }
            /*else {
                barParent.$dockData.sections.remove(btnPNode.$dockData);
            }*/
        }
    }
    
    function checkBars(){
        var bar, bars = state.bars;
        for (var i = bars.length - 1; i >= 0; i--) {
            bar = bars[i];
            if (bar.cache && bar.cache.childNodes.length == 1) {
                bar.cache.destroy(true, true);
                delete bar.cache;
                //bars.remove(bar);
            }
        }
    }
    
    function registerLookup(node){
        if (!node.$dockData.uniqueId)
            node.$dockData.uniqueId = lookup.push({node: node, data: node.$dockData}) - 1;
        else
            lookup[node.$dockData.uniqueId] = {node: node, data: node.$dockData};
    }
    
    function findNextBar(start){
        var bar = start.nextSibling;
        while (bar) {
            if (bar.localName == "bar" && bar.visible)
                break;
            if (bar.localName == "vbox" && bar.visible) {
                bar = bar.bar;
                break;
            }
            bar = bar.nextSibling;
        }
        return bar != start ? bar : null;
    }
    
    function findPreviousBar(start){
        var bar = start.previousSibling;
        while (bar) {
            if (bar.localName == "bar" && bar.visible)
                break;
            if (bar.localName == "vbox" && bar.visible) {
                bar = bar.bar;
                break;
            }
            bar = bar.previousSibling;
        }
        return bar != start ? bar : null;
    }
    
    function findNextElement(start, type){
        var el = start.nextSibling;
        while (el && !el.visible && (!type || el.localName != type)) {
            el = el.nextSibling;
        }
        return el;
    }
    
    /**
     * Retrieve the current state of the layout as a JSON object
     * 
     */
    this.getState = function(raw){
        if (raw)
            return state;
        
        var copy = {};
        copy.bars = state.bars.slice(0);

        (copy.bars).each(function(bar, i, list){
            bar = list[i] = apf.extend({}, bar);
            //bar.cache = undefined;
            delete bar.cache;
            bar.sections = bar.sections.slice(0);
            
            (bar.sections).each(function(section, i, list){
                section = list[i] = apf.extend({}, section);
                //section.cache = undefined;
                delete section.cache;
                section.buttons = section.buttons.slice(0);
                
                (section.buttons).each(function(button, i, list){
                    button = list[i] = apf.extend({}, button);
                    //button.cache = undefined;
                    delete button.cache;
                });
            });
        });
        
        return JSON.parse(JSON.stringify(copy));
    };
    
    /**
     * Set the current layout via a JSON object
     * @param {Object} obj JSON object with the following structure:
     *  {
     *      bars : [
     *          {
     *              expanded : false,
     *              width : 300,
     *              sections : [
     *                  {
     *                      flex : 1,
     *                      width : 200,
     *                      height : 200,
     *                      buttons : [
     *                          {
     * 
     *                          }
     *                      ]
     *                  }
     *              ]
     *          }
     *      ]
     *  }
     * 
     */
    this.loadState = function(data){
        this.clearState();

        state  = JSON.parse(JSON.stringify(data));
        lookup = [];
        
        if (!state.bars) 
            return;
        
        state.bars.each(function(bar){
            bar.uniqueId = lookup.push({data: bar}) - 1;
            
            bar.sections.each(function(section){
                section.uniqueId = lookup.push({data: section}) - 1;
                
                section.buttons.each(function(button){
                    button.uniqueId = lookup.push({data: button}) - 1;
                });
            });
        });

        var bars = state.bars;
        for (var i = 0; i < bars.length; i++) {
            addBarState.call(this, bars[i]);
        }
    };
    
    /**
     * Destroy full state
     */
    this.clearState = function(){
        if (!state || !state.bars)
            return;
        state.bars.each(function(b) {
            var bar = b.cache;
            if (!bar) return;
            
            if (bar.localName == "bar" && bar.dock) {
                bar.hide();
                if (bar.vbox)
                    bar.vbox.hide();
                var sections = bar.selectNodes("vbox");
                for (var i = 0; i < sections.length; i++) {
                    var buttons = sections[i].selectNodes("button");
                    if (buttons && buttons.length && buttons[0]) {
                        for (var j = 0; j < buttons.length; j++) {
                            buttons[j].hideMenu();
                            buttons[j].$dockpage.parentNode.remove(buttons[j].$dockpage);
                            buttons[j].$dockData.hidden = -1;
                        }
                    }
                }
            }
            else if (!bar.bar) {
                return;
            }
            
            bar.destroy(true, true);
            if (bar.vbox)
                bar.vbox.destroy(true, true);
        });
    };
    
    /**
     * Experimental and probably useless
     *
    this.updateState = function(data, section){
        var before;
        
        if (data.bars) {
            var bars = data.bars;
            for (var i = 0; i < bars.length; i++) {
                if (!bars[i].uniqueId) {
                    var before = findNextKnownNode(bars, i);
                    addBarState.call(this, bars[i], before);
                }
                else
                    this.updateState(bars[i]);
            }
        }
        else if (data.sections) {
            var bar = this.lookup[data.uniqueId];
            
            var sections = data.sections;
            for (var i = 0; i < sections.length; i++) {
                if (!sections[i].uniqueId) {
                    var before = findNextKnownNode(sections, i);
                    addSectionState.call(this, sections[i], before, bar);
                }
                else
                    this.updateState(sections[i]);
            }
            
            //@todo update other states here
        }
        else if (data.buttons) {
            section = section || this.lookup[data.uniqueId];
            
            var buttons = data.buttons;
            for (var i = 0; i < buttons.length; i++) {
                if (!buttons[i].uniqueId) {
                    var before = findNextKnownNode(buttons, i);
                    addButtonState.call(this, buttons[i], before, section);
                }
                else {
                    this.updateState(buttons[i], section);
                }
            }
            
            //@todo update other states here
        }
        else {
            var button = this.lookup[data.uniqueId];
            
            var hidden = state.$dockData.hidden;
            if (button.$dockData.hidden != hidden) {
                if (hidden)
                    buttons[j].$dockpage.parentNode.remove(buttons[j].$dockpage);
                else {
                    return true;
                }
            }
            
            //@todo update other states here
        }
    };*/
    
    this.addTo = function(def, uniqueId) {
        var item = lookup[uniqueId].data;
        
        if (item.buttons) {
            item.buttons.push(def);
        }
        else if (item.sections) {
            item.sections.push(def);
        }
        
        def.uniqueId = lookup.push({data: def}) - 1;
        return def.uniqueId;
    };
    
    this.show = function(uniqueId, byUser){
        var item  = lookup[uniqueId].data;
        var before;
        
        if (!item.bars && !item.sections) {
            var section = findParentState(lookup[uniqueId].data);
            if (!hasVisibleChildren(section.buttons)) {
                
                var bar = findParentState(section);
                if (!hasVisibleChildren(bar.sections)) {
                    section.buttons.each(function(button){
                        if (button.hidden != 2 || button.uniqueId == uniqueId)
                            button.hidden = byUser ? -2 : -1;
                    });
                    
                    before = findNextKnownNode(state.bars, state.bars.indexOf(bar) + 1);
                    addBarState.call(this, bar, before);
                }
                else {
                    section.buttons.each(function(button){
                        if (button.hidden != 2 || button.uniqueId == uniqueId)
                            button.hidden = byUser ? -2 : -1;
                    });
                    
                    before = findNextKnownNode(bar.sections, bar.sections.indexOf(section) + 1);
                    addSectionState.call(this, section, before, lookup[bar.uniqueId].node);
                }
            }
            else {
                if (item.hidden > 0) {
                    item.hidden = byUser ? -2 : -1;
                    before = findNextKnownNode(section.buttons, section.buttons.indexOf(item) + 1);
                    addButtonState.call(this, item, before, lookup[section.uniqueId].node);
                }
                else
                    addButtonState.call(this, item, null, lookup[section.uniqueId].node);
            }
        }
        else {
            (item.bars || [item]).each(function(bar){
                (bar.sections || [bar]).each(function(section){
                    (section.buttons || [section]).each(function(button){
                        //@todo
                    });
                });
            });
        }
    };
    
    this.hide = function(uniqueId, byUser){
        var item  = lookup[uniqueId].data;

        (item.bars || [item]).each(function(bar){
            (bar.sections || [bar]).each(function(section){
                (section.buttons || [section]).each(function(button){
                    button = lookup[button.uniqueId].node;
                    if (button.$dockData.hidden < 0) {
                        button.setValue(false);
                        var page = button.$dockpage;
                        page.parentNode.remove(page, null, true);
                        button.$dockData.hidden = byUser ? 2 : 1;
                    }
                });
            });
        });
    };
    
    this.isExpandedFull = function(node){
        var pNode = node.parentNode;
        while (pNode && pNode.id != "hboxDockPanel") {
            if(pNode.expanded)
                return true;
            pNode = pNode.parentNode;
        }
        return false;
    };
    
    this.isExpanded = function(uniqueId){
        var button = lookup[uniqueId].node;
        if (!button) {
            this.show(uniqueId);
            button = lookup[uniqueId].node;
        }
        
        var bar = findParentState(findParentState(lookup[uniqueId].data));
        return lookup[bar.uniqueId].data.expanded;
    };
    
    this.showMenu = function(uniqueId){
        var button = lookup[uniqueId].node;
        if (!button) {
            this.show(uniqueId);
            button = lookup[uniqueId].node;
        }
        
        button.showMenu();
        
        var tab = button.$dockpage.parentNode;
        if (!tab.activepage)
            tab.set(tab.getPage(0));
    };
    
    this.findBar = function(uniqueId, el){
        var button = lookup[uniqueId].node;
        var node = button && button.parentNode.parentNode;
        
        return el ? node : node.$dockData;
    };
    
    this.findTabs = function(uniqueId, el){
        var bar = lookup[uniqueId].node;
        var nodes = bar.vbox.selectNodes("tab");
        
        if (el)
            return apf.getArrayFromNodelist(nodes);
        
        var list = [];
        for (var i = 0; i < nodes.length; i++) {
            list.push(nodes[i].$dockData);
        }
        
        return list;
    };
    
    function addBarState(state, beforeBar){
        var sections = state.sections;

        if (!hasVisibleChildren(sections))
            return;
        
        var bar = this.$addBar(beforeBar, state);
            
        for (var j = 0; j < sections.length; j++) {
            addSectionState.call(this, sections[j], 
              sections[j].position 
                ? bar.childNodes[sections[j].position]
                : null, bar);
        }
        
        if (state.expanded > 0)
            this.expandBar(bar, state.expanded == 2, true);
    }
    
    function addSectionState(state, beforeState, bar){
        var buttons = state.buttons;
        if (!hasVisibleChildren(buttons))
            return;
        
        var section = this.$addSection(bar, 
            beforeState, 
            null, state);
        
        this.$addMenu(section, state);
        
        for (var k = 0; k < buttons.length; k++) {
            addButtonState.call(this, buttons[k], null, section);
        }
    }
    
    function addButtonState(state, before, section){
        if (state.hidden > 0)
            return;
        
        // code here to throw if no parentNode is set.
        section.parentNode;
        this.$addButton(section, before, section.$menu, 
            this.$addPage(
                this.$cbFindPage(state.ext), 
                before && before.$dockpage,
                section.$menu, 
                state.caption, 
                state.caption && state.caption.toLowerCase() || "",
                section
            ), apf.extend(state, this.$cbFindOptions(state.ext) || {}) //@todo options don't need to be late anymore
        );
    }
    
    function animate(bar, reverse, callback){
        var _self = this;

        if (this.animateControl)
            this.animateControl.stop();
        
        this.animating = true;
    
        bar.show();
        bar.vbox.show();
 
        var from = bar.getWidth();
        var to   = bar.vbox.getWidth() - apf.getWidthDiff(bar.vbox.$ext);

        if (reverse)
            bar.hide();
        else
            bar.vbox.setWidth(from);
        
        var tweens = [
            (reverse
                ? {oHtml: bar.vbox.$ext, type: "width", from: to, to: from}
                : {oHtml: bar.vbox.$ext, type: "width", from: from, to: to})
        ]
        
        var nodes = bar.vbox.getElementsByTagNameNS(apf.ns.aml, "tab");
        nodes.each(function(tab){
            tweens.push(reverse
                ? {oHtml: tab.$ext, type: "fade", from: 1, to: -1}
                : {oHtml: tab.$ext, type: "fade", from: 0, to: 1})
            tab.$ext.style.width = to + "px";
        });

        var options = {
            steps : 6,
            interval : apf.isChrome ? 5 : 5,
            control : this.animateControl = {},
            anim : apf.tween.easeOutCubic,
            tweens : tweens,
            oneach: function(){
                apf.layout.forceResize(bar.vbox.$ext);
            },
            onfinish : function(){
                setTimeout(function(){ 
                    //if (reverse) {
                        nodes.each(function(tab){
                            apf.setOpacity(tab.$ext, 1);
                            tab.$ext.style.width = "";
                        });
                    //}
                });
                bar.vbox.setWidth(to);
                callback && callback();
                _self.animating = false;
            }
        };
        options.onstop = options.onfinish;
        
        apf.tween.multi(document.body, options);
    }
    
    /**
     * Expand a bar
     */
    this.expandBar = function (bar, byUser, showAnimation){
        if (typeof bar == "number")
            bar = lookup[bar].node;
        
        if (this.$currentMenu)
            this.$currentMenu.hide();
        
        var pNode = bar.parentNode || this.$parentHBox;

        if (!bar.vbox) {
            var _self = this;
            bar.vbox = pNode.insertBefore(new apf.vbox({
                padding   : 0,
                width     : bar.$dockData && bar.$dockData.width || 260,
                splitters : true,
                vdock     : 1,
                "class"   : "dockcol unselectable expandedpanel",
                childNodes : [
                    new apf.button({
                        dock       : 1,
                        skin       : "dockheader",
                        "class"    : "expanded",
                        nosplitter : true,
                        height     : 11,
                        resizable  : false,
                        margin     : "0 0 0 0",
                        onclick    : function(){
                            _self.collapseBar(bar, true, true);
                        }
                    })
                ]
            }), bar);

            if (!bar.vbox)
                return;

            var ps = bar.vbox.previousSibling;

            bar.splitter = pNode.insertBefore(new apf.splitter({
                scale   : "right",
                "class" : "splitter-editor-right" + " panelsplitter",//+ (panelSplittersCount > 0 ? " panelsplitter" : ""),
                width   : "0",
                ondragstart : function(){
                    if (_self.$currentMenu)
                        _self.$currentMenu.hide();
                }
            }), bar.vbox);
            
            if (!ps)
                bar.splitter.setAttribute("parent", bar.parentNode.parentNode.parentNode);
            
            bar.splitter.bar = 
            bar.vbox.bar     = bar;
        }
        else {
            pNode.insertBefore(bar.vbox, bar);
            pNode.insertBefore(bar.splitter, bar.vbox);
        }
        
        var vbox = bar.selectNodes("vbox");
        
        for (var i = 0; i < vbox.length; i++) {
            var button  = vbox[i].selectSingleNode("button"),
                menu    = self[button.submenu],
                childEl = menu && menu.firstChild;
            
            if (childEl) {
                childEl.extId = button.$dockData.ext[0];
                bar.vbox.appendChild(childEl);
                if (childEl.skin == "dockbar")
                    childEl.setAttribute("height", 34);
                if (!childEl.flex && childEl.tagName != "bar" && !childEl.noflex)
                    childEl.setAttribute("flex", 1);
            }
        }

        if (bar.vbox) {
            bar.vbox.show();
            bar.vbox.expanded = true; 
            bar.vbox.firstChild.$ext.onmousemove({});
        }
        
        this.findTabs(bar.$dockData.uniqueId, true)
            .each(function(tab){
                if (!tab.activepage)
                    tab.set(tab.getPage(0));
            });
        
        if (false && showAnimation && this.$cbAnimate())
            animate.call(this, bar);
        
        bar.hide();
        bar.expanded = true;
        bar.splitter.show();
        bar.$dockData.expanded = byUser ? 2 : 1;
        
        this.$cbChange();
    };
    
    /**
     * Collapse a bar
     */
    this.collapseBar = function(bar, byUser, showAnimation){
        if (typeof bar == "number")
            bar = lookup[bar].node;
        
        bar.$dockData.expanded = byUser ? -2 : -1;
        bar.expanded = false;

        //if (!hasVisibleChildren(bar.$dockData.sections))
            //return;

        if (this.$currentMenu)
            this.$currentMenu.hide();

        function done(){
            var vboxes = bar.selectNodes("vbox");
            var tabs = bar.vbox.selectNodes("tab");
            for (var i = 0; i < vboxes.length; i++) {
                //What is all this?
                /*if (!vboxes[i].getAttribute("visible")) {
                    skip++;
                    continue;
                }*/
    
                var menu = self[vboxes[i].selectSingleNode("button").submenu];
                menu.appendChild(tabs[i]); //-skip
            }
            
            bar.show();
            bar.vbox.hide();
            bar.parentNode.removeChild(bar.vbox);
            bar.vbox.expanded = false;
            bar.splitter.hide();
        }

        if (false && showAnimation && this.$cbAnimate())
            animate.call(this, bar, true, done);
        else
            done();
        
        //Hack for button
        bar.firstChild.$ext.onmousemove({});
        
        this.$cbChange();
    };
    
    this.$isLastBar = function(aml) {
        var last = this.$parentHBox.lastChild;
        while (last && !last.visible)
            last = last.previousSibling;
        
        return aml == last || aml == last.vbox;
    };

    this.$getLastBar = function(){
        var firstBar = this.$parentHBox.firstChild;
        if (!firstBar)
            return;
        
        if (!firstBar.visible) {
            while (firstBar && !firstBar.visible) {
                firstBar = firstBar.nextSibling;
            }
        }

        if (firstBar.localName != "bar")
            firstBar = firstBar.bar;
           
        //if (lastBar && !lastBar.visible)
            //lastBar = lastBar.vbox;
            
        return firstBar.visible ? firstBar : firstBar.vbox;
    };
    
    /**
     * Starts the docking detection during drag&drop
     */
    this.$startDrag = function (dragged, original){
        var last, state = 0, _self = this;

        apf.setOpacity(dragged.$ext, 0.2);
        
        apf.setStyleClass(dragged.$ext, 'dragging');
        
        var lastBar   = this.$getLastBar();
        var leftEdge  = apf.getAbsolutePosition(lastBar.$ext)[0];
        var indicator = this.indicator;
        
        lastInfo = null;
        
        //Fix, actually bug is in interactive
        apf.addListener(document, "mouseup", function(e){
            apf.removeListener(document, "mousemove", whiledrag);
            apf.removeListener(document, "mouseup", arguments.callee);
        });
        
        apf.addListener(document, "mousemove", whiledrag = function(e){
            if (last) {
                last.$ext.style.borderBottom = "";
                last = null;
            }
            
            if (!e) return;
            
            if (e.button !== 0) {
                document.onmouseup(null, true);
                return;
            }
            
            var indicatorTop = indicator.style.top;
            dragged.$ext.style.top = "-2000px";
            indicator.style.top = "-2000px";
            apf.plane.hide();
            
            var info, aml;
            //Adding a column
            if (e.clientX > leftEdge - 40 && e.clientX < leftEdge) {
                var isSameColumn = dragged.localName == "vbox" 
                    && dragged.$dockbar == lastBar
                    && !dragged.$dockbar.selectNodes("vbox").length;

                info = {
                    position : isSameColumn ? "none" : "left_of_column",
                    aml : aml = last = lastBar
                };
            }
            //Rest
            else {
                info = _self.$calcAction(e, original);
                aml  = last = info.aml;
            }
            
            if (lastInfo && lastInfo.position == info.position && lastInfo.aml == aml) {
                indicator.style.top = indicatorTop;
                //indicator.style.display = "block";
                return;
            }
            
            lastInfo = info;
            
            if (!aml || !aml.dock && !aml.bar) {
                if (!state && false) {
                    state = 1;
                    apf.tween.single(dragged.$ext, {
                        type: "fade",
                        from: 0.2,
                        to  : 1,
                        steps : 20,
                        onfinish : function(){
                            state = 1;
                        }
                    });
                }
                return;
            }

            var borderColor = "rgba(154,190,144,0.50)";
            var borderColor2 = "rgba(154,190,144,0.75)";
            var pos = apf.getAbsolutePosition(aml.$ext);
            indicator.style.left = pos[0] + "px";
            indicator.style.top  = pos[1] + "px";
            indicator.style.display = "block";
            indicator.style.backgroundColor = "";
            indicator.style.borderColor = borderColor;
            indicator.style.marginLeft = "0";
            indicator.innerHTML = "";
            
            if (state && false) {
                state = 0;
                apf.tween.single(dragged.$ext, {
                    type: "fade",
                    from: 1,
                    to  : 0.2,
                    steps : 20,
                    onfinish : function(){
                        state = 0;
                    }
                });
            }
            
            var isDropExpanded = _self.isExpandedFull(info.aml);
            var width = aml.$ext.offsetWidth;
            var height = aml.$ext.offsetHeight;
            switch (info.position) {
                case "before_button":
                case "after_button":
                    indicator.innerHTML = "<div></div><div style='position:absolute'></div>";
                    indicator.style.border = "1px solid " + borderColor2;
                    
                    var pos2 = apf.getAbsolutePosition(aml.parentNode.$ext);
                    indicator.style.left = (pos2[0] - 1) + "px";
                    indicator.style.top  = pos2[1] + "px";
                    width = aml.parentNode.$ext.offsetWidth + 1;
                    height = aml.parentNode.$ext.offsetHeight + 1;
                    
                    var divHead = indicator.firstChild;
                    divHead.style.height = "7px";
                    divHead.style.backgroundColor = borderColor;
                    
                    var div = indicator.childNodes[1];
                    var oBtn = getOriginal("button", original);
                    var isSameElement = aml == oBtn || 
                        findNextElement(aml, "button") == oBtn && info.position == "after_button";
                    if (isSameElement) { //@todo Checks needs to include different representations
                        if (aml != oBtn)
                            pos = apf.getAbsolutePosition(oBtn.$ext);
                        div.style.top = (pos[1] - pos2[1] + 4) + "px";
                        div.style.left = "2px";
                        div.style.right = "3px";
                        div.style.height = (oBtn.$ext.offsetHeight - 9) + "px";
                        div.style.border = "2px solid " + borderColor;
                        div.style.webkitBorderRadius = "4px";
                    }
                    else {
                        div.style.top = (pos[1] - pos2[1]
                            + (info.position == "before_button" ? 0 : aml.$ext.offsetHeight) 
                            ) + "px";
                        div.style.width = "34px";
                        div.style.margin = "0 2px 0 1px";
                        div.style.borderBottom = "3px solid " + borderColor;
                    }
                    
                    break;
                case "in_section":
                    if (getOriginal("section", original) == aml.$dockfor) {//@todo move this
                        indicator.style.borderWidth = "1px 1px 1px 1px";
                        height--;
                    }
                    break;
                case "after_page":
                case "before_page":
                    var pNode = aml.parentNode;
                    var pos2 = apf.getAbsolutePosition(pNode.$ext);
                    indicator.style.left = (pos2[0] + (!isDropExpanded ? 0 : 3)) + "px";
                    indicator.style.top  = (pos2[1] + (!isDropExpanded ? -2 : 3)) + "px";
                    indicator.style.borderColor = borderColor2;
                    width = pNode.$ext.offsetWidth + (!isDropExpanded ? 6 : 2);
                    height = pNode.$ext.offsetHeight + (!isDropExpanded ? 11 : 0);
                    indicator.style.borderWidth = "3px 3px 3px 3px";
                    
                    var compareAml = info.position == "before_page" 
                        ? aml.previousSibling 
                        : aml.nextSibling;
                    var originalAml = getOriginal("page", original);
                    var matchAml = originalAml == aml 
                        ? aml 
                        : (originalAml == compareAml ? compareAml : false);
                    var diff = apf.getAbsolutePosition((matchAml || aml).$button, pNode.$ext);
                    if (matchAml) {
                        indicator.innerHTML = "<div style='position:absolute;'></div><div style='position:absolute;'></div><div style='position:absolute;'></div>";
                        var div1 = indicator.firstChild;
                        var div2 = indicator.childNodes[1];
                        var div3 = indicator.childNodes[2];
                        div1.style.left = (diff[0] - (!isDropExpanded ? 3 : 6)) + "px";
                        div1.style.width = (matchAml.$button.offsetWidth - 6) + "px";
                        div1.style.height = !isDropExpanded ? "16px" : "19px";
                        div1.style.margin = "-19px 0 0 0px";
                        div1.style.border = "3px solid " + borderColor2;
                        div1.style.borderWidth = "3px 3px 0 3px";
                        
                        div2.style.left = (diff[0] + matchAml.$button.offsetWidth - (!isDropExpanded ? 6 : 6)) + "px";
                        div2.style.right = "0px";
                        div3.style.borderBottom =
                        div2.style.borderBottom = "3px solid " + borderColor2;
                        
                        div3.style.left = "0px";
                        div3.style.right = (width - diff[0] - (!isDropExpanded ? 12 : 8)) + "px";
                        
                        indicator.style.borderTop = "0px solid " + borderColor2;
                        indicator.style.top = (pos2[1] + (!isDropExpanded ? 19 : 23)) + "px";
                        height -= 26 + (!isDropExpanded ? 4 : 2);
                        width  -= !isDropExpanded ? 6 : 8;
                    }
                    else {
                        indicator.style.top  = (pos2[1] + (!isDropExpanded ? 0 : 4)) + "px";
                        indicator.innerHTML = "<div style='position:absolute;'><div></div></div>";
                        indicator.firstChild.style.height = "16px";
                        indicator.firstChild.style.width = "7px";
                        indicator.firstChild.style.background = borderColor2;
                        indicator.firstChild.style.top = "0px";
                        indicator.firstChild.firstChild.style.width = "0px";//background = "#5c5c5c";
                        indicator.firstChild.firstChild.style.height = "100%";
                        indicator.firstChild.firstChild.style.margin="0 3px 0 3px";
                        indicator.firstChild.firstChild.style.borderLeft = "1px dotted #666";
                        indicator.firstChild.firstChild.style.opacity = 0.6;
                        
                        var left = (diff[0] + 
                            (info.position == "before_page" ? 0 : aml.$button.offsetWidth));

                        if (left + 7 >= width) {
                            left -= (isDropExpanded ? 11 : 10);
                            indicator.firstChild.style.width = "4px";
                            indicator.firstChild.firstChild.style.marginRight = "0px";
                        }
                        else if (left > 10)
                            left -= (isDropExpanded ? 10 : 7);
                        else {
                            left -= (isDropExpanded ? 3 : 0);
                            indicator.firstChild.style.width = "4px";
                            indicator.firstChild.firstChild.style.marginLeft = "0px";
                        }
                        indicator.firstChild.style.left = left + "px";
                        height -= !isDropExpanded ? 11 : 9;
                        width  -= !isDropExpanded ? 6 : 8;
                    }
                    break;
                case "before_tab":
                    height = 0;
                case "after_tab":
                    indicator.style.left = (pos[0] + 2) + "px";
                    indicator.style.top  = (pos[1] + height - (!aml.nextSibling ? 3 : 0)) + "px";
                    indicator.style.height = "3px";
                    indicator.style.width = (width - 7) + "px";
                    indicator.style.borderWidth = "0 0 0 0";
                    indicator.style.backgroundColor = borderColor2;
                    
                    return;
                case "before_section":
                    height = 0;
                case "after_section":
                    indicator.style.left = pos[0] + "px";
                    indicator.style.top  = (pos[1] + height - 3) + "px";
                    indicator.style.height = "5px";
                    indicator.style.width = aml.$ext.offsetWidth + "px";
                    indicator.style.borderWidth = "0 0 0 0";
                    indicator.innerHTML = "<div style='margin:2px 0 2px 0'></div>";
                    indicator.firstChild.style.backgroundColor = "#5c5c5c";
                    indicator.firstChild.style.height = "1px";
                    indicator.style.backgroundColor = borderColor;
                    return;
                case "in_column":
                    indicator.innerHTML = "<div style='position:absolute'></div>";
                    indicator.style.borderWidth = "0 0 0 0";
                    
                    div = indicator.firstChild;
                    div.style.top = "100%";
                    div.style.borderTop = "3px solid " + borderColor;
                    div.style.height = (dragged.localName == "vbox" ? dragged.$ext.offsetHeight : 50) + "px";
                    div.style.background = "rgba(172,172,172,0.5)";
                    div.style.width = "100%";
                    div.style.webkitBorderRadius = "0 0 4px 4px";
                    
                    /*apf.tween.single(div, {
                        type: "height",
                        from: 0,
                        to  : dragged.localName == "vbox" ? dragged.$ext.offsetHeight : 50,
                        anim : apf.tween.EASEOUT,
                        steps : 20
                    });*/
                    
                    break;
                case "left_of_column":
                    if (aml != _self.$getLastBar()) {
                        indicator.style.borderWidth = "0 0 0 3px";
                        indicator.style.marginLeft = "-1px";
                    }
                    else {
                        indicator.innerHTML = "<div style='position:absolute'></div>";
                        indicator.style.borderWidth = "0 0 0 0";
                        
                        var div = indicator.firstChild;
                        div.style.right = "100%";
                        div.style.width = 0;
                        div.style.height = "100%";
                        div.style.borderRight = "3px solid " + borderColor;
                        div.style.background = "rgba(172,172,172,0.5)";
                        div.style.webkitBorderRadius = "4px 0 0 4px";
                        
                        apf.tween.single(div, {
                            type: "width",
                            from: 0,
                            to  : 40,
                            anim : apf.tween.EASEOUT,
                            steps : 20
                        });
                    }
                    break;
                case "right_of_column":
                    indicator.style.borderWidth = "0 3px 0 0";
                    if (!_self.$isLastBar(aml))
                        indicator.style.marginLeft = "2px";
                    break;
                default:
                    indicator.style.display = "none";
                    //apf.setOpacity(dragged.$ext, 1);
                    apf.setStyleClass(dragged.$ext, '', ['dragging']);
                    break;
            }
            
            diff = apf.getDiff(indicator);
            indicator.style.width  = (width - diff[0]) + "px";
            indicator.style.height = (height - diff[1]) + "px";
        });
        
        whiledrag.dragged  = dragged;
        whiledrag.original = original;
    };
    
    /**
     * Normalize types by converting them to the requested widget type of the
     * conceptual single object
     */
    function getOriginal(type, aml) {
        var buttons;
        if (type == "button") {
            if (aml.localName == "page")
                return aml.$dockbutton;
            if (aml.localName == "divider") {
                buttons = aml.parentNode.selectNodes("button");
                if (buttons.length == 1)
                    return buttons[0];
            }
            return aml;
        }
        else if (type == "page") {
            if (aml.localName == "button")
                return aml.$dockpage;
            if (aml.localName == "divider") {
                buttons = aml.parentNode.selectNodes("button");
                if (buttons.length == 1)
                    return buttons[0].$dockpage;
            }
            return aml;
        }
        else if (type == "section") {
            if (aml.localName == "page" && aml.parentNode.getPages().length == 1)
                return aml.$dockbutton.parentNode;
            if (aml.localName == "divider")
                return aml.parentNode;
            return aml;
        }
    }
    
    function matchTab(pos, y) {
        return y > pos - diffPixel && y < pos + diffPixel;
    }
    
    /**
     * Calculate what action will be performed based on the relative location
     * of the mouse cursor
     */
    this.$calcAction = function(e, original){
        var position = "none";

        var el = document.elementFromPoint(e.clientX, e.clientY);
        if (el == document.body)
            return {};
        
        var aml = apf.findHost(el);
        if (!aml) 
            return {};

        if (aml.localName == "codeeditor") {
            while (aml && !aml.$dockData) {
                aml = aml.bar || aml.parentNode;
            }
        }
        if (!aml)
            return {};

        var pos;
        if (!aml.dock || aml.localName == "page" || aml.localName == "tab") {
            var node = aml;
            while (node && !node.vdock)
                node = node.parentNode;
            
            if (node && node.localName == "vbox") {
                pos = apf.getAbsolutePosition(node.$ext)[1];
                var tabs = node.selectNodes("tab");
                var doTest = original.parentNode.localName == "tab" 
                    && original.parentNode.getPages().length == 1;

                if (matchTab(apf.getAbsolutePosition(tabs[0].$ext, node.$ext)[1] + pos, e.clientY)) {
                    return doTest && original.parentNode == tabs[0] 
                        ? {} : {position: "before_tab", aml: tabs[0]};
                }
                        
                for (var i = 0; i < tabs.length; i++) {
                    if (matchTab(tabs[i].$ext.offsetHeight + 1 
                      + apf.getAbsolutePosition(tabs[i].$ext, node.$ext)[1] + pos - (!aml.nextSibling ? 3 : 0), e.clientY)) {
                        return doTest && (original.parentNode == tabs[i] || original.parentNode == tabs[i+1])
                            ? {} : {position: "after_tab", aml: tabs[i]};
                    }
                }
            }
        }
        
        if (aml.localName == "splitter") {
            //aml.$ext.style.display = "none";
            //aml = apf.findHost(document.elementFromPoint(e.clientX, e.clientY));
            //aml.$ext.style.display = "block";
            aml = aml.nextSibling;
        }
    
        if (!aml.dock && !aml.bar)
            return {};

        var bar = aml;
        while (bar && bar.localName != "bar" && (bar.localName != "vbox" || !bar.dock && !bar.bar))
            bar = bar.parentNode;
    
        var l, r, t, isSameColumn, pages;
        if (bar) {
            pos = apf.getAbsolutePosition(e.target, bar.$ext);
            l = pos[0] + e.offsetX;
            r = bar.$ext.offsetWidth - l;
        }
        
        if (bar && l < diffPixel) {
            aml = bar.parentNode.localName == "bar" ? bar.parentNode : bar;
            isSameColumn = 
                (original.localName == "divider" 
                  && (original.parentNode.$dockbar == aml
                    || original.parentNode.$dockbar == findPreviousBar(aml))
                  && !original.parentNode.$dockbar.selectNodes("vbox").length
                || original.localName == "button" && original.parentNode.childNodes.length == 2
                  && (original.parentNode.parentNode == aml
                    || original.parentNode.parentnode == findPreviousBar(aml))
                || original.localName == "page" && original.parentNode.getPages().length == 1
                  && (original.$dockbutton.parentNode.parentNode == (aml.bar || aml)
                    || original.$dockbutton.parentNode.parentNode == findPreviousBar(aml))
                );

            return {
                position : isSameColumn ? "none" : "left_of_column",
                aml : aml
            };
        }
        else if (bar) {
            if (!bar)
                return {};
            
            var df = (this.$isLastBar(bar)
                ? diffPixel * 2
                : diffPixel);
    
            if (bar && r < df) {
                aml = bar.parentNode.localName == "bar" ? bar.parentNode : bar;
                
                isSameColumn = 
                (original.localName == "divider" 
                  && (original.parentNode.$dockbar == aml
                    || original.parentNode.$dockbar == findNextBar(aml))
                  && !original.parentNode.$dockbar.selectNodes("vbox").length
                || original.localName == "button" && original.parentNode.childNodes.length == 2
                  && (original.parentNode.parentNode == aml
                    || original.parentNode.parentnode == findNextBar(aml))
                || original.localName == "page" && original.parentNode.getPages().length == 1
                  && (original.$dockbutton.parentNode.parentNode == (aml.bar || aml)
                    || original.$dockbutton.parentNode.parentNode == findNextBar(aml))
                );

                return {
                    position : isSameColumn ? "none" : "right_of_column",
                    aml : aml
                };
            }
        }
        
        if (aml.localName == "page" || aml.localName == "tab" || aml.localName == "menu") {
            position = "before_page";
            if (aml.localName == "page") {
                pos = apf.getAbsolutePosition(aml.$button);
                l = e.clientX - pos[0];
    
                if (l > aml.$button.offsetWidth/2)
                    position = "after_page";
            }
            else if (aml.localName == "menu") {
                if (aml.firstChild.getPages) {
                    pages = aml.firstChild.getPages();
                    aml = pages[pages.length - 1];
                }
                position = "after_page";
            }
            else if (aml.localName == "tab") {
                pages = aml.getPages();
                aml = pages[pages.length - 1];
                position = "after_page";
            }
    
            //var pos2 = apf.getAbsolutePosition(aml.parentNode.$ext);
            //var t = e.clientY - pos2[1];
            //if (t > 18)
                //return {};
        }
        else {
            if (aml.localName == "bar" || aml.skin == "dockheader") {
                if (aml.skin == "dockheader") {
                    aml = aml.parentNode.selectNodes("vbox")[0];
                    position = "before_section";
                }
                else {
                    position = original.localName == "divider" 
                      && original.parentNode.$dockbar == aml
                      && aml.lastChild.$dockfor == original.parentNode //!aml.selectNodes("vbox").length
                        ? "in_section"
                        : "in_column";
                    aml = aml.lastChild;/*selectNodes("vbox");
                    aml = vboxs[vboxs.length - 1];*/
                }
            }
            else if (aml.localName == "button") {
                position = "after_button";
                pos = apf.getAbsolutePosition(aml.$ext);
                t = e.clientY - pos[1];
                if (t < aml.$ext.offsetHeight/2) {
                    if (aml.previousSibling && aml.previousSibling.localName == "button") {
                        aml = aml.previousSibling;
                    }
                    else {
                        position = "before_button";
                        //aml = aml.parentNode;
                    }
                }
            }
            else if (aml.dock && (aml.localName == "divider" || aml.localName == "vbox")) {
                if (aml.localName == "divider")
                    aml = aml.parentNode;
                
                var buttons = aml.selectNodes("button");
                if (!buttons.length)
                    return {position: "in_section", aml: aml};
                
                pos = apf.getAbsolutePosition(aml.$ext);
                t = e.clientY - pos[1];
                var b = aml.$ext.offsetHeight - t;
    
                if (t < diffPixel) {
                    if (original.localName != "divider" 
                      || original.parentNode != (aml.previousSibling 
                      && aml.previousSibling.$dockfor)) {
                        position = "before_section";
                    }
                }
                else if (b < diffPixel && aml.nextSibling) {
                    if (original.localName != "divider" 
                      || original.parentNode != aml.$dockfor) {
                        if (!aml.nextSibling
                          || aml.nextSibling.$dockfor != getOriginal("section", original))
                            position = "after_section";
                    }
                }
                
                if (position == "none") {
                    if (t < aml.$ext.offsetHeight/2) {
                        position = "before_button";
                        aml = buttons[0];
                    }
                    else {
                        position = "after_button";
                        aml = buttons[buttons.length - 1];
                    }
                }
            }
        }
    
        return {
            position : position,
            aml      : aml
        };
    };
    
    /**
     * clearState after dragging (detect dropping)
     * 
     * @todo because of the caching this function can become simpler
     */
    this.$stopDrag = function(e){
        whiledrag();
        apf.removeListener(document, "mousemove", whiledrag);
        
        var indicator = this.indicator;
        var info = lastInfo;//calcAction(e);
        var aml  = info && info.aml;
        
        indicator.style.display = "none";
        
        var original = whiledrag.dragged;
        apf.setOpacity(original.$ext, 1);
        apf.setStyleClass(original.$ext, '', ['dragging']);
        
        if (!aml) return;
        switch(info.position) {
            case "before_button":
            case "after_button":
                var submenu = self[aml.submenu];
                var dragAml = whiledrag.original;
    
                this.$moveTo(submenu, dragAml, aml, info.position == "before_button" 
                    ? aml 
                    : aml.nextSibling, aml.parentNode, info.position);
                break;
            case "before_tab":
            case "after_tab":
                var bar      = aml.parentNode.bar;
                var childNr  = apf.getChildNumber(aml);
                var sections = bar.selectNodes("vbox");
                var section = this.$addSection(bar, info.position == "before_tab"
                    ? sections[0]
                    : sections[childNr + 1], null, original && original.$dockData);
                
                //reconstruct menu
                var submenu = this.$addMenu(section);
                var dragAml = whiledrag.original;
                
                var tab = aml.parentNode.insertBefore(submenu.firstChild, info.position == "before_tab"
                    ? aml
                    : aml.nextSibling);
                tab.setAttribute("flex", 1);
    
                this.$moveTo(submenu, dragAml, tab, null, section, info.position, tab);//, null, pNode);
                break;
            case "before_section":
            case "in_column":
            case "after_section":
                var section = this.$addSection(aml.parentNode, info.position == "before_section"
                    ? aml
                    : (info.position == "in_column"
                        ? null
                        : aml.nextSibling), null, original && original.$dockData);
                
                //reconstruct menu
                var submenu = this.$addMenu(section);
                var dragAml = whiledrag.original;
    
                this.$moveTo(submenu, dragAml, aml, null, section, info.position);
                break;
            case "before_page":
            case "after_page":
                var submenu = self[aml.$dockbutton.submenu];//aml.parentNode.parentNode;
                var dragAml = whiledrag.original;
                
                this.$moveTo(submenu, dragAml, aml.parentNode, info.position == "before_page" 
                    ? aml.$dockbutton
                    : aml.nextSibling && aml.nextSibling.$dockbutton, submenu.ref, 
                        info.position, aml.parentNode);
                break;
            case "left_of_column":
                var bar = this.$addBar(aml);
                //Single Tab Case
                //create new section
                var section = this.$addSection(bar, null, null, original && original.$dockData);
                
                var dragAml = whiledrag.original, oldSectionData;
                if (dragAml.localName == "button" || dragAml.localName == "divider")
                    oldSectionData = dragAml.parentNode.$dockData;
                else if (dragAml.localName == "page")
                    oldSectionData = dragAml.$dockbutton.parentNode.$dockData;
                
                var submenu = this.$addMenu(section, oldSectionData);
                this.$moveTo(submenu, dragAml, aml, null, section, info.position);
                break;
            case "right_of_column":
                var bar = this.$addBar(aml.nextSibling);
                //Single Tab Case
                //create new section
                var section = this.$addSection(bar, null, null, original && original.$dockData);
                
                //reconstruct menu
                var submenu = this.$addMenu(section);
                var dragAml = whiledrag.original;
    
                this.$moveTo(submenu, dragAml, aml, null, section, info.position);
                break;
            default:
                break;
        }
    };
    
    /**
     * Manages the move of a conceptual single element, represented by either
     * a button, page or divider and performs the move from it's current position
     * to it's new position.
     * 
     * @todo because of the caching this function can become simpler
     */
    this.$moveTo = function(submenu, dragAml, aml, beforeButton, parentNode, position, tab, pNode, ignoreEvent){
        var beforePage = beforeButton && beforeButton.$dockpage;

        if (dragAml.localName == "page" || dragAml.localName == "button" || dragAml.localName == "hbox") {
            if ((submenu.skin == "dockwin_runbtns" && dragAml.id != "btnRunCommands")  //@giannis tsss
              || (submenu.skin != "dockwin_runbtns" && dragAml.id == "btnRunCommands"))
                return;

            if (dragAml.localName == "page" || dragAml.localName == "hbox") {
                var page = dragAml;
                var button = dragAml.$dockbutton;
            }
            else if (dragAml.localName == "button") {
                page = dragAml.$dockpage;
                button = dragAml;
            }
            
            if (!pNode)
                pNode = page.parentNode;
            
            var btnPNode = button.parentNode;
            var oldMenu  = self[page.$dockbutton.submenu];
            var newPNode = tab || submenu.firstChild;
            
            if (newPNode) {
                newPNode.insertBefore(page, beforePage);
                if (!self[page.id])
                    self[page.id] = page;
                
                if (!newPNode.getPages || newPNode.getPages().length == 1) {
                    var mnu = self[page.$dockbutton.submenu];
                    if (mnu) {
                        mnu.setAttribute("width", oldMenu.width);
                        mnu.setAttribute("height", oldMenu.height);
                    }
                    var totalFlex = 0, count = 0;
                    if (newPNode.parentNode.localName == "vbox") {
                        newPNode.parentNode.selectNodes("tab").each(function(tab){ 
                            totalFlex += tab.flex || 1;
                            count++;
                        });
                    }
                    else {
                        var vboxes = parentNode.parentNode.selectNodes("vbox");
                        vboxes.each(function(vbox){  
                            var button = vbox.selectSingleNode("button");
                            totalFlex += button && self[button.submenu].firstChild.flex || 1;
                            count++;
                        });
                    }
                    if (!newPNode.height)
                        newPNode.setAttribute("flex", totalFlex/count);
                }
            }
            
            if (beforeButton && beforeButton.previousSibling == button || beforeButton == button
              || !beforeButton && !button.nextSibling && button.parentNode == parentNode)
                return;
    
            button.setAttribute("submenu", submenu.id);

            //add button to section
            parentNode.insertBefore(button, beforeButton);
            
            //correct state
            var i, b = parentNode.$dockData.buttons;
            btnPNode.$dockData.buttons.remove(button.$dockData);
            
            if (beforeButton)
                b.insertIndex(button.$dockData, b.indexOf(beforeButton.$dockData));
            else
                i = b.push(button.$dockData);
            
            tableCleanup(pNode, btnPNode, oldMenu, b);
            checkBars();
        }
        else if (dragAml.localName == "divider") {
            var buttons = dragAml.parentNode && dragAml.parentNode.selectNodes("button");
            for (var i = buttons.length - 1; i >= 0; i--) {
                var button = buttons[i];
                this.$moveTo(submenu, button, aml, beforeButton, parentNode, position, tab, pNode, true);
            }
            
            checkBars();
        }
        
        if (!ignoreEvent)
            this.$cbChange();
    };
    
    /**
     * Creates a new menu
     */
    this.$addMenu = function(section, options){
        if (!options) 
            options = section.$dockData;
        var _self = this,
            menuId  = options.id || "submenu" + menuCounter++,
            resizeTimer;

        if (section.$menu)
            return apf.document.body.appendChild(section.$menu);

        var menu = new apf.menu({
            id        : menuId,
            width     : options.width || "350",
            height    : options.height || "200",
            ref       : section,
            right     : 10,
            pinned    : "true",
            animate   : "false",
            skin      : options.skin ? options.skin : "dockwindowblack",
            resizable : options.resizable === false ? false : "left bottom",
            dock      : 1,
            onhide    : function(e){
                if (this.firstChild && this.firstChild.getPage())
                    this.firstChild.getPage().$dockbutton.$dockData.showMenu = false;
            },
            ondisplay : function(e){
                if (_self.$currentMenu && _self.$currentMenu != this && _self.$currentMenu.parentNode)
                    _self.$currentMenu.hide();
                _self.$currentMenu = this;
                
                var pos   = apf.getAbsolutePosition(menu.opener.$ext);
                var width = apf.getWindowWidth();
                var dist  = //menu.$ext.offsetWidth > width - pos[0] //Weird bug - chrome only??
                    width - pos[0] 
                    //: menu.$ext.offsetWidth;

                menu.$ext.style.right = (dist + 5) + "px";
                menu.$ext.style.left = "";

                var x;
                setTimeout(x = function(){
//                    menu.$ext.style.marginRight = "0";
//                    menu.$ext.style.right = (width - pos[0] + 6) + "px";
//                    menu.$ext.style.left = "";
//                    menu.$ext.style.zIndex = "9999";
                    
                    if (menu.opener && menu.opener.$dockData && menu.opener.$dockData.caption) {
                        var btnPos = apf.getAbsolutePosition(menu.opener.$ext),
                            arrow;
                        if (typeof menu.$ext.getElementsByClassName == "function" && (arrow = menu.$ext.getElementsByClassName("arrow")[0])) {
                            arrow.style.top = btnPos[1] - apf.getAbsolutePosition(menu.$ext)[1] + 8 + "px"
                        }
                    }
                });
                x();
                
                if (this.firstChild.getPage())
                    this.firstChild.getPage().$dockbutton.$dockData.showMenu = true;
            },
            onafterresize : function(){
                section.$dockData.width  = this.getWidth();
                section.$dockData.height = this.getHeight();
                
                _self.$cbChange();
            },
            childNodes : [
                new apf.tab({
                    anchors : options.noTab ? "1 -7 0 4" : "5 4 5 4", 
                    skin    : options.noTab ? "dockbar" : "docktab",
                    buttons : "scale, close",
                    anims   : "remove",
                    dock    : 1,
                    nosplitter : options.noTab ? true : false,
                    flex    : options.flex || (options.noflex ? 0 : 1), 
                    activepage : 0,
                    noflex  : options.noflex,
                    onafterswitch : function(e){
                        setTimeout(function(){
                            if (e.previousPage) {
                                var button = e.previousPage.$dockbutton;
                                button.$dockData.active = false;
                                if (button.value && menu.visible) {
                                    button.value = false;
                                    button.$setState("Out", {});
                                }
                            }
                            if (e.nextPage && e.nextPage.$dockbutton) {
                                var button = e.nextPage.$dockbutton;
                                button.$dockData.active = true;
                                if (!button.value && menu.visible) {
                                    button.value = true;
                                    button.$setState("Down", {});
                                }
                                
                                if (menu.visible) {
                                    menu.opener = button;
                                    menu.dispatchEvent("display");
                                }
                            }
                            
                            _self.$cbChange();
                        });
                    },
                    onresize : function(e){
                        clearTimeout(resizeTimer);
                        
                        var tab = this;
                        resizeTimer = setTimeout(function(){
                            if (section.parentNode && section.parentNode.$dockData
                              && section.parentNode.$dockData.expanded > 0) {
                                section.parentNode.$dockData.width  = tab.getWidth();
                                options.flex = tab.flex;
                                
                                _self.$cbChange();
                            }
                        }, 500);
                    },
                    onclose : function(e){
                        var page = e.page;
                        page.lastParent = this;
                        
                        _self.$cbChange();
                    }
                })
            ]
        });
        
        apf.document.body.appendChild(menu);
        
        menu.show();
        menu.hide();
        
        section.$menu = menu;
        
        menu.setAttribute("width", options.width || 260);
        if (options.height)
            menu.setAttribute("height", options.height);
        
        return menu;
    };
    
    /**
     * Creates a new bar
     */
    this.$addBar = function(before, dockData){
        var _self = this;
        
        this.columnCounter++;
        
        if (before && before.previousSibling 
          && before.previousSibling.tagName == 'splitter' )
            before = before.previousSibling;
        
        if (!dockData) {
            dockData = {sections: []};
            dockData.uniqueId = lookup.push({data: dockData}) - 1;
        }

        if (dockData && dockData.cache)
            var bar = this.$parentHBox.insertBefore(dockData.cache, before);

        else {
            var bar   = this.$parentHBox.insertBefore(new apf.bar({
                skin : "debug-panel",
                margin : "0 0 0 0",
                dock : 1,
                onDOMNodeRemovedFromDocument : function(){
                    _self.columnCounter--;
                },
                childNodes : [
                    new apf.button({
                        dock : 1,
                        skin : "dockheader",
                        onclick : function(){
                            _self.expandBar(this.parentNode, true, true);
                        }
                    }),
                ]
            }), before);
            
            bar.$dockData = dockData;
            bar.$dockData.cache = bar;
            
            if (state.bars.indexOf(bar.$dockData) == -1)
                state.bars.insertIndex(bar.$dockData, 
                  before ? state.bars.indexOf(before.$dockData) : state.bars.length);
        }
        
        registerLookup.call(this, bar);
        
        return bar;
    };
    
    /**
     * Creates a new page
     */
    this.$addPage = function(page, before, menu, caption, name, section){
        var _self = this;

        if (!page)
            page = menu.firstChild.add(caption, name);
        else if (section && section.parentNode.expanded) {
            var bar = section.parentNode;
            if (menu.firstChild) {
                menu.firstChild.insertBefore(page, before);

                bar.vbox.insertBefore(menu.firstChild, 
                    section.nextSibling && section.nextSibling.lastChild
                      && section.nextSibling.lastChild.$dockpage.parentNode);
            }
            else {
                var index = apf.getArrayFromNodelist(bar.selectNodes("vbox")).indexOf(section);
                var tab = bar.vbox.selectNodes("tab")[index];
                
                tab.insertBefore(page, before);
            }
        }
        else 
            menu.firstChild.insertBefore(page, before);

        page.oDrag = page.$button;
        page.dock  = 1;
        page.setAttribute("draggable", true);
        
        var beforeDrag;        
        
        if (!page.$addedDockEvent) {  
            page.addEventListener("beforedrag", beforeDrag = function(e){ //change this to beforedrag and recompile apf
                this.$ext.style.zIndex = "";

                var originalTab = this.parentNode;
                var oneTab = originalTab.length == 1;
                var pHtmlNode = (oneTab ? this.parentNode : this).$ext;
                
                if (oneTab) {
                    originalTab.$buttons.style.opacity = 0;
                    this.$ext.style.opacity = 0;
                    //pHtmlNode.style.background = "#434343";
                    //pHtmlNode.style.border = "3px solid #373737";
                }
                else {
                    pHtmlNode.style.background = "#fafcfe";
                }

                var tab = this.parentNode.cloneNode(false);
                tab.removeAttribute("id");
                tab.removeAttribute("activepage");
                tab.setAttribute("buttons", "close"); //@todo bug in scale that doesnt resize 
                tab.removeAttribute("anchors");
                
                apf.document.body.appendChild(tab);
                
                tab.setWidth(this.parentNode.$ext.offsetWidth - 6);
                tab.setHeight(this.parentNode.$ext.offsetHeight - 6);

                var dragPage = this.cloneNode(false);
                dragPage.removeAttribute("id");
                dragPage.removeAttribute("render");
                tab.appendChild(dragPage);
                
                var nodes = this.childNodes;
                for (var i = nodes.length - 1; i >= 0; i--) {
                    dragPage.insertBefore(nodes[i], dragPage.firstChild);
                }

                var pos = apf.getAbsolutePosition(this.parentNode.$ext);
                tab.setLeft(pos[0] - 1 + 3);
                tab.setTop(pos[1] - 2 + 3);

                tab.$ext.style.border = "1px solid #333";
                tab.addEventListener("afterdrag", function(e){
                    originalTab.$buttons.style.opacity = "";
                    page.$ext.style.opacity = "";
                    pHtmlNode.style.background = "";
                    pHtmlNode.style.border = "";
                    
                    var nodes = dragPage.childNodes;
                    for (var i = nodes.length - 1; i >= 0; i--) {
                        page.appendChild(nodes[i], page.firstChild);
                    }
                    
                    tab.id = tab.name = ""; //@todo fix this bug in apf
                    tab.destroy(true, true);
                    _self.$stopDrag(e.htmlEvent);

                    tab.removeEventListener("afterdrag", arguments.callee);
                });

                //document instead?
                var clientX = e.htmlEvent.clientX;
                var clientY = e.htmlEvent.clientY;
                tab.setAttribute("draggable", true);
                setTimeout(function(){
                    tab.$dragStart({clientX:clientX,clientY:clientY});
                    tab.$ext.style.zIndex = 1000000;
                });

                _self.$startDrag(tab, this);

                return false;
            });
            
            page.addEventListener("afterclose", function(e){
                var button = this.$dockbutton;
                var pNode = this.lastParent;
                var btnPNode = button.parentNode;

                button.removeNode();//.destroy(true, true);
                this.removeNode();

                button.$dockData.hidden = 2;

                tableCleanup(pNode, btnPNode, pNode.parentNode.localName == "menu" 
                    ? pNode.parentNode 
                    : self[button.submenu]);
                    
                _self.$cbStorePage(this);

//                page.removeEventListener("beforedrag", beforeDrag);
//                page.removeEventListener("afterclose", arguments.callee);
//                page.$addedDockEvent = false;
                
                return false;
            }, true);
            page.$addedDockEvent = true;
        }

        return page;
    };

    /**
     * Retrieves an existing section and its associated menu
     */
    this.$getSection = function(bar, ident) {
        for (var barChild in bar.childNodes) {
            if (bar.childNodes[barChild].value && bar.childNodes[barChild].value == ident) {
                return bar.childNodes[barChild];
            }
        }
        
        return null;
    };

    /**
     * Creates a new section
     */
    this.$addSection = function(bar, before, ident, sectionOpt){
        var _self   = this;
        
        if (!sectionOpt) {
            sectionOpt = {buttons: []};
            sectionOpt.uniqueId = lookup.push({data: sectionOpt}) - 1;
        }
        
        if (!bar)
            bar = this.$parentHBox.lastChild;
        
        if (sectionOpt.cache) {
            var section = bar.insertBefore(sectionOpt.cache, before);

            var pData = findParentState(sectionOpt, true);
            if (pData && pData != bar.$dockData)
                pData.sections.remove(sectionOpt);
        
            var sections = bar.$dockData.sections;
            if (sections.indexOf(section.$dockData) == -1)
                sections.insertIndex(section.$dockData, 
                  before ? sections.indexOf(before.$dockData) : sections.length);
        }
        else {
            var section = bar.insertBefore(new apf.vbox({
                padding : 0,
                edge    : "0 0 3 0",
                "class" : "docksection",
                //width   : bar.$dockData.width || "",
                value   : ident,
                dock    : sectionOpt.draggable === false ? 0 : 1,
                draggable : sectionOpt.draggable === false ? false : true,
                childNodes : [
                    new apf.divider({
                        skin      : "divider-debugpanel",
                        margin    : "3 2 -4 2",
                        dock      : 1,
                        visible   : sectionOpt.draggable === false ? false : true,
                        draggable : true
                    })
                ]
            }), before);
            
            if (sectionOpt.draggable !== false) {
                var div = section.firstChild;
                div.addEventListener("beforedrag", function(e){ //change this to beforedrag and recompile apf
                    var section = this.parentNode;
    
                    //this.hideMenu();
    
                    var pNode = section.$dockbar = section.parentNode;
                    var placeHolder = section.cloneNode(false);
                    placeHolder.removeAttribute("id");
                    placeHolder.$dockfor = section;
    
                    var diff = apf.getDiff(section.$ext);
                    var height = section.$ext.offsetHeight;
                    var pos = apf.getAbsolutePosition(section.$ext);
    
                    pNode.insertBefore(placeHolder, section);
                    placeHolder.$ext.style.background = "#434343";
                    placeHolder.$ext.style.borderTop = "1px solid #373737";
                    placeHolder.$ext.style.height = (height - diff[1]) + "px";
    
                    section.setWidth(section.$ext.offsetWidth);
                    apf.document.body.appendChild(section);
                    section.setLeft(pos[0]);
                    section.setTop(pos[1]);
    
                    section.addEventListener("afterdrag", function(e){
                        pNode.insertBefore(section, placeHolder);
                        section.setAttribute("draggable", false);
    
                        setTimeout(function(){
                            section.removeAttribute("left");
                            section.removeAttribute("top");
                            section.removeAttribute("width");
                            section.$ext.style.position = "relative";
                            section.$ext.style.zIndex = 1;
                        });
    
                        var buttons = this.selectNodes("button");
                        if (buttons.length)
                            buttons[0].setValue(false);
                            
                        placeHolder.destroy(true, true);
    
                        _self.$stopDrag(e.htmlEvent);
    
                        section.removeEventListener("afterdrag", arguments.callee);
                    });
    
                    section.setAttribute("draggable", true);
    
                    var clientX = e.htmlEvent.clientX;
                    var clientY = e.htmlEvent.clientY;
                    setTimeout(function(){
                        section.$dragStart({clientX:clientX,clientY:clientY});
                        section.$ext.style.zIndex = 1000000;
                    });
    
                    _self.$startDrag(section, this);
    
                    return false;
                });
            }

            var pData = findParentState(sectionOpt);
            if (pData && pData != bar.$dockData)
                pData.sections.remove(sectionOpt);
        
            section.$dockData = sectionOpt;
            section.$dockData.cache = section;
            
            var sections = bar.$dockData.sections;
            if (sections.indexOf(section.$dockData) == -1)
                sections.insertIndex(section.$dockData, 
                  before ? sections.indexOf(before.$dockData) : sections.length);
        }
        
        registerLookup.call(this, section);
        
        return section;
    };
    
    /**
     * Creates a new button
     */
    this.$addButton = function(section, before, submenu, page, options){
        var _self  = this, btnLock, tmp;
        var drag = true; 
        if (typeof options.draggable != "undefined" )
            drag = false;

        if (options.cache) {
            var button = section.insertBefore(options.cache, before);
            
            var pData = findParentState(options);
            if (pData && pData != section.$dockData)
                pData.buttons.remove(options);
                
            var buttons = section.$dockData.buttons;
            if (buttons.indexOf(button.$dockData) == -1)
                buttons.insertIndex(button.$dockData, 
                  before ? buttons.indexOf(before.$dockData) : buttons.length);
        }
        else {
            var button = section.insertBefore(new apf.button({
                skin    : "dockButton",
                submenu : submenu.id,
                dock    : drag ? 1 : "",
                visible : options && (options.hidden < 0) || true, 
                "class" : options["class"] || "",
                draggable : drag,
                onmousedown  : function(){
                    btnLock = true;
    
                    self[this.submenu] && self[this.submenu].firstChild 
                      && self[this.submenu].firstChild.set 
                      && self[this.submenu].firstChild.set(page);
                    btnLock = false;
                    
                    if (options && (tmp = options.primary)) {
                        var span = button.$ext.getElementsByTagName("span");
                        span[2].style.backgroundPosition = 
                            tmp.activeState.x + 'px ' 
                            + tmp.activeState.y + 'px';
                
                        if (tmp = options.secondary) {
                            span[1].style.backgroundPosition = 
                                tmp.activeState.x + 'px ' 
                                + tmp.activeState.y + 'px';
                        }
                    }
                    
                    setTimeout(function(){
                        _self.$cbChange();
                    });
                }
            }), before);
            
            if (options && options["id"])
                button.setAttribute('id', options["id"]);
            
            function _setBtnIco(_btn){
                if (options && (tmp = options.primary)) {
                    var span = _btn.$ext.getElementsByTagName("span");
                    
                    _btn.setAttribute("tooltip", options.menu.split("/").pop());
                    
                    span[2].style.background = 'url("' 
                        + tmp.backgroundImage + '") '
                        + tmp.defaultState.x + 'px '
                        + tmp.defaultState.y + 'px no-repeat';
                    
                    if (tmp = options.secondary) {
                        span[1].style.background = 'url("' 
                            + tmp.backgroundImage + '") '
                            + tmp.defaultState.x + 'px '
                            + tmp.defaultState.y + 'px no-repeat'
                    }
                    
                    if (tmp = options.tertiary) {
                        span[0].style.background =
                            tmp.backgroundColor + ' url("'
                            + tmp.backgroundImage + '") '
                            + tmp.defaultState.x + 'px '
                            + tmp.defaultState.y + 'px no-repeat';
                        span[0].style.border = "1px solid #c7c7c7";
                    }
                }
            };
            
            _setBtnIco(button);
            
            // When the page is shown, we can reset the notification count
            page.addEventListener("prop.visible", function(e) {
    //            _self.resetNotificationCount(winIdent);
    
                //if (self[button.submenu] && !btnLock && e.value && this.$ext.offsetWidth && button.parentNode) // && this.parentNode.parentNode.localName == "menu") // & !_self.expanded
                    //button.showMenu();
                    
                if (e.value == true && options && options.cbOnPageShow)
                    options.cbOnPageShow();
                    
                else if (e.value == false && options && options.cbOnPageHide)
                    options.cbOnPageHide();
            });
            
            button.addEventListener("beforedrag", function(e){ //change this to beforedrag and recompile apf
                var originalButton = this;
                
                this.hideMenu();
                this.setValue(true);
                
                //Upgrade to container if only 1 element
                if (this.parentNode.selectNodes("button").length == 1) {
                    this.parentNode.firstChild.dispatchEvent("beforedrag", e);
                    return false;
                }
                
                var btn = this.cloneNode(true);
                btn.removeAttribute("id");
                apf.document.body.appendChild(btn);
                btn.setValue(true);
                _setBtnIco(btn);
                
                var pos = apf.getAbsolutePosition(this.$ext);
                btn.setLeft(pos[0]);
                btn.setTop(pos[1]);
                btn.addEventListener("afterdrag", function(e){
                    btn.destroy(true, true);
                    originalButton.setValue(false);
                    _self.$stopDrag(e.htmlEvent);
                    
                    btn.removeEventListener("afterdrag", arguments.callee);
                });
                
                //document instead?
                var clientX = e.htmlEvent.clientX;
                var clientY = e.htmlEvent.clientY;
                setTimeout(function(){
                    btn.$dragStart({clientX:clientX,clientY:clientY});
                    btn.$ext.style.zIndex = 1000000;
                    this.removeEventListener("mouseover", arguments.callee);
                });
                
                _self.$startDrag(btn, this);
                
                return false;
            });
        
            page.$dockbutton = button;
            button.$dockpage = page;
        
            var pData = findParentState(options);
            if (pData && pData != section.$dockData)
                pData.buttons.remove(options);
                
                button.$dockData = options;
                button.$dockData.cache = button;
            
            var buttons = section.$dockData.buttons;
            if (buttons.indexOf(button.$dockData) == -1)
                buttons.insertIndex(button.$dockData, 
                  before ? buttons.indexOf(before.$dockData) : buttons.length);
        }
        
        registerLookup.call(this, button);
        
        if (options) {
            //button.hidden = options.hidden !== false;
            
            if (options.showMenu && !options.active) //Cleanup - covering up an error somewhere /me lazy
                options.showMenu = false;
            else if (options.showMenu) {
                if (options.active) {
                    submenu.firstChild && submenu.firstChild.set 
                      && submenu.firstChild.set(page);
                }
                
                button.showMenu();
            }
            else if (options.active) {
                //Set proper event to delay rendering
                if (apf.window.vManager.check(page.parentNode, "page", function(){
                    if (!page.parentNode.activepage)
                        page.parentNode.set(page);
                }) && !page.parentNode.activepage)
                    page.parentNode.set(page);
            }
        }
        
        return button;
    };
}).call(DockableLayout.prototype);

});/**
 * Native drag 'n drop upload for Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 */

define(function(require, exports, module) {

var ide  = require("core/ide");
var ext  = require("core/ext");
var util = require("core/util");
var fs   = require("ext/filesystem/filesystem");

var MAX_UPLOAD_SIZE = 52428800;
var MAX_OPENFILE_SIZE = 2097152;
var MAX_CONCURRENT_FILES = 10;

module.exports = ext.register("ext/dragdrop/dragdrop", {
    dev         : "Ajax.org",
    name        : "Dragdrop",
    alone       : true,
    type        : ext.GENERAL,
    
    nodes: [],
        
    init: function() {
        var _self  = this;

        var dropbox = document.createElement("div");
        apf.setStyleClass(dropbox, "draganddrop");
        
        var label = document.createElement("span");
        label.textContent = "Drop files here to upload";
        dropbox.appendChild(label);
        
        function decorateNode(holder) {
            dropbox = holder.dropbox = dropbox.cloneNode(true);
            holder.appendChild(dropbox);
            
            holder.addEventListener("dragenter", dragEnter, false);
            dropbox.addEventListener("dragleave", dragLeave, false);
            dropbox.addEventListener("drop", dragDrop, false);
            
            ["dragexit", "dragover"].forEach(function(e) {
                dropbox.addEventListener(e, noopHandler, false);
            });
        }
        
        ide.addEventListener("init.ext/editors/editors", function(){
            _self.nodes.push(tabEditors.$ext);
            decorateNode(tabEditors.$ext);
        });
        
        ide.addEventListener("init.ext/tree/tree", function(){
            _self.nodes.push(trFiles.$ext);
            decorateNode(trFiles.$ext);
        });
        
        this.dragStateEvent = {"dragenter": dragEnter};
        
        function dragLeave(e) {
            apf.stopEvent(e);
            apf.setStyleClass(this, null, ["over"]);
        }
        
        function dragEnter(e) {
            apf.stopEvent(e);
            apf.setStyleClass(this.dropbox, "over");
        }
        
        function dragDrop(e) {
            dragLeave.call(this, e);
            return _self.onBeforeDrop(e);
        }
        
        function noopHandler(e) {
            apf.stopEvent(e);
        }
        
        this.StatusBar = {
            $init: function() {
                if (!sbMain)
                    return;
                
                sbMain.firstChild.appendChild(
                    new apf.progressbar({
                        id: "pbMain",
                        anchors: "0 0 0 5",
                        //autohide: true
                    })
                );
            },
            start: function() {
                if (!sbMain.visible)
                    sbMain.show();
            },
            end: function() {
                sbMain.hide();
                
                if (sbMain.childNodes)
                    sbMain.childNodes[0].setAttribute("caption", "");
            },
            upload: function(file) {
                if (sbMain.childNodes) {
                    var caption = "Uploading file " + (file.name || "") + "(" + (file.type || "") + ")";
                    sbMain.childNodes[0].setAttribute("caption", caption);
                }
                pbMain.clear();
                pbMain.start();
                
            },
            progress: function(value) {
                pbMain.setValue(value);
            }
        };
            
        this.StatusBar.$init();
        
        apf.addEventListener("http.uploadprogress", this.onProgress.bind(this));
    },
    
    onBeforeDrop: function(e) {
        // @see Please, go to line 176 for clarification.
        if (!(window.File && window.FileReader/* && window.FormData*/)) {
            util.alert(
                "Could not upload file(s)", "An error occurred while dropping this file(s)",
                "Your browser does not offer support for drag and drop for file uploads. " +
                "Please try with a recent version of Chrome or Firefox browsers."
            );
            return false;
        }
        /** Check the number of dropped files exceeds the limit */
        if (e.dataTransfer.files.length > MAX_CONCURRENT_FILES) {
            util.alert(
                "Could not upload file(s)", "An error occurred while dropping this file(s)",
                "You can only drop " + MAX_CONCURRENT_FILES + " files to upload at the same time. " + 
                "Please try again with " + MAX_CONCURRENT_FILES + " or a lesser number of files."
            );
            return false;
        }
        /** Check total filesize of dropped files */
        for (var size = 0, i = 0, l = e.dataTransfer.files.length; i < l; ++i)
            size += e.dataTransfer.files[i].size;

        if (size > MAX_UPLOAD_SIZE) {
            util.alert(
                "Could not save document", "An error occurred while saving this document",
                "The file(s) you dropped exceeds the maximum of 50MB and could therefore not be uploaded."
            );
            return false;
        }
        
        if (e.dataTransfer.files.length < 1)
            return false;
        
        this.onDrop(e);
        
        return true;
    },
    
    onDrop: function(e) {
        var _self = this;
        var dt = e.dataTransfer;
        var files = dt.files;
        
        apf.asyncForEach(files, function(file, next) {
            _self.StatusBar.start();
            /** Chrome, Firefox */
            if (apf.hasFileApi) {
                /** Processing ... */
                var reader = new FileReader();
                /** Init the reader event handlers */
                reader.onloadend = _self.onLoad.bind(_self, file, next);
                /** Begin the read operation */
                reader.readAsBinaryString(file);
            }
            else {
                /** Safari >= 5.0.2 and Safari < 6.0 */
                _self.onLoad(file, next, _self.getFormData(file));
                /**
                 * @fixme Safari for Mac is buggy when sending XHR using FormData
                 * Problem in their source code causing sometimes `WebKitFormBoundary`
                 * to be added to the request body, making it imposible to construct
                 * a multipart message manually and to construct headers.
                 * 
                 * @see http://www.google.es/url?sa=t&source=web&cd=2&ved=0CCgQFjAB&url=https%3A%2F%2Fdiscussions.apple.com%2Fthread%2F2412523%3Fstart%3D0%26tstart%3D0&ei=GFWITr2BM4SEOt7doNUB&usg=AFQjCNF6WSGeTkrpaqioUyEswi9K2xhZ8g
                 * @todo For safari 6.0 seems like FileReader will be present
                 */
            }
        }, this.StatusBar.end);
    },
    
    onLoad: function(file, next, e) {
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder");
            
        if (node.getAttribute("type") != "folder" && node.tagName != "folder")
            node = node.parentNode;
            
        var path     = node.getAttribute("path");
        var filename = file.name;
        var index    = 0;
        var _self    = this;

        function check(exists) {
            if (exists) {
                filename = file.name + "." + index++;
                fs.exists(path + "/" + filename, check);
            } else
                upload();
        }
        
        function upload() {
            var data = e instanceof FormData ? e : e.target.result;
            var oBinary = {
                filename: file.name,
                filesize: file.size,
                blob: file
            };
            /*if (data instanceof FormData) {
                oBinary.filedataname = file.name;
                oBinary.multipart = true;
            }*/
            
            fs.webdav.write(path + "/" + file.name, data, false, oBinary, complete);
            _self.StatusBar.upload(file);
        }
        
        function complete(data, state, extra) {
            if (state != apf.SUCCESS) {
                return util.alert(
                    "Could not save document",
                    "An error occurred while saving this document",
                    "Please see if your internet connection is available and try again. "
                        + (state == apf.TIMEOUT
                            ? "The connection timed out."
                            : "The error reported was " + extra.message),
                    next);
            }
            
            /** Request successful */
            fs.webdav.exec("readdir", [path], function(data) {
                if (data instanceof Error) {
                    // @todo: in case of error, show nice alert dialog.
                    return next();
                }
                
                var strXml = data.match(new RegExp(("(<file path='" + path +
                    "/" + filename + "'.*?>)").replace(/\//g, "\\/")));
                
                if(!strXml)
                    next();
                    
                strXml = strXml[1]
                var oXml = apf.xmldb.appendChild(node, apf.getXml(strXml));

                trFiles.select(oXml);
                if (file.size < MAX_OPENFILE_SIZE)
                    ide.dispatchEvent("openfile", {doc: ide.createDocument(oXml)});
                
                next();
            });
        }
        
        /** Check if path already exists, otherwise continue with upload() */
        fs.exists(path + "/" + file.name, check);
    },
    
    onProgress: function(o) {
        var e = o.extra;
        var total = (e.loaded / e.total) * 100;
        this.StatusBar.progress(total.toFixed());
    },
    
    getFormData: function(file) {
        var form = new FormData();
        form.append("upload", file);
        
        return form;
    },
    
    enable: function() {
        var _self = this;
        this.nodes.each(function(item) {
            for (var e in _self.dragStateEvent)
                item.addEventListener(e, _self.dragStateEvent[e], false);
        });
        apf.addEventListener("http.uploadprogress", this.onProgress);
    },
    
    disable: function() {
        var _self = this;
        this.nodes.each(function(item) {
            for (var e in _self.dragStateEvent)
                item.removeEventListener(e, _self.dragStateEvent[e], false);
        });
        apf.removeEventListener("http.uploadprogress", this.onProgress);
    },
    
    destroy: function() {
        var _self = this;
        this.nodes.each(function(item){
            item.removeChild(item.dropbox);
            for (var e in _self.dragStateEvent)
                item.removeEventListener(e, _self.dragStateEvent[e], false);
        });
        this.nodes = [];
        apf.removeEventListener("http.uploadprogress", this.onProgress);
    }
});

});/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/editors/editors", {
    name    : "Editors",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],

    fileExtensions  : {},

    register : function(oExtension){
        /*var id = "rb" + oExtension.path.replace(/\//g, "_");

        oExtension.$rbEditor = barButtons.appendChild(new apf.radiobutton({
            id        : id,
            label     : oExtension.name,
            value     : oExtension.path,
            margin    : "0 -1 0 0",
            visible   : "{require('ext/editors/editors').isEditorAvailable(tabEditors.activepage, '" + oExtension.path + "')}",
            onclick   : function(){
                require('ext/editors/editors').switchEditor(this.value);
            }
        }));*/

        //Add a menu item to the list of editors
        oExtension.$itmEditor = mnuEditors.appendChild(new apf.item({
            type     : "radio",
            caption  : oExtension.name,
            value    : oExtension.path,
            disabled : "{!require('ext/editors/editors').isEditorAvailable(tabEditors.activepage, '" 
                + oExtension.path + "')}",
            onclick  : function(){
                require('ext/editors/editors').switchEditor(this.value);
            }
        }));

        var _self = this;
        oExtension.fileExtensions.each(function(mime){
            (_self.fileExtensions[mime] || (_self.fileExtensions[mime] = [])).push(oExtension);
        });

        if (!this.fileExtensions["default"] || (oExtension.name && oExtension.name == "Code Editor"))
            this.fileExtensions["default"] = oExtension;
    },

    unregister : function(oExtension){
        //oExtension.$rbEditor.destroy(true, true);
        oExtension.$itmEditor.destroy(true, true);

        var _self = this;
        oExtension.fileExtensions.each(function(fe){
            _self.fileExtensions[fe].remove(oExtension);
            if (!_self.fileExtensions[fe].length)
                delete _self.fileExtensions[fe];
        });

        if (this.fileExtensions["default"] == oExtension) {
            delete this.fileExtensions["default"];

            for (var prop in this.fileExtensions) {
                this.fileExtensions["default"] = this.fileExtensions[prop][0];
                break;
            }
        }
    },

    addTabSection : function(){
        var _self = this;
        var vbox = this.hbox.appendChild(
            new apf.bar({id:"tabPlaceholder", flex:1, skin:"basic"})
        );

        var btn;
        var tab = new apf.bar({
            skin     : "basic",
            style    : "padding : 0 0 32px 0;position:absolute;", //53px
            //htmlNode : document.body,
            childNodes: [
                new apf.tab({
                    id      : "tabEditors",
                    skin    : "editor_tab",
                    style   : "height : 100%",
                    buttons : "close,scale,order",
                    overactivetab  : true,
                    onfocus        : function(e){
                        _self.switchfocus(e);
                    },
                    onbeforeswitch : function(e){
                        _self.beforeswitch(e);
                    },
                    onafterswitch : function(e){
                        _self.afterswitch(e);
                    },
                    onclose : function(e){
                        if (!ide.onLine && !ide.offlineFileSystemSupport) //For now prevent tabs from being closed
                            return false;

                        _self.close(e.page);
                    },
                    childNodes : [
                        btn = new apf.button({
                            id : "plus_tab_button",
                            style : "display:inline-block;margin: 0 0 5px 13px;",
                            right : 5,
                            top   : 8,
                            width : 30,
                            height : 17,
                            skin : "btn_icon_only",
                            background : "plustabbtn.png|horizontal|3|30",
                            onclick : function(){
                                require("ext/newresource/newresource").newfile();
                            }
                        })
                    ]
                }),
                new apf.button({
                    top   : 8,
                    left  : 5,
                    width : 17,
                    height : 17,
                    submenu : "mnuTabs",
                    skin : "btn_icon_only",
                    "class" : "tabmenubtn",
                    background : "tabdropdown.png|horizontal|3|17"
                }) /*,
                new apf.hbox({
                    id      : "barButtons",
                    edge    : "0 0 0 6",
                    "class" : "relative",
                    zindex  : "1000",
                    bottom  : "0",
                    left    : "0",
                    right   : "0"
                })*/
            ]
        });
        
        apf.document.body.appendChild(tab);

        tabEditors.$buttons.appendChild(btn.$ext);
        tabEditors.addEventListener("DOMNodeInserted",function(e){
            if (e.$isMoveWithinParent) {
                //record position in settings

                var amlNode = e.currentTarget;
                if (amlNode.localName != "page" || e.relatedNode != this || amlNode.nodeType != 1)
                    return;

                settings.save();
            }

            if (e.relatedNode == this && e.currentTarget.localName == "page") {
                tabEditors.appendChild(btn);
                tabEditors.$buttons.appendChild(btn.$ext);
                btn.$ext.style.position = "";
                btn.$ext.style.right = "";
                btn.$ext.style.top = "";
            }
        });

        tabEditors.addEventListener("DOMNodeRemoved",function(e){
            if (e.relatedNode == this && this.getPages().length == 1) {
                btn.$ext.style.position = "absolute";
                btn.$ext.style.right = "5px";
                btn.$ext.style.top = "8px";
            }
        });

        tabPlaceholder.addEventListener("resize", this.$tabPlaceholderResize = function(e){
            _self.setTabResizeValues(tab.$ext);
        });

        return vbox;
    },

    /**
     * This method has been abstracted so it can be used by
     * the focus extension to get the destination coordinates and
     * dimensions of tabEditors.parentNode when the editor goes
     * out of focus mode
     */
    setTabResizeValues : function(ext) {
        var ph;
        var pos = apf.getAbsolutePosition(ph = tabPlaceholder.$ext);
        ext.style.left = (pos[0] - 2) + "px";
        ext.style.top = pos[1] + "px";
        var d = apf.getDiff(ext);
        // + (hboxDockPanel.getWidth() && apf.isGecko ? 2 : 0)
        ext.style.width = (ph.offsetWidth + 2 - d[0]) + "px";
        ext.style.height = (ph.offsetHeight - d[1]) + "px";
    },

    /**
     * Disable the resize event when the editors are in focus mode
     */
    disableTabResizeEvent : function() {
        tabPlaceholder.removeEventListener("resize", this.$tabPlaceholderResize);
    },

    /**
     * Enable the resize event when the editors come back to non-focus mode
     */
    enableTabResizeEvent : function() {
        tabPlaceholder.addEventListener("resize", this.$tabPlaceholderResize);
    },

    isEditorAvailable : function(page, path){
        var editor = ext.extLut[path];
        if (!editor)
            return false;

        var fileExtensions = editor.fileExtensions;
        var fileExtension = (tabEditors.getPage(page).$model.queryValue("@path") || "").split(".").pop();
        var isEnabled = fileExtensions.indexOf(fileExtension) > -1;
        
        if (!isEnabled && this.fileExtensions["default"] == editor)
            return true; 
        else
            return isEnabled;
    },

    initEditor : function(editor){
        //Create Page Element
        var editorPage = new apf.page({
            id        : editor.path,
            mimeTypes : editor.fileExtensions,
            visible   : false,
            realtime  : false
        });
        tabEditors.appendChild(editorPage);

        //Initialize Content of the page
        ext.initExtension(editor, editorPage);

        return editorPage;
    },

    switchEditor : function(path){
        var page = tabEditors.getPage();
        if (!page || page.type == path)
            return;

        var lastType = page.type;
        
        var info;
        if ((info = page.$doc.dispatchEvent("validate", info)) !== true) {
            util.alert(
                "Could not switch editor",
                "Could not switch editor because this document is invalid.",
                "Please fix the error and try again:" + info
            );
            return;
        }

        var editor = ext.extLut[path];
        if (!editor.inited)
            this.initEditor(editor);

        editor.$itmEditor.select();
        //editor.$rbEditor.select();

        page.setAttribute("type", path);
        
        page.$editor = editor;
        this.currentEditor = editor;

        this.beforeswitch({nextPage: page});
        this.afterswitch({nextPage: page, previousPage: {type: lastType}});
    },

    openEditor : function(doc, init, active) {
        var xmlNode  = doc.getNode();
        var filepath = xmlNode.getAttribute("path");

        var page = tabEditors.getPage(filepath);
        if (page) {
            tabEditors.set(page);
            return;
        }

        var fileExtension = (xmlNode.getAttribute("path") || "").split(".").pop();
        var editor = this.fileExtensions[fileExtension] 
          && this.fileExtensions[fileExtension][0] 
          || this.fileExtensions["default"];

        if (!init && this.currentEditor)
            this.currentEditor.disable();

        if (!editor) {
            util.alert(
                "No editor is registered",
                "Could not find an editor to display content",
                "There is something wrong with the configuration of your IDE. No editor plugin is found.");
            return;
        }

        if (!editor.inited)
            this.initEditor(editor);

        //Create Fake Page
        if (init)
            tabEditors.setAttribute("buttons", "close");

        var model = new apf.model();
        var fake = tabEditors.add("{([@changed] == 1 ? '*' : '') + [@name]}", filepath, editor.path, null, function(page){
            page.$at     = new apf.actiontracker();
            page.$doc    = doc;
            doc.$page    = page;
            page.$editor = editor;
            page.setAttribute("tooltip", "[@path]");
            page.setAttribute("class",
                "{parseInt([@saving], 10) || parseInt([@lookup], 10) ? (tabEditors.getPage(tabEditors.activepage) == this ? 'saving_active' : 'saving') : \
                ([@loading] ? (tabEditors.getPage(tabEditors.activepage) == this ? 'loading_active' : 'loading') : '')}"
            );
            page.setAttribute("model", page.$model = model);
            page.$model.load(xmlNode);
        });

        if (init)
            tabEditors.setAttribute("buttons", "close,scale,order");

        doc.addEventListener("setnode", function(e) {
            fake.$model.load(e.node);
            ide.dispatchEvent("afteropenfile", {doc: doc, node: e.node, editor: editor});
        });

        this.initEditorEvents(fake, model);

        if (init && !active)
            return;

        //Set active page
        tabEditors.set(filepath);

        //if (editorPage.model != model)
            //this.beforeswitch({nextPage: fake});

        //Open tab, set as active and wait until opened
        /*fake.addEventListener("afteropen", function(){

        });*/

        editor.enable();
        editor.$itmEditor.select();
        //editor.$rbEditor.select();

        this.currentEditor = editor;

        // okay don't know if you would want this, but this is the way the 'open file' dialog
        // handles it so let's do that
        setTimeout(function () {
            if (typeof ceEditor !== "undefined")
                ceEditor.focus();
        }, 100);

        settings.save();
    },

    initEditorEvents: function(fake, model) {
        fake.$at.addEventListener("afterchange", function(e) {
            if (e.action == "reset") {
                delete this.undo_ptr;
                return;
            }

            var val;
            if (fake.$at.ignoreChange) {
                val = undefined;
                fake.$at.ignoreChange = false;
            }
            else if(this.undolength === 0 && !this.undo_ptr) {
                val = undefined;
            }
            else {
                val = (this.$undostack[this.$undostack.length - 1] !== this.undo_ptr)
                    ? 1
                    : undefined;
            }

            if (fake.changed !== val) {
                fake.changed = val;
                model.setQueryValue("@changed", (val ? "1" : "0"));
                
                var node = fake.$doc.getNode();
                ide.dispatchEvent("updatefile", {
                    changed : val ? 1 : 0,
                    xmlNode : node
                });
            }
        });
    },

    close : function(page) {
        page.addEventListener("afterclose", this.$close);
    },

    $close : function() {
        var page = this;
        var at   = page.$at;
        var mdl  = page.$model;

        mdl.setQueryValue("@changed", 0);
        page.$doc.dispatchEvent("close");

        if (mdl.data) {
            mdl.removeXml("data");
            ide.dispatchEvent("closefile", {xmlNode: mdl.data, page: page});
        }

        //mdl.unshare();
        mdl.destroy();

        at.reset();
        at.destroy();

        //If there are no more pages left, reset location
        if (!tabEditors.getPage()) {
            /*if (window.history.pushState) {
                var p = location.pathname.split("/");
                window.history.pushState(path, path, "/" + (p[1] || "") + "/" + (p[2] || ""));
            }
            else {
                apf.history.setHash("");
            }*/
            apf.history.setHash("");
        }

        //Destroy the app page if it has no application instance
        //if (!tabEditors.selectNodes("page[@type='" + page.type + "']").length && editorPage)
            //editorPage.destroy(true, true);

        settings.save();
    },

    switchfocus : function(e){

    },

    beforeswitch : function(e) {
        var page       = e.nextPage,
            editorPage = tabEditors.getPage(page.type);
        if (!editorPage) return;

        // fire this event BEFORE editor sessions are swapped.
        ide.dispatchEvent("beforeeditorswitch", {
            previousPage: e.previousPage,
            nextPage: e.nextPage
        });

        if (editorPage.model != page.$model)
            editorPage.setAttribute("model", page.$model);
        if (editorPage.actiontracker != page.$at)
            editorPage.setAttribute("actiontracker", page.$at);

        if (page.$editor && page.$editor.setDocument) {
            page.$editor.setDocument(page.$doc, page.$at);
        }

        ide.dispatchEvent("editorswitch", {
            previousPage: e.previousPage,
            nextPage: e.nextPage
        });
    },

    afterswitch : function(e) {
        var page = e.nextPage;
        var fromHandler, toHandler = ext.extLut[page.type];

        if (e.previousPage && e.previousPage != e.nextPage)
            fromHandler = ext.extLut[e.previousPage.type];

        if (fromHandler != toHandler) {
            if (fromHandler)
                fromHandler.disable();
            toHandler.enable();
        }
        
        var path = page.$model.data.getAttribute("path").replace(/^\/workspace/, "");
        /*if (window.history.pushState) {
            var p = location.pathname.split("/");
            window.history.pushState(path, path, "/" + (p[1] || "name") + "/" + (p[2] || "project") + path);
        }
        else {
            apf.history.setHash("!" + path);
        }*/
        apf.history.setHash("!" + path);
        
        toHandler.$itmEditor.select();
        
        var fileExtension = (path || "").split(".").pop();
        var editor = this.fileExtensions[fileExtension] 
          && this.fileExtensions[fileExtension][0] 
          || this.fileExtensions["default"];

        if (!editor) {
            util.alert(
                "No editor is registered",
                "Could not find an editor to display content",
                "There is something wrong with the configuration of your IDE. No editor plugin is found.");
            return;
        }

        if (!editor.inited)
            this.initEditor(editor);
        
        this.currentEditor = editor;
        editor.ceEditor.focus();

        //toHandler.$rbEditor.select();

        /*if (self.TESTING) {}
            //do nothing
        else if (page.appid)
            app.navigateTo(page.appid + "/" + page.id);
        else if (!page.id)
            app.navigateTo(app.loc || (app.loc = "myhome"));*/
    },

    /**** Init ****/

    init : function(){
        var _self = this;
        
        window.onpopstate = function(e){
            var page = "/workspace" + e.state;
            if (tabEditors.activepage != page && tabEditors.getPage(page))
                tabEditors.set(page);
        };

        apf.addEventListener("hashchange", function(e){
            var page = "/workspace" + e.page;
            if (tabEditors.activepage != page && tabEditors.getPage(page))
                tabEditors.set(page);
        });
        
        apf.document.body.appendChild(new apf.menu({
            id : "mnuEditors"
        }));
        
        mnuView.insertBefore(new apf.item({
            caption : "Editor",
            submenu : "mnuEditors"
        }), mnuView.firstChild);
        
        ext.addType("Editor", function(oExtension){
            _self.register(oExtension);
          }, function(oExtension){
            _self.unregister(oExtension);
          });

        ide.addEventListener("openfile", function(e){
            _self.openEditor(e.doc, e.init, e.active);
        });

        ide.addEventListener("filenotfound", function(e) {
            var page = tabEditors.getPage(e.path);
            if (page)
                tabEditors.remove(page);
        });

        var vbox  = colMiddle;
        this.hbox = vbox.appendChild(new apf.hbox({flex : 1, padding : 5, splitters : true}));
        //this.splitter = vbox.appendChild(new apf.splitter());
        this.nodes.push(this.addTabSection());

        this.panel = this.hbox;

        /**** Support for state preservation ****/

        this.$settings = {};
        ide.addEventListener("loadsettings", function(e){
            if (!e.model.queryNode("auto/files"));
                apf.createNodeFromXpath(e.model.data, "auto/files");
            
            function checkExpand(path, doc) {
                ide.addEventListener("init.ext/tree/tree", function(){
                    var parent_path = apf.getDirname(path).replace(/\/$/, "");
                    var expandEventListener = function(e) {
                        if (e.xmlNode && e.xmlNode.getAttribute("path") == parent_path) {
                            // if the file has been loaded from the tree
                            if (doc.getNode().getAttribute("newfile") != 1) {
                                // databind the node from the tree to the document
                                doc.setNode(e.xmlNode.selectSingleNode("node()[@path='" + path + "']"));
                            }
                            else {
                                // if not? then keep it this way, but invoke setNode() anyway because
                                // it triggers events
                                doc.setNode(doc.getNode());
                            }
                            trFiles.removeEventListener("expand", expandEventListener);
                        }
                    };
    
                    trFiles.addEventListener("expand", expandEventListener);
                });
            }

            var model = e.model;
            ide.addEventListener("extload", function(){
                // you can load a file from the hash tag, if that succeeded then return
                var loadFileFromHash =  (_self.loadFileFromHash(window.location.hash, checkExpand));
                if (loadFileFromHash) {
                    window.location.hash = loadFileFromHash; // update hash
                    return;
                }

                // otherwise, restore state from the .config file
                var active = model.queryValue("auto/files/@active");
                var nodes  = model.queryNodes("auto/files/file");

                for (var i = 0, l = nodes.length; i < l; i++) {
                    var node  = nodes[i];
                    var state = node.getAttribute("state");
                    var doc   = ide.createDocument(node);

                    try {
                        if (state)
                            doc.state = JSON.parse(state);
                    }
                    catch (ex) {}

                    // node.firstChild is not always present (why?)
                    if ((node.getAttribute("changed") == 1) && node.firstChild) {
                        doc.cachedValue = node.firstChild.nodeValue
                            .replace(/\n]\n]/g, "]]")
                            .replace(/\\r/g, "\r")
                            .replace(/\\n/g, "\n");
                    }

                    ide.dispatchEvent("openfile", {
                        doc    : doc,
                        init   : true,
                        active : active
                            ? active == node.getAttribute("path")
                            : i == l - 1
                    });

                    checkExpand(node.getAttribute("path"), doc);
                }
            });
        });

        ide.addEventListener("savesettings", function(e){
            if (!e.model.data)
                return;

            var pNode   = e.model.data.selectSingleNode("auto/files");
            var state   = pNode && pNode.xml;
            var pages   = tabEditors.getPages();

            if (pNode) {
                pNode.parentNode.removeChild(pNode);
                pNode = null;
            }

            if (pages.length) {
                var active = tabEditors.activepage;
                e.model.setQueryValue("auto/files/@active", active);

                pNode = apf.createNodeFromXpath(e.model.data, "auto/files");
                for (var i = 0, l = pages.length; i < l; i++) {
                    if(!pages[i] || !pages[i].$model)
                        continue;
                        
                    var file = pages[i].$model.data;
                    if (!file || file.getAttribute("debug"))
                        continue;

                    var copy = apf.xmldb.cleanNode(file.cloneNode(false));
                    //copy.removeAttribute("changed");
                    copy.removeAttribute("loading");
                    copy.removeAttribute("saving");
                    pNode.appendChild(copy);

                    var state = pages[i].$editor.getState && pages[i].$editor.getState(pages[i].$doc);
                    if (state)
                        copy.setAttribute("state", apf.serialize(state));

                    //@todo the second part of this if can be removed as soon
                    //as the collab team implements stored changed settings
                    //please note that for this to work on loadsettings we
                    //should check whether the file on disk has changed and
                    //popup a file watch dialog to ask if the user wants to
                    //load the new file from disk, losing changes.
                    if (copy.getAttribute("changed") == 1 && copy.getAttribute("newfile") == 1) {
                        copy.appendChild(copy.ownerDocument.createCDATASection(
                            pages[i].$doc.getValue()
                                .replace(/\r/g, "\\r")
                                .replace(/\n/g, "\\n")
                                .replace(/\]\]/g, "\n]\n]")
                        ));
                    }
                }
            }

            if (state != (pNode && pNode.xml))
                return true;
        });

        ide.addEventListener("reload", function(e) {
            var doc = e.doc;
            doc.state = doc.$page.$editor.getState && doc.$page.$editor.getState(doc);
        });

        ide.addEventListener("afterreload", function(e) {
            var doc         = e.doc,
                acesession  = doc.acesession,
                sel         = acesession.getSelection();

            sel.selectAll();
            acesession.getUndoManager().ignoreChange = true;
            acesession.replace(sel.getRange(), e.data);
            sel.clearSelection();

            if (doc.state) {
                var editor = doc.$page.$editor;
                editor.setState && editor.setState(doc, doc.state);
            }
        });
    },

    /** Load any file from the hash, with optional some lines selected
     *
     * @param {string} hash Hash as obtained from the window element
     * @param {function} checkExpand Function that expands the tree for the given file
     * @return {string} The new hash
     */
    loadFileFromHash : function (hash, checkExpand) {
        // an initial state can be sent in the hash
        // match 'openfile-',
        // match any character except :& or end of file
        // optional: match : digit - digit
        // [1] is filename, [2] is starting line number, [3] is ending line number
        var editorInitialStatePattern = /openfile-(.[^:&$]*)(?:\:(\d+)-(\d+))?/;
        var rawState = hash.match(editorInitialStatePattern);

        if (rawState) {
            // build the real path, as the one in the hash is relative
            var path = ide.davPrefix.replace(/\/$/, "") + "/" + rawState[1];
            var doc = ide.createDocument(this.createFileNodeFromPath(path));

            // if selection information was added, add that to the state
            if (rawState[2] && rawState[3]) {
                doc.state = {
                    scrollleft: 0, scrolltop: 0,
                    selection: {
                        start: { row: parseInt(rawState[2] || 0, 10) - 1, column: 0 },
                        end: { row: parseInt(rawState[3] || 0, 10), column: 0 } // plus 1 to capture whole previous line
                    }
                };
            }

            // send it to the dispatcher
            ide.dispatchEvent("openfile", {
                doc: doc,
                active: true
            });
            // and expand the tree
            checkExpand(path, doc);

            // return the new hash
            return hash.replace(editorInitialStatePattern, "");
        }

        return null;
    },

    createFileNodeFromPath : function (path) {
        var name = path.split("/").pop();
        var node = apf.n("<file />")
            .attr("name", name)
            .attr("contenttype", util.getContentType(name))
            .attr("path", path)
            .node();
        return node;
    },

    showFile : function(path, row, column, text, state) {
        var node = this.createFileNodeFromPath(path);

        this.jump(node, row, column, text);
    },

    jump : function(fileEl, row, column, text, doc, page) {
        var path    = fileEl.getAttribute("path");
        var hasData = page && (tabEditors.getPage(path) || { }).$doc ? true : false;

        if (row !== undefined) {
            var jumpTo = function(){
                setTimeout(function() {
                    // TODO move this to the editor
                    ceEditor.$editor.gotoLine(row, column);
                    if (text)
                        ceEditor.$editor.find(text);
                    ceEditor.focus();
                }, 100);
            };

            if (hasData) {
                tabEditors.set(path);
                jumpTo();
            }
            else
                ide.addEventListener("afteropenfile", function(e) {
                    var node = e.doc.getNode();

                    if (node.getAttribute("path") == path) {
                        ide.removeEventListener("afteropenfile", arguments.callee);
                        jumpTo();
                    }
                });
        }

        if (!hasData)
            ide.dispatchEvent("openfile", {
                doc: doc || ide.createDocument(fileEl)
            });
        else
            tabEditors.set(path);
    },

    enable : function(){
        this.hbox.show();
        //this.splitter.show();
    },

    disable : function(){
        this.hbox.hide();
        //this.splitter.hide();
    },

    destroy : function(){
        this.hbox.destroy(true, true);
        //this.splitter.destroy(true, true);
    }
});

});
/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
 define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var markup = require("text!ext/extmgr/extmgr.xml");
var panels = require("ext/panels/panels");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/extmgr/extmgr", {
    name   : "Extension Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    markup : markup,
    desp   : [panels],
    
    nodes : [],
    
    hook : function(){
        var _self = this;
        var reloadDgExt = true;
        this.nodes.push(
            mnuWindows.insertBefore(new apf.divider(), mnuWindows.firstChild),

            mnuWindows.insertBefore(new apf.item({
                caption : "Extension Manager...",
                onclick : function(){
                    ext.initExtension(_self);
                    winExt.show();

                    // Hackity hackathon
                    // @TODO the problem is apparently that APF does not
                    // like to show the datagrid records when two datagrids are
                    // bound to the same model && that one of the xpath selectors
                    // used to filter the model, has no results
                    setTimeout(function() {
                        if (reloadDgExt) {
                            dgExt.reload();
                            reloadDgExt = false;
                        }
                    });
                }
            }), mnuWindows.firstChild)
        );

        // Load up extensions the user added manually
        ide.addEventListener("loadsettings", function(e){
            ide.addEventListener("extload", function(){
                var nodes = e.model.queryNodes("auto/extensions/plugin");
                for (var n = 0; n < nodes.length; n++)
                    _self.loadExtension(nodes[n].getAttribute("path"));
            });
        });

        // Save the manually-loaded extensions
        ide.addEventListener("savesettings", function(e){
            var eNode = e.model.data.selectSingleNode("auto/extensions");
            if (eNode) {
                eNode.parentNode.removeChild(eNode);
                eNode = null;
            }

            eNode = apf.createNodeFromXpath(e.model.data, "auto/extensions");
            var userExtensions = mdlExt.queryNodes("plugin[@userext='1']");
            for (var u = 0; u < userExtensions.length; u++) {
                var copy = apf.xmldb.cleanNode(userExtensions[u].cloneNode(false));
                eNode.appendChild(copy);
            }

            return true;
        });
    },

    init : function(amlNode){},

    loadExtension : function(path) {
        if (path || tbModuleName.validate()) {
            if (!path) {
                path = tbModuleName.value;
                tbModuleName.clear();
            }
            require([path], function() {
                var extNode = mdlExt.queryNode("plugin[@path='" + path + "']");
                if (extNode)
                    apf.xmldb.setAttribute(extNode, "userext", "1");
                settings.save();
            });
        } else {
            util.alert("Error", "Validation Error",
                "There was a problem validating your input: '" + 
                tbModuleName.value + "'");
        }
    },

    removeExtension : function() {
        var extPath = dgExtUser.selected.getAttribute("path");
        var extension = require(extPath);

        if(ext.unregister(extension)) {
            mdlExt.removeXml(mdlExt.queryNode("plugin[@path='" + extPath + "']"));
            settings.save();
        }
    },

    enableExt : function(path) {
        ext.enableExt(path);

        if (tabExtMgr.activepage === 0)
            btnUserExtEnable.setAttribute("caption", "Disable");
        else
            btnDefaultExtEnable.setAttribute("caption", "Disable");
    },

    disableExt : function(path) {
        ext.disableExt(path);

        if (tabExtMgr.activepage === 0)
            btnUserExtEnable.setAttribute("caption", "Enable");
        else
            btnDefaultExtEnable.setAttribute("caption", "Enable");
    },

    updateEnableBtnState : function() {
        if (tabExtMgr.activepage === 0) {
            if (dgExtUser.selected.getAttribute("enabled") === "1")
                btnUserExtEnable.setAttribute("caption", "Disable");
            else
                btnUserExtEnable.setAttribute("caption", "Enable");
        }
        else {
            if (dgExt.selected.getAttribute("enabled") === "1")
                btnDefaultExtEnable.setAttribute("caption", "Disable");
            else
                btnDefaultExtEnable.setAttribute("caption", "Enable");
        }
    },

    enable : function(){
        if (!this.disabled) return;
        
        this.nodes.each(function(item){
            item.enable();
        });
        this.disabled = false;
    },
    
    disable : function(){
        if (this.disabled) return;
        
        this.nodes.each(function(item){
            item.disable();
        });
        this.disabled = true;
    },
    
    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

    }
);/**
 * File System Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/filesystem/filesystem", {
    name   : "File System",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    deps   : [],
    commands: {
        "open": {
            "hint": "open a file to edit in a new tab",
            "commands": {
                "[PATH]": {"hint": "path pointing to a file. Autocomplete with [TAB]"}
            }
        },
        "c9": {
            "hint": "alias for 'open'",
            "commands": {
                "[PATH]": {"hint": "path pointing to a file. Autocomplete with [TAB]"}
            }
        }
    },

    readFile : function (path, callback){
        if (this.webdav)
            this.webdav.read(path, callback);
    },

    saveFile : function(path, data, callback) {
        if (!this.webdav)
            return;
        this.webdav.write(path, data, null, function(data, state, extra) {
            if ((state == apf.ERROR && extra.status == 400 && extra.retries < 3) || state == apf.TIMEOUT)
                return extra.tpModule.retry(extra.id);

            callback(data, state, extra);
        });
    },

    list : function(path, callback) {
        if (this.webdav)
            this.webdav.list(path, callback);
    },

    exists : function(path, callback) {
        if (this.webdav)
            this.webdav.exists(path, callback);
    },

    createFolder: function(name, tree) {
        if (!tree) {
            tree = apf.document.activeElement;
            if (!tree || tree.localName != "tree")
                tree = trFiles;
        }

        var node = tree.selected;
        if (!node && tree.xmlRoot)
            node = tree.xmlRoot.selectSingleNode("folder");
        if (!node)
            return;
        if (node.getAttribute("type") != "folder" && node.tagName != "folder")
            node = node.parentNode;

        if (this.webdav) {
            var prefix = name ? name : "New Folder";
            var path = node.getAttribute("path");
            if (!path) {
                path = ide.davPrefix;
                node.setAttribute("path", path);
            }

            var _self = this,
                index = 0;

            function test(exists) {
                if (exists) {
                    name = prefix + "." + index++;
                    _self.exists(path + "/" + name, test);
                } else {
                    tree.focus();
                    _self.webdav.exec("mkdir", [path, name], function(data) {
                        // @todo: in case of error, show nice alert dialog
                        if (data instanceof Error)
                            throw Error;

                        var strXml = data.match(new RegExp(("(<folder path='" + path
                                + "/" + name + "'.*?>)").replace(/\//g, "\\/")))[1];

                        tree.slideOpen(null, node, true, function(data, flag, extra){
                            var folder;
                            // empty data means it didn't trigger <insert> binding,
                            // therefore the node was expanded already
                            if (!data)
                                tree.add(apf.getXml(strXml), node);

                            folder = apf.queryNode(node, "folder[@path='"+ path +"/"+ name +"']");

                            tree.select(folder);
                            tree.startRename();
                        });
                    });
                }
            }

            name = prefix;
            this.exists(path + "/" + name, test);
        }
    },

    createFile: function(filename, newFile) {
        var node;

        if (!newFile) {
            node = trFiles.selected;
            if (!node)
                node = trFiles.xmlRoot.selectSingleNode("folder");
            if (node.getAttribute("type") != "folder" && node.tagName != "folder")
                node = node.parentNode;
        }
        else {
            node = apf.getXml('<file newfile="1" type="file" size="" changed="1" '
                + 'name="Untitled.txt" contenttype="text/plain; charset=utf-8" '
                + 'modifieddate="" creationdate="" lockable="false" hidden="false" '
                + 'executable="false"></file>');
        }

        if (this.webdav) {
            var prefix = filename ? filename : "Untitled";

            if(!newFile)
                trFiles.focus();

            var _self = this,
                path  = node.getAttribute("path");
            if (!path) {
                path = ide.davPrefix;
                node.setAttribute("path", path);
            }

            var index = 0;

            var test = function(exists) {
                if (exists) {
                    filename = prefix + "." + index++;
                    _self.exists(path + "/" + filename, test);
                }
                else {
                    if (!newFile) {
                        var file
                        var both = 0;
                        function done(){
                            if (both == 2) {
                                file = apf.xmldb.appendChild(node, file);
                                trFiles.select(file);
                                trFiles.startRename();
                                trFiles.slideOpen(null, node, true);
                            }
                        }

                        trFiles.slideOpen(null, node, true, function(){
                            both++;
                            done();
                        });

                        _self.webdav.exec("create", [path, filename], function(data) {
                            _self.webdav.exec("readdir", [path], function(data) {
                                if (data instanceof Error) {
                                    // @todo: should we display the error message in the Error object too?
                                    return util.alert("Error", "File '" + filename + "' could not be created",
                                        "An error occurred while creating a new file, please try again.");
                                }

                                var m = data.match(new RegExp(("(<file path='" + path +
                                    "/" + filename + "'.*?>)").replace(/\//g, "\\/")))
                                if (!m) {
                                    return util.alert("Error", "File '" + filename + "' could not be created",
                                        "An error occurred while creating a new file, please try again.");
                                }
                                file = apf.getXml(m[1]);

                                both++;
                                done();
                            });
                        });
                    }
                    else {
                        node.setAttribute("name", filename);
                        node.setAttribute("path", path + "/" + filename);
                        ide.dispatchEvent("openfile", {doc: ide.createDocument(node), type:"newfile"});
                    }
                }
            };

            filename = prefix;
            this.exists(path + "/" + filename, test);
        }
    },

    beforeStopRename : function(name) {
        // Returning false from this function will cancel the rename. We do this
        // when the name to which the file is to be renamed contains invalid
        // characters
        var match = name.match(/^(?:\w|[.])(?:\w|[.-])*$/);

        return match !== null && match[0] == name;
    },

    beforeRename : function(node, name, newPath, isCopyAction) {
        var path = node.getAttribute("path");
        var page = tabEditors.getPage(path);

        if (name)
            newPath = path.replace(/^(.*\/)[^\/]+$/, "$1" + name);
        else
            name = newPath.match(/[^\/]+$/);

        node.setAttribute("oldpath", node.getAttribute("path"));
        node.setAttribute("path", newPath);
        apf.xmldb.setAttribute(node, "name", name);

        // when this is a copy action, then we don't want this to happen
        if (page && !isCopyAction)
            page.setAttribute("id", newPath);

        var childNodes = node.childNodes;
        var length = childNodes.length;

        for (var i = 0; i < length; ++i) {
            var childNode = childNodes[i];
            if(!childNode || childNode.nodeType != 1)
                continue;

            // The 'name' variable is redeclared here for some fucked up reason.
            // The problem is that we are reusing that variable below. If the author
            // of this would be so kind to fix this code as soon as he sees this
            // comment, I would be eternally grateful. Sergi.
            var name = childNode.getAttribute("name");

            this.beforeRename(childNode, null, node.getAttribute("path") + "/" + name);
        }
        ide.dispatchEvent("updatefile", {
            path: path,
            newPath: newPath,
            filename: name && name.input,
            xmlNode: node
        });
    },

    beforeMove: function(parent, node, tree) {
        var path = node.getAttribute("path");
        var page = tabEditors.getPage(path);
        var newpath = parent.getAttribute("path") + "/" + node.getAttribute("name");

        node.setAttribute("path", newpath);
        if (page)
            page.setAttribute("id", newpath);

        var childNodes = node.childNodes;
        var length = childNodes.length;

        for (var i = 0; i < length; ++i) {
            this.beforeMove(node, childNodes[i]);
        }

        ide.dispatchEvent("updatefile", {
            path: path,
            xmlNode: node
        });

        return true;
    },

    remove: function(path) {
        var page = tabEditors.getPage(path);
        if (page)
            tabEditors.remove(page);

        davProject.remove(path, false, function() {});
    },

    /**** Init ****/

    init : function() {
        this.model = new apf.model();
        this.model.load("<data><folder type='folder' name='" + ide.projectName +
            "' path='" + ide.davPrefix + "' root='1'/></data>");

        this.model.setAttribute("whitespace", false);

        var processing = {};
        this.model.addEventListener("update", function(e){
            // Resort on move, copy, rename, add
            if (e.action === "attribute" || e.action === "add" || e.action === "move") {
                var xmlNode = e.xmlNode, pNode = xmlNode.parentNode;
                if (processing[xmlNode.getAttribute("a_id")]) {
                    return;
                }
                processing[xmlNode.getAttribute("a_id")] = true;

                var sort = new apf.Sort();
                sort.set({
                    xpath: "@name",
                    method: "filesort"
                });
                var nodes = sort.apply(pNode.childNodes);

                for (var i = 0, l = nodes.length; i < l; i++) {
                    if (nodes[i] == xmlNode) {
                        if (xmlNode.nextSibling != nodes[i+1]) {
                            apf.xmldb.appendChild(pNode, xmlNode, nodes[i+1]);
                        }
                        break;
                    }
                }
            }
        });

        var dav_url = location.href.replace(location.pathname + location.hash, "") + ide.davPrefix;
        this.webdav = new apf.webdav({
            id  : "davProject",
            url : dav_url,
            onauthfailure: function() {
                ide.dispatchEvent("authrequired");
            }
        });

        function openHandler(e) {
            ide.send({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "filesystem"
            });
            return false;
        }
        ide.addEventListener("consolecommand.open", openHandler);
        ide.addEventListener("consolecommand.c9",   openHandler);

        var fs = this;
        ide.addEventListener("openfile", function(e){
            var doc  = e.doc;
            var node = doc.getNode();
            var editor = e.doc.$page && e.doc.$page.$editor;

            apf.xmldb.setAttribute(node, "loading", "true");
            ide.addEventListener("afteropenfile", function(e) {
                if (e.node == node) {
                    apf.xmldb.removeAttribute(e.node, "loading");
                    ide.removeEventListener("afteropenfile", arguments.callee);
                }
            });

            if (doc.hasValue()) {
                ide.dispatchEvent("afteropenfile", {doc: doc, node: node, editor: editor});
                return;
            }

            // do we have a value in cache, then use that one
            if (doc.cachedValue) {
                doc.setValue(doc.cachedValue);
                delete doc.cachedValue;
                ide.dispatchEvent("afteropenfile", {doc: doc, node: node, editor: editor});
            }
            // if we're creating a new file then we'll fill the doc with nah dah
            else if ((e.type && e.type === "newfile") || Number(node.getAttribute("newfile") || 0) === 1) {
                doc.setValue("");
                ide.dispatchEvent("afteropenfile", {doc: doc, node: node, editor: editor});
            }
            // otherwise go on loading
            else {
                // add a way to hook into loading of files
                if (ide.dispatchEvent("readfile", {doc: doc, node: node}) === false)
                    return;

                var path = node.getAttribute("path");

                /**
                 * Callback function after we retrieve response from jsdav
                 */
                var readfileCallback = function(data, state, extra) {
                    // verify if the request succeeded
                    if (state != apf.SUCCESS) {
                        // 404's should give a file not found, but what about others?
                        if (extra.status == 404) {
                            ide.dispatchEvent("filenotfound", {
                                node : node,
                                url  : extra.url,
                                path : path
                            });
                        }
                    }
                    else {
                        // populate the document
                        doc.setValue(data);
                        // fire event
                        ide.dispatchEvent("afteropenfile", { doc: doc, node: node, editor: editor });
                    }
                };
                
                // if we're not online, we'll add an event handler that listens to the socket connecting (or the ping or so)
                if (!ide.onLine) {
                    var afterOnlineHandler = function () {
                        fs.readFile(path, readfileCallback);
                        ide.removeEventListener("afteronline", afterOnlineHandler);
                    };
                    ide.addEventListener("afteronline", afterOnlineHandler);
                }
                else {
                    fs.readFile(path, readfileCallback);
                }
            }
        });

        ide.addEventListener("reload", function(e) {
            var doc  = e.doc,
                node = doc.getNode(),
                path = node.getAttribute("path");

            /**
             * This callback is executed when the file is read, we need to check
             * the current state of online/offline
             */
            var readfileCallback = function(data, state, extra) {
                if (state == apf.OFFLINE) {
                    ide.addEventListener("afteronline", function(e) {
                        fs.readFile(path, readfileCallback);
                        ide.removeEventListener("afteronline", arguments.callee);
                    });
                } else if (state != apf.SUCCESS) {
                    if (extra.status == 404)
                        ide.dispatchEvent("filenotfound", {
                            node : node,
                            url  : extra.url,
                            path : path
                        });
                } else {
                   ide.dispatchEvent("afterreload", {doc : doc, data : data});
                }
            };

            fs.readFile(path, readfileCallback);
        });
    },

    enable : function() {},

    disable : function() {},

    destroy : function(){
        this.webdav.destroy(true, true);
        this.model.destroy(true, true);
    }
});

});
/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var markup = require("text!ext/gotofile/gotofile.xml");

module.exports = ext.register("ext/gotofile/gotofile", {
    name    : "Filter Tree",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    markup  : markup,
    offline : false,
    commands : {
        "gotofile": {hint: "search for a filename and jump to it"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            mnuFile.insertBefore(new apf.item({
                caption : "Open...",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }), mnuFile.firstChild),

            ide.barTools.appendChild(new apf.button({
                id      : "btnOpen",
                icon    : "open.png",
                width   : 29,
                tooltip : "Open...",
                skin    : "c9-toolbarbutton",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }))
        );

        this.hotitems["gotofile"] = [this.nodes[0]];
    },

    init : function() {
        var _self = this;
        
        txtGoToFile.addEventListener("keydown", function(e){
            if (txtGoToFile.value == "") {
                return;
            }

            if (e.keyCode == 13){
                //var node = trFiles.xmlRoot.selectSingleNode("folder[1]");
                mdlGoToFile.load("{davProject.report('" + ide.davPrefix //node.getAttribute("path")
                    + "', 'filesearch', {query: '" + txtGoToFile.value + "'})}");
                ide.dispatchEvent("track_action", {type: "gotofile"});
            }
            else if (e.keyCode == 40 && dgGoToFile.length) {
                var first = dgGoToFile.getFirstTraverseNode();
                if (first) {
                    dgGoToFile.select(first);
                    dgGoToFile.focus();
                }
            }
        });
        
        dgGoToFile.addEventListener("keydown", function(e) {
            if (e.keyCode == 38 && !e.shiftKey) {
                if (this.selected == this.getFirstTraverseNode())
                    txtGoToFile.focus();
            }
            else if (apf.isCharacter(e.keyCode)) {
                txtGoToFile.focus();
            }
        }, true);

        dgGoToFile.addEventListener("afterchoose", function(e) {
            _self.openFile();
        });

        this.nodes.push(winGoToFile);
    },
    
    openFile: function(){
        var nodes = dgGoToFile.getSelection();
        
        if(nodes.length == 0)
            return false;
            
        winGoToFile.hide();
        for (var i = 0; i < nodes.length; i++) {
            var path = ide.davPrefix.replace(/[\/]+$/, "") + "/" 
                + apf.getTextNode(nodes[i]).nodeValue.replace(/^[\/]+/, "");
            editors.showFile(path, 0, 0);
            ide.dispatchEvent("track_action", {type: "fileopen"});
        }
    },

    gotofile : function(){
        this.toggleDialog(true);
        return false;
    },

    toggleDialog: function(forceShow) {
        ext.initExtension(this);

        if (!winGoToFile.visible || forceShow)
            winGoToFile.show();
        else
            winGoToFile.hide();
        return false;
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
        winGoToFile.destroy(true, true);
        this.nodes = [];
    }
});

});/**
 * Gotoline Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var code = require("ext/code/code");
var editors = require("ext/editors/editors");
var skin = require("text!ext/gotoline/skin.xml");
var markup = require("text!ext/gotoline/gotoline.xml");

module.exports = ext.register("ext/gotoline/gotoline", {
    name    : "Gotoline Window",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    skin    : {
        id  : "gotoline",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/gotoline/images/"
    },
    markup  : markup,
    commands : {
        "gotoline": {hint: "enter a linenumber and jump to it in the active document"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Go to Line...",
                onclick : function(){
                    _self.gotoline();
                }
            }))
        );

        ide.addEventListener("gotoline", function() {
            _self.gotoline();
        });

        code.commandManager.addCommand({
            name: "gotoline",
            exec: function() {
                _self.gotoline();
            }
        });

        this.hotitems.gotoline = [this.nodes[1]];
    },

    init : function() {
        var _self = this;

        lstLineNumber.addEventListener("afterchoose", function() {
            if (lstLineNumber.selected) {
                _self.execGotoLine(parseInt(lstLineNumber.selected.getAttribute("nr"), 10));
            }
            else {
                _self.execGotoLine();
            }
        });
        lstLineNumber.addEventListener("afterselect", function() {
            if (this.selected)
                txtLineNr.setValue(this.selected.getAttribute("nr"));
        });

        var restricted = [38, 40, 36, 35];
        lstLineNumber.addEventListener("keydown", function(e) {
            if (e.keyCode == 13 && this.selected){
                return false;
            }
            else if (e.keyCode == 38) {
                if (this.selected == this.getFirstTraverseNode()) {
                    txtLineNr.focus();
                    this.clearSelection();
                }
            }
            else if (e.keyCode == 27){
                _self.hide();
                ceEditor.focus();
            }
            else if (restricted.indexOf(e.keyCode) == -1)
                txtLineNr.focus();
        }, true);

        txtLineNr.addEventListener("keydown", function(e) {
            if (e.keyCode == 13){
                _self.execGotoLine();
                return false;
            }
            else if (e.keyCode == 27){
                _self.hide();
                ceEditor.focus();
                return false;
            }
            else if (e.keyCode == 40) {
                var first = lstLineNumber.getFirstTraverseNode();
                if (first) {
                    lstLineNumber.select(first);
                    lstLineNumber.$container.scrollTop = 0;
                    lstLineNumber.focus();
                }
            }
            else if ((e.keyCode > 57 || e.keyCode == 32) && (e.keyCode < 96 || e.keyCode > 105))
                return false;
        });

        winGotoLine.addEventListener("blur", function(e){
            if (!apf.isChildOf(winGotoLine, e.toElement))
                _self.hide();
        });
        
        txtLineNr.addEventListener("blur", function(e){
            if (!apf.isChildOf(winGotoLine, e.toElement))
                _self.hide();
        });
    },
    
    show : function() {
        var editor = editors.currentEditor;
        var ace = editor.ceEditor.$editor;
        var aceHtml = editor.ceEditor.$ext;
        var cursor = ace.getCursorPosition();

        //Set the current line
        txtLineNr.setValue(txtLineNr.getValue() || cursor.row + 1);

        //Determine the position of the window
        var pos = ace.renderer.textToScreenCoordinates(cursor.row, cursor.column);
        var epos = apf.getAbsolutePosition(aceHtml);
        var maxTop = aceHtml.offsetHeight - 100;

        editor.ceEditor.parentNode.appendChild(winGotoLine);
        winGotoLine.setAttribute("top", Math.min(maxTop, pos.pageY - epos[1]));
        winGotoLine.setAttribute("left", -60);

        winGotoLine.show();
        txtLineNr.focus();

        //Animate
        apf.tween.single(winGotoLine, {
            type     : "left",
            anim     : apf.tween.easeInOutCubic,
            from     : -60,
            to       : 0,
            steps    : 8,
            interval : 10,
            control  : (this.control = {})
        });
    },

    hide : function() {
        apf.tween.single(winGotoLine, {
            type     : "left",
            anim     : apf.tween.EASEOUT,
            from     : winGotoLine.$ext.offsetLeft,
            to       : -60,
            steps    : 8,
            interval : 10,
            control  : (this.control = {}),
            onfinish : function(){
                winGotoLine.hide();
            }
        });
    },

    gotoline: function() {
        ext.initExtension(this);

        if (this.control && this.control.stop)
            this.control.stop();

        var editorPage = tabEditors.getPage();
        if (!editorPage)
            return;

        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        if (!winGotoLine.visible)
            this.show();
        else
            this.hide();

        return false;
    },

    execGotoLine: function(line) {
        var editor = require('ext/editors/editors').currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        var ceEditor = editor.ceEditor;
        var ace      = ceEditor.$editor;

        winGotoLine.hide();

        if (typeof line != "number")
            line = parseInt(txtLineNr.getValue(), 10) || 0;

        var history = lstLineNumber.$model;
        var gotoline, lineEl = history.queryNode("gotoline/line[@nr='" + line + "']");
        if (lineEl)
            gotoline = lineEl.parentNode;
        else {
            gotoline = apf.createNodeFromXpath(history.data, "gotoline");
            lineEl   = apf.getXml("<line nr='" + line + "' />");
        }

        if (lineEl != gotoline.firstChild)
            apf.xmldb.appendChild(gotoline, lineEl, gotoline.firstChild);

        ace.gotoLine(line);
        ceEditor.focus();
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
/**
 * Guides the user through features of the IDE
 * 
 * @author Matt Pardee
 * @author Garen J. Torikian
 * 
 * @copyright 2011, Cloud9 IDE, Inc
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {
    
var ext = require("core/ext");
var ide = require("core/ide");
var skin = require("text!ext/guidedtour/skin.xml");
var markup = require("text!ext/guidedtour/guidedtour.xml");
var ideConsole = require("ext/console/console");
var zen = require("ext/zen/zen");
var dockpanel = require("ext/dockpanel/dockpanel");
var panels = require("ext/panels/panels");
var settings = require("core/settings");
var helloWorldScript = require("text!ext/guidedtour/hello-world-script.txt");

var save;
var madeNewFile = false;
var wentToZen = false;
var madeDebug = false;
var deletedFile = false;
var hasDeploy = false;

var jsonTourIde = {
    initialText: "This guided tour introduces you to some of the ways<br/> Cloud9 IDE makes it easy for you to program faster and smarter.\n\nClick the play button below to be taken on the tour automatically. Or, you can click the forward and backward buttons to navigate on your own. Remember that during the tour, you won't be able to interact with any of the editor's features.",
    finalText: "Well, that's everything! Still have questions? Head on over to <a href=\"http://support.cloud9ide.com/forums\" target=\"_blank\">our documentation site</a>.",
    steps: [
    {
        el: navbar,
        desc: "This is the project bar. It controls the behavior of the IDE, as well as the presentation of your code.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            // require("ext/tree/tree").enable();
        },
        el: apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:hbox[1]/a:vbox[1]/button[@caption="Project Files"]'),
        desc: "This button shows and hides your project files.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            //require("ext/openfiles/openfiles").enable();
        },
        el: apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:hbox[1]/a:vbox[1]/button[@caption="Open Files"]'),
        desc: "This button shows and hides your open files in a list view.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            //require("ext/settings/settings").enable();
        },
        el: apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:hbox[1]/a:vbox[1]/button[@caption="Preferences"]'),
        desc: "Here, you can change the behavior of the editor, manipulate the code beautifier, and change the indentation and width of the editor, among other options.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            //require("ext/tree/tree").enable();
        },
        el: "winFilesViewer",
        desc: "All your project files are listed here. You can rename and delete files, as well as drag in new ones from your computer. You can also right-click to see context options.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            //require("ext/tree/tree").enable();
        },
        el: plus_tab_button,
        desc: "You can use this button to quickly add new files to the editor. We'll simulate pushing that right now.",
        pos: "left",
        time: 4
    }, {
        before: function(){
            if (madeNewFile == false) {
                madeNewFile = true;
                require("ext/newresource/newresource").newfile();
            }
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabEditors.$ext),
        desc: "Here's a tabbed arrangement of all your active files, including the new one we just created. You can rearrange the tabs however you like and swap through them with keyboard shortcuts.",
        pos: "bottom",
        time: 4
    }, {
        before: function() {
            tabEditors.getPage().$doc.setValue(helloWorldScript);
            if (!save) 
                save = require("ext/save/save");
            var page = tabEditors.getPage();
            var file = page.$model.data;
            save._saveAsNoUI(page, file.getAttribute("path"), ide.davPrefix + "/helloWorld-quideTour.js");
            require("ext/tree/tree").refresh();
        },
        el: undefined,
        div: "ceEditor",
        desc: "We've just typed up a quick code example and saved it as \"helloWorld-quideTour.js.\" We'll work with this file, then delete it when we're done.",
        pos: "left",
        time: 5
    }, {
        before: function(){
            if (wentToZen){
                zen.fadeZenButtonOut();
                wentToZen = false;
            }
        },
        el: undefined,
        div: "DIV[1]",
        desc: "The gutter can do more than show line numbers. It also detects and displays warnings and errors in your code. If you're debugging an application, you can also set breakpoints here.",
        pos: "right",
        time: 5
    }, {
        before: function() {

        },
        el: undefined,
        div: "barIdeStatus",
        desc: "This is the status bar. It shows your current line number and column position, and clicking on it lets you modify some visual aspects, like vim mode, line margins, and beautify options.",
        pos: "left",
        time: 4
    }, {
        before: function(){
            wentToZen = true;
            zen.fadeZenButtonIn();
        },
        el: undefined,
        div: undefined,
        desc: "If you hover over this corner, you can activate \"Zen Mode,\" which is a distraction-free environment. We'll simulate pressing that button now.",
        pos: "left",
        time: 5
    }, {
        before: function() {
            var hlElement = require("ext/guidedtour/guidedtour").hlElement;
            hlElement.style.visibility = "hidden";
            winTourText.hide();
            document.getElementsByClassName("tgDialog")[0].style.display = "none";
            zen.fadeZenButtonOut();
            zen.enterIntoZenMode();
            
            setTimeout(function(){
                zen.escapeFromZenMode();
                document.getElementsByClassName("tgDialog")[0].style.display = "";
                require("ext/guidedtour/guidedtour").stepForward();
                zen.fadeZenButtonOut();
                                
                hlElement.style.visibility = "visible";
                winTourText.show();
            }, 2000);
        },
        time: 4,
        desc: "",
        skip: true
    }, {
        before: function(){
            //ideConsole.disable();
        },
        el: apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:bar[1]/a:vbox[1]/a:hbox[1]'),
        desc: "This area down here acts just like a command line for your project in the Cloud9 IDE. You can always type 'help' to get a list of the available commands.",
        pos: "top",
        time: 5
    }, {
        before: function() {
            //ideConsole.enable();
            ideConsole.show();
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "After clicking the expand arrows, you'll be able to get to the full console view. Any output from your program&mdash;like console.log() messages or compilation errors&mdash;appears in the Output tab.",
        pos: "top",
        time: 4
    }, {
        before: function() {
            //winRunCfgNew.hide();
            //ideConsole.disable();
            var doc = require("ext/editors/editors").currentEditor.ceEditor.getSession();
            doc.setBreakpoints([1]);
        },
        el: undefined,
        div: "DIV[1]",
        desc: "We're ready to test our code, so we've inserted a breakpoint on this line by clicking in the gutter. Before debugging, though, we'll need to set up a debugging scenario.",
        pos: "right",
        time: 5
    }, {
        before: function(){
            panels.activate(require("ext/runpanel/runpanel"));
            if (!madeDebug) {
                settings.model.setQueryValue('auto/configurations/@debug', true);
            }
            setTimeout(function(){
                lstRunCfg.select(lstRunCfg.$model.queryNode("//config"), null, null, null, true)
            });
        },
        el: "winRunPanel",
        desc: "Here's where the fun begins! After clicking Debug, then Run Configurations, you'll be able to create or modify a debug configuration. Every configuration needs a name and a file to run, but you can also pass arguments.",
        pos: "right",
        time: 5
    }, {
        before: function() {
            require('ext/runpanel/runpanel').run(true);
            var bar = dockpanel.layout.$getLastBar();
            if(!bar) {
                dockpanel.showBar(dockpanel.getBars("ext/debugger/debugger", "pgDebugNav")[0]);
            }
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "Whoa! A lot of things just happened. First off, the Output tab opened up to show us that our code is running, and currently being debugged.",
        pos: "top",
        time: 4
    }, {
        before: function() {
        },
        el: function(){
            return dockpanel.layout.$getLastBar();;
        },
        desc: "Next, when you start debugging, you'll instantly get a new debugging toolbar.",
        pos: "left",
        time: 4
    }, {
        before: function() {
            var menuId = dockpanel.getButtons("ext/debugger/debugger", "pgDebugNav")[0];
            if(menuId) {
                dockpanel.layout.showMenu(menuId.uniqueId);
                if(!pgDebugNav.parentNode.parentNode.visible)
                    btnRunCommands.dispatchEvent("mousedown",  {});
            }
        },
        el: function(){
            return pgDebugNav;
        },
        desc: "In this toolbar, the usual start, stop, and step buttons are at the top, to help control the flow of the debugging.",
        pos: "left",
        time: 4
    }, {
        before: function() {
            var menuId = dockpanel.getButtons("ext/debugger/debugger", "dbgVariable")[0];
            if(menuId) {
                dockpanel.layout.showMenu(menuId.uniqueId);
                dbgVariable.parentNode.set(dbgVariable)
            }
        },
        el: function(){
            return dbgVariable;
        },
        desc: "In this section you can view variables in the debug state.",
        pos: "left",
        time: 4
    }, {
        before: function() {
            var menuId = dockpanel.getButtons("ext/debugger/debugger", "dbgCallStack")[0];
            if(menuId)
                dockpanel.layout.showMenu(menuId.uniqueId);
            dbgCallStack.parentNode.set(dbgCallStack)
        },
        el: function(){
            return dbgCallStack;
        },
        desc: "Here you can see the call stack of the program you are debugging.",
        pos: "left",
        time: 4
    }, {
        before: function() {
            
            dbgCallStack && dbgCallStack.parentNode && dbgCallStack.parentNode.parentNode.hide();
            dbg.continueScript();
            txtConsoleInput.setValue("git status");
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "We indicated to the debugger that we want to continue. At last, the console.log() message printed out. Now, we're going to simulate typing 'git status' in the command line.",
        pos: "top",
        time: 4
    }, {
        before: function(){
            require(["c9/ext/deploy/deploy"], function(deploy) { 
                hasDeploy = true;
                panels.activate(deploy);
            });
        },
        el: "winDeploy",
        desc: "In this panel you can manage(add/remove) your deploy targets for your application, in different services, like Joyent and Heroku.",
        pos: "right",
        notAvailable: !hasDeploy,
        time: 5
    }, {
        before: function() {
            require('ext/runpanel/runpanel').stop();
            
            if(trFiles.$model.queryNode("//file[@path='" + ide.davPrefix + "/helloWorld-quideTour.js']")) {
                require("ext/console/console").commandTextHandler({
                    keyCode: 13,
                    currentTarget: txtConsoleInput
                });
                txtConsoleInput.setValue("rm helloWorld-quideTour.js");
            }
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "As expected, there's been a new file added to git. We're done testing it, and don't want to keep it around, so let's remove it with 'rm helloWorld-quideTour.js'.",
        pos: "top",
        time: 4
    }, {
        before: function() {
            panels.activate(require("ext/tree/tree"));
            var demoFile = trFiles.$model.queryNode("//file[@path='" + ide.davPrefix + "/helloWorld-quideTour.js']");
            if(demoFile && !deletedFile) {
                deletedFile = true;
                tabEditors.remove(tabEditors.getPage());
                require("ext/console/console").commandTextHandler({
                    keyCode: 13,
                    currentTarget: txtConsoleInput
                });
                trFiles.confirmed = true;
                trFiles.remove(demoFile);
                trFiles.confirmed = false;
                require("ext/tree/tree").refresh();
            }
        },
        el: "winFilesViewer",
        desc: "Voila! Notice that the file is gone from your project.",
        pos: "right",
        time: 4
    }]
};

module.exports = ext.register("ext/guidedtour/guidedtour", {
    name: "Guided Tour",
    dev: "Cloud9 IDE, Inc.",
    alone: true,
    type: ext.GENERAL,
    markup: markup,
    skin    : {
        id   : "guidedtour",
        data : skin,
        "media-path" : "/static/ext/guidedtour/images/"
    },
    currentStep: -1,
    currentEl: null,
    nodes: [],

    hook: function() {
        //this.launchGT();
    },
    
    init: function(amlNode) {     
        this.initTour();
        this.tour = jsonTourIde;
        
        this.overlay   = document.createElement("div");
        this.hlElement = document.createElement("div");
        
        this.overlay.setAttribute("style", "display:none;position:fixed;left: 0px;top: 0px;width:100%;height:100%;opacity:0.3;background:#000;opacity:0");
        document.body.appendChild(this.overlay);

        this.hlElement.setAttribute("style", "z-index:9998;display:none;position:absolute;box-shadow:0px 0px 15px #000;");
        document.body.appendChild(this.hlElement);

        winTourGuide.addEventListener("hide", this.shutdown(this.hlElement));
        tourControlsDialog.addEventListener("hide", this.shutdown(this.hlElement));
    },

    launchGT: function(){        
        ext.initExtension(this);
        this.hideMenus();
        madeNewFile = wentToZen = madeDebug = deletedFile = false;
        this.currentStep = -1;
        winTourDesc.setValue(this.tour.initialText);
        winTourGuide.show();
        winTourButtonStart.show();
        winTourButtonClose.show();
        winTourButtonDone.hide();
    },
    
    hideMenus: function(){
        var buttons = dockpanel.getButtons("ext/debugger/debugger");
        if(!buttons)
            return;
            
        for(var i = 0, button; i < buttons.length; i++) {
            button = buttons[i];
            if(!button.showMenu || !button.cache)
                continue;
            
            self[button.cache.submenu].hide();
        }
    },
    
    initTour: function(){
        this.animateui = settings.model.queryValue('general/@animateui');
        settings.model.setQueryValue('general/@animateui', false);
        
        /*ide.addEventListener("loadsettings", function(e){
            _self.animateui = settings.model.queryValue('general/@animateui');
            settings.model.setQueryValue('general/@animateui', false);
        });*/
        
        !self["winFilesViewer"] && panels.activate(require("ext/tree/tree"));

        var demoFile = trFiles.$model.queryNode("//file[@path='" + ide.davPrefix + "/helloWorld-quideTour.js']");
        if (demoFile && !deletedFile) {
            txtConsoleInput.setValue("rm helloWorld-quideTour.js");
            deletedFile = true;
            require("ext/console/console").commandTextHandler({
                keyCode: 13,
                currentTarget: txtConsoleInput
            });
            trFiles.confirmed = true;
            trFiles.remove(demoFile);
            trFiles.confirmed = false;
            require("ext/tree/tree").refresh();
        }
    },
    
    /**
     * Play controls
     */
    togglePlay: function(){
        if (this.playing) this.pause();
        else this.play();
    },

    play: function(){
        btnTourPlay.$ext.childNodes[1].style.backgroundPosition = "-28px 3px";
        btnTourPlay.tooltip = "Play";
        this.playing = true;
        this.stepForwardAuto();
    },

    pause: function(){
        btnTourPlay.$ext.childNodes[1].style.backgroundPosition = "14px 4px";
        btnTourPlay.tooltip = "Pause";
        this.playing = false;
        clearTimeout(this.$timerForward);
    },

    end: function(){
        this.pause();
        this.hlElement.style.opacity = "0";
    },

    startTour: function(){
        var _self = this;
        
        this.currentStep = -1;
        winTourGuide.hide();
        tourControlsDialog.show();
        this.stepForward();
        
        this.overlay.style = 'block';
        
        settings.model.setQueryValue('general/@animateui', false);
        
        apf.removeEventListener("keyup", _self.keyUpEvent);
        
        apf.addEventListener("keyup", _self.keyUpEvent = function(e){
            if(e.keyCode == 39)
                _self.stepForward();
            else if(e.keyCode == 37)
                _self.stepBack();
        });
        
        // remove the modal overlay, but keep it around to block input
        //var modalBackground = document.getElementsByClassName("bk-window-cover");
        //modalBackground[modalBackground.length - 1].style.opacity = "0";
    },

    stepBack: function(){
        this.currentStep--;

        var step = this.tour.steps[this.currentStep];
        
        if(!step)
            return;
        
        if (step.skip !== undefined) { // we're in the zen mode step, go back one more
            this.currentStep--;
            step = this.tour.steps[this.currentStep];
        }

        if (this.currentStep === 0) {
            btnTourStepBack.disable();
            btnTourStepBack.$ext.childNodes[1].style.backgroundPosition = "20px -21px";
        }

        btnTourStepForward.enable();

        this.commonStepOps(step);
    },

    stepForwardAuto: function(){
        var _self = this;
        var timeout = this.currentStep > -1 ? this.tour.steps[this.currentStep].time : 0;

        this.$timerForward = setTimeout(function() {
            _self.stepForward();
            if (_self.tour.steps[_self.currentStep + 1]) 
                _self.stepForwardAuto();
            else {
                _self.end();
                _self.finalStep();
            }
        }, timeout * 1000);
    },

    stepForward: function(){
        this.currentStep++;
        if (!this.tour.steps[this.currentStep]) 
            this.finalStep();
        else {
            if (this.currentStep > 0){
                btnTourStepBack.enable();
                btnTourStepBack.$ext.childNodes[1].style.backgroundPosition = "20px 5px";
            }
            if(this.currentStep > 22) {
                btnTourStepBack.disable();
                btnTourStepBack.$ext.childNodes[1].style.backgroundPosition = "20px -21px";
            }
            var step = this.tour.steps[this.currentStep];
            this.commonStepOps(step);
        }
    },

    finalStep: function() {
        winTourText.close();
        tourControlsDialog.hide();
        this.closeTG();
        this.hlElement.style.display = "none";

        winTourGuide.show();
        winTourDesc.setValue(this.tour.finalText);
        this.currentStep = -1;
        winTourButtonStart.hide();
        winTourButtonClose.hide();
        winTourButtonDone.show();
    },
    
    // These are common operations we do for each step
    // forwards and back, so we DRY
    commonStepOps: function(step){
        function getCurrentEl(){
            if (step.el !== undefined) {
                if(typeof step.el == "string")
                    step.el = self[step.el];
                if(typeof step.el == "function")
                    step.el = step.el();
                _self.currentEl = step.el;
            }
            // All of these fix issues with elements not being available when this plugin loads
            else if (step.div == "ceEditor"){
                _self.currentEl = ceEditor;
            }
            else if (step.div == "expandedDbg") {
                _self.currentEl = expandedDbg;
            }
            else if (step.div == "barIdeStatus") {
                _self.currentEl = barIdeStatus;
            }
            else if (step.div !== undefined) {
                if (step.node !== undefined) {
                    _self.currentEl = (apf.XPath || apf.runXpath() || apf.XPath).selectNodes(step.div, apf.document.selectSingleNode(step.node).$ext);
                }
                else {
                    _self.currentEl = (apf.XPath || apf.runXpath() || apf.XPath).selectNodes(step.div, ceEditor.$ext);
                }
            }
            else {
                // fixes issue with no zen button existing
                _self.currentEl = btnZenFullscreen;
            }
        }
        var _self = this;
        if(step.notAvailable) {
            this.stepForward();
            return;
        }
        if (step.before) 
            step.before();
        
        setTimeout(function(){   
            getCurrentEl();
            if(!_self.currentEl)
                return;
                
            _self.highlightElement();
    
            textTourDesc.setValue(step.desc);
    
            // Reset Position
            winTourText.setAttribute("bottom", "");
            winTourText.setAttribute("top", "");
            winTourText.setAttribute("left", "");
            winTourText.setAttribute("right", "");
    
            var pos = _self.getElementPosition(_self.currentEl);
            
            if(!pos)
                return;
            
            winTourText.setAttribute("class", step.pos);
        
            _self.setPositions(step.pos, pos, winTourText);
            
            if(step.pos)
                winTourText.show();
        });
    },

    setPositions: function(position, posArray, div) {
        if (position == "top"){
            div.setAttribute("bottom", (window.innerHeight - posArray[1]) + 25);
            div.setAttribute("left", (posArray[0] + (posArray[2] / 2)) - (div.getWidth() / 2));
        }
        else if (position == "right"){
            div.setAttribute("left", posArray[0] + posArray[2] + 25);
            div.setAttribute("top", (posArray[1] + (posArray[3] / 2)) - (div.getHeight() / 2));
        }
        else if (position == "bottom"){
            div.setAttribute("top", posArray[3] + 50);
            div.setAttribute("right", (posArray[0] + (posArray[2] / 2)) - (div.getWidth() / 2));
        }
        else if (position == "left"){
            div.setAttribute("right", (window.innerWidth - posArray[0]) + 25);
            div.setAttribute("top", (posArray[1] + (posArray[3] / 2)) - (div.getHeight() / 2));
        }

        return div;
    },

    /**
     * Element methods
     */
    highlightElement: function(){        
        //this.currentEl.addEventListener("resize", this.$celResize = function() {
        //_self.resizeHighlightedEl();
        //});
        this.resizeHighlightedEl();
        
        var hlZindex = this.hlElement.style.zIndex;
        winTourText.$ext.style.zIndex = hlZindex + 1;
        tourControlsDialog.$ext.style.zIndex = hlZindex + 2;
    },

    resizeHighlightedEl: function() {
        var pos = this.getElementPosition(this.currentEl);
        this.hlElement.style.left = pos[0] + "px";
        this.hlElement.style.top = pos[1] + "px";
        this.hlElement.style.width = (pos[2] - 4) + "px";
        this.hlElement.style.height = (pos[3] - 4) + "px";
        this.hlElement.style.display = "block";
        this.hlElement.style.border = "solid 2px #bee82c";

        if (this.currentEl.$ext) {
            var zIndex;
            var pNode = this.currentEl;
            if (pNode) {
                while (pNode && pNode.tagName != "body" && (!zIndex || zIndex <= 9998)) {
                    zIndex = pNode.$ext && pNode.$ext.style && parseInt(pNode.$ext.style.zIndex || 9997) + 1;
                    pNode = pNode.parentNode;
                }
            }
            else {
                zIndex = 9998;
            }
        }
        else {
            zIndex = this.currentEl.style && parseInt(this.currentEl.style.zIndex || 9997) + 1;
        }

        this.hlElement.style.zIndex = zIndex;
    },

    getElementPosition: function(el){
        if(!el)
            return [0, 0, 0, 0];
            
        var elExt = el.$ext;
        if (elExt === undefined) {
            var pos = apf.getAbsolutePosition(el[0]);
            return [pos[0], pos[1], el[0].offsetWidth, el[0].offsetHeight];
        }
        else {
            var pos = apf.getAbsolutePosition(elExt);
            var w = el.getWidth();
            var h = el.getHeight();
            return [pos[0], pos[1], w, h];
        }
    },

    enable: function() {
        this.nodes.each(function(item) {
            item.enable();
        });
    },

    closeTG: function() {
        var _self = this;
        winTourGuide.hide();
        
        apf.removeEventListener("keyup", _self.keyUpEvent);
    },

    shutdown: function(hlElement) {
        var _self = this;
        
        apf.removeEventListener("keyup", _self.keyUpEvent);
        return function() {
            require("ext/guidedtour/guidedtour").pause(); // stop auto-moving
            winTourText.hide();
            tourControlsDialog.hide();
            zen.fadeZenButtonOut(); // in case it's still showing
            (hlElement || _self.hlElement).style.display = "none";
            _self.currentStep = -1;
            _self.overlay.style = 'none';
            
            //set anim settings to what it was before the tour
            settings.model.setQueryValue('general/@animateui', _self.animateui);
        };        
    },

    disable: function() {
        this.nodes.each(function(item) {
            item.disable();
        });
    },

    destroy: function() {
        this.nodes.each(function(item) {
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
/**
 * Help menu for the Cloud 9 IDE
 * 
 * @author Garen J. Torikian
 * 
 * @copyright 2011, Cloud9 IDE, Inc
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

    var ide = require("core/ide");
    var ext = require("core/ext");
    var markup = require("text!ext/help/help.xml");
    var css = require("text!ext/help/style.css");
    var skin = require("text!ext/help/skin.xml");

    module.exports = ext.register("ext/help/help", {
        name: "Help Menu",
        dev: "Cloud9 IDE, Inc.",
        alone: true,
        type: ext.GENERAL,
        nodes: [],
        markup: markup,
        css: css,
        panels: {},
        skin: {
            id: "help-skin",
            data: skin,
            "media-path": "/static/ext/help/images/"
        },
        showingAll: true,

        initPanel: function(panelExt) {
            if (panelExt.panel) {
                return;
            }

            ext.initExtension(panelExt);
            this.$setEvents(panelExt);

            var set = this.$settings && this.$settings[panelExt.path];
            if (set) this.setPanelSettings(panelExt, set);

            panelExt.panel.setAttribute("draggable", "false");
        },

        register: function(panelExt) {
            var _self = this;
            if (!panelExt.alwayson) {
                panelExt.mnuItem = mnuPanels.appendChild(new apf.item({
                    caption: panelExt.name,
                    type: "check",
                    //checked : panelExt.visible || false,
                    checked: "{panelExt.visible}",
                    onclick: function() {
                        _self.initPanel(panelExt);
                        this.checked ? panelExt.enable() : panelExt.disable();
                    }
                }));
            }

            if (false && this.$settings && this.$settings[panelExt.path]) {
                this.setPanelSettings(panelExt, _self.$settings[panelExt.path]);
            }
            else if (panelExt.visible) {
                if (panelExt.skin) {
                    setTimeout(function() {
                        this.initPanel(panelExt);
                    });
                }
                else {
                    this.initPanel(panelExt);
                }
            }

            this.panels[panelExt.path] = panelExt;
        },


        unregister: function(panelExt) {
            panelExt.mnuItem.destroy(true, true);
            delete this.panels[panelExt.path];
        },

        init: function(amlNode) {
            apf.importCssString((this.css || ""));

            this.nodes.push(
            barMenu.appendChild(new apf.button({
                submenu: "mnuHelp",
                caption: "Help",
                skin: "c9-menu-btn",
                margin: "1 0 0 0"
            })), mnuWindows);

            if (window.location.host.indexOf("c9.io") >= 0 || window.location.host.indexOf("stage.io") >= 0) {                
                var blogURL = window.location.protocol + "//" + window.location.host + "/site/?json=get_tag_posts&tag_slug=changelog";
    
                var response = apf.ajax(blogURL, {
                    method: "GET",
                    contentType: "application/json",
                    async: true,
                    data: apf.serialize({
                        agent: navigator.userAgent,
                        type: "C9 SERVER EXCEPTION"
                    }),
                    callback: function( data, state) {
                        if (state == apf.SUCCESS) {
                            if (data !== undefined) {
                                var jsonBlog = JSON.parse(data);
                                var latestDate = jsonBlog.posts[0].date;
        
                                mnuChangelog.setAttribute("caption", mnuChangelog.caption + " (" + latestDate.split(" ")[0].replace(/-/g, ".") + ")");
                            }
                        }
                    }
                });
            }
        },

        showAbout: function() {
            aboutDialog.show();
            document.getElementById("c9Version").innerHTML = "Version " + window.cloud9config.version;
        },

        launchTwitter: function() {
            alert("Let's go to Twitter!");
        },

        enable: function() {
            this.nodes.each(function(item) {
                item.enable();
            });
        },

        disable: function() {
            this.nodes.each(function(item) {
                item.disable();
            });
        },

        destroy: function() {
            this.nodes.each(function(item) {
                item.destroy(true, true);
            });
            this.nodes = [];
        }
    });

});/**
 * HTML Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var code = require("ext/code/code");
var markup = require("text!ext/html/html.xml");

var previewExtensions = [
    "htm", "html", "xhtml",
    "conf", "log", "text", "txt",
    "xml", "xsl"
];

module.exports = ext.register("ext/html/html", {
    name  : "HTML Editor",
    dev   : "Ajax.org",
    type  : ext.GENERAL,
    alone : true,
    deps  : [code],
    markup: markup,
    nodes : [],

    hook : function(){
        var _self = this;
        tabEditors.addEventListener("afterswitch", function(e){
            _self.afterSwitchOrOpen(e.nextPage);
        });
        ide.addEventListener("afteropenfile", function(e){
            // Only listen for event from editors.js
            if (e.editor && e.node.$model)
                _self.afterSwitchOrOpen(e.node);
        });
        ide.addEventListener("updatefile", function(e) {
            var page = tabEditors.getPage(e.newPath);
            if (!page || !page.$active)
                return;
            _self.afterSwitchOrOpen(page);
        });
    },

    afterSwitchOrOpen : function(node) {
        var name = node.$model.data.getAttribute("name");
        var fileExtension = name.split(".").pop();

        if (previewExtensions.indexOf(fileExtension) > -1) {
            ext.initExtension(this);
            this.page = node;
            this.enable();
        }
        else {
            this.disable();
        }
    },

    init : function() {
        //Append the button bar to the main toolbar
        var nodes = barHtmlMode.childNodes;
        var node;
        for (var i = nodes.length - 1; i >= 0; i--) {
            node = ide.barTools.appendChild(nodes[0]);
            if (node.nodeType != 1) {
                continue;
            }
            this.nodes.push(node);
        }

        btnHtmlOpen.onclick = this.onOpenPage.bind(this);
        this.enabled = true;
    },

    onOpenPage : function() {
        var file = this.page.$model.data;
        window.open(location.protocol + "//" + location.host + file.getAttribute("path"), "_blank");
    },

    enable : function() {
        if (this.enabled)
            return;
        this.enabled = true;

        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function(){
        if (!this.enabled)
            return;
        this.enabled = false;

        this.nodes.each(function(item){
            item.hide && item.hide();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy && item.destroy(true, true);
        });
        this.nodes = [];
    }
});
});
/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */


define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/imgview/imgview.xml");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/imgview/imgview", {
    name    : "Image Viewer",
    dev     : "Ajax.org",
    fileExtensions : [
        "bmp",
        "djv",
        "djvu",
        "gif",
        "ico",
        "jpg",
        "jpeg",
        "pbm",
        "pgm",
        "png",
        "pnm",
        "ppm",
        "psd",
        "tiff",
        "xbm",
        "xpm"
    ],
    type    : ext.EDITOR,
    markup  : markup,
    deps    : [editors],

    nodes : [],

    setDocument : function(doc, actiontracker){
        doc.session = doc.getNode().getAttribute("path");
        imgEditor.setProperty("value", doc.session);
    },

    hook : function() {},

    init : function(amlPage) {
        var editor = imgEditor;
        
        ide.addEventListener("beforefilesave", function(e) {
            var path = e.node && e.node.getAttribute("path");
            if (!path)
                return;
            // don't save images for now.
            if (editor.value == path)
                return false;
        });
        
        amlPage.appendChild(editor);
        editor.show();

        this.imgEditor = this.amlEditor = editor;
        //this.nodes.push();
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

        this.nodes = [];
    }
});

});
/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

// contains language specific debugger bindings
define(function(require, exports, module) {

    var baseLanguageHandler = require('ext/language/base_handler');
    
    var expressionBuilder = module.exports = Object.create(baseLanguageHandler);
    
    /*** publics ***/
    
    expressionBuilder.handlesLanguage = function(language) {
        return language === 'javascript';
    };
        
    // builds an expression for the v8 debugger based on a node
    expressionBuilder.buildExpression = function(node) {
        if (!node) return null;
        
        return getExpressionValue(node);
    };
    
    /*** privates ***/
    
    // get a string value of any expression
    var getExpressionValue = function(d) {
        if (d.value) return d.value;
        
        var result;
        
        d.rewrite(
            // var someVar = ...
            'VarDeclInit(x, _)', function(b) {
                result = b.x.value;
            },
            // var someVar;
            'VarDecl(x)', function(b) {
                result = b.x.value;
            },
            // e.x
            'PropAccess(e, x)', function(b) {
                result = getExpressionValue(b.e) + "." + b.x.value;
            },
            // x
            'Var(x)', function(b) {
                result = b.x.value;
            },
            // e(arg, ...)
            'Call(e, args)', function(b) {
                var method = getExpressionValue(b.e);
                var args = b.args.toArray().map(getExpressionValue).join(", ");
                result = method + "(" + args + ")";
            },
            // 10
            'Num(n)', function(b) {
                result = b.n.value;
            },
            // e[idx]
            'Index(e, idx)', function(b) {
                result = getExpressionValue(b.e) + "[" + getExpressionValue(b.idx) + "]";
            },
            // new SomeThing(arg, ...)
            'New(e, args)', function(b) {
                var method = getExpressionValue(b.e);
                var args = b.args.toArray().map(getExpressionValue).join(", ");
                result = "new " + method + "(" + args + ")";
            },
            // x (function argument)
            'FArg(x)', function(b) {
                result = b.x.value;
            },
            // 10 + 4
            'Op(op, e1, e2)', function(b) {
                result = getExpressionValue(b.e1) + " " + b.op.value + " " + getExpressionValue(b.e2);
            },
            // if nuthin' else matches
            function() {
                if(!result)
                    result = "";
            }
        );
        return result;
    };

});
/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ext = require("core/ext");
var editors = require("ext/editors/editors");
var language = require("ext/language/language");

module.exports = ext.register("ext/jslanguage/jslanguage", {
    name    : "Javascript Language Support",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    deps    : [editors, language],
    nodes   : [],
    alone   : true,

    init : function() {
        language.registerLanguageHandler('ext/jslanguage/parse');
        language.registerLanguageHandler('ext/jslanguage/scope_analyzer');
        language.registerLanguageHandler('ext/jslanguage/narcissus_jshint');
        language.registerLanguageHandler('ext/jslanguage/debugger');
    },
    
    enable : function() {
    },

    disable : function() {
    },

    destroy : function() {
    }
});

});
/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var baseLanguageHandler = require('ext/language/base_handler');
var lint = require("ace/worker/jshint").JSHINT;
var parser = require("ace/narcissus/jsparse");

var handler = module.exports = Object.create(baseLanguageHandler);

var disabledJSHintWarnings = [/Missing radix parameter./, /Bad for in variable '(.+)'./];

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

handler.analysisRequiresParsing = function() {
    return false;
};

handler.analyze = function(doc) {
    var value = doc.getValue();
    value = value.replace(/^(#!.*\n)/, "//$1");

    var markers = [];
    try {
        parser.parse(value);
    }
    catch (e) {
        var chunks = e.message.split(":");
        var message = chunks.pop().trim();
        var numString = chunks.pop();
        if(numString) {
            var lineNumber = parseInt(numString.trim(), 10) - 1;
            markers = [{
                pos: {
                    sl: lineNumber,
                    el: lineNumber
                },
                message: message,
                type: "error"
            }];
        }
        return markers;
    }
    finally {}
    if (this.isFeatureEnabled("jshint")) {
        lint(value, {
            undef: false,
            onevar: false,
            passfail: false,
            devel: true,
            browser: true,
            node: true
        });
        lint.errors.forEach(function(warning) {
            if (!warning)
                return;
            for (var i = 0; i < disabledJSHintWarnings.length; i++)
                if(disabledJSHintWarnings[i].test(warning.reason))
                    return;
            markers.push({
                pos: {
                    sl: warning.line-1,
                    sc: warning.column-1
                },
                type: 'warning',
                message: warning.reason
            });
        });
    }
    return markers;
};
    
});
if (typeof process !== "undefined") {
    require("../../../support/paths");
    require.paths.unshift(__dirname + "/../..");
    require.paths.unshift(__dirname + "/../../../support/treehugger/lib");
}

define(function(require, exports, module) {

var assert = require("ace/test/assertions");
//var handler = require('ext/jslanguage/narcissus_jshint');
var LanguageWorker = require('ext/language/worker').LanguageWorker;
var EventEmitter = require("ace/lib/event_emitter").EventEmitter;

module.exports = {

    "test integration base case" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 0);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/narcissus_jshint");
        assert.equal(worker.handlers.length, 1);
        worker.switchFile("test.js", "javascript", "hello();");
    },
    
    "test integration narcissus" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            assert.equal(markers[0].pos.sl, 1);
            assert.equal(markers[0].message, 'missing operand');
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/narcissus_jshint");
        worker.switchFile("test.js", "javascript", "console.log(1);\nhello(");
    },

    "test integration JSHint" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            assert.equal(markers[0].pos.sl, 1);
            assert.equal(markers[0].message, 'Missing semicolon.');
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/narcissus_jshint");
        worker.switchFile("test.js", "javascript", "console.log(1);\nhello()");
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var parser = require("treehugger/js/parse");
var baseLanguageHandler = require('ext/language/base_handler');

var handler = module.exports = Object.create(baseLanguageHandler);

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};
    
handler.parse = function(code) {
    code = code.replace(/^(#!.*\n)/, "//$1");
    return parser.parse(code);
};

/* Ready to be enabled to replace Narcissus, when mature

handler.analyze = function(doc, ast) {
    var error = ast.getAnnotation("error");
    if (error)
        return [{
            pos: {sl: error.line},
            type: 'error',
            message: error.message || "Parse error."
        }];
    else
        return [];
};
*/

});if (typeof process !== "undefined") {
    require("../../../support/paths");
    require.paths.unshift(__dirname + "/../..");
    require.paths.unshift(__dirname + "/../../../support/treehugger/lib");
}

define(function(require, exports, module) {

var assert = require("ace/test/assertions");
//var handler = require('ext/jslanguage/narcissus_jshint');
var LanguageWorker = require('ext/language/worker').LanguageWorker;
var EventEmitter = require("ace/lib/event_emitter").EventEmitter;

module.exports = {
    "test parsing" : function() {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/parse");
        assert.equal(worker.handlers.length, 1);
        worker.switchFile("test.js", "javascript", "hello();");
        var ast = worker.parse();
        assert.equal(ast, '[Call(Var("hello"),[])]');
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}/**
 * JavaScript scope analysis module and warning reporter.
 * 
 * This handler does a couple of things:
 * 1. It does scope analysis and attaches a scope object to every variable, variable declaration and function declaration
 * 2. It creates markers for undeclared variables
 * 3. It creates markers for unused variables
 * 4. It implements the local variable refactoring
 * 
 * @depend ext/jslanguage/parse
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {
var baseLanguageHandler = require('ext/language/base_handler');
require('treehugger/traverse');
var handler = module.exports = Object.create(baseLanguageHandler);

// Based on https://github.com/jshint/jshint/blob/master/jshint.js#L331
var GLOBALS = {
    // Literals
    "true"                   : true,
    "false"                  : true,
    "undefined"              : true,
    "null"                   : true,
    "this"                   : true,
    "arguments"              : true,
    // Browser
    ArrayBuffer              :  true,
    ArrayBufferView          :  true,
    Audio                    :  true,
    addEventListener         :  true,
    applicationCache         :  true,
    blur                     :  true,
    clearInterval            :  true,
    clearTimeout             :  true,
    close                    :  true,
    closed                   :  true,
    DataView                 :  true,
    defaultStatus            :  true,
    document                 :  true,
    event                    :  true,
    FileReader               :  true,
    Float32Array             :  true,
    Float64Array             :  true,
    FormData                 :  true,
    getComputedStyle         :  true,
    HTMLElement              :  true,
    HTMLAnchorElement        :  true,
    HTMLBaseElement          :  true,
    HTMLBlockquoteElement    :  true,
    HTMLBodyElement          :  true,
    HTMLBRElement            :  true,
    HTMLButtonElement        :  true,
    HTMLCanvasElement        :  true,
    HTMLDirectoryElement     :  true,
    HTMLDivElement           :  true,
    HTMLDListElement         :  true,
    HTMLFieldSetElement      :  true,
    HTMLFontElement          :  true,
    HTMLFormElement          :  true,
    HTMLFrameElement         :  true,
    HTMLFrameSetElement      :  true,
    HTMLHeadElement          :  true,
    HTMLHeadingElement       :  true,
    HTMLHRElement            :  true,
    HTMLHtmlElement          :  true,
    HTMLIFrameElement        :  true,
    HTMLImageElement         :  true,
    HTMLInputElement         :  true,
    HTMLIsIndexElement       :  true,
    HTMLLabelElement         :  true,
    HTMLLayerElement         :  true,
    HTMLLegendElement        :  true,
    HTMLLIElement            :  true,
    HTMLLinkElement          :  true,
    HTMLMapElement           :  true,
    HTMLMenuElement          :  true,
    HTMLMetaElement          :  true,
    HTMLModElement           :  true,
    HTMLObjectElement        :  true,
    HTMLOListElement         :  true,
    HTMLOptGroupElement      :  true,
    HTMLOptionElement        :  true,
    HTMLParagraphElement     :  true,
    HTMLParamElement         :  true,
    HTMLPreElement           :  true,
    HTMLQuoteElement         :  true,
    HTMLScriptElement        :  true,
    HTMLSelectElement        :  true,
    HTMLStyleElement         :  true,
    HTMLTableCaptionElement  :  true,
    HTMLTableCellElement     :  true,
    HTMLTableColElement      :  true,
    HTMLTableElement         :  true,
    HTMLTableRowElement      :  true,
    HTMLTableSectionElement  :  true,
    HTMLTextAreaElement      :  true,
    HTMLTitleElement         :  true,
    HTMLUListElement         :  true,
    HTMLVideoElement         :  true,
    Int16Array               :  true,
    Int32Array               :  true,
    Int8Array                :  true,
    Image                    :  true,
    localStorage             :  true,
    location                 :  true,
    navigator                :  true,
    open                     :  true,
    openDatabase             :  true,
    Option                   :  true,
    parent                   :  true,
    print                    :  true,
    removeEventListener      :  true,
    resizeBy                 :  true,
    resizeTo                 :  true,
    screen                   :  true,
    scroll                   :  true,
    scrollBy                 :  true,
    scrollTo                 :  true,
    sessionStorage           :  true,
    setInterval              :  true,
    setTimeout               :  true,
    SharedWorker             :  true,
    Uint16Array              :  true,
    Uint32Array              :  true,
    Uint8Array               :  true,
    WebSocket                :  true,
    window                   :  true,
    Worker                   :  true,
    XMLHttpRequest           :  true,
    XPathEvaluator           :  true,
    XPathException           :  true,
    XPathExpression          :  true,
    XPathNamespace           :  true,
    XPathNSResolver          :  true,
    XPathResult              :  true,
    // Devel
    alert                    : true,
    confirm                  : true,
    console                  : true,
    Debug                    : true,
    opera                    : true,
    prompt                   : true,
    // Frameworks
    jQuery                   : true,
    "$"                      : true,
    "$$"                     : true,
    goog                     : true,
    dojo                     : true,
    dojox                    : true,
    dijit                    : true,
    apf                      : true,
    // mootools
    Assets                   : true,
    Browser                  : true,
    Chain                    : true,
    Class                    : true,
    Color                    : true,
    Cookie                   : true,
    Core                     : true,
    Document                 : true,
    DomReady                 : true,
    DOMReady                 : true,
    Drag                     : true,
    Element                  : true,
    Elements                 : true,
    Event                    : true,
    Events                   : true,
    Fx                       : true,
    Group                    : true,
    Hash                     : true,
    HtmlTable                : true,
    Iframe                   : true,
    IframeShim               : true,
    InputValidator           : true,
    instanceOf               : true,
    Keyboard                 : true,
    Locale                   : true,
    Mask                     : true,
    MooTools                 : true,
    Native                   : true,
    Options                  : true,
    OverText                 : true,
    Request                  : true,
    Scroller                 : true,
    Slick                    : true,
    Slider                   : true,
    Sortables                : true,
    Spinner                  : true,
    Swiff                    : true,
    Tips                     : true,
    Type                     : true,
    typeOf                   : true,
    URI                      : true,
    Window                   : true,
    // prototype.js
    '$A'                     : true,
    '$F'                     : true,
    '$H'                     : true,
    '$R'                     : true,
    '$break'                 : true,
    '$continue'              : true,
    '$w'                     : true,
    Abstract                 : true,
    Ajax                     : true,
    Enumerable               : true,
    Field                    : true,
    Form                     : true,
    Insertion                : true,
    ObjectRange              : true,
    PeriodicalExecuter       : true,
    Position                 : true,
    Prototype                : true,
    Selector                 : true,
    Template                 : true,
    Toggle                   : true,
    Try                      : true,
    Autocompleter            : true,
    Builder                  : true,
    Control                  : true,
    Draggable                : true,
    Draggables               : true,
    Droppables               : true,
    Effect                   : true,
    Sortable                 : true,
    SortableObserver         : true,
    Sound                    : true,
    Scriptaculous            : true,
    // require.js
    define                   : true,
    // node.js
    __filename               : true,
    __dirname                : true,
    Buffer                   : true,
    exports                  : true,
    GLOBAL                   : true,
    global                   : true,
    module                   : true,
    process                  : true,
    require                  : true,
    // Standard
    Array                    : true,
    Boolean                  : true,
    Date                     : true,
    decodeURI                : true,
    decodeURIComponent       : true,
    encodeURI                : true,
    encodeURIComponent       : true,
    Error                    : true,
    'eval'                   : true,
    EvalError                : true,
    Function                 : true,
    hasOwnProperty           : true,
    isFinite                 : true,
    isNaN                    : true,
    JSON                     : true,
    Math                     : true,
    Number                   : true,
    Object                   : true,
    parseInt                 : true,
    parseFloat               : true,
    RangeError               : true,
    ReferenceError           : true,
    RegExp                   : true,
    String                   : true,
    SyntaxError              : true,
    TypeError                : true,
    URIError                 : true,
    // non-standard
    escape                   : true,
    unescape                 : true
};

handler.handlesLanguage = function(language) {
    return language === 'javascript';
};

function Variable(declaration) {
    this.declarations = [];
    if(declaration)
        this.declarations.push(declaration);
    this.uses = [];
}

Variable.prototype.addUse = function(node) {
    this.uses.push(node);
};

Variable.prototype.addDeclaration = function(node) {
    this.declarations.push(node);
};

handler.analyze = function(doc, ast) {
    var handler = this;
    var markers = [];
    
    // Preclare variables (pre-declares, yo!)
    function preDeclareHoisted(scope, node) {
        node.traverseTopDown(
            // var bla;
            'VarDecl(x)', function(b, node) {
                node.setAnnotation("scope", scope);
                if(!scope.hasOwnProperty(b.x.value))
                    scope[b.x.value] = new Variable(b.x);
                else
                    scope[b.x.value].addDeclaration(b.x);
                return node;
            },
            // var bla = 10;
            'VarDeclInit(x, _)', function(b, node) {
                node.setAnnotation("scope", scope);
                if(!scope.hasOwnProperty(b.x.value))
                    scope[b.x.value] = new Variable(b.x);
                else
                    scope[b.x.value].addDeclaration(b.x);
                return node;
            },
            // function bla(farg) { }
            'Function(x, _, _)', function(b, node) {
                node.setAnnotation("scope", scope);
                if(b.x.value) {
                    scope[b.x.value] = new Variable(b.x);
                }
                return node;
            }
        );
    }
    
    function scopeAnalyzer(scope, node, parentLocalVars) {
        preDeclareHoisted(scope, node);
        var localVariables = parentLocalVars || [];
        function analyze(scope, node) {
            node.traverseTopDown(
                'VarDecl(x)', function(b) {
                    localVariables.push(scope[b.x.value]);
                },
                'VarDeclInit(x, _)', function(b) {
                    localVariables.push(scope[b.x.value]);
                },
                'Assign(Var(x), e)', function(b, node) {
                    if(!scope[b.x.value]) {
                        markers.push({
                            pos: node[0].getPos(),
                            type: 'warning',
                            message: 'Assigning to undeclared variable.'
                        });
                    }
                    else {
                        scope[b.x.value].addUse(node[0]);
                    }
                    analyze(scope, b.e);
                    return this;
                },
                'ForIn(Var(x), e, stats)', function(b, node) {
                    if(!scope[b.x.value]) {
                        markers.push({
                            pos: node[0].getPos(),
                            type: 'warning',
                            message: 'Using undeclared variable as iterator variable.'
                        });
                    }
                    else {
                        scope[b.x.value].addUse(node);
                    }
                    analyze(scope, b.e);
                    analyze(scope, b.stats);
                    return this;
                },
                'Var(x)', function(b, node) {
                    node.setAnnotation("scope", scope);
                    if(scope[b.x.value]) {
                        scope[b.x.value].addUse(node);
                    } else if(handler.isFeatureEnabled("undeclaredVars") && !GLOBALS[b.x.value]) {
                        markers.push({
                            pos: this.getPos(),
                            type: 'warning',
                            message: "Undeclared variable."
                        });
                    }
                    return node;
                },
                'Function(x, fargs, body)', function(b, node) {
                    node.setAnnotation("scope", scope);

                    var newScope = Object.create(scope);
                    newScope['this'] = new Variable();
                    b.fargs.forEach(function(farg) {
                        farg.setAnnotation("scope", newScope);
                        newScope[farg[0].value] = new Variable(farg);
                        if (handler.isFeatureEnabled("unusedFunctionArgs"))
                            localVariables.push(newScope[farg[0].value]);
                    });
                    scopeAnalyzer(newScope, b.body);
                    return node;
                },
                'Catch(x, body)', function(b, node) {
                    var oldVar = scope[b.x.value];
                    // Temporarily override
                    scope[b.x.value] = new Variable(b.x);
                    scopeAnalyzer(scope, b.body, localVariables);
                    // Put back
                    scope[b.x.value] = oldVar;
                    return node;
                },
                'PropAccess(_, "lenght")', function(b, node) {
                    markers.push({
                        pos: node.getPos(),
                        type: 'warning',
                        message: "Did you mean 'length'?"
                    });
                },
                'Call(Var("parseInt"), [_])', function() {
                    markers.push({
                        pos: this[0].getPos(),
                        type: 'warning',
                        message: "Missing radix argument."
                    });
                }
            );
        }
        analyze(scope, node);
        if(!parentLocalVars) {
            for (var i = 0; i < localVariables.length; i++) {
                if (localVariables[i].uses.length === 0) {
                    var v = localVariables[i];
                    v.declarations.forEach(function(decl) {
                        markers.push({
                            pos: decl.getPos(),
                            type: 'unused',
                            message: 'Unused variable.'
                        });
                    });
                }
            }
        }
    }
    scopeAnalyzer({}, ast);
    return markers;
};

handler.onCursorMovedNode = function(doc, fullAst, cursorPos, currentNode) {
    if (!currentNode)
        return;
    var markers = [];
    var enableRefactorings = [];
    
    function highlightVariable(v) {
        if (!v)
            return;
        v.declarations.forEach(function(decl) {    
            if(decl.getPos())    
                markers.push({
                    pos: decl.getPos(),
                    type: 'occurrence_main'
                });
        });    
        v.uses.forEach(function(node) {
            markers.push({
                pos: node.getPos(),
                type: 'occurrence_other'
            });
        });
    }
    currentNode.rewrite(
        'Var(x)', function(b) {
            var scope = this.getAnnotation("scope");
            if (!scope)
                return;
            var v = scope[b.x.value];
            highlightVariable(v);
            // Let's not enable renaming 'this' and only rename declared variables
            if(b.x.value !== "this" && v)
                enableRefactorings.push("renameVariable");
        },
        'VarDeclInit(x, _)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            enableRefactorings.push("renameVariable");
        },
        'VarDecl(x)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            enableRefactorings.push("renameVariable");
        },
        'FArg(x)', function(b) {
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            enableRefactorings.push("renameVariable");
        },
        'Function(x, _, _)', function(b) {
            // Only for named functions
            if(!b.x.value)
                return;
            highlightVariable(this.getAnnotation("scope")[b.x.value]);
            enableRefactorings.push("renameVariable");
        }
    );
    
    if (!this.isFeatureEnabled("instanceHighlight"))
        return { enableRefactorings: enableRefactorings };    

    return {
        markers: markers,
        enableRefactorings: enableRefactorings
    };
};

handler.getVariablePositions = function(doc, fullAst, cursorPos, currentNode) {
    var v;
    var mainNode;    
    currentNode.rewrite(
        'VarDeclInit(x, _)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = b.x;    
        },
        'VarDecl(x)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = b.x;
        },
        'FArg(x)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = node;
        },
        'Function(x, _, _)', function(b, node) {
            if(!b.x.value)
                return;
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = b.x;
        },
        'Var(x)', function(b, node) {
            v = node.getAnnotation("scope")[b.x.value];
            mainNode = node;
        }
    );
    var pos = mainNode.getPos();
    var others = [];

    var length = pos.ec - pos.sc;

    v.declarations.forEach(function(node) {
         if(node !== currentNode[0]) {
            var pos = node.getPos();
            others.push({column: pos.sc, row: pos.sl});
        }
    });
    
    v.uses.forEach(function(node) {
        if(node !== currentNode) {
            var pos = node.getPos();
            others.push({column: pos.sc, row: pos.sl});
        }
    });
    return {
        length: length,
        pos: {
            row: pos.sl,
            column: pos.sc
        },
        others: others
    };
};

});
if (typeof process !== "undefined") {
    require("../../../support/paths");
    require.paths.unshift(__dirname + "/../..");
    require.paths.unshift(__dirname + "/../../../support/treehugger/lib");
}

define(function(require, exports, module) {

var assert = require("ace/test/assertions");
var LanguageWorker = require('ext/language/worker').LanguageWorker;
var EventEmitter = require("ace/lib/event_emitter").EventEmitter;

module.exports = {
    "test unused variable" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            assert.equal(markers[0].message, 'Unused variable.');
            assert.equal(markers[0].pos.sl, 0);
            assert.equal(markers[0].pos.el, 0);
            assert.equal(markers[0].pos.sc, 4);
            assert.equal(markers[0].pos.ec, 9);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        assert.equal(worker.handlers.length, 2);
        worker.switchFile("test.js", "javascript", "var hello = false;");
    },
    "test unused variable scoped" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            assert.equal(markers[0].message, 'Unused variable.');
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        assert.equal(worker.handlers.length, 2);
        worker.switchFile("test.js", "javascript", "var hello = false; function noName() { var hello = true; hello = false; }");
    },
    "test unused variable scoped without var decl" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 0);
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        assert.equal(worker.handlers.length, 2);
        worker.switchFile("test.js", "javascript", "var hello = false; function noName() { hello = false; }");
    },
    "test undeclared variable" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            assert.equal(markers[0].message, 'Assigning to undeclared variable.');
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        assert.equal(worker.handlers.length, 2);
        worker.switchFile("test.js", "javascript", "hello = false;");
    },
    "test undeclared iteration variable" : function(next) {
        var emitter = Object.create(EventEmitter);
        emitter.emit = emitter._dispatchEvent;
        emitter.on("markers", function(markers) {
            assert.equal(markers.length, 1);
            assert.equal(markers[0].message, 'Using undeclared variable as iterator variable.');
            next();
        });
        var worker = new LanguageWorker(emitter);
        worker.register("ext/jslanguage/scope_analyzer");
        worker.register("ext/jslanguage/parse");
        worker.switchFile("test.js", "javascript", "for(p in {}) { }");
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}function simpleFunction() {
}

function simpleFunctionNested(a, b) {
    function nested(c) {
    }
}

(function() {
    var someFunction = function(a, b) {
    };
    
    someFunction.bla = function() {
    };
})();function simpleFunction() {
}

function simpleFunctionNested(a, b) {
    function nested(c) {
    }
}

(function() {
    var someFunction = function(a, b) {
    };
    
    someFunction.bla = function() {
    };
})();/**
 * Keybindings Manager for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

module.exports = ext.register("ext/keybindings/keybindings", {
    name: "Keybindings Manager",
    dev: "Ajax.org",
    alone: true,
    type: ext.GENERAL,
    current: null,
    nodes: [],

    init : function(amlNode) {
        // Fetch the default keybindings:
        var _self = this;
        ide.addEventListener("loadsettings", function(e) {
            var value = e.model.queryValue("general/keybindings/@preset") 
                || "default_" + (apf.isMac ? "mac" : "win");
                
            require(["ext/keybindings_default/" + value]);
        });
    },
    
    update : function(oExt) {
        var j, l, command, items, item, val;
        var name     = oExt.path.split("/").pop().toLowerCase();
        var bindings = this.current[name];
        
        if (!bindings || !oExt.commands) 
            return;
        for (command in oExt.commands) {
            if (!bindings[command])
                continue;
            if (typeof (val = oExt.commands[command])["hotkey"] !== "undefined")
                apf.hotkeys.remove(val.hotkey);
            oExt.commands[command].hotkey = bindings[command];
            if (ext.commandsLut[command])
                ext.commandsLut[command].hotkey = bindings[command];
            if ((items = (oExt.hotitems && oExt.hotitems[command]))) {
                for (j = 0, l = items.length; j < l; ++j) {
                    item = items[j];
                    if (!item.setAttribute) continue;
                    item.setAttribute("hotkey", bindings[command]);
                }
            }
            else if (typeof oExt[command] == "function") {
                apf.hotkeys.register(bindings[command], oExt[command].bind(oExt));
            }
            else {
                apf.console.error("Please implement the '" + command
                    + "' function on plugin '" + oExt.name + "' for the keybindings to work");
            }
        }
    },

    onLoad: function(def) {
        var _self = this;
        
        // update keybindings for extensions
        def = def.ext;
        
        // parse keybindings definition
        this.current = def;
        
        var i, oExt;
        for (i in ext.extLut) {
            //name     = i.substr(i.lastIndexOf("/") + 1).toLowerCase();
            //bindings = def[name];
            oExt     = ext.extLut[i];
            this.update(oExt);
        }
        
        if (!this.eventsInited) {
            ide.dispatchEvent("keybindingschange", { keybindings: def });
            ide.addEventListener("$event.keybindingschange", function(callback) {
                if (_self.current)
                    callback({keybindings: _self.current});
            });
            
            ide.addEventListener("ext.register", function(e){
                _self.update(e.ext);
            });
            
            this.eventsInited = true;
        }
        
        return def;
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
/**
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var keys = require("ext/keybindings/keybindings");

return keys.onLoad({
    "ext" : {
        "console" : {
            "switchconsole": "Shift-Esc"
        },
        "save" : {
            "quicksave": "Command-S",
            "saveas": "Command-Shift-S",
	    "reverttosaved": "Command-Shift-Q"
        },
        "undo" : {
            "undo": "Command-Z",
            "redo": "Command-Shift-Z"
        },
        "clipboard" : {
            "cut": "Shift-Command-X",
            "copy": "Command-C",
            "paste": "Command-V"
        },
        "quickwatch": {
            "quickwatch": "Option-Q"
        },
        "runpanel": {
            "run" : "F5",
            "stop" : "Shift-F5"
        },
        "debugger": {
            "resume": "F8",
            "stepinto": "F11",
            "stepover": "F10",
            "stepout": "Shift-F11"
        },
        "zen": {
            "zen": "Command-E",
            "zenslow": "Command-Shift-E"
        },
        "gotoline": {
           "gotoline": "Command-L"
        },
        "beautify": {
            "beautify": "Command-Shift-B"
        },
        "gotofile": {
            "gotofile": "Alt-Shift-R"
        },
        "newresource": {
            "newfile": "Option-Shift-N",
            "newfiletemplate": "Option-Ctrl-N",
            "newfolder": "Option-Ctrl-Shift-N"
        },
        "quicksearch": {
            "find": "Command-F",
            "findnext": "Command-G",
            "findprevious": "Command-Shift-G"
        },
        "searchreplace" : {
            "search": "Command-Shift-F",
            "searchreplace": "Command-Shift-R"
        },
        "searchinfiles" : {
            "searchinfiles": "Alt-Shift-F"
        },
        "formatjson" : {
            "format" : "Command-Shift-J"
        },
        "settings": {
            "showsettings": "Command-,"
        },
        "tabbehaviors" : {
            "closetab": "Option-W",
            "closealltabs": "Option-Shift-W",
            "closeallbutme": "Command-Option-W",
            "gototabright": "Command-]",
            "gototableft": "Command-[",
            "tab1": "Command-1",
            "tab2": "Command-2",
            "tab3": "Command-3",
            "tab4": "Command-4",
            "tab5": "Command-5",
            "tab6": "Command-6",
            "tab7": "Command-7",
            "tab8": "Command-8",
            "tab9": "Command-9",
            "revealtab": "Command-Shift-L",
            "nexttab": "Command-Tab|Option-Tab",
            "previoustab": "Command-Shift-Tab|Option-Shift-Tab"
        },
        "tabsessions" : {
            "savetabsession": "Command-Alt-S"
        },
        "splitview" : {
            "mergetableft": "Command-Option-[",
            "mergetabright": "Command-Option-]"
        },
        "code" : {
            "selectall": "Command-A",
            "removeline": "Command-D",
            "togglecomment": "Command-/",
            "findnext": "Command-G",
            "findprevious": "Command-Shift-G",
            "find": "Command-F",
            "replace": "Command-Shift-R",
            "undo": "Command-Z",
            "redo": "Command-Shift-Z|Command-Y",
            "overwrite": "Insert",
            "copylinesup": "Command-Option-Up",
            "movelinesup": "Option-Up",
            "selecttostart": "Command-Shift-Up",
            "gotostart": "Command-Home|Command-Up",
            "selectup": "Shift-Up",
            "golineup": "Up",
            "copylinesdown": "Command-Option-Down",
            "movelinesdown": "Option-Down",
            "selecttoend": "Command-Shift-Down",
            "gotoend": "Command-End|Command-Down",
            "selectdown": "Shift-Down",
            "golinedown": "Down",
            "selectwordleft": "Option-Shift-Left",
            "gotowordleft": "Option-Left",
            "selecttolinestart": "Command-Shift-Left",
            "gotolinestart": "Command-Left|Home",
            "selectleft": "Shift-Left",
            "gotoleft": "Left",
            "selectwordright": "Option-Shift-Right",
            "gotowordright": "Option-Right",
            "selecttolineend": "Command-Shift-Right",
            "gotolineend": "Command-Right|End",
            "selectright": "Shift-Right",
            "gotoright": "Right",
            "gotopagedown": "Command-PageDown",
            "selectpagedown": "Shift-PageDown",
            "pagedown": "PageDown",
            "gotopageup": "Command-PageUp",
            "selectpageup": "Shift-PageUp",
            "pageup": "PageUp",
            "selectlinestart": "Shift-Home",
            "selectlineend": "Shift-End",
            "del": "Delete",
            "backspace": "Command-Backspace|Option-Backspace|Backspace",
            "outdent": "Shift-Tab",
            "indent": "Tab"
        },
        "language": {
            "complete": "Ctrl-Space|Alt-Space",
            "renameVar": "Command-Option-R"
        }
    }
});

});
/**
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var keys = require("ext/keybindings/keybindings");

return keys.onLoad({
    "ext" : {
        "console" : {
            "switchconsole": "Shift-Esc"
        },
        "save" : {
            "quicksave": "Ctrl-S",
            "saveas": "Ctrl-Shift-S",
            "reverttosaved": "Ctrl-Shift-Q"
        },
        "undo" : {
            "undo": "Ctrl-Z",
            "redo": "Ctrl-Y"
        },
        "clipboard" : {
            "cut": "Ctrl-X",
            "copy": "Ctrl-C",
            "paste": "Ctrl-V"
        },
        "quickwatch": {
            "quickwatch": "Ctrl-Q"
        },
        "runpanel": {
            "run" : "Ctrl-F5",
            "stop" : "Shift-F5"
        },
        "debugger": {
            "resume": "F8",
            "stepinto": "F11",
            "stepover": "F10",
            "stepout": "Shift-F11"
        },
        "zen": {
            "zen": "Ctrl-E",
            "zenslow": "Ctrl-Shift-E"
        },
        "gotoline": {
            "gotoline": "Ctrl-G"
        },
        "beautify": {
            "beautify": "Ctrl-Shift-B"
        },
        "gotofile": {
            "gotofile": "Alt-Shift-R"
        },
        "newresource": {
            "newfile": "Ctrl-N",
            "newfiletemplate": "Ctrl-Shift-N",
            "newfolder": "Ctrl-Alt-N"
        },
        "quicksearch": {
            "find": "Ctrl-F",
            "findnext": "Ctrl-K",
            "findprevious": "Ctrl-Shift-K"
        },
        "searchreplace" : {
            "search": "Ctrl-Shift-F",
            "searchreplace": "Ctrl-Shift-R"
        },
        "searchinfiles" : {
            "searchinfiles": "Alt-Shift-F"
        },
        "formatjson" : {
            "format" : "Ctrl-Shift-J"
        },
        "settings": {
            "showsettings": "Ctrl-,"
        },
        "tabbehaviors" : {
            "closetab": "Ctrl-W",
            "closealltabs": "Ctrl-Shift-W",
            "closeallbutme": "Ctrl-Alt-W",
            "gototabright": "Ctrl-]",
            "gototableft": "Ctrl-[",
            "tab1": "Ctrl-1",
            "tab2": "Ctrl-2",
            "tab3": "Ctrl-3",
            "tab4": "Ctrl-4",
            "tab5": "Ctrl-5",
            "tab6": "Ctrl-6",
            "tab7": "Ctrl-7",
            "tab8": "Ctrl-8",
            "tab9": "Ctrl-9",
            "revealtab": "Ctrl-Shift-L",
            "nexttab": "Ctrl-Tab",
            "previoustab": "Ctrl-Shift-Tab"
        },
        "tabsessions" : {
            "savetabsession": "Ctrl-Alt-S"
        },
        "splitview" : {
            "mergetableft": "Ctrl-Alt-[",
            "mergetabright": "Ctrl-Alt-]"
        },
        "code" : {
            "selectall": "Ctrl-A",
            "removeline": "Ctrl-D",
            "gotoline": "Ctrl-G",
            "togglecomment": "Ctrl-7",
            "findnext": "F3",
            "findprevious": "Shift-F3",
            "find": "Ctrl-F",
            "replace": "Ctrl-Shift-R",
            "undo": "Ctrl-Z",
            "redo": "Ctrl-Shift-Z|Ctrl-Y",
            "overwrite": "Insert",
            "copylinesup": "Ctrl-Alt-Up",
            "movelinesup": "Ctrl-Up",
            "selecttostart": "Ctrl-Shift-Up",
            "gotostart": "Ctrl-Home",
            "selectup": "Shift-Up",
            "golineup": "Up",
            "copylinesdown": "Ctrl-Alt-Down",
            "movelinesdown": "Ctrl-Down",
            "selecttoend": "Ctrl-Shift-Down",
            "gotoend": "Ctrl-End",
            "selectdown": "Shift-Down",
            "golinedown": "Down",
            "selectwordleft": "Ctrl-Shift-Left",
            "gotowordleft": "Ctrl-Left",
            "selecttolinestart": "Alt-Shift-Left",
            "gotolinestart": "Alt-Left|Home",
            "selectleft": "Shift-Left",
            "gotoleft": "Left",
            "selectwordright": "Ctrl-Shift-Right",
            "gotowordright": "Ctrl-Right",
            "selecttolineend": "Alt-Shift-Right",
            "gotolineend": "Alt-Right|End",
            "selectright": "Shift-Right",
            "gotoright": "Right",
            "selectpagedown": "Shift-PageDown",
            "pagedown": "PageDown",
            "selectpageup": "Shift-PageUp",
            "pageup": "PageUp",
            "selectlinestart": "Shift-Home",
            "selectlineend": "Shift-End",
            "del": "Delete",
            "backspace": "Backspace",
            "outdent": "Shift-Tab",
            "indent": "Tab"
        },
        "language": {
            "complete": "Ctrl-Space|Alt-Space",
            "renameVar": "Ctrl-Alt-R"
        }
    }
});

});
/**
 * Default Keybindings Help Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/keybindings_default/keybindings_default.xml");
var css = require("text!ext/keybindings_default/keybindings_default.css");

var mac = require("text!ext/keybindings_default/default_mac.js");
var win = require("text!ext/keybindings_default/default_win.js");

function parseKeyBindings(txt) {
    var json;
    txt.replace(/keys\.onLoad\(([\w\W\n\r]*)\);\n/gm, function(m, s){
        json = s.replace(/\);[\n\r\s]*\}$/, "");
    });
    return JSON.parse(json);
}

var extCache = {};

function uCaseFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function generatePanelHtml(def, isMac) {
    var html = [];
    var div, extName, oExt, cmdName, command, parts;
    var count = 0;
    for (extName in def.ext) {
        ++count;
        oExt = extCache[extName];
        if (!extCache[extName]) {
            try {
                oExt = extCache[extName] = require("ext/" + extName + "/" + extName);
            }
            catch(ex) {
                continue;
            }
        }
        
        div = count % 3;
        html.push('<div class="keybindings_default_block',
            (div === 1 || div === 2 ? "_border" : ""),
            '"><h3>', oExt.name.toUpperCase(), "</h3>");
        for (cmdName in def.ext[extName]) {
            command = def.ext[extName][cmdName];
            html.push('<div class="keybindings_default_command">',
                '<span class="keybindings_default_cmdname">',
                    (oExt.commands && oExt.commands[cmdName].short 
                        ? oExt.commands[cmdName].short
                        : uCaseFirst(cmdName)
                    ),
                '</span><br/>');
            command = command.split("|")[0];
            if (isMac)
                parts = apf.hotkeys.toMacNotation(command).split(" ");
            else
                parts = command.split("-");
            html.push('<span class="keybindings_default_cmdkey">', 
                parts.join('</span><span class="keybindings_default_cmdop">+</span><span class="keybindings_default_cmdkey">'),
                '</span></div>');
        }
        html.push("</div>");
    }
    return html.join("");
}

module.exports = ext.register("ext/keybindings_default/keybindings_default", {
    name    : "Default Keybindings",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    
    commands : {
        "keybindings": {hint: "show a window that lists all available key shortcuts within the IDE"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        apf.importCssString(css || "");
        
        this.hotitems.keybindings = [this.nodes[0]];
    },

    init : function(amlNode){
        apf.document.body.insertMarkup(markup);
        
        var as = Array.prototype.slice.call(winKeyBindings.$ext.getElementsByTagName("a"));
        var _self = this;
        as.forEach(function(a) {
            var which = a.innerHTML.indexOf("Mac") > -1 ? "mac" : "win";
            apf.addListener(a, "mousedown", function(e) {
                _self.togglePanels(which);
            });
        });
        
        this.buildPanels();
    },
    
    togglePanels: function(which) {
        if (which == "mac") {
            //barKeyBindingsWin.hide();
            //barKeyBindingsMac.show();
            barKeyBindingsWin.setAttribute("visible", "false");
            barKeyBindingsMac.setAttribute("visible", "true");
        }
        else {
            barKeyBindingsMac.setAttribute("visible", "false");
            barKeyBindingsWin.setAttribute("visible", "true");
            //barKeyBindingsMac.hide();
            //barKeyBindingsWin.show();
        }
    },
    
    buildPanels: function() {
        // build windows panel:
        var panelWin = barKeyBindingsWin;
        panelWin.$ext.innerHTML = generatePanelHtml(parseKeyBindings(win));
        
        // build mac panel:
        var panelMac = barKeyBindingsMac;
        panelMac.$ext.innerHTML = generatePanelHtml(parseKeyBindings(mac), true);
    },
    
    keybindings: function() {
        ext.initExtension(this);
        winKeyBindings.show();
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

});/**
 * Minimap plugin for Cloud9
 * 
 * @author Sergi Mansilla
 * @contributor Matt Pardee
 * @copyright 2012, Cloud9 IDE, Inc.
 * 
 * TODO:
 * - On direct click in the map, it should
 *      take the user to the line he was pointing
 *      to, and not to the relative position of
 *      the document to the Y coordinate of the map.
 */

define(function(require, exports, module) {

var LINE_HEIGHT = 4;
var MARGIN_RIGHT = 2;

var Map = (function() {
    Map.createCanvas = function(w, h) {
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        return {
            canvas : canvas,
            ctx : canvas.getContext("2d")
        };
    };

    Map.storeCanvas = function(width, height, lines) {
        var canvas = Map.createCanvas(width, height);
        var ctx = canvas.ctx;
        ctx.font = LINE_HEIGHT + "px Monospace";
        ctx.fillStyle = "#fff";

        for (var i = 0, _len = lines.length; i < _len; i++)
            ctx.fillText(lines[i], 0, (i << 2) + LINE_HEIGHT);

        return canvas;
    };

    Map.prototype.refreshCanvas = function(y) {
        var code = this.codeCanvas.canvas;
        var w = Math.min(this.c.width, code.width);
        var h = Math.min(this.c.height, code.height);
        if (this.codeCanvas.canvas.height < (y + h))
            h -= (y + h) - code.height;
        this.ctx.fillRect(0, 0, this.c.width, this.c.height);
        var dw = Math.max(w - MARGIN_RIGHT, 0);
        h = Math.max(h, 1);
        w = Math.max(w, 1);
        y = Math.max(y, 0);
        if (code.height !== 0 && code.width !== 0)
            return this.ctx.drawImage(code, 0, y, w, h, MARGIN_RIGHT, 0, dw, h);
    };

    Map.prototype.refreshVisor = function(y) {
        this.visor.style.top = y + "px";
    };

    Map.prototype.resize = function(w, h) {
        this.c.width = w;
        this.c.height = h;
        if (this.codeCanvas) {
            this.codeCanvas.width = w;
            this.codeCanvas.height = h;
        }
        this.visibleLines = this.ace.$getVisibleRowCount();
        this.visorHeight = Map.toHeight(this.visibleLines);
        this.visor.style.width = this.c.width + "px";
        this.visor.style.height = this.visorHeight + "px";
        this.render();
    };

    Map.prototype.getNormal = function() {
        var normal = this.visorTop / (this.c.height - this.visorHeight);
        if (normal > 1)
            normal = 1;
        else if (normal < 0)
            normal = 0;

        return normal;
    };

    Map.prototype.afterScroll = function() {
        if (!this.mousedown) {
            var topLine = this.ace.renderer.getFirstVisibleRow();
            this.normal = topLine / (this.lines.length - this.visibleLines);
            this.visorTop = this.normal * (this.c.height - this.visorHeight);
            return this.render();
        }
    };

    function Map(ace, c, visor) {
        var _self = this;
        this.ace = ace;
        this.c = c;
        this.visor = visor;
        this.visibleLines = this.ace.$getVisibleRowCount();
        this.visorHeight = Map.toHeight(this.visibleLines);
        this.ctx = c.getContext("2d");
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.c.width, this.c.height);
        this.visorTop = 0;
        this.inVisor = false;
        this.mousedown = false;

        this.ace.renderer.scrollBar.addEventListener("scroll", function() {
            _self.afterScroll();
        });

        var session = this.ace.getSession();

        visor.addEventListener("mousedown", function(e) {
            _self.inVisor = true;
            _self.visorDiff = e.offsetY || e.layerY;
            _self.mousedown = _self.visorDiff + _self.visorTop;
            _self.containerTop = apf.getAbsolutePosition(_self.c)[1];
        }, false);

        document.addEventListener("mousemove", function(e) {
            if (_self.inVisor && _self.mousedown !== false) {
                _self.visorTop = (e.pageY - _self.containerTop) - _self.visorDiff;
                _self.normal = _self.getNormal();
                _self.render(true);
            }
        }, false);

        document.addEventListener("mouseup", function(e) {
            if (!_self.inVisor && e.target === c) {
                _self.visorTop = (e.offsetY || e.layerY) - (_self.visorHeight / 2);
                _self.normal = _self.getNormal();
                _self.render(true);
            }
            _self.mousedown = _self.inVisor = false;
        }, false);

        this.updateSource(session);
    }

    Map.prototype.updateSource = function(session) {
        this.lines = session.getLines(0, session.getLength() - 1);
        this.actualHeight = Map.toHeight(this.lines.length);
        this.codeCanvas = Map.storeCanvas(this.c.width, this.actualHeight, this.lines);
        return this.render();
    };

    Map.prototype.render = function(scrollAce) {
        var top = 0;
        var height = Math.min(this.c.height, this.actualHeight);
        var fitsCanvas = this.actualHeight < this.c.height;
        var fitsScreen = this.visorHeight > height;
        var maxVisorY = height - this.visorHeight;
        if (fitsScreen) {
            this.refreshCanvas(0);
        }
        else {
            var visorTop = 0;
            if (this.visorTop > maxVisorY)
                visorTop = maxVisorY;
            else if (this.visorTop > 0)
                visorTop = this.visorTop;

            if (fitsCanvas) {
                top = visorTop;
                this.refreshCanvas(0);
            }
            else {
                top = (this.normal || 0) * (this.actualHeight - this.visorHeight);
                this.refreshCanvas(top - visorTop);
            }
            this.refreshVisor(visorTop);
        }

        if (scrollAce)
            this.ace.scrollToLine(Map.toLine(top));
    };

    Map.toLine = function(y) {
        return Math.ceil(y / LINE_HEIGHT);
    };

    Map.toHeight = function(line) {
        return line * LINE_HEIGHT;
    };

    Map.prototype.destroy = function() {
        this.lines = null;
        this.pixelData = null;
        this.ctx.clearRect(0, 0, this.c.width, this.c.height);
        this.c.removeEventListener("mousedown");
        this.c.removeEventListener("mousemove");
        this.c.removeEventListener("mouseup");
        this.c = this.ctx = this.ace = this.codeCanvas = null;
    };

    return Map;
})();

return module.exports = Map;

});/**
 * Minimap extension for Cloud9 IDE
 * 
 * @author Sergi Mansilla
 * @contributor Matt Pardee
 * @copyright 2012, Cloud9 IDE, Inc.
 */
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var Map = require("ext/minimap/map");
var css = require("text!ext/minimap/style.css");

return module.exports = ext.register("ext/minimap/minimap", {
    name  : "Minimap",
    dev   : "Cloud9 IDE, Inc.",
    type  : ext.GENERAL,
    alone : true,
    commands : {
        "minimap": {
            hint: "Hide or show the code minimap"
        }
    },
    nodes   : [],
    deps    : [editors],
    css     : css,
    map_width : 165,
    map_enabled : false,

    hook : function() {
        var _self = this;
        this.menuItem = new apf.item({
            id      : "mnuItemShowMinimap",
            type    : "check",
            caption : "Show Minimap",
            checked : "[{require('ext/settings/settings').model}::editors/code/@minimap]",
            onclick : function() {
                _self.toggle();
            }
        });

        this.nodes.push(mnuView.appendChild(this.menuItem));

        ide.addEventListener("afteropenfile", function() {
            ext.initExtension(_self);
            if (_self.editor)
                _self.updateMap();
        });

        ide.addEventListener("loadsettings", function(e) {
            _self.map_enabled = e.model.queryValue("editors/code/@minimap");
        });
    },

    init : function() {
        var _self = this;

        apf.importCssString((this.css || ""));

        this.editor = ceEditor.$editor;
        this.panel = ceEditor.parentNode.appendChild(new apf.bar({
            id : "minimapPanel",
            visible : false,
            top : 2,
            bottom : 0
        }));

        this.panel.$ext.style.right = "0";
        this.panel.$ext.style.webkitTextSizeAdjust = "none";
        this.canvas = document.createElement("canvas");
        this.panel.$ext.appendChild(this.canvas);
        this.visor = document.createElement("div");
        this.visor.setAttribute("id", "minimapVisor");
        this.panel.$ext.appendChild(this.visor);
        this.map = new Map(this.editor, this.canvas, this.visor);

        tabPlaceholder.addEventListener("resize", function() {
            if (_self.panel.visible)
                _self.map.resize(_self.map_width, ceEditor.getHeight());
        });

        tabEditors.addEventListener("afterswitch", function() {
            _self.updateMap();
            setTimeout(function() {
                _self.setupChangeListener();
            }, 200);
        });

        if (apf.isTrue(this.map_enabled)) {
            setTimeout(function() {
                _self.show();
            });
        }

        this.setupChangeListener();
    },
    
    setupChangeListener : function() {
        if (this.$changeEvent)
            this.editorSession.removeEventListener("change", this.$changeEvent);

        var _self = this;
        if(editors.currentEditor.ceEditor) {
            this.editorSession = editors.currentEditor.ceEditor.$editor.session;
            this.editorSession.addEventListener("change", this.$changeEvent = function() {
                if (_self.$updateTimer)
                    clearTimeout(_self.$updateTimer);
                _self.$updateTimer = setTimeout(function() {
                    _self.updateMap();
                }, 100);
            });
        }
    },

    // Support for CLI
    minimap : function() {
        mnuItemShowMinimap.dispatchEvent("click");
    },

    toggle : function() {
        if (apf.isTrue(this.map_enabled))
            this.hide();
        else
            this.show();
    },

    show : function() {
        this.editor.container.style.right = this.map_width + "px";
        this.panel.show();
        this.updateMap();
        this.map_enabled = true;

        ide.dispatchEvent("minimap.visibility", {
            visibility: "shown",
            width : this.map_width
        });
    },

    /**
     * Hide minimap
     * 
     * @param {boolean} noSetMapEnabled Whether to set `map_enabled`
     * @see this.disable()
     */
    hide : function(noSetMapEnabled) {
        this.panel.hide();
        this.editor.container.style.right = "0";

        if (!noSetMapEnabled)
            this.map_enabled = false;

        ide.dispatchEvent("minimap.visibility", {
            visibility: "hidden"
        });
    },

    updateMap : function() {
        if (this.panel.visible)
            this.map.updateSource(this.editor.getSession());
    },

    enable: function() {
        this.menuItem.show();

        if (this.map_enabled)
            this.show();
    },

    disable: function() {
        this.menuItem.hide();

        // We don't want to set the map_enabled var when disabling,
        // because when it's re-enabled we want it to re-appear if
        // map_enabled was originally set to true
        this.hide(true);
    },

    destroy: function() {
        this.nodes.each(function(item) {
            return item.destroy();
        });
        this.nodes = [];
        this.map.destroy();
        this.map = null;
        this.panel.destroy(true, true);
    }
});
});
/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var fs = require("ext/filesystem/filesystem");
var markup = require("text!ext/newresource/newresource.xml");

module.exports = ext.register("ext/newresource/newresource", {
    dev     : "Ajax.org",
    name    : "New Resource",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    markup  : markup,
    deps    : [fs],
    commands : {
        "newfile": {
            hint: "create a new file resource",
            msg: "New file created."
        },
        "newfolder": {
            hint: "create a new directory resource",
            msg: "New directory created."
        },
        "newfiletemplate": {hint: "open the new file template dialog"}
    },
    hotitems: {},

    nodes   : [],

    init : function(amlNode){
        var _self = this;

        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.divider(), ide.mnuFile.firstChild),
            ide.mnuFile.insertBefore(new apf.item({
                caption : "New Folder",
                onclick : function(){
                    _self.newfolder();
                }
            }), ide.mnuFile.firstChild),
            ide.mnuFile.insertBefore(new apf.item({
                caption : "New From Template...",
                onclick : function(){
                    _self.newfiletemplate();
                }
            }), ide.mnuFile.firstChild),
            ide.mnuFile.insertBefore(new apf.item({
                caption : "New File",
                onclick : function(){
                    _self.newfile();
                }
            }), ide.mnuFile.firstChild)
        );

        this.hotitems.newfile = [this.nodes[3]];
        this.hotitems.newfiletemplate = [this.nodes[2]];
        this.hotitems.newfolder = [this.nodes[1]];
    },

    newfile: function(type, value, path) {
        if (!type) type = "";

        var node = apf.getXml("<file />");
        
        if (!path && self.trFiles) {
            var sel = trFiles.selected;
    
            if (!sel) {
                trFiles.select(trFiles.$model.queryNode('folder'));
                sel = trFiles.selected;
            }
    
            if (sel) {
                path = sel.getAttribute("path");
                if (trFiles.selected.getAttribute("type") == "file" || trFiles.selected.tagName == "file")
                    path = path.replace(/\/[^\/]*$/, "/");
                else
                    path = path + "/";
            }
        }
        if (!path)
            path = ide.davPrefix + "/";

        var name = "Untitled", count = 1;
        while (tabEditors.getPage(path + name + count + type))
            count++;

        node.setAttribute("name", name + count + type);
        node.setAttribute("path", path + name + count + type);
        node.setAttribute("changed", "1");
        node.setAttribute("newfile", "1");

        var doc = ide.createDocument(node);
        if (value)
            doc.cachedValue = value;

        ide.dispatchEvent("openfile", {
            doc: doc,
            type: "newfile"
        });
        ide.dispatchEvent("track_action", {type: "template", template: type});
    },

    newfiletemplate : function(){
        winNewFileTemplate.show();
    },

    newfolder: function() {
        fs.createFolder();
        return false;
    },

    enable : function(){
        if (!this.disabled) return;

        this.nodes.each(function(item){
            item.enable();
        });
        this.disabled = false;
    },

    disable : function(){
        if (this.disabled) return;

        this.nodes.each(function(item){
            item.disable();
        });
        this.disabled = true;
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];

        mnuNew.destroy(true, true);

        tabEditors.removeEventListener("close", this.$close);
    }
});

    }
);
/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

require("apf/elements/debugger");
require("apf/elements/debughost");

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");
var markup = require("text!ext/noderunner/noderunner.xml");

module.exports = ext.register("ext/noderunner/noderunner", {
    name    : "Node Runner",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    offline : false,
    markup  : markup,
    commands: {
        "run": {
            "hint": "run a node program on the server",
            "commands": {
                "[PATH]": {"hint": "path pointing to an executable. Autocomplete with [TAB]"}
            }
        }
    },

    NODE_VERSION: "auto",

    init : function(){
        var _self = this;
        ide.addEventListener("socketDisconnect", this.onDisconnect.bind(this));
        ide.addEventListener("socketMessage", this.onMessage.bind(this));

        dbg.addEventListener("break", function(e){
            ide.dispatchEvent("break", e);
        });

        dbgNode.addEventListener("onsocketfind", function() {
            return ide.socket;
        });

        stDebugProcessRunning.addEventListener("activate", this.$onDebugProcessActivate.bind(this));
        stDebugProcessRunning.addEventListener("deactivate", this.$onDebugProcessDeactivate.bind(this));

        ide.addEventListener("consolecommand.run", function(e) {
            ide.send({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "noderunner"
            });
            return false;
        });

        ide.addEventListener("loadsettings", function(e){
            _self.NODE_VERSION = e.model.queryValue("auto/node-version/@version") || "auto";
        });
    },

    $onDebugProcessActivate : function() {
        dbg.attach(dbgNode, 0);
    },

    $onDebugProcessDeactivate : function() {
        dbg.detach(function(){});
    },

    onMessage : function(e) {
        var message = e.message;
        //console.log("MSG", message)

        switch(message.type) {
            case "node-debug-ready":
                ide.dispatchEvent("debugready");
                break;

            case "chrome-debug-ready":
                winTab.show();
                dbgChrome.loadTabs();
                ide.dispatchEvent("debugready");
                break;

            case "node-exit":
                stProcessRunning.deactivate();
                stDebugProcessRunning.deactivate();
                break;

            case "node-exit-with-error":
                stProcessRunning.deactivate();
                stDebugProcessRunning.deactivate();

                // TODO: is this the way to report an errror?
                txtOutput.addValue("<div class='item console_log' style='font-weight:bold;color:#ff0000'>[C9 Server Exception: "
                        + message.errorMessage + "</div>");
                break;

            case "state":
                stDebugProcessRunning.setProperty("active", message.debugClient || message.nodeDebugClient);
                stProcessRunning.setProperty("active", message.processRunning || message.nodeProcessRunning || message.pythonProcessRunning);
                dbgNode.setProperty("strip", message.workspaceDir + "/");
                ide.dispatchEvent("noderunnerready");
                break;

            case "error":
                // child process already running
                if (message.code == 1) {
                    stDebugProcessRunning.setProperty("active", false);
                    stProcessRunning.setProperty("active", true);

                    //ide.send({"command": "state"});
                    break;
                }
                // debug process already running
                else if (message.code == 5) {
                    stDebugProcessRunning.setProperty("active", true);
                    stProcessRunning.setProperty("active", true);

                    //ide.send({"command": "state"});
                    break;
                }

                /*
                    6:
                    401: Authorization Required
                */
                // Command error
                if (message.code === 9) {
                    txtConsole.addValue("<div class='item console_log' style='font-weight:bold;color:yellow'>"
                        + message.message + "</div>");
                }
                else if (message.code !== 6 && message.code != 401 && message.code != 455 && message.code != 456) {
                    txtConsole.addValue("<div class='item console_log' style='font-weight:bold;color:#ff0000'>[C9 Server Exception "
                        + (message.code || "") + "] " + message.message + "</div>");

                    apf.ajax("/debug", {
                        method      : "POST",
                        contentType : "application/json",
                        data        : apf.serialize({
                            agent   : navigator.userAgent,
                            type    : "C9 SERVER EXCEPTION",
                            code    : e.code,
                            message : e.message
//                            log     : apf.console.debugInfo.join("\n")
                        })
                    });
                }

                ide.send({"command": "state"});
                break;
        }
    },

    onDisconnect : function() {
        stDebugProcessRunning.deactivate();
    },

    debug : function() {
        this.$run(true);
    },

    run : function(path, args, debug, nodeVersion) {
        // this is a manual action, so we'll tell that to the debugger
        dbg.registerManualAttach();
        if (stProcessRunning.active || !stServerConnected.active || typeof path != "string")
            return false;

        if (nodeVersion == 'default')
            nodeVersion = "";

        path = path.trim();

        var page = ide.getActivePageModel();
        var command = {
            "command" : apf.isTrue(debug) ? "RunDebugBrk" : "Run",
            "file"    : path.replace(/^\/+/, ""),
            "runner"  : "node",
            "args"    : args || "",
            "version" : nodeVersion || settings.model.queryValue("auto/node-version/@version") || this.NODE_VERSION,
            "env"     : {
                "C9_SELECTED_FILE": page ? page.getAttribute("path").slice(ide.davPrefix.length) : ""
            }
        };
        ide.send(command);
    },

    stop : function() {
        if (!stProcessRunning.active)
            return;

        ide.send({
            "command": "kill",
            "runner"  : "node"
        });
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});
/**
 * Test Panel for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var fs = require("ext/filesystem/filesystem");
var newresource = require("ext/newresource/newresource");
var noderunner = require("ext/noderunner/noderunner");
var testpanel = require("ext/testpanel/testpanel");
var console = require("ext/console/console");
var template = require("text!ext/nodeunit/nodeunit.template");

var parser = require("treehugger/js/parse");
require("treehugger/traverse");

function escapeXpathString(name){
    if (name.indexOf('"') > -1) {
        var out = [], parts = name.split('"');
        parts.each(function(part) {
            out.push(part == '' ? "'\"'" : '"' + part + '"');
        })
        return "concat(" + out.join(", ") + ")";
    }
    return '"' + name + '"';
}

module.exports = ext.register("ext/nodeunit/nodeunit", {
    name            : "Node Unit Test Manager",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    nodes           : [],
    template        : template,

    hook : function(){
        var _self = this;
        ide.addEventListener("init.ext/testpanel/testpanel", function(){
            ext.initExtension(_self);
        });
    },

    init : function() {
        var _self = this;

        this.nodes.push(
            mnuFilter.insertBefore(new apf.item({
                type    : "radio",
                value   : "nodeunit",
                caption : "Node Unit Tests"
            }), mnuFilter.getElementsByTagNameNS(apf.ns.aml, "divider")[1]),

            mnuTestNew.appendChild(new apf.item({
                caption : "Node Unit Test",
                onclick : function(){
                    _self.createAndOpenTest();
                }
            }))
        );

        davProject.report(ide.davPrefix, 'filelist', {},
          function(data, state, extra){
            if (state == apf.ERROR) {
                if (data && data.indexOf("jsDAV_Exception_FileNotFound") > -1) {
                    return;
                }

                //@todo
                return;
            }
            if (state == apf.TIMEOUT)
                return; //@todo

            var nodes = data.selectNodes("//d:href");
            for (var node, i = 0; i < nodes.length; i++) {
                node = nodes[i];

                //@todo support for submodules
                if (node.firstChild.nodeValue.match(/_test\.js$/)) {
                    var file = apf.getXml("<file />");
                    var path = ide.davPrefix + "/" + node.firstChild.nodeValue;
                    file.setAttribute("name", path.split("/").pop());
                    file.setAttribute("path", path);
                    file.setAttribute("type", "nodeunit");
                    apf.xmldb.appendChild(testpanel.findParent(path), file);
                }
            }
        });

        ide.addEventListener("afterfilesave", function(e){
            var node = e.node;
            var name = node.getAttribute("name");
            if (!name.match(/_test.js$/))
                return;

            var path = node.getAttribute("path");
            var fileNode = mdlTests.queryNode("//file[@path=" + escapeXpathString(path) + "]");
            if (!fileNode) {
                fileNode = apf.xmldb.getCleanCopy(node);
                fileNode.setAttribute("type", "nodeunit");
                apf.xmldb.appendChild(testpanel.findParent(path), fileNode);
            }
        });

        ide.addEventListener("test.expand.nodeunit", function(e){
            var xmlNode = e.xmlNode;
            _self.reloadTestFile(xmlNode);
        });

        ide.addEventListener("test.stop", function(e){
            if (!_self.running)
                return;
            _self.stop();
        });

        ide.addEventListener("test.icon.nodeunit", function(e){
            return "page_white_code.png";
        });

        ide.addEventListener("test.run.nodeunit", function(e){
            var fileNode = e.xmlNode;
            var next    = e.next;

            console.autoOpen = false;

            _self.stopping     = false;
            _self.running      = true;
            _self.lastTestNode = fileNode;

            testpanel.setLog(fileNode, "running");

            //@todo this should be loaded via file contents
            if (testpanel.expandTests) {
                if (dgTestProject.$hasLoadStatus(fileNode, "potential"))
                    dgTestProject.slideOpen(null, fileNode);
                else {
                    _self.reloadTestFile(fileNode);
                }
            }

            var timer = setInterval(function(){
                if (fileNode.selectNodes("test").length) {
                    clearTimeout(timer);
                    parseMessage({data: ""})
                }
            }, 10);

            var stack = [];
            ide.addEventListener("socketMessage", function(e){
                //@todo testpanel.setLog(node, "started");

                if (e.message.type == "node-data") {
                    parseMessage(e.message);
                }
                else if (e.message.type.indexOf("node-exit") > -1) {
                    ide.removeEventListener("socketMessage", arguments.callee);
                    if (_self.stopping)
                        _self.stopped();
                    else {
                        _self.running = false;
                        if (fileNode.getAttribute("status") == -1)
                            testpanel.setError(fileNode, "failed");
                        if (!stProcessRunning.active)
                            next();
                        else {
                            stProcessRunning.addEventListener("deactivate", function(){
                                next();
                                stProcessRunning.removeEventListener("deactivate", arguments.callee);
                            });
                        }
                    }
                }
            });

            function completed(){
                var nodes = apf.queryNodes(fileNode, "test[@status=0 or error]");

                if (_self.stopping) {
                    testpanel.setError(fileNode, "Test Cancelled");
                    return;
                }
                else if (nodes.length)
                    testpanel.setError(fileNode, "Failed " + (nodes.length)
                        + " tests of " + fileNode.selectNodes("test").length);
                else
                    testpanel.setPass(fileNode,
                        "(" + fileNode.selectNodes("test").length + ")");
            }

            function parseMessage(message){
                var data;
                if (stack.length) {
                    data = stack.join("") + message.data;
                    stack = [];
                }
                else
                    data = message.data;

                //Parse

                //Remove summary
                data = data.replace(/\s*Summary\:\s+Total number of tests[\s\S]*$/, "");
                data = data.substr(1);
                var parts = data.match(/\[(\d+)m[\s\S]*?(?:$|(?=\[[1-9]\d*m))/g);
                if (!parts)
                    return;

                var match;
                for (var i = 0; i < parts.length; i++) {
                    var part = parts[i];
                    //FAIL
                    if (part.substr(0, 3) == "[31") {
                        match = part.match(/^\[31m\[(\d+)\/(\d+)\]\s+(.*?)\s+FAIL.*([\S\s]*?)(?=\[\d+m|$)/);
                        if(!match)
                            continue;

                        var testNode = fileNode.selectSingleNode("test[@name=" + escapeXpathString(match[3]) + "]");
                        if (!testNode) {
                            var doc  = fileNode.ownerDocument;
                            testNode = doc.createElement("test");
                            testNode.setAttribute("name", match[3]);
                            apf.xmldb.appendChild(fileNode, testNode);
                        }
                        //fileNode.addNode();
                        testpanel.setError(testNode, "Test Failed");
                        testpanel.setLog(fileNode, "completed test " + match[2] + " of " + match[1]);

                        var errorNode = testNode.ownerDocument
                            .createElement("error");
                        errorNode.setAttribute("name", match[4]);
                        apf.xmldb.appendChild(testNode, errorNode);

                        if (match[2] == match[1])
                            completed();
                    }
                    //PASS
                    //[32m[4/1] test basic addition OK[0m
                    else if (part.substr(0, 3) == "[32") {
                        match = part.match(/^\[32m\[(\d+)\/(\d+)\]\s+(.*?)\sOK[\s\S]{4,6}/);
                        if(!match)
                            continue;

                        var testNode = fileNode.selectSingleNode("test[@name=" + escapeXpathString(match[3]) + "]");
                        if(!testNode) {
                            var doc  = fileNode.ownerDocument;
                            testNode = doc.createElement("test");
                            testNode.setAttribute("name", match[3]);
                            apf.xmldb.appendChild(fileNode, testNode);
                        }
                        testpanel.setPass(testNode);
                        testpanel.setLog(fileNode, "completed test " + match[2] + " of " + match[1]);

                        if (match[2] == match[1])
                            completed();
                    }
                }
            }

            var path = fileNode.getAttribute("path")
                .slice(ide.davPrefix.length + 1)
                .replace("//", "/");

            noderunner.run(path, [], false);
        });

        ide.addEventListener("socketMessage", function(e) {
            if (_self.disabled) return;

            var message = e.message;
            if ((message.type && message.type != "watcher") || !message.path)
                return;

            var path = message.path.slice(ide.workspaceDir.length);

            if (path != _self.testpath)
                return;

            switch (message.subtype) {
                case "create":
                    //Add file to model
                    break;
                case "remove":
                    //Remove file from model
                    break;
                case "change":
                    //Reread file and put tests update in model
                    var xmlNode = mdlTests.selectSingleNode("//file[@path='" + message.path + "']");
                    _self.reloadTestFile(xmlNode);
                    break;
            }
        });

        this.enable();
    },

    stop : function(){
        this.stopping = true;

        if (this.lastTestNode) {
            testpanel.setLog(this.lastTestNode.tagName == "file"
                ? this.lastTestNode
                : this.lastTestNode.parentNode, "Stopping...");
        }

        noderunner.stop();
    },

    stopped : function(msg){
        this.stopping = false;
        this.running  = false;

        testpanel.stopped();

        console.autoOpen = true;
    },

    createAndOpenTest : function(){
        var _self = this;
        var path  = (ide.davPrefix + "/" + this.testpath).split("/");
        var stack = [];

        var recur = function(){
            stack.push(path.shift());

            if (path.length == 0) {
                newresource.newfile("_test.js", _self.template,
                  ide.davPrefix + "/");
                return;
            }

            fs.exists(stack.join("/") + "/" + path[0], function(data, state, extra){
                if (data) {
                    recur();
                }
                else {
                    fs.webdav.exec("mkdir",
                      [stack.join("/"), path[0]], function(data) {
                        recur();
                    });
                }
            });
        }

        recur();
    },

    reloadTestFile : function(xmlNode) {
        fs.readFile(xmlNode.getAttribute("path"), function(data, state, extra){
            if (state == apf.SUCCESS) {
                var node, found = [];

                var ast = parser.parse(data);
                var doc  = xmlNode.ownerDocument;
                ast.traverseTopDown(
                    'Assign(PropAccess(Var("module"),"exports"), ObjectInit(inits))', function(b) {
                        b.inits.forEach(function(init) {
                            // init now contains PropertyInit("name", value) nodes, first branch is the name node
                            var name = init[0].value;

                            node = xmlNode.selectSingleNode("test[@name="
                              + escapeXpathString(name) + "]");

                            if (!node) {
                                node = doc.createElement("test");
                                node.setAttribute("name", name);

                                apf.xmldb.appendChild(xmlNode, node);
                            }

                            found.push(node);
                        });
                    }
                );

                var nodes = xmlNode.childNodes;
                for (var i = nodes.length - 1; i >= 0; i--) {
                    if (found.indexOf(nodes[i]) == -1)
                        apf.xmldb.removeNode(nodes[i]);
                }
            }
        });
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });

//@todo this is much more complex
//        ide.send({
//            "command"     : "watcher",
//            "type"        : "watchFile",
//            "path"        : this.testpath
//        });

        this.disabled = false;
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });

//        ide.send({
//            "command"     : "watcher",
//            "type"        : "unwatchFile",
//            "path"        : this.testpath
//        });

        this.disabled = true;
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];

        testpanel.unregister(this);
    }
});

});
/**
 * General Purpose Offline Syncing Library
 *
 * @event losechanges   Fires before the offline state is removed.
 *   cancelable: Prevents the application from losing it's recorded offline state.
 * @event beforeoffline Fires before bringing the application offline.
 *   cancelable: Prevents the application from going offline
 * @event afteroffline  Firest after the application is brought offline.
 * @event beforeonline  Fires before bringing the application online.
 *   cancelable: Prevents the application from going online
 * @event afteronline   Fires after the application is brought online.
 * @event beforeload    Fires before loading the offline state into this application.
 *   cancelable: Prevents the application from reloading it's offline state.
 * @event sync          Fires at each sync item's completion.
 *   object:
 *   {Number} position the number of the item in the list that is currently processed.
 *   {Number} length   the total number of items in the list.
 *
 * @property {Number}  progress  the progress of the sync. A number between 0 and 1.
 * @property {Number}  position  the progress of the sync. 
 * @property {Number}  length    the total length of items to sync.
 * @property {Boolean} syncing   whether the application is syncing while coming online.
 * @property {Boolean} onLine    whether the application is online. This property is false during sync.
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var Offline = module.exports = function(namespace, detectUrl){
    /**
     * whether the application is online.
     * @type {Boolean}
     */
    this.onLine    = -1;
    this.detectUrl = detectUrl;
    this.interval  = 5000;
    this.namespace = namespace;
    
    //navigator.onLine
    var cache = window.applicationCache;
    
    //@todo this is non-ie for now
    
    cache.addEventListener("offline", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("online", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("checking", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("downloading", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("progress", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("cached", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("noupdate", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("updateready", function(e){
        //console.log(e.type);
        cache.swapCache();
    }, false);
    
    cache.addEventListener("error", function(e){
        //console.log(e.type);
    }, false);
};

(function(){
    
    this.start = function(){
        // TODO: turned off because at this point the IDE is not up yet and
        // will result in JS errors
        this.offlineTime = parseInt(localStorage[this.namespace + ".offlinetime"] || 0, 10);

        //If we were offline lets stay offline
        if (this.offlineTime)
            this.goOffline();
        //I beleve these should be commented out for detection to pick up on the online state
        //else //Else we try to go online
            //this.goOnline();
        
        this.startDetect();
    }
    
    /**** Offline Detection ****/
    
    this.isSiteAvailable = function(callback){
        var _self = this;
        
        if (!this.http) {
            this.http = new apf.http();
            this.http.timeout = this.interval;
        }
        
        this.http.get(apf.getNoCacheUrl(this.detectUrl), {
            callback: function(data, state, extra){
                if (state != apf.SUCCESS){ // || !window.navigator.onLine
                    _self.goOffline(callback); //retry here??
                }
                else {
                    _self.goOnline(callback);
                }
            },
            ignoreOffline  : true,
            hideLogMessage : true
        });
    };
    
    this.startDetect = function(){
        if (this.detectErrorHandler) //Detection already started
            return;
        
        var _self = this;
        
        apf.addEventListener("error", this.detectErrorHandler = function(e){
            //Timeout detected.. Network is probably gone
            if (e.state == apf.TIMEOUT) {
                //Let's try to go offline and return false to cancel the error
                return !_self.goOffline();//callback //@todo callback???
            }
        });
        
        //Check if we have connection right now
        this.isSiteAvailable();
        
        //#ifdef __DEBUG
        apf.console.info("Started automatic detection of network state");
        //#endif
        
        this.detectTimer = setInterval(function(){
            _self.isSiteAvailable();
        }, this.interval);
    }
    
    this.stopDetect = function(){
        clearInterval(this.detectTimer);
        apf.removeEventListener("error", this.detectErrorHandler);
        
        //#ifdef __DEBUG
        apf.console.info("Stopped automatic detection of network state");
        //#endif
    }
    
    /**** Offline State Management ****/

    /**
     * Brings the application offline.
     */
    this.goOffline = function(){
        if (this.onLine === false)
            return false;

        if (this.dispatchEvent("beforeoffline") === false)
            return false;

        //We're offline, let's dim the light
        this.onLine    = false;

        if (!this.offlineTime) {
            this.offlineTime = new Date().getTime();
            // this can yield errors ('cause it's DOM):
            // [Exception... "Failure"  nsresult: "0x80004005 (NS_ERROR_FAILURE)"
            try {
                localStorage[this.namespace + ".offlinetime"] = this.offlineTime;
            }
            catch(ex) {}
        }

        this.dispatchEvent("afteroffline");

        return true;//success
    }

    /**
     * Brings the application online.
     */
    this.goOnline = function(){
        if (this.onLine === true)
            return false;

        if (this.dispatchEvent("beforeonline") === false)
            return false;

        //We're online, let's show the beacon
        this.onlineTime  = new Date().getTime();
        this.onLine      = true; //@todo Think about doing this in the callback, because of processes that will now intersect
        this.offlineTime = null;
        
        // this can yield errors ('cause it's DOM):
        // [Exception... "Failure"  nsresult: "0x80004005 (NS_ERROR_FAILURE)"
        try {
            delete localStorage[this.namespace + ".offlinetime"];
        }
        catch(ex) {}
        
        this.dispatchEvent("afteronline");

        return true;//success
    }
}).call(Offline.prototype = new apf.Class().$init());

});/**
 * Offline Support for Cloud9
 *
 * @copyright 2011, Ajax.org B.V.
 */

define(function(require, exports, module) {

var ide                 = require('core/ide');
var OfflineFileSystem   = require("ext/offline/lib-offlinefs");

var WebdavHtml5FileSystem = module.exports = function(callback, sync) {
    var _self   = this;
    this.sync   = sync;
    this.fs     = new OfflineFileSystem();
    
    this.fs.setFileSystem(this.fs.PERSISTENT, 1024, function(error, webfs){
        if (error)
            console.log(error);
        
        _self.webfs = webfs;
        _self.offlinefs = webfs.fs;
        _self.offlineroot = webfs.root;
        
        _self.loaded    = true;
        callback.apply(window, arguments);
        _self.emptyQueue();
    });
};

WebdavHtml5FileSystem.isAvailable = function(){
    return !!window.requestFileSystem;
};

(function() {
    this.available = true;
    this.fake      = true;
    
    this.$queue = [];
    this.queue = function(method, args) {
        this.$queue.push([method, args]);
    };
    this.emptyQueue = function() {
        var _self = this;
        this.$queue.each(function(item) {
            item[0].apply(_self, item[1]);
        });
        this.$queue = [];
    };
    
    
    this.exists = function(path, callback) {
        if (!this.loaded)
            return this.queue(this.exists, arguments);
        var new_path = path.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this;
        
        this.webfs.open(new_path, 'r', function(error, handler) {
            if (error)
                callback(false);
            else
                callback(true);
        });
    };
    
    
    /**
    * Read function here currently takes in content as a string,
    * we probably want to do some MIME checking here for binary
    * files
    */
    this.read = function(path, callback){
        if (!this.loaded)
            return this.queue(this.read, arguments);
            
        var new_path = path.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this;
        this.webfs.readFile(new_path, function(error, read, buffer) {
            if (error)
                return _self.handleError(callback, error);
            
            _self.webfs.readString(buffer, function(error, data) {
                if (error)
                    return _self.handleError(callback, error);
                callback(data, apf.SUCCESS, {});    
            });
        });
        /*
        if (localStorage[fIdent]) {
            var files = JSON.parse(localStorage[fIdent]);
            if (files[path])
                return callback(files[path], apf.SUCCESS, {});
        }
        this.handleError(callback);
        */
    };
    /**
     * Here we write the file to the file system, then we also
     * need to add it to the sync operations for that file
     * when we go online
     */
    this.writeFile = 
    this.write     = function(path, data, x, callback){
        if (!this.loaded)
            return this.queue(this.write, arguments);

        var new_path = path.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this;
        
        this.webfs.writeFile(new_path, data, function(error, buffer) {
            if (error)
                return _self.handleError(callback, error);
            
            if (!ide.onLine) {
                _self.sync.add(path, {
                    type: "webdav-write",
                    date: new Date().getTime(),
                    path: path,
                    data: data
                });
                callback(data, apf.SUCCESS, {});
            }
        });
    };
    /**
     * method to do a ls on a directory, this returns
     * an array of FileEntry and DirectoryEntry objects
     * which can be itterated over to generate
     * a tree path
     */
    this.readdir = 
    this.scandir = 
    this.list    = function(path, callback){
        if (!this.loaded)
            return this.queue(this.list, arguments);
        
        var new_path = path.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this,
            name_array,
            name;
        this.webfs.readdir(new_path, function(error, items) {
            if (error)
                return _self.handleError(callback, error);
                
            var output = [];
            var total = 0;
            
            var handleOpen = function(error, handler) {
                if (error)
                    return;
                    
                if (handler.isDirectory) {
                    output.push('<folder path="' + handler.fullPath.replace(new RegExp('^\\/' + ide.projectName), ide.davPrefix) + '"  type="folder" size="0" name="' + handler.name + '" contenttype="" modifieddate="" creationdate="" lockable="false" hidden="false" executable="false" />');
                } else if (handler.isFile) {
                    output.push('<file path="' + handler.fullPath.replace(new RegExp('^\\/' + ide.projectName), ide.davPrefix) + '"  type="file" size="" name="' + handler.name + '" contenttype="" modifieddate="" creationdate="" lockable="false" hidden="false" executable="false" />');
                }
                
                total++;
                
                if (total == items.length) {
                    callback('<files>' + output.join('\n') + '</files>', apf.SUCCESS, {});
                }
            };
            
            for (var i = 0, j = items.length; i < j; i++) {
                var item = items[i];
                _self.webfs.open(item, handleOpen);
            }
        });
    };
    
    this.rename =
    this.move = function(sFrom, sTo, bOverwrite, bLock, callback) {
        if (!this.loaded)
            return this.queue(this.move, arguments);
            
        var new_from = sFrom.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var new_to = sTo.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this;
        
        this.webfs.rename(new_from, new_to, function(error, newDirEntry) {
            if (error)
                return _self.handleError(callback, error);
                
            if (!ide.onLine) {
                _self.sync.add(sFrom, {
                    type: "webdav-move",
                    date: new Date().getTime(),
                    path: sFrom,
                    data: sTo
                });
                callback("", apf.SUCCESS, {});
            }
        });
    };
    
    //@todo move stuff from exec
    this.mkdir = function(sPath, bLock, callback) {
        var new_path = sPath.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        
        this.webfs.mkdir(new_path, function(error, directory) {
            if (error)
                return _self.handleError(callback, error);
                
            if (!ide.onLine) {
                _self.sync.add(sPath, {
                    type: "webdav-mkdir",
                    date: new Date().getTime(),
                    path: sPath,
                    data: null
                });
               callback("", apf.SUCCESS, {});
            }
        });
    };
    
    //@todo test this
    this.remove = function(sPath, bLock, callback) {
        if (!this.loaded)
            return this.queue(this.remove, arguments);
        var new_path = sPath.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this;
        
        this.webfs.unlink(new_path, function(error) {
            if (error)
                return _self.handleError(callback, error);
                
            if (!ide.onLine) {
                _self.sync.add(sPath, {
                    type: "webdav-remove",
                    date: new Date().getTime(),
                    path: sPath
                });
                callback("", apf.SUCCESS, {});
            }
        });
    };
    
    //@todo
    this.copy = function(sFrom, sTo, bOverwrite, bLock, callback) {
        if (!this.loaded)
            return this.queue(this.move, arguments);
        var new_from = sFrom.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var new_to = sTo.replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
        var _self = this;
        
        this.webfs.copy(new_from, new_to, function(error, newDirEntry) {
            if (error)
                return _self.handleError(callback, error);
            
            if (!ide.onLine) {
                _self.sync.add(sFrom, {
                    type: "webdav-move",
                    date: new Date().getTime(),
                    path: sFrom,
                    data: sTo
                });
                callback("", apf.SUCCESS, {});
            }
        });
    };
    
    //@todo fix double entries (move implementations to functions - Watch out for different arguments!!)
    this.exec = function(type, args, cb) {
        if (!this.loaded)
            return this.queue(this.exec, arguments);
        
        var _self = this,
            ful_path;
        switch(type) {
            //@todo this should be same as write file
            case "create":
                /**
                 * Here we create an empty file based on the path
                 * and filename passed, may have issues due to 
                 * the way directories and files are created (non-recursive)
                 */
                //args = [path, filename];
                //path = args[0].replace(new RegExp("^" + ide.davPrefix.replace(/\//g, "\\/")), '/' + ide.projectName);
                full_path = args[0] + '/' + args[1];
                this.write(full_path, 'empty_file', null, cb);
            break;
            case "move":
            case "mv":
            case "rename":
                var tmp = args[1].split('/');
                tmp.pop();
                var new_to = tmp.join('/') + "/" + args[0];
                this.rename(args[1], new_to, false, false, cb);
            break;
            case "login":
            case "authenticate":
                break;
            case "logout":
                break;
            case "exists":
                this.exists(args[0], cb);
                break;
            case "read":
                this.readFile(args[0], cb);
                break;
            case "create":
                full_path = args[0] ? args[0] : "";
                if (full_path.charAt(full_path.length - 1) != "/")
                    full_path = full_path + "/";
                this.writeFile(full_path + args[1], args[2], args[3] || false, cb);
                break;
            case "write":
            case "store":
            case "save":
                this.writeFile(args[0], args[1], args[2] || false, cb);
                break;
            case "copy":
            case "cp":
                this.copy(args[0], args[1], args[2] || true, args[3] || false, cb);
                break;
            case "rename":
                var sBasepath = args[1].substr(0, args[1].lastIndexOf("/") + 1);
                this.rename(args[1], sBasepath + args[0], args[2] || false, args[3] || false, cb);
                break;
            case "move":
            case "mv":
                full_path = args[1];
                if (full_path.charAt(full_path.length - 1) != "/")
                    full_path = full_path + "/";
                this.rename(args[0], full_path + args[0].substr(args[0].lastIndexOf("/") + 1),
                    args[2] || false, args[3] || false, cb);
                break;
            case "remove":
            case "rmdir":
            case "rm":
                this.remove(args[0], args[1] || false, cb);
                break;
            case "readdir":
            case "scandir":
                if (!ide.onLine)
                    this.readdir(args[0], cb);
                break;
            case "getroot":
                this.getProperties(this.$rootPath, 0, cb);
                break;
            case "mkdir":
                full_path = args[0] ? args[0] : "";
                if (full_path.charAt(full_path.length - 1) != "/")
                    full_path = full_path + "/";
                this.mkdir(full_path + args[1], args[2] || false, cb);
                break;
            case "lock":
                this.lock(args[0], null, null, null, cb);
                break;
            case "unlock":
                this.unlock(args[0], cb);
                break;
            case "report":
                break;
            default:
                //#ifdef __DEBUG
                throw new Error(apf.formatErrorString(0, null, "Saving/Loading data",
                    "Invalid WebDAV method '" + method + "'"));
                //#endif
                break;
        }
    };
    
    this.handleError = function(callback, error) {
        callback(null, apf.ERROR, error ? {message: error.code} : {});
    };
}).call(WebdavHtml5FileSystem.prototype = new apf.Class().$init());

});define(function(require, exports, module) {

/**
 * @package webfs
 * @copyright  Copyright(c) 2011 Ajax.org B.V. <info AT ajax.org>
 * @author Tane Piper <tane AT ajax DOT org>
 * @license http://github.com/ajaxorg/webfs/blob/master/LICENSE MIT License
 */

/**
 * We need to ensure that we have the correct version of requestFileSystem and
 * BlobBuilder available to the script
 */
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;


/**
 * @class WebFS object
 * @description Can take a pre-existing native local filesystem as a
 *              parameter.  If not parameter passed, filesystem can be set with
 *              setFileSystem 
 */
var WebFS = module.exports = (function() {
    
    /**
     * @constructor
     * @description Can take a pre-existing native local filesystem as a
     *              parameter.  If not parameter passed, filesystem can be set with
     *              setFileSystem
     * @param   {DOMFileSystem}     fs
     * @type    {void}
     */
    function WebFS(fs) {
        this.fs = fs;
        if (fs)
            this.root = fs.root;
    }
    
    // Filesystem system types flags
    WebFS.prototype.TEMPORARY                   = 0;
    WebFS.prototype.PERSISTENT                  = 1;
    // Filesystem progress flags
    WebFS.prototype.EMPTY                       = 0;
    WebFS.prototype.LOADING                     = 1;
    WebFS.prototype.DONE                        = 2;
    // Filesystem error flags
    WebFS.prototype.NOT_FOUND_ERR               = 1;
    WebFS.prototype.SECURITY_ERR                = 2;
    WebFS.prototype.ABORT_ERR                   = 3;
    WebFS.prototype.NOT_READABLE_ERR            = 4;
    WebFS.prototype.ENCODING_ERR                = 5;
    WebFS.prototype.NO_MODIFICATION_ALLOWED_ERR = 6;
    WebFS.prototype.INVALID_STATE_ERR           = 7;
    WebFS.prototype.SYNTAX_ERR                  = 8;
    WebFS.prototype.INVALID_MODIFICATION_ERR    = 9;
    WebFS.prototype.QUOTA_EXCEEDED_ERR          = 10;
    WebFS.prototype.TYPE_MISMATCH_ERR           = 11;
    WebFS.prototype.PATH_EXISTS_ERR             = 12;
    
    WebFS.prototype.DIR_SEPARATOR = '/';
    WebFS.prototype.DIR_BLACKLIST = ['.', './', '..', '../', '/'];
    WebFS.prototype.TYPE_FILE = 'file';
    WebFS.prototype.TYPE_DIR = 'dir';
    
    
    /**
     * Creates a stats object
     * @private
     * @param   {FileEntry, DirectoryEntry}   entry
     * @param   {Function}                    callback
     * @type    {void}
     */
    var Stats = function(entry, callback) {
        var _self = {};
        
        if (entry.isFile) {
            
            entry.file(function(file) {
                
                var t = file.lastModifiedDate;
                var m = t.getMonth() + 1;
                var month = m < 10 ? "0" + m : m;
            
                var time = [t.getFullYear(), month, t.getDate()].join('-') + 'T' + [t.getHours(), t.getMinutes(), t.getSeconds()].join(':') + 'Z';
            
                _self.mtime = time;
                _self.atime = time;
                _self.ctime = time;
                
                _self.size = file.fileSize;
                
                afterMetaData()
            });
        } else {
            entry.getMetadata(function(metadata) {
                var t = metadata.modificationTime;
                var m = t.getMonth() + 1;
                var month = m < 10 ? "0" + m : m;
                
                var time = [t.getFullYear(), month, t.getDate()].join('-') + 'T' + [t.getHours(), t.getMinutes(), t.getSeconds()].join(':') + 'Z';
                
                _self.mtime = time;
                _self.atime = time;
                _self.ctime = time;
                
                _self.size = 0;
                
                afterMetaData()
            });
        }
        
        function afterMetaData() {
            
            _self.dev = 0;
            _self.ino = 0;
            _self.mode = 0;
            _self.nlink = 0;
            _self.uid = 0;
            _self.gid = 0;
            _self.rdev = 0;
            _self.blocks = 0;
            
            
            _self.isDirectory = entry.isDirectory;
            _self.isFile = entry.isFile;
            
            /**
             * These next stats functions all return false for nodejs compatibility
             */
            _self.isBlockDevice = false;
            _self.isCharacterDevice = false;
            _self.isSymbolicLink = false;
            _self.isFIFO = false;
            _self.isSocket = false;
            
            callback(null, _self);
        }
    };

    /**
     * Returns if requestFileSystem is available
     * @type    {void}
     */
    WebFS.prototype.isAvailable = function(){
        return !!window.requestFileSystem;
    };
    
    /**
     * Error handler for file system operations
     * @param   {Error}     error
     * @type    {void}
     */
    WebFS.prototype.errorHandler = function(error) {
        var msg;
        
        switch(error.code) {
            case this.NOT_FOUND_ERR:
                error.message = "The file or directory has not been found";
                break;
            case this.SECURITY_ERR:
                error.message = "The file you are attempting to access is unsafe for web access or may be being accessed too many times.";
                break;
            case this.ABORT_ERR:
                error.message = "The current operation has been aborted";
                break;
            case this.NOT_READABLE_ERR:
                error.message = "The file you are attempting to read is not readable, this may be a permissions issue.";
                break;
            case this.ENCODING_ERR:
                error.message = "The data or URL passed is malformed";
                break;
            case this.NO_MODIFICATION_ALLOWED_ERR:
                error.message = "The file or directory cannot be modified.";
                break;
            case this.INVALID_STATE_ERR:
                error.message = "The file or directory state has changed since the last operation.";
                break;
            case this.SYNTAX_ERR:
                error.message = "There is a syntax error with this file operation.";
                break;
            case this.INVALID_MODIFICATION_ERR:
                error.message = "Invalid file operation.";
                break;
            case this.QUOTA_EXCEEDED_ERR:
                msg = "The quota for the filesystem has been exceeded.";
                break;
            case this.TYPE_MISMATCH_ERR:
                error.message = "Incorrect file operation on file or directory.";
                break;
            case this.PATH_EXISTS_ERR:
                error.message = "This path already exists";
                break;
        }
        
        return error;
    };
    
    /**
     * If the user does not use an external fs object, we can call this method
     * to create a new file system object
     * @param   {Number}    type
     * @param   {Number}    size
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.setFileSystem = function(type, size, callback) {
        var _self = this;
        
        var successHandler = function(fs) {
            _self.fs = fs;
            _self.root = fs.root;
            callback(null, _self);
        };
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        requestFileSystem(type, (size * 1024 *1024), successHandler, errorHandler);
    };
    
    /**
     * Get the current raw filesystem for this WebFS object
     * @type    {void}
     */
    WebFS.prototype.getFileSystem = function() {
        return this.fs;
    };
    
    /**
     * Rename or move src to dest.  If dest is a directory, must contain a trailing '/' char.
     * @param   {String}    src 
     * @param   {String}    dest
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.rename = function(src, dest, callback) {
        var _self = this;
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        var doMove = function(srcDirEntry, destDirEntry, newName) {
            var name = newName || null;
            srcDirEntry.moveTo(destDirEntry, name, function(newDirEntry) {
                callback(null, newDirEntry);
            }, errorHandler);
        };
        
        if (dest[dest.length - 1] == _self.DIR_SEPARATOR) {
            _self.root.getDirectory(src, {}, function(srcDirEntry) {
                // Create blacklist for dirs we can't re-create.
                var create = _self.DIR_BLACKLIST.indexOf(dest) != -1 ? false : true;
             
                _self.root.getDirectory(dest, {create: create}, function(destDirEntry) {
                    doMove(srcDirEntry, destDirEntry);
                }, errorHandler);
             }, function(error) {
                 // Try the src entry as a file instead.
                _self.root.getFile(src, {}, function(srcDirEntry) {
                    _self.root.getDirectory(dest, {}, function(destDirEntry) {
                        doMove(srcDirEntry, destDirEntry);
                    }, errorHandler);
                }, errorHandler);
            });
        } else {
            // Treat src/destination as files.
            _self.root.getFile(src, {}, function(srcFileEntry) {
                srcFileEntry.getParent(function(parentDirEntry) {
                    doMove(srcFileEntry, parentDirEntry, dest);
              }, errorHandler);
            }, errorHandler);
        }
    };
    
    /**
     * Takes a file handler and truncates the content to the passed length
     * @param   {FileEntry} fileEntry
     * @param   {Number}    len
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.truncate = function(fileEntry, len, callback) {
        var _self = this;
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
    
        fileEntry.createWriter(function(fileWriter) {
            fileWriter.onwriteend = function(e) {
                callback(null, fileEntry, e);
            };
            fileWriter.onerror = errorHandler;
                
            fileWriter.truncate(len);
        });
    };
    
    /**
     * Stub chmod function for nodejs compatiblity
     * @param   {String}    path
     * @param   {Number}    mode
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.chmod = function(path, mode, callback) {
        callback();
    };
    
    /**
     * Returns a stat object from a path
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.stat = function(path, callback) {
        var _self = this;
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        this.open(path, function(error, fileHandler) {
            if (error && error.code == _self.TYPE_MISMATCH_ERR) {
                // Get a directory instead
                _self.root.getDirectory(path, {}, function(dirHandler) {
                    Stats(dirHandler, callback);
                }, errorHandler);
            } else if (error) {
                errorHandler(error);
            } else {
                Stats(fileHandler, callback);
            }
        });
    };
    
    /**
     * Returns a stat object from a path
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     * @function
     */
    WebFS.prototype.lstat = WebFS.prototype.stat;
    
    /**
     * Returns a stat object from a file descriptor
     * @param   {FileEntry, DirectoryEntry} fd
     * @param   {Function}                  callback
     * @type    {void}
     */
    WebFS.prototype.fstat = function(fd, callback) {
        Stats(fd, callback);
    };
    
    /**
     * Stub link function for nodejs compatibility
     * @param   {String}    srcpath
     * @param   {String}    destpath
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.link = function(srcpath, destpath, callback) {
        callback();
    };
    
    /**
     * Stub symlink function for nodejs compatibility
     * @param   {String}    linkdata
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.symlink = function(linkdata, path, callback) {
        callback();
    };
    
    /**
     * Stub readlink function for nodejs compatibility
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.readlink = function(path, callback) {
        callback();
    };
    
    /**
     * Stub realpath function for nodejs compatibility
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.realpath = function(path, callback) {
        callback();
    };
    
    /**
     * Deletes a file from the path.  Directories are removed recursivly
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.unlink = function(path, callback) {
        var _self = this;
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        _self.root.getFile(path, {}, function(fileEntry) {
            fileEntry.remove(callback, errorHandler);
        }, function(error) {
            if (error.code == FileError.TYPE_MISMATCH_ERR) {
                _self.root.getDirectory(path, {}, function(dirEntry) {
                    dirEntry.removeRecursively(callback, errorHandler);
                }, errorHandler);
            } else {
                errorHandler(error);
            }
        });
    };
    
    /**
     * Deletes a directory from the path.  Directories are removed recursivly
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     * @function
     */
    WebFS.prototype.rmdir= WebFS.prototype.unlink;
    
    /**
     * Creates a directory on the filesystem, will recursivly create paths
     * @param   {String}    path
     * @param   {Number}    mode
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.mkdir = function(path, mode, callback) {
        var _self = this;
        
        if (typeof callback != "function") {
            callback = mode;
        }
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        var createDir = function(rootDir, folders) {
            if (folders[0] == '.' || folders[0] == '') {
                folders = folders.slice(1);
            }

            rootDir.getDirectory(folders[0], {create: true}, function(dirEntry) {
                if (folders.length) {
                    createDir(dirEntry, folders.slice(1));
                } else {
                    callback(null, dirEntry);
                }
            }, errorHandler);
        };
        createDir(this.fs.root, path.split('/'));
    };
    
    /**
     * Reads the contents of a directory, returns the result as an array of entries
     * @param   {String}    path
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.readdir = function(path, callback) {
        var _self = this;
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        var listHandler = function(dirHandler) {
            var dirReader = dirHandler.createReader();
            var entries = [];
            var readEntries = function() {
                dirReader.readEntries(function(results) {
                    if (!results.length) {
                        callback(null, entries.sort());
                    } else {
                        for (var i = 0, j = results.length; i < j; i++) {
                            if (results[i].isDirectory)
                                entries.push(results[i].fullPath + '/');
                            else
                                entries.push(results[i].fullPath);
                        }
                        //entries = entries.concat(Array.prototype.slice.call(results || [], 0));
                        readEntries();
                    }
                }, errorHandler);
            };
            readEntries();
        };
        
        _self.root.getDirectory(path, {}, listHandler, errorHandler);
    };
    
    /**
     * 'Close' a file or directory handler by setting it to null
     * @param   {FileEntry, DirectoryEntry} fd
     * @param   {Function}                  callback
     * @type    {void}
     */
    WebFS.prototype.close = function(fd, callback) {
        fd = null;  // Set to null for GC
        callback();
    };
    
    /**
     * Opens a file or directory and return a handler
     * @param   {String}    path
     * @param   {String}    flags
     * @param   {Number}    mode
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.open = function(path, flags, mode, callback) { 
        var _self = this;
        
        if (typeof callback != "function") {
            callback = mode;
        }
        if (typeof callback != "function") {
            callback = flags;
        }
        
        var errorHandler = function(error) {
            if (error && error.code == _self.TYPE_MISMATCH_ERR) {
                _self.root.getDirectory(path, options, successHandler, function(error) {
                    callback(_self.errorHandler(error));
                });
            }
        };
        
        var successHandler = function(fileHandler) {
            callback(null, fileHandler);
        };
        
        var options = {};
        // If the flag is to write or append, and the file does not exist
        // then we need to ensure it's created
        if (['w', 'w+', 'a', 'a+'].indexOf(flags) > -1)
            options.create = true;

        _self.root.getFile(path, options, successHandler, errorHandler);
    };
    
    /**
     * Writes the contents of a Blob or File to a FileEntry on the filesystem
     * @param   {FileEntry} fileHandler
     * @param   {Mixed}     buffer
     * @param   {Number}    offset
     * @param   {Number}    length
     * @param   {Number}    position
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.write = function(fileHandler, buffer, offset, length, position, callback) {
        var _self = this,
            data;
            
        if (typeof callback != "function") {
            callback = position;
        }
        if (typeof callback != "function") {
            callback = length;
        }
        if (typeof callback != "function") {
            callback = offset;
        }
            
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
                
        var data = (typeof buffer == 'string') ? _self.createBlob(buffer) : buffer;
        
        var writerHandler = function(fileWriter) {
            
            fileWriter.onwriteend = function(e) {
                callback(null, e.loaded, buffer);
            };
            
            fileWriter.onerror = errorHandler;
          
            fileWriter.write(data);
        };
            
        fileHandler.createWriter(writerHandler, errorHandler);
    };
    
    /**
     * Asynchronously writes data to a file, replacing the file if it already exists.  Data can be a string or a buffer.
     * @param   {String}    filename
     * @param   {Mixed}     data
     * @param   {String}    encoding
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.writeFile = function(filename, data, encoding, callback) {
        var _self = this;
        
        if (typeof callback != 'function') {
            callback = encoding;
        }
        
        var buffer = (typeof data == 'string') ? _self.createBlob(data) : data;
        
        var openFileHandler = function(error, fileHandler) {
            _self.truncate(fileHandler, 0, function(error) {
                if (error)
                    return callback(error);
                _self.write(fileHandler, buffer, null, null, null, function(error, written, buffer_) {
                    callback(error, buffer_);  
                });
            });
        };
        
        _self.open(filename, 'w', null, openFileHandler);  
    };
    
    /**
     * Read data from the file specified by file handler.
     * @param   {FileEntry} fileHandler
     * @param   {Mixed}     buffer
     * @param   {Number}    offset
     * @param   {Number}    length
     * @param   {Number}    position
     * @type    {void}
     */
    WebFS.prototype.read = function(fileHandler, buffer, offset, length, position, callback) {
        var _self = this,
            data;
            
        if (typeof callback != "function") {
            callback = position;
        }
        if (typeof callback != "function") {
            callback = length;
        }
        if (typeof callback != "function") {
            callback = offset;
        }
        
        var errorHandler = function(error) {
            callback(_self.errorHandler(error));
        };
        
        fileHandler.file(function(file) {
            var reader = new FileReader();
            
            reader.onloadend = function(e) {
                buffer.append(this.result);
                callback(null, buffer.getBlob().size, buffer.getBlob());
            };
            
            reader.onerror = errorHandler;
            
            // Since we want to support binary or string data, we should read
            // as an array buffer and allow the user to determine the output
            // from the Blob/File interface buffer
            reader.readAsArrayBuffer(file);
        });
    };
    
    /**
     * Asynchronously reads the entire contents of a file and returns a buffer
     * @param   {String}    filename
     * @param   {String}    encoding
     * @param   {Function}  callback
     * @type    {void}
     */
    WebFS.prototype.readFile = function(filename, encoding, callback) {
        var _self = this;
        
        if (typeof callback != 'function') {
            callback = encoding;
        }
                
        var successHandler = function(error, fileHandler) {
            if (error)
                return callback(error);
                
            _self.read(fileHandler, new BlobBuilder(), null, null, null, callback);
        };
        
        this.open(filename, null, null, successHandler);
    };
    
    /**
     * Takes data, string or binary, and creates a binary blob.
     * @param   {Mixed}     data
     * @param   {String}    encoding
     * @type    {void}
     */
    WebFS.prototype.createBlob = function(data, encoding) {
        var bb = new BlobBuilder();
        bb.append(data);
        if (encoding)
            return bb.getBlob(encoding);
        else
            return bb.getBlob();
    };
    
    /**
     * Method to get content of a blob or file as a string
     * @param   {File, Blob}    data
     * @param   {String}        encoding
     * @param   {Function}      callback
     * @type    {void}
     */
    WebFS.prototype.readString = function(data, encoding, callback) {
        
        var reader = new FileReader(),
            encoding_;
            
        if (typeof callback != 'function') {
            callback = encoding;
            encoding_ = 'UTF-8';
        } else {
            encoding_ = encoding;
        }
        
        reader.onloadend = function(event) {
            callback(null, this.result);
        };
        
        reader.onerror = function(error) {
            callback(error);
        };
        
        data = reader.readAsText(data, encoding_);
    };
    
    /**
     * Method to get content as a binary string
     * @param   {File, Blob}    data
     * @param   {Function}      callback
     * @type    {void}
     */
    WebFS.prototype.readBinaryString = function(data, callback) {
        var reader = new FileReader();
        reader.onloadend = function(event) {
            callback(null, this.result);
        };
        reader.onerror = function(error) {
            callback(error);
        };
        
        reader.readAsBinaryString(data);
    };
    
    /**
     * Method to get content as a array buffer
     * @param   {File, Blob}    data
     * @param   {Function}      callback
     * @type    {void}
     */
    WebFS.prototype.readArrayBuffer = function(data, callback) {
        var reader;
        reader = new FileReader();
        reader.onloadend = function(event) {
            callback(null, this.result);
        };
        reader.onerror = function(error) {
            callback(error);
        };
        
        reader.readAsArrayBuffer(data);
    };
    
    /**
     * Method to get content as a data url
     * @param   {File, Blob}    data
     * @param   {Function}      callback
     * @type    {void}
     */
    WebFS.prototype.readDataUrl = function(data, callback) {
        var reader = new FileReader();
        reader.onloadend = function(event) {
            callback(null, this.result);
        };
        reader.onerror = function(error) {
            callback(error);
        };
        
        reader.readAsDataURL(data);
    };
    
    return WebFS;
})();

});
/**
 * Offline Support for Cloud9
 *
 * @copyright 2011, Ajax.org B.V.
 */

define(function(require, exports, module) {

var util = require("core/util");
var fs = require("ext/filesystem/filesystem");
var ide = require("core/ide");

var WebdavLocalStorage = module.exports = function(callback, sync, fIdent) {
    this.fs     = null;
    this.sync   = sync;
    this.fIdent = fIdent;
    
    callback();
};

(function() {
    this.available = false;
    this.fake      = true;
    
    this.exists = function(path, callback) {
        if (localStorage[this.fIdent]) {
            var files = JSON.parse(localStorage[this.fIdent]);
            if (files[path])
                return callback(true);
            return callback(false);
        }
    };
    
    this.read = function(path, callback){
        if (localStorage[this.fIdent]) {
            var files = JSON.parse(localStorage[this.fIdent]);
            if (files[path])
                return callback(files[path], apf.SUCCESS, {});
        }
        this.handleError(callback);
    };
    
    this.write = function(path, data, x, callback){
        if (!ide.onLine) {
            this.sync.add(path, {
                type: "webdav-write",
                date: fs.model.queryValue("//file[@path='" + path + "']/@modifieddate"),
                path: path,
                data: data
            });
            
            if (callback)
                callback("", apf.SUCCESS, {});
        }
    };
    
    this.remove = function(path, lock, callback){
        return this.handleError(callback);
        
        /*
        this.sync.add(path, {
            type: "webdav-rm",
            path: path,
            lock: lock
        });
        
        if (callback)
            callback("", apf.SUCCESS, {});
        */
    };
    
    this.copy = function(from, to, overwrite, lock, callback){
        return this.handleError(callback);
        
        /*
        this.sync.add(from, {
            type: "webdav-copy",
            from: from,
            to: to,
            overwrite: overwrite,
            lock: lock
        });
        
        if (callback)
            callback("", apf.SUCCESS, {});
        */
    };
    
    this.move = function(from, to, overwrite, lock, callback){
        return this.handleError(callback);
        
        /*
        this.sync.add(from, {
            type: "webdav-move",
            from: from,
            to: to,
            overwrite: overwrite,
            lock: lock
        });
        
        if (callback)
            callback("", apf.SUCCESS, {});
        */
    };
    
    this.list = function(path, callback){
        this.handleError(callback);
    };
    
    this.exec = function(type, args, callback) {
        switch(type) {
            case "create":
                //args = [path, filename];
            break;
            case "mkdir":
                //args = [path, name]
            break;
            case "login":
            case "authenticate":
            case "logout":
            case "read":
            case "readdir":
            case "scandir":
            case "getroot":
            case "lock":
            case "unlock":
                break;
            case "exists":
            case "create":
            case "write":
            case "store":
            case "save":
            case "copy":
            case "cp":
            case "rename":
            case "move":
            case "mv":
            case "remove":
            case "rmdir":
            case "rm":
            case "mkdir":
            case "report":
                //No can do
                this.handleError(callback);
        }
    };
    
    this.handleError = function(callback){
        if (!ide.onLine) {
            util.alert("Sorry, you are offline right now and cannot perform this operation");
            callback(null, apf.ERROR, {});
        }
    };
}).call(WebdavLocalStorage.prototype = new apf.Class().$init());

});
/**
 * Offline Support for Cloud9
 *
 * @copyright 2011, Ajax.org B.V.
 */

define(function(require, exports, module) {

var Sync = module.exports = function(namespace){
    this.namespace = namespace;
    
    this.items = localStorage[this.namespace + ".syncitems"]
        ? apf.unserialize(localStorage[this.namespace + ".syncitems"])
        : {length: 100};
    
};

(function(){
    this.getLength = function(){
        return this.items && this.items.length || 0;
    }
    
    /**
     * Clears all offline data.
     */
    this.clear = function(){
        if (!this.enabled)
            return false;
    
        //#ifdef __DEBUG
        apf.console.info("Clearing all offline and state cache");
        //#endif
    
         this.items = {length: 0};
         localStorage[this.namespace + ".syncitems"] = apf.serialize(this.items);
    }
    
    this.add = function(id, syncItem){
        this.items[id] = syncItem;
        this.items.length++;
        
        localStorage[this.namespace + ".syncitems"] = apf.serialize(this.items);
        
        //@todo error handling
    }
    
    /**
     * Does cleanup after we've come online
     * @private
     */
     this.start = function(handler){
        if (this.syncing)
            return;
        
        var syncItems  = apf.extend({}, this.items),
            syncLength = this.items.length,
            len, i;
    
        var _self = this;
        var next = function(error, start){
            if (!_self.syncing)
                return false;

            if (!start) {
                syncItems.length--;
                localStorage[_self.namespace + ".syncitems"] = apf.serialize(syncItems); //Save state up to now
            }
            
            if (syncItems.length < 1) {
                _self.items = {length: 0};
                localStorage[_self.namespace + ".syncitems"] = apf.serialize(_self.items);
                
                return -1;
            }
    
            var item;
            for (var id in syncItems) {
                if (id == "length") 
                    continue;
                    
                item = syncItems[id];
                delete syncItems[id];
                break;
            }
            if (item === undefined)
                return -1;
            
            handler({
                item     : item,
                progress : parseInt((syncLength - syncItems.length) / syncLength * 100, 10),
                position : (syncLength - syncItems.length),
                length   : syncLength
            }, next);
            
            return 1;
        }
    
        this.syncing = true;
        next(null, true);
    };
    
    this.stop = function(){
        if (this.syncing)
            this.syncing = false;
    };
}).call(Sync.prototype);

});/**
 * Offline Support for Cloud9
 *
 * @copyright 2011, Ajax.org B.V.
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");

var WebdavHtml5FileSystem = require("ext/offline/lib-offlinedav");
var WebdavLocalStorage = require("ext/offline/lib-offlinels");

/**
 * Create the webdav wrapper, if we have a real webdav object we'll be
 * saving remotely, otherwise we'll save locally
 */
var WebdavWrapper = function(webdav, sync, fIdent, callback) {
    this.realWebdav    = webdav;
    
    // Check Local filesystem is available, or use localStorage
    this.hasFileSystem = WebdavHtml5FileSystem.isAvailable()  && false; //@todo this has to be changed when bgsync is 100% working
    if (this.hasFileSystem)
        this.localWebdav = new WebdavHtml5FileSystem(callback, sync);
    else
        this.localWebdav = new WebdavLocalStorage(callback, sync, fIdent);
};

(function() {
    this.available = true;
    this.fake      = true;
    
    /**
     * Check a file exists in the path
     */
    this.exists = function(path, callback) {
        if (ide.onLine)
            this.realWebdav.exists.apply(this.realWebdav, arguments);
        else if (this.hasFileSystem)
            this.localWebdav.exists.apply(this.localWebdav, arguments);
        else
            callback(null, apf.OFFLINE, {});
    };
    
    /**
    * Read function here currently takes in content as a string,
    * we probably want to do some MIME checking here for binary
    * files
    */
    this.read = function(path, callback){
        if (ide.onLine)
            this.realWebdav.read.apply(this.realWebdav, arguments);
        else if (this.hasFileSystem)
            this.localWebdav.read.apply(this.localWebdav, arguments);
        else
            callback(null, apf.OFFLINE, {});
    };
    /**
     * Here we write the file to the file system, then we also
     * need to add it to the sync operations for that file
     * when we go online
     * 
     * With write, if the project is syned, we also want to write offline
     * as well as offline, but if we are offline we only write to offline
     */
    this.writeFile =
    this.write     = function(path, data, x, callback){
        if (ide.onLine)
            this.realWebdav.write.apply(this.realWebdav, arguments);
        
        this.localWebdav.write.call(this.localWebdav, path, data, x, callback);
    };
    
    /**
     * Remove a file from the filesystem.  If we are online and the project
     * is syned, we write to both online and offline, if we are offline we
     * only write to offline
     */
    this.remove = function(sPath, bLock, callback) {
        if (ide.onLine)
            this.realWebdav.remove.apply(this.realWebdav, arguments);
        
        this.localWebdav.remove.call(this.localWebdav, sPath, bLock, callback);
    }
    
    /**
     * Copy a file from the filesystem.  If we are online and the project
     * is syned, we write to both online and offline, if we are offline we
     * only write to offline
     */
    this.copy = function(sFrom, sTo, bOverwrite, bLock, callback) {
        if (ide.onLine)
            this.realWebdav.copy.apply(this.realWebdav, arguments);
        
        this.localWebdav.copy.call(this.localWebdav, sFrom, sTo, bOverwrite, bLock, callback);
    }
    
    /**
     * Rename or move a file from the filesystem.  If we are online and the project
     * is syned, we write to both online and offline, if we are offline we
     * only write to offline
     */
    this.rename =
    this.move = function(sFrom, sTo, bOverwrite, bLock, callback) {
        if (ide.onLine)
            this.realWebdav.move.apply(this.realWebdav, arguments);
        
        this.localWebdav.move.call(this.localWebdav, sFrom, sTo, bOverwrite, bLock, callback);
    }
    
    this.report = function(sPath, reportName, oProperties, callback) {
        //if (ide.onLine)
            this.realWebdav.report.apply(this.realWebdav, arguments);
    }
    
    this.getProperties = function(sPath, iDepth, callback, oHeaders) {
    }
    
    this.setProperties = function(sPath, oPropsSet, oPropsDel, sLock) {
    }
    
    /**
     * method to do a ls on a directory, this returns
     * an array of FileEntry and DirectoryEntry objects
     * which can be itterated over to generate
     * a tree path
     */
    this.list = function(path, callback){
        if (ide.onLine)
            this.realWebdav.list.apply(this.realWebdav, arguments);
        else if (this.hasFileSystem)
            this.localWebdav.list.apply(this.localWebdav, arguments);
        else
            throw new Error("You are currently offline and the local filesystem is unavailable");
    };
    this.exec = function(type, args, callback) {
        if (ide.onLine)
            this.realWebdav.exec.apply(this.realWebdav, arguments);
        this.localWebdav.exec.call(this.localWebdav, type, args, callback);
    };
    
    this.handleError = function(callback, error) {
        callback(null, apf.ERROR, error ? {message: error.code} : {});
    }
}).call(WebdavWrapper.prototype = new apf.AmlElement().$init());

module.exports = WebdavWrapper

});
/**
 * Offline Support for Cloud9
 *
 * @copyright 2010, Ajax.org B.V.
 */
define(function(require, exports, module) {

var ide     = require("core/ide");
var ext     = require("core/ext");
var util    = require("core/util");
var Offline = require("ext/offline/lib-offline");
var Sync    = require("ext/offline/lib-sync");
var fs      = require("ext/filesystem/filesystem");
var WebdavWrapper = require("ext/offline/lib-webdav-wrap");

module.exports = ext.register("ext/offline/offline", {
    dev      : "Ajax.org",
    name     : "Offline",
    alone    : true,
    type     : ext.GENERAL,
    deps     : [fs],
    handlers : {},

    offlineStartup : 0,

    /**
     * Test method for going offline/online
     * @param {Boolean} online If the request is to go online or not
     */
    test : function(online){
        ide.testOffline = online ? 2 : 1;
        if (online)
            ide.socket.socket.connect();
        else
            ide.socket.socket.disconnect();
    },

    /**
     * Attach a method to a handler type
     * @param {String} type The handler hash type
     * @param {Function} handler The handler function
     */
    addHandler : function(type, handler){
        this.handlers[type] = handler;
    },

    /**
     * Init method to create the offline logic
     */
    init : function(){
        var _self   = this;
        var offline = this.offline = new Offline("cloud9", (window.location.pathname + "/$reconnect").replace(/\/\//g, "/"));
        var sync    = this.sync    = new Sync("cloud9");

        // preload the offline image programmatically:
        var img = new Image();
        img.src = ide.staticPrefix + "/style/images/offline.png";

        //Replace http checking because we already have a socket
        //offline.isSiteAvailable = function(){};

        //Set events necessary for checking online status using socket poll loop
        //@todo we still need to solve if (!_self.offlineStartup)
        /*ide.addEventListener("socketConnect", function(e){
            if (!_self.offlineStartup)
                offline.goOnline(); //Comment this out to test offline-start
        });

        ide.addEventListener("socketDisconnect", function(e){
            offline.goOffline();
        });*/

        //Forward Events
        offline.dispatchEvent = function(name, e){
            ide.dispatchEvent(name, e);
        };

        ide.onLine = -1;

        //If we are syncing stop sync.
        ide.addEventListener("beforeoffline", function(){
            if (sync.syncing)
                sync.stop();
        });

        ide.addEventListener("afteroffline", function(){
            stServerConnected.deactivate();
            ide.onLine = false;
            logobar.$ext.className = "c9-menu-bar offline";

            _self.bringExtensionsOffline();
        });

        //If we need to sync first, prevent Cloud9 from coming online
        ide.addEventListener("beforeonline", function(){
            if (sync.getLength()) {
                sync.start(function(data, next){
                    var item = data.item;
                    var cb   = function(){
                        if (next() < 0) //End of loop
                            offline.goOnline();
                    };

                    //Execute sync task here
                    var handler = _self.handlers[item.type];
                    if (!handler) {
                        if (self.console)
                            console.warn("Couldn't find handler for offline type '" + item.type + "'");
                        cb();
                    }
                    else
                        handler(item, cb);
                });
                return false;
            }
        });

        ide.addEventListener("afteronline", function(e){
            stServerConnected.activate();
            ide.onLine = true;
            logobar.$ext.className = "c9-menu-bar";

            _self.bringExtensionsOnline();
        });

        // after the IDE connects (either initial or after reconnect)
        ide.addEventListener("socketConnect", function (e) {
            // load the state, which is quite a weird name actually, but it contains
            // info about the debugger. The response is handled by 'noderunner.js'
            // who publishes info for the UI of the debugging controls based on this.
            ide.send({
                command: "state",
                action: "publish"
            });

            // the debugger needs to know that we are going to attach, but that its not a normal state message
            dbg.registerAutoAttach();
        });

        /**** File System ****/
        /**
         * Here, we need to first create the offlineWebdav object in the main scope
         * of the function, then we need to call the file system constructor. This
         * is async operation, so we need to wait on the filesystem becoming available
         * Due to the app starting in offline in this mode, we need to create a fake read
         * function here or an exception is thrown.
         * Once the file system is available, it's attached to the offlinefs instance, and we
         * can call it's methods with the correct filesystem scope
         */

        // fIdent is used for localStorage in Firefox or if local Filesystem is
        // not available
        var fIdent = "cloud9.files." + ide.workspaceId;


        ide.addEventListener("init.ext/filesystem/filesystem", function(){
            // If we don't have the real webdav, we need to use the offline one
            if (!fs.realWebdav)
                fs.realWebdav = fs.webdav;

            // Now we create a fake webdav object
            var fakeWebdav = new WebdavWrapper(fs.realWebdav, sync, fIdent, function(){
                // We need to set if we have offline file system support, and if we
                // do we don't need to disable plugins like tree, save, etc
                ide.offlineFileSystemSupport = fakeWebdav && fakeWebdav.hasFileSystem;
            });

            // Finally set the objects we need to make the calls on
            fs.webdav = fakeWebdav;
            davProject = fakeWebdav; //intended global
        });

        /**
         * Handler for syncing, wedav-write.  This is used when we go back online
         * and we need to sync file writes
         * @param {Object}      item
         * @param {Function}    callback
         */
        this.addHandler("webdav-write", function(item, callback){
            // Set the webdav object
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");

            // Get the properties of the item
            webdav.getProperties(item.path, 0, function(data){
                var xml = apf.getXml(data);
                // Check the date is newwer
                var serverdate = new Date(xml.firstChild
                    ? xml.firstChild.getAttribute("modifieddate")
                    : 0);
                if (serverdate <= new Date(item.date))
                    webdav.write(item.path, item.data, null, callback);
                else {
                    // If the item is older, we need to confirm we want to
                    // overwrite the remote one
                    util.confirm(
                        "File conflict while syncing",
                        "Conflict found in file " + item.path,
                        "Clicking 'OK' will overwrite the online file.<br />"
                        + "Clicking 'Cancel' will save this file as:<br /><br />"
                        + item.path + "_backup",
                        function(){
                            webdav.write(item.path, item.data, null, callback);
                        },
                        function(){
                            webdav.write(item.path + "_backup", item.data, null, callback);
                        });
                }
            });
        });

        /**
         * Handler for the creation of a new file
         */
        this.addHandler("webdav-create", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.writeFile(item.path, item.data, false, null, callback);
        });

        /**
         * Handler for updating an existing file
         */
        this.addHandler("webdav-write", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.writeFile(item.path, item.data, false, null, callback);
        });

        /**
         * Handler for removing a file
         */
        this.addHandler("webdav-rm", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.remove(item.path, false, callback);
        });

        /**
         * Handler for creating a new directory
         */
        this.addHandler("webdav-mkdir", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.mkdir(item.path, false, callback);
        });

        /**
         * Handler for removing a directory
         */
        this.addHandler("webdav-rmdir", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.remove(item.path, false, callback);
        });

        /**
         * Handler for moving a file or directory
         */
        this.addHandler("webdav-move", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.move(item.from, item.to, false, false, callback);
        });

        /**
         * Handler for copying a file or directory
         */
        this.addHandler("webdav-copy", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.copy(item.from, item.to, true, false, callback);
        });

        /**
         * Handler for renaming a file or directory
         */
        this.addHandler("webdav-rename", function(item, callback) {
            var webdav = fs.realWebdav || fs.webdav;
            if (webdav.fake) throw new Error("Found fake webdav, while expecting real one!");
            webdav.rename(item.from, item.to, false, false, callback);
        });

        var ident = "cloud9.filetree." + ide.workspaceId;
        function saveModel(){
            localStorage[ident] = fs.model.data.xml;
        }

        //@todo after being longer than 5 minutes offline reload tree when coming online

        ide.addEventListener("afteroffline", function(){
            if (!fs.model.data) {
                if (localStorage[ident]) {
                    fs.model.load(localStorage[ident]);
                    fs.projectName = fs.model.queryValue("folder[@root='1']/@name");
                }
            }
            else {
                saveModel();
            }
        });

        fs.model.addEventListener("update", saveModel);
        fs.model.addEventListener("afterload", saveModel);

        //File contents
        /**
         * This is where we save the files if we have offline support
         */
        function saveFiles(e) {
            // Check for offline support
            if (!ide.offlineFileSystemSupport) {
                var pages = tabEditors.getPages();
                var files = {};
                var len = pages.length;
                if (len) {
                    for (var i = 0; i < len; i++) {
                        var node;
                        // Sometimes there is no model for the page, and this
                        // could cause Cloud9 to lose data
                        if (pages[i].$model && pages[i].$model.data)
                            node = pages[i].$model.data;

                        if (node)
                            files[node.getAttribute("path")] = pages[i].$doc.getValue();
                    }
                }

                try {
                    delete localStorage[fIdent];
                    localStorage[fIdent] = JSON.stringify(files);
                } catch(e) {
                    // TODO: What if we cannot store the files?
                }
            }
        }

        ide.addEventListener("savesettings", saveFiles);
        apf.addEventListener("exit", saveFiles);

        /**** Init ****/

        ide.addEventListener("socketConnect", function() {
            offline.goOnline();
            ide.removeEventListener("socketConnect", arguments.callee);
        });

        ide.addEventListener("extload", function() {
            offline.start();
        });

        if (_self.offlineStartup)
            ide.dispatchEvent("afteroffline"); //Faking offline startup
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
        //Remove all events
    },

    bringExtensionsOnline : function(){
        var exts = ext.extensions;
        for (var i = 0, l = exts.length; i < l; i++) {
            var _ext = exts[i];
            if (_ext.offline === false)
                _ext.enable();
        }
    },

    bringExtensionsOffline : function(){
        var exts = ext.extensions;
        for (var i = 0, l = exts.length; i < l; i++) {
            var _ext = exts[i];
            if (_ext.offline === false)
                _ext.disable();
        }
    }
});

/*

//#ifdef __WITH_AUTH
var auth = apf.document.getElementsByTagNameNS(apf.ns.apf, "auth")[0];
if (!auth)
    return;

//First let's log in to the services that need it before syncing changes
if (auth.needsLogin && auth.loggedIn) { // && !auth.loggedIn
    auth.authRequired({
        object : this,
        retry  : callback
    });
}

        //#ifdef __WITH_AUTH
//if (apf.auth.retry) //Don't want to ruin the chances of having a smooth ride on a bad connection
//    apf.auth.loggedIn = false; //we're logged out now, we'll auto-login when going online
//#endif

var _self = this;
apf.addEventListener("exit", function(){
    return _self.dispatchEvent("losechanges");
});
*/

});/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var panels = require("ext/panels/panels");
var markup = require("text!ext/openfiles/openfiles.xml");

module.exports = ext.register("ext/openfiles/openfiles", {
    name            : "Active Files",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    markup          : markup,
    nodes           : [],
    
    defaultWidth    : 130,

    hook : function(){
        panels.register(this, {
            position : 2000,
            caption: "Open Files",
            "class": "open_files"
        });
        
        var model = this.model = new apf.model().load("<files />");
        
        ide.addEventListener("afteropenfile", function(e){
            var node = e.doc.getNode();
            if (node) {
                if (!model.queryNode("//node()[@path='" + node.getAttribute("path") + "']"))
                    model.appendXml(apf.getCleanCopy(node));
            }
        });

        ide.addEventListener("closefile", function(e){
            var node = e.xmlNode;
            model.removeXml("//node()[@path='" + node.getAttribute("path") + "']");
        });

        ide.addEventListener("updatefile", function(e){
            var node = e.xmlNode;

            var path = e.path || node.getAttribute("path");

            var fNode = model.queryNode("//node()[@path='" + path + "']");
            if (node && fNode) {
                if (e.path)
                    fNode.setAttribute("path", node.getAttribute("path"));
                if (e.filename)
                    apf.xmldb.setAttribute(fNode, "name", apf.getFilename(e.filename));
                if (e.changed != undefined)
                    apf.xmldb.setAttribute(fNode, "changed", e.changed);
            }
        });
    },

    init : function() {
        var _self = this;
        
        this.panel = winOpenFiles;
        this.nodes.push(winOpenFiles);
        
        colLeft.appendChild(winOpenFiles);
        
        lstOpenFiles.addEventListener("afterselect", this.$afterselect = function(e) {
            var node = this.selected;
            if (!node || this.selection.length > 1)
                return;

            ide.dispatchEvent("openfile", { doc: ide.createDocument(node) });
        });

        lstOpenFiles.addEventListener("afterremove", function(e){
            //Close selected files
            var sel = this.getSelection();
            for (var i = 0; i < sel.length; i++) {
                tabEditors.remove(tabEditors.getPage(sel[i].getAttribute("path")));
            }
        });

        tabEditors.addEventListener("afterswitch", function(e){
            var page = e.nextPage;
            if (page && page.$model.data) {
                var node = _self.model.queryNode("file[@path='" 
                    + page.$model.data.getAttribute("path") + "']");
                if (node && !lstOpenFiles.isSelected(node))
                    lstOpenFiles.select(node);
            }
        });

        ide.addEventListener("treechange", function(e) {

            var path = e.path
                        .replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                        .replace(/\[@name="workspace"\]/, "")
                        .replace(/\//, "");
            var parent = trFiles.getModel().data.selectSingleNode(path);
            if (!parent)
                return;

            var nodes = parent.childNodes;
            var files = e.files;
            var removed = [];

            for (var i = 0; i < nodes.length; ++i) {
                var node = nodes[i];
                var name = node.getAttribute("name");

                if (files[name])
                    delete files[name];
                else
                    removed.push(node);
            }

            removed.forEach(function (node) {
                apf.xmldb.removeNode(node);
            });

            path = parent.getAttribute("path");

            for (var filename in files) {
                var file = files[filename];

                var xmlNode = "<" + file.type +
                    " type='" + file.type + "'" +
                    " name='" + filename + "'" +
                    " path='" + path + "/" + filename + "'" +
                "/>";

                trFiles.add(xmlNode, parent);
            }
        });
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
        
        panels.unregister(this);
    },
});

});
/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");
var markup = require("text!ext/panels/panels.xml");

module.exports = ext.register("ext/panels/panels", {
    name   : "Panel Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    markup : markup,
    minWidth: 150,
    nodes : [],
    panels : {},
    
    currentPanel : null,
    
    register : function(panelExt, options){
        var _self = this;
        
        var beforePanel, diff = 1000000;
        for (var path in this.panels) {
            var d = this.panels[path].$panelPosition - options.position;
            if (d > 0 && d < diff) {
                beforePanel = this.panels[path];
                diff = d;
            }
        }
        
        panelExt.mnuItem = mnuProjectBar.insertBefore(new apf.item({
            caption : panelExt.name,
            type    : "radio",
            value   : panelExt.path,
            group   : this.group,
            "onprop.selected" : function(e){
                if (e.value)
                    _self.activate(panelExt);
            }
        }), beforePanel && beforePanel.mnuItem);
        
        panelExt.button = navbar.insertBefore(new apf.button({
            skin    : "mnubtn",
            state   : "true",
            //value   : "true",
            "class" : options["class"],
            caption : options.caption
        }), beforePanel && beforePanel.button || navbar.firstChild);

        //navbar.current = this;
        panelExt.button.addEventListener("mousedown", function(e){
            var value = this.value;
            if (_self.currentPanel && (_self.currentPanel != panelExt || value) && value) {
                _self.deactivate(_self.currentPanel == panelExt, true);
                
                if (value) {
                    if (!apf.isTrue(settings.model.queryValue('general/@animateui')))
                        colLeft.hide();
                    return;
                }
            }

            _self.activate(panelExt, true);
        });
        
        this.panels[panelExt.path] = panelExt;
        panelExt.$panelPosition = options.position;
        panelExt.nodes.push(panelExt.button, panelExt.mnuItem);
        
        ide.addEventListener("init." + panelExt.path, function(e){
            panelExt.panel.setAttribute("draggable", "false");
        });
        
        ide.addEventListener("loadsettings", function(){
            if (!settings.model.queryNode("auto/panels/panel[@path='" 
                + panelExt.path + "']")) {
                settings.model.appendXml("<panel path='" 
                    + panelExt.path + "' width='" 
                    + panelExt.defaultWidth + "' />", "auto/panels");
            }
        });
        
        var active = settings.model.queryValue("auto/panels/@active");
        if (panelExt["default"] && !active || active == panelExt.path)
            _self.activate(panelExt, null, true);
    },
    
    animate : function(win, toWin, toWidth){
        var tweens = [], _self = this;
        
        if (this.animateControl)
            this.animateControl.stop();
        
        this.animating = true;
        
        navbar.$ext.style.zIndex = 10000;
        
        if (toWin) {
            var toWinExt = toWin.$altExt || toWin.$ext;
            
            //Hack because of bug in hbox.js - apparently only run dialog has .$altExt
            toWin.show();
            toWin.hide();
        }
        
        if (win) {
            var left = win.getLeft();
            var top  = win.getTop();
            var width = win.getWidth();
            var height = win.getHeight();
            
            var winExt = win.$altExt || win.$ext;
            var diff  = apf.getDiff(winExt);
            var zIndex = winExt.style.zIndex;
            if(width < this.minWidth)
                width = this.minWidth;
            
            winExt.style.position = "absolute";
            winExt.style.zIndex = 1000;
            winExt.style.left = left + "px";
            winExt.style.top = top + "px";
            winExt.style.width = (width - diff[0]) + "px";
            winExt.style.height = (height - diff[1]) + "px";
            
            if (toWin) {
                tweens.push(
                    {oHtml: toWinExt, type: "fade", from: 0, to: 1},
                    {oHtml: toWinExt, type: "width", from: width, to: toWidth},
                    {oHtml: winExt, type: "width", from: width, to: toWidth},
                    {oHtml: colLeft.$ext, type: "width", from: width, to: toWidth}
                );
            }
            else {
                colLeft.$ext.style.minWidth = 0;
                tweens.push(
                    {oHtml: winExt, type: "left", from: left, to: left - width},
                    {oHtml: colLeft.$ext, type: "width", from: width, to: 0}
                );
            }
        }
        else {
            toWin.show();
            colLeft.show();

            var left = toWin.getLeft();
            var top  = toWin.getTop();
            var height = toWin.getHeight();
            var width = 0;
            
            tweens.push(
                {oHtml: toWinExt, type: "left", from: left - toWidth, to: left},
                {oHtml: colLeft.$ext, type: "width", from: width, to: toWidth}
            );
        }
        
        if (toWin) {
            var diff2  = apf.getDiff(toWinExt);
            var zIndex2 = toWinExt.style.zIndex;
            toWinExt.style.position = "absolute";
            toWinExt.style.zIndex = 2000;
            toWinExt.style.left = left + "px";
            toWinExt.style.top = top + "px";
            toWinExt.style.width = (toWidth - diff2[0]) + "px";
            toWinExt.style.height = (height - diff2[1]) + "px";
            toWin.show();
        }
        
        colLeft.$ext.style.width = width + "px";
        //apf.setOpacity(toWinExt, 0);
        
        var options = {
            steps : 8,
            interval : apf.isChrome ? 0 : 5,
            control : this.animateControl = {},
            anim : apf.tween.EASEOUT,
            tweens : tweens,
            oneach: function(){
                apf.layout.forceResize()
            },
            onfinish : function(){
                if (toWin) {
                    toWinExt.style.zIndex = zIndex2;
                    toWinExt.style.position = 
                    toWinExt.style.left = 
                    toWinExt.style.top = 
                    toWinExt.style.height =
                    toWinExt.style.width = "";
                    apf.setOpacity(toWinExt, 1);
                    colLeft.$ext.style.minWidth = _self.minWidth + "px";
                }
                if (win) {
                    winExt.style.zIndex = zIndex;
                    winExt.style.position = 
                    winExt.style.left = 
                    winExt.style.top = 
                    winExt.style.height =
                    winExt.style.width = "";
                    apf.setOpacity(winExt, 1);
                    win.hide();
                    
                    if (!toWin)
                        colLeft.hide();
                }
                
                _self.animating = false;
            }
        };
        options.onstop = options.onfinish;
        
        apf.tween.multi(document.body, options);
    },
    
    activate : function(panelExt, noButton, noAnim){
        if (this.currentPanel == panelExt)
            return;
        
        ext.initExtension(panelExt);
        
        var lastPanel = this.currentPanel;
        
        if (this.currentPanel && (this.currentPanel != this))
            this.deactivate();
        
        var width = settings.model.queryValue("auto/panels/panel[@path='" 
            + panelExt.path + "']/@width") || panelExt.defaultWidth;
        
        if (noAnim || !apf.isTrue(settings.model.queryValue('general/@animateui'))) {
            panelExt.panel.show();
            colLeft.setWidth(width);
        }
        else if (!noAnim)
            this.animate(lastPanel && lastPanel.panel, panelExt.panel, width);

        colLeft.show();
        
        if (!noButton)
            panelExt.button.setValue(true);

        splitterPanelLeft.show();
        this.currentPanel = panelExt;
        
        //settings.model.setQueryValue("auto/panels/@active", panelExt.path);
        
        ide.dispatchEvent("showpanel." + panelExt.path);
        
        panelExt.mnuItem.select(); //Will set setting too
    },
    
    deactivate : function(noButton, anim){
        if (!this.currentPanel)
            return;

        if (!apf.isTrue(settings.model.queryValue('general/@animateui'))) {
            this.currentPanel.panel.hide();
        }
        else if (anim)
            this.animate(this.currentPanel.panel);
        
        if (!noButton)
            this.currentPanel.button.setValue(false);

        splitterPanelLeft.hide();
        
        //Quick Fix
        if (apf.isGecko)
            apf.layout.forceResize(ide.vbMain.$ext);
            
        settings.model.setQueryValue("auto/panels/@active", "");
        
        ide.dispatchEvent("hidepanel." + this.currentPanel.path);
        
        this.currentPanel = null;
    },
    
    unregister : function(panelExt){
        panelExt.mnuItem.destroy(true, true);
        delete this.panels[panelExt.path];
    },

    init : function(amlNode){
        var _self = this;
        
        this.nodes.push(
            this.group = apf.document.body.appendChild(new apf.group({
                value : "[{req"+"uire('ext/settings/settings').model}::auto/panels/@active]"
            })),
            
            barMenu.appendChild(new apf.button({
                submenu : "mnuWindows",
                caption : "Windows",
                skin    : "c9-menu-btn",
                margin  : "1 0 0 0"
            })),
            mnuWindows
        );
        
        colLeft.addEventListener("resize", function(){
            if (!_self.currentPanel || _self.animating)
                return;
            
            var query = "auto/panels/panel[@path='" 
                + _self.currentPanel.path + "']/@width";
                
            if (settings.model.queryValue(query) != colLeft.getWidth())
                settings.model.setQueryValue(query, colLeft.getWidth());
        });
        
        /**** Support for state preservation ****/
        
        var _self = this;
        this.$settings = {};
        ide.addEventListener("loadsettings", function(e){
            var animateNode = e.model.queryNode("general/@animateui");
            if (!animateNode)
                e.model.setQueryValue("general/@animateui", 
                    apf.isGecko ? false : true);
        });

        var props = ["visible", "flex", "width", "height", "state"];
        ide.addEventListener("savesettings", function(e){
            var changed = false, 
                xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/panel/text()");

            var set, pset, path, parent, panel, p, i, l = props.length;
            for (path in _self.panels) {
                panel = _self.panels[path].panel;
                if (!panel) continue;

                if (!_self.$settings[path]) {
                    _self.$settings[path] = {parent: {}};
                    changed = true;
                }
                
                parent = panel.parentNode;
                set    = _self.$settings[path];
                pset   = _self.$settings[path].parent;

                for (i = 0; i < l; i++) {
                    if (props[i] == "width") {
                        if (set[p = props[i]] !== _self.panels[path].$lastWidth) {
                            set[p] = _self.panels[path].$lastWidth;
                            changed = true;
                        }
                        continue;
                    }
                        
                    if (set[p = props[i]] !== panel[p]) {
                        set[p] = panel[p];
                        changed = true;
                    }
                    if (pset[p] !== parent[p]) {
                        pset[p] = parent[p];
                        changed = true;
                    }
                }
            }
            
            if (changed) {
                xmlSettings.nodeValue = apf.serialize(_self.$settings);
                return true;
            }
        });
        
        ide.addEventListener("init.ext/settings/settings", function (e) {
            var heading = e.ext.getHeading("General");
            heading.appendChild(new apf.checkbox({
                "class" : "underlined",
                value : "[general/@animateui]",
                skin  : "checkbox_grey",
                label : "Enable UI Animations"
            }))
        });
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
/**
 * quicksearch Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var code = require("ext/code/code");
var editors = require("ext/editors/editors");
var Search = require("ace/search").Search;
var skin = require("text!ext/quicksearch/skin.xml");
var markup = require("text!ext/quicksearch/quicksearch.xml");

var oIter, oTotal;

module.exports = ext.register("ext/quicksearch/quicksearch", {
    name    : "quicksearch",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    skin    : {
        id  : "quicksearch",
        data : skin,
        "icon-path" : ide.staticPrefix + "/ext/quicksearch/icons/"
    },
    markup  : markup,
    commands : {
        "quicksearch": {hint: "quickly search for a string inside the active document, without further options (see 'search')"},
        "find": {hint: "open the quicksearch dialog to quickly search for a phrase"},
        "findnext": {
            hint: "search for the next occurrence of the search query your entered last",
            msg: "Navigating to next match."
        },
        "findprevious": {
            hint: "search for the previous occurrence of the search query your entered last",
            msg: "Navigating to previous match."
        }
    },
    defaultOffset : 30,
    offsetWidth : 30,
    hotitems: {},

    nodes   : [],

    currentRange: null,

    hook : function(){
        var _self = this;
        code.commandManager.addCommand({
            name: "find",
            exec: function(env, args, request) {
                _self.toggleDialog(1);
            }
        });

        ide.addEventListener("minimap.visibility", function(e) {
            if (e.visibility === "shown")
                _self.offsetWidth = _self.defaultOffset + e.width;
            else
                _self.offsetWidth = _self.defaultOffset;

            _self.updateBarPosition();
        });
    },

    init : function(amlNode){
        var _self = this;

        txtQuickSearch.addEventListener("keydown", function(e){
            switch (e.keyCode){
                case 13: //ENTER
                    _self.execSearch(false, !!e.shiftKey);
                    return false;
                case 27: //ESCAPE
                    _self.toggleDialog(-1);
                    if (e.htmlEvent)
                        apf.stopEvent(e.htmlEvent);
                    else if (e.stop)
                        e.stop();
                    return false;
                case 38: //UP
                    _self.navigateList("prev");
                break;
                case 40: //DOWN
                    _self.navigateList("next");
                break;
                case 36: //HOME
                    if (!e.ctrlKey) return;
                    _self.navigateList("first");
                break;
                case 35: //END
                    if (!e.ctrlKey) return;
                    _self.navigateList("last");
                break;
            }
        });

        winQuickSearch.addEventListener("blur", function(e){
            if (!apf.isChildOf(winQuickSearch, e.toElement))
                _self.toggleDialog(-1);
        });
        txtQuickSearch.addEventListener("blur", function(e){
            if (!apf.isChildOf(winQuickSearch, e.toElement))
                _self.toggleDialog(-1);
        });

        var editor = editors.currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.parentNode.appendChild(winQuickSearch);
            
        setTimeout(function() {
            _self.updateBarPosition();
        });
    },

    updateBarPosition : function() {
        if (!window["winQuickSearch"])
            return;

        winQuickSearch.setAttribute("right", this.offsetWidth);
    },

    navigateList : function(type){
        var settings = require("ext/settings/settings");
        if (!settings)
            return;

        var model = settings.model;
        var lines = model.queryNodes("search/word");

        var next;
        if (type == "prev")
            next = Math.max(0, this.position - 1);
        else if (type == "next")
            next = Math.min(lines.length - 1, this.position + 1);
        else if (type == "last")
            next = Math.max(lines.length - 1, 0);
        else if (type == "first")
            next = 0;

        if (lines[next]) {
            txtQuickSearch.setValue(lines[next].getAttribute("key"));
            txtQuickSearch.select();
            this.position = next;
        }
    },

    handleQuicksearchEscape : function(e) {
        if (e.keyCode == 27)
            this.toggleDialog(-1);
    },

    updateCounter: function() {
        var ace = this.$getAce();
        var width, buttonWidth;

        if (!oIter) {
            oIter  = document.getElementById("spanSearchIter");
            oTotal = document.getElementById("spanSearchTotal");
        }

        if (oIter.parentNode) {
            if (!ace || !winQuickSearch.visible) {
                oIter.parentNode.style.width = "0px";
                return;
            }
            else
                oIter.parentNode.style.width = "auto";
        }

        setTimeout(function() {
            if (oIter.parentNode && txtQuickSearch && txtQuickSearch.$button) {
                width = oIter.parentNode.offsetWidth || 0;
                txtQuickSearch.$button.style.right = width + "px";
            }
        });

        var ranges = ace.$search.findAll(ace.getSession());
        if (!ranges || !ranges.length) {
            oIter.innerHTML = "0";
            oTotal.innerHTML = "of 0";
            return;
        }
        var crtIdx = -1;
        var cur = this.currentRange;
        if (cur) {
            // sort ranges by position in the current document
            ranges.sort(cur.compareRange.bind(cur));
            var range;
            var start = cur.start;
            var end = cur.end;
            for (var i = 0, l = ranges.length; i < l; ++i) {
                range = ranges[i];
                if (range.isStart(start.row, start.column) && range.isEnd(end.row, end.column)) {
                    crtIdx = i;
                    break;
                }
            }
        }
        oIter.innerHTML = String(++crtIdx);
        oTotal.innerHTML = "of " + ranges.length;
    },

    toggleDialog: function(force) {
        ext.initExtension(this);

        if (this.control && this.control.stop)
            this.control.stop();

        var editorPage = tabEditors.getPage();
        if (!editorPage) return;

        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        var _self = this;

        if (!force && !winQuickSearch.visible || force > 0) {
            this.position = -1;

            var sel   = editor.getSelection();
            var doc   = editor.getDocument();
            var range = sel.getRange();
            var value = doc.getTextRange(range);

            if (!value && editor.ceEditor)
               value = editor.ceEditor.getLastSearchOptions().needle;

            if (value)
                txtQuickSearch.setValue(value);

            winQuickSearch.$ext.style.top = "-30px";
            winQuickSearch.show();
            txtQuickSearch.focus();
            txtQuickSearch.select();

            //Animate
            apf.tween.single(winQuickSearch, {
                type     : "top",
                anim     : apf.tween.easeInOutCubic,
                from     : -27,
                to       : 2,
                steps    : 8,
                interval : 10,
                control  : (this.control = {}),
                onfinish : function() {
                    _self.updateCounter();
                }
            });
        }
        else if (winQuickSearch.visible) {
            txtQuickSearch.focus();
            txtQuickSearch.select();

            //Animate
            apf.tween.single(winQuickSearch, {
                type     : "top",
                anim     : apf.tween.NORMAL,
                from     : winQuickSearch.$ext.offsetTop,
                to       : -30,
                steps    : 8,
                interval : 10,
                control  : (this.control = {}),
                onfinish : function(){
                    winQuickSearch.hide();
                    editor.ceEditor.focus();
                }
            });
        }

        return false;
    },

    quicksearch : function(){
        this.toggleDialog(1);
    },

    execSearch: function(close, backwards) {
        var ace = this.$getAce();
        if (!ace)
            return;

        var txt = txtQuickSearch.getValue();
        if (!txt)
            return;

        var options = {
            backwards: !!backwards,
            wrap: true,
            caseSensitive: false,
            wholeWord: false,
            regExp: false,
            scope: Search.ALL
        };

        if (this.$crtSearch != txt)
            this.$crtSearch = txt;
        ace.find(txt, options);
        this.currentRange = ace.selection.getRange();

        var settings = require("ext/settings/settings");
        if (settings.model) {
            var history = settings.model;
            var search = apf.createNodeFromXpath(history.data, "search");

            if (!search.firstChild || search.firstChild.getAttribute("key") != txt) {
                var keyEl = apf.getXml("<word />");
                keyEl.setAttribute("key", txt);
                apf.xmldb.appendChild(search, keyEl, search.firstChild);
            }
        }

        if (close) {
            winQuickSearch.hide();
            editors.currentEditor.ceEditor.focus();
        }

        this.updateCounter();
    },

    find: function() {
        this.toggleDialog(1);
        return false;
    },

    findnext: function() {
        var ace = this.$getAce();
        if (!ace)
            return;

        ace.findNext();
        this.currentRange = ace.selection.getRange();
        this.updateCounter();
        return false;
    },

    findprevious: function() {
        var ace = this.$getAce();
        if (!ace)
            return;

        ace.findPrevious();
        this.currentRange = ace.selection.getRange();
        this.updateCounter();
        return false;
    },

    $getAce: function() {
        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        var ceEditor = editor.ceEditor;
        return ceEditor.$editor;
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
/**
 * Identifies some "hot spots" in the IDE that users should be aware of
 * 
 * @author Garen J. Torikian
 * 
 * @copyright 2011, Cloud9 IDE, Inc
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var skin = require("text!ext/quickstart/skin.xml");
var markup = require("text!ext/quickstart/quickstart.xml");

var jsonQuickStart = {
    identifiers: [
        {
            el : apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:hbox[1]/a:vbox[1]/button[@caption="Project Files"]'),
            name : "qsProjectBar",
            pos: "right"
        },
        {
            el : logobar,
            name : "qsMenuBar",
            pos: "bottom"
        },
       {
            el : tabEditors,
            name : "qsToolbar",
            pos: "left",
            visible: function(){
                return hboxDockPanel.childNodes[0];
            }
        },
        {
            el : apf.document.selectSingleNode('/html[1]/body[1]/a:vbox[1]/a:vbox[1]/a:bar[1]/a:vbox[1]/a:hbox[1]'),
            name : "qsCLI",
            pos: "top"
        }
    ]
};

// require("ext/settings/settings").model.queryValue("auto/help/@show") == "false"
//ide.addEventListener("loadsettings", function(){

module.exports = ext.register("ext/quickstart/quickstart", {
    name     : "Quick Start",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    skin    : {
        id   : "quickstart",
        data : skin,
        "media-path" : "/static/ext/quickstart/images/"
    },
    nodes : [],

    init : function(amlNode){   
        this.overlay = document.createElement("div");
        this.overlay.setAttribute("style",
            "z-index:9016;display:none;position:fixed;left: 0px;top: 0px;width:100%;height:100%;opacity:0.3;background:#000;");
        document.body.appendChild(this.overlay);
    },
    
    hook : function(){
        var _self = this;
                
        ide.addEventListener("loadsettings", function(e) {
            var showQS = require("ext/settings/settings").model.queryValue("auto/help/@show");
            if(showQS === "" || showQS == "true") {
                if(apf.getcookie("show-quick-start") == "false") {
                    require("ext/settings/settings").model.setQueryValue("auto/help/@show", "false");   
                }
                else {
                    require("ext/settings/settings").model.setQueryValue("auto/help/@show", "true");
                    apf.xmldb.setAttribute(require("ext/settings/settings").model.queryNode("auto/help"), "show", "true");
                    _self.launchQS();
                }
             }
         });
    },
    
    launchQS : function() {
        var _self = this;
        ext.initExtension(this);
        this.hideMenus();
         //debugPanelCompact.show();
        setTimeout(function(){
            _self.overlay.style.display = "block";
            _self.arrangeQSImages();
            quickStartDialog.show();
        })
    },
    
    setState: function(state){
        apf.setcookie("show-quick-start", state, new Date().getTime() + 1000*3600*24*365*2);
    },
    
    hideMenus: function(){
        var buttons = require("ext/dockpanel/dockpanel").getButtons("ext/debugger/debugger");
        if(!buttons)
            return;
        for(var i = 0, button; i < buttons.length; i++) {
            button = buttons[i];
            if(!button.showMenu || !button.cache)
                continue;
            
            self[button.cache.submenu].hide();
        }
    },
    
    /**
    * Arrange the images pointing out the locations
    */
    arrangeQSImages : function() {
        var divToId, position, imgDiv;
        for (var i = 0; i < jsonQuickStart.identifiers.length; i++) {
            if(jsonQuickStart.identifiers[i].visible && !jsonQuickStart.identifiers[i].visible())
                continue;            
            
            divToId = require("ext/guidedtour/guidedtour").getElementPosition(jsonQuickStart.identifiers[i].el);
            position = jsonQuickStart.identifiers[i].pos;
            imgDiv = apf.document.getElementById(jsonQuickStart.identifiers[i].name);
            
            imgDiv.setAttribute("bottom", "");
            imgDiv.setAttribute("top", "");
            imgDiv.setAttribute("left", "");
            imgDiv.setAttribute("right", "");
        
            this.setPositions(position, divToId, imgDiv);     
            
            imgDiv.show();
        }
    },
    
    setPositions : function(position, posArray, div) {
        if (position == "top") {
             div.setAttribute("bottom", (window.innerHeight - posArray[1]) + 100);
             div.setAttribute("left", (posArray[0] + (posArray[2]/2)) - (div.getWidth()/2));
        }
        else if (position == "right"){
            div.setAttribute("left", posArray[0] + posArray[2] - 2);
            div.setAttribute("top", (posArray[1] + (posArray[3]/2)) - (div.getHeight()/2));            
        }
        else if (position == "bottom"){
            div.setAttribute("top", posArray[3]);
            div.setAttribute("right", (posArray[0] + (posArray[2]/2)) - (div.getWidth()/2));
        }
        else if (position == "left"){
            div.setAttribute("top", 125);
            div.setAttribute("right", 0);
        }  
        
        return div;
    },
    
    closeStart : function() {
        //debugPanelCompact.hide();
        quickStartDialog.hide();
        this.overlay.style.display = "none";
        
        var imgDiv;
        for (var i = 0; i < jsonQuickStart.identifiers.length; i++) {
            imgDiv = apf.document.getElementById(jsonQuickStart.identifiers[i].name);
            imgDiv.hide();
        }
    },
    
    shutdownQSStartGT : function() {
        this.closeStart();
        require('ext/guidedtour/guidedtour').launchGT();
    }
});

});/**
 * quickwatch Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var editors = require("ext/editors/editors");
var noderunner = require("ext/noderunner/noderunner");
var markup = require("text!ext/quickwatch/quickwatch.xml");

module.exports = ext.register("ext/quickwatch/quickwatch", {
    name    : "quickwatch",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    deps   : [noderunner],
    commands : {
        "quickwatch": {hint: "quickly inspect the variable that is under the cursor"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
    },

    init : function(amlNode){
        txtCurObject.addEventListener("keydown", function(e){
            if (e.keyCode == 13) {
                if (!this.value.trim())
                    return dgWatch.clear();

                require("ext/debugger/inspector").evaluate(this.value);
            }
            else if (e.keyCode == 40 && dgWatch.length) {
                var first = dgWatch.getFirstTraverseNode();
                if (first) {
                    dgWatch.select(first);
                    dgWatch.focus();
                }
            }
        });

        var restricted = [38, 40, 36, 35];
        dgWatch.addEventListener("keydown", function(e) {
            if (e.keyCode == 38) {
                if (this.selected == this.getFirstTraverseNode())
                    txtCurObject.focus();
            }
            else if (restricted.indexOf(e.keyCode) == -1) {
                txtCurObject.focus();
            }
        }, true);
    },

    toggleDialog: function(force, exec) {
        ext.initExtension(this);

        if (!winQuickWatch.visible || force == 1) {
            var editor = editors.currentEditor;

            var range;
            var sel   = editor.getSelection();
            var doc   = editor.getDocument();
            if (sel.isEmpty()) {
                var cursor = sel.getCursor();
                range = doc.getWordRange(cursor.row, cursor.column);
            }
            else
                range = sel.getRange();
            var value = doc.getTextRange(range);

            if (value) {
                txtCurObject.setValue(value);
                if (exec) {
                    require("ext/debugger/inspector").evaluate(value);
                    txtCurObject.focus();
                }
            }

            winQuickWatch.show();
        }
        else
            winQuickWatch.hide();

        return false;
    },

    quickwatch : function(){
        this.toggleDialog(1, true);
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

});/**
 * Adds a menu item with a submenu that lists all recently opened files
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

module.exports = ext.register("ext/recentfiles/recentfiles", {
    dev         : "Ajax.org",
    name        : "Recent Files",
    alone       : true,
    type        : ext.GENERAL,
    deps        : [],
    offline     : true,

    currentSettings : [],
    nodes       : [],

    init : function(){
        var _self = this;

        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Open Recent",
                submenu : "mnuRecent"
            }), ide.mnuFile.firstChild),

            apf.document.body.appendChild(this.menu = new apf.menu({
                id : "mnuRecent",
                childNodes : [
                    this.divider = new apf.divider(),
                    new apf.item({
                        caption : "Clear Menu",
                        onclick : function(){
                            _self.clearMenu();
                        }
                    })
                ]
            }))
        );

        ide.addEventListener("loadsettings", function(e){
            var model = e.model;
            var strSettings = model.queryValue("auto/recentfiles");
            if (strSettings) {
                var currentSettings;
                try {
                    currentSettings = JSON.parse(strSettings);
                }
                catch (ex) {
                    //fail! revert to default
                    currentSettings = [];
                }

                _self.clearMenu();

                for (var i = currentSettings.length - 1; i >= 0; i--) {
                    _self.$add(currentSettings[i]);
                }
            }
        });

        ide.addEventListener("savesettings", function(e){
            if (!_self.changed)
                return;

            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/recentfiles/text()");

            var currentSettings = [];
            var nodes = _self.menu.childNodes;
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].localName == "item") {
                    currentSettings.push({
                        caption : nodes[i].caption,
                        value   : nodes[i].value
                    });
                }
                else break;
            }

            xmlSettings.nodeValue = apf.serialize(currentSettings);
            return true;
        });

        function evHandler(e){
            var node = e.node || e.xmlNode;

            if (!node)
                return;

            if (e.name != "afterfilesave" && node.getAttribute("newfile") == 1)
                return;

            var obj = {
                caption : node.getAttribute("name"),
                value   : node.getAttribute("path"),
                node    : node
            };

            _self.currentSettings.shift(obj);

            _self.$add(obj);
        }

        ide.addEventListener("afteropenfile", evHandler);
        ide.addEventListener("afterfilesave", evHandler);
        ide.addEventListener("closefile", evHandler);
    },

    $add : function(def) {
        var found, nodes = this.menu.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;

            if (nodes[i].localName == "item") {
                if (nodes[i].value == def.value) {
                    found = nodes[i];
                    break;
                }
            }
            else break;
        }

        if (found) {
            this.menu.insertBefore(found, this.menu.firstChild);
        }
        else {
            this.menu.insertBefore(new apf.item({
                caption : def.caption,
                value   : def.value,
                onclick : function(){
                    var node = apf.getXml("<file />");
                    node.setAttribute("name", def.caption);
                    node.setAttribute("path", def.value);

                    ide.dispatchEvent("openfile", {doc: ide.createDocument(node)});
                }
            }), this.menu.firstChild);
        }

        while (this.menu.childNodes.length > 12) {
            this.menu.removeChild(this.divider.previousSibling);
        }

        this.changed = true;
    },

    clearMenu : function(){
        var nodes = this.menu.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            if (nodes[0].localName == "item")
                this.menu.removeChild(nodes[0]);
            else break;
        }
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
/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var noderunner = require("ext/noderunner/noderunner");
var panels = require("ext/panels/panels");
var settings = require("ext/settings/settings");
var dock = require("ext/dockpanel/dockpanel");
var save = require("ext/save/save");
var markup = require("text!ext/runpanel/runpanel.xml");
var buttonsMarkup = require("text!ext/runpanel/runbuttons.xml");
var markupSettings = require("text!ext/runpanel/settings.xml");

module.exports = ext.register("ext/runpanel/runpanel", {
    name    : "Run Panel",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    //offline : false,
    markup  : markup,
    deps    : [noderunner],

    defaultWidth : 270,

    commands : {
        "run": {
            "hint": "run and debug a node program on the server",
            "commands": {
                "[PATH]": {"hint": "path pointing to an executable. Autocomplete with [TAB]"}
            }
        },
        "stop": {
            "hint": "stop a running node program on the server",
            "commands": {
                "[PATH]": {"hint": "path pointing to an executable. Autocomplete with [TAB]"}
            }
        }
    },

    hotitems: {},

    nodes : [],

    hook : function(){
        var _self = this;

        panels.register(this, {
            position : 3000,
            caption: "Run",
            "class": "rundebug"
        });

        apf.document.body.insertMarkup(buttonsMarkup);

        this.nodes.push(
            mnuRunCfg
        );

        while (tbRun.childNodes.length) {
            var button = tbRun.firstChild;

            ide.barTools.appendChild(button);
            if (button.nodeType == 1) {
                this.nodes.push(button);
            }
        }

        mdlRunConfigurations.addEventListener("afterload", function(e) {
            _self.$populateMenu();
        });

        //Settings Support
        ide.addEventListener("init.ext/settings/settings", function(e) {
            var heading = e.ext.getHeading("General");
            heading.insertMarkup(markupSettings);
        });

        ide.addEventListener("loadsettings", function(e){
            var runConfigs = e.model.queryNode("auto/configurations");
            if (!runConfigs) {
                runConfigs = apf.createNodeFromXpath(e.model.data, "auto/configurations");
                apf.xmldb.setAttribute(runConfigs, "debug", "true");

                e.model.setQueryValue("general/@saveallbeforerun", false);
            }
            if (!e.model.queryNode("auto/configurations/@debug"))
                e.model.setQueryValue("auto/configurations/@debug", true);
            if (!e.model.queryNode("auto/configurations/@autohide"))
                e.model.setQueryValue("auto/configurations/@autohide", true);

            if (!runConfigs.selectSingleNode("config[@curfile]")) {
                var setLast = false;
                if (!e.model.queryNode("auto/configurations/config[@last='true']")) {
                    var config = e.model.queryNode("auto/configurations/config")
                    if (config)
                        apf.xmldb.setAttribute(config, "last", "true");
                    else
                        setLast = true;
                }

                var cfg = apf.n("<config />")
                    .attr("name", " (active file)")
                    .attr("curfile", "1");
                if (setLast)
                    cfg.attr("last", "true");
                runConfigs.insertBefore(cfg.node(), runConfigs.firstChild);
            }

            mdlRunConfigurations.load(runConfigs);
        });

        var page = tabEditors.getPage();
        if (page && page.$model) {
            var path = page.$model.queryValue("@path").replace(ide.davPrefix, "");
            mdlRunConfigurations.setQueryValue("config[@curfile]/@path", path);
            mdlRunConfigurations.setQueryValue("config[@curfile]/@name",
                path.split("/").pop() + " (active file)");
        }

        tabEditors.addEventListener("afterswitch", function(e){
            var page = e.nextPage;
            var path = page.$model.queryValue("@path").replace(ide.davPrefix, "");
            mdlRunConfigurations.setQueryValue("config[@curfile]/@path", path);
            mdlRunConfigurations.setQueryValue("config[@curfile]/@name",
                path.split("/").pop() + " (active file)");
        });

        ide.addEventListener("afterfilesave", function(e){
            var page = tabEditors.getPage();
            if (page) {
                var path = page.$model.queryValue("@path").replace(ide.davPrefix, "");
                mdlRunConfigurations.setQueryValue("config[@curfile]/@path", path);
                mdlRunConfigurations.setQueryValue("config[@curfile]/@name",
                    path.split("/").pop() + " (active file)");
            }
        });

        var hasBreaked = false;
        stProcessRunning.addEventListener("deactivate", function(){
            if (!_self.autoHidePanel())
                return;

            var name = "ext/debugger/debugger";
            dock.hideSection(name, false);
            hasBreaked = false;

            /*var bar = dock.getBars("ext/debugger/debugger", "pgDebugNav")[0];
            if (!bar.extended)
                dock.hideBar(bar);*/
        });
        /*stProcessRunning.addEventListener("activate", function(){
            if (!_self.shouldRunInDebugMode() || !_self.autoHidePanel())
                return;

            var bar = dock.getBars("ext/debugger/debugger", "pgDebugNav")[0];
            if (!bar.extended)
                dock.showBar(bar);
        });*/
        ide.addEventListener("break", function(){
            if (!_self.shouldRunInDebugMode() || !_self.autoHidePanel() || hasBreaked)
                return;

            hasBreaked = true;

            var name = "ext/debugger/debugger";
            dock.showSection(name, false);

            var uId = dock.getButtons(name, "pgDebugNav")[0].uniqueId;
            if (dock.layout.isExpanded(uId) < 0)
                dock.layout.showMenu(uId);

            //var bar = dock.getBars("ext/debugger/debugger", "pgDebugNav")[0];
            //dock.expandBar(bar);
        });
//        ide.addEventListener("dockpanel.load.settings", function(e){
//            var state = e.state;
//
//            if (_self.autoHidePanel() && !stProcessRunning.active) {
//                var bar = dock.getBars("ext/debugger/debugger", "pgDebugNav", state)[0];
//                bar.sections.each(function(section){
//                    section.buttons.each(function(button){
//                        if (!button.hidden || button.hidden == -1)
//                            button.hidden = 1;
//                    });
//                });
//            }
//        });

        // When we are not in debug mode and we close a page it goes back to be
        // automatically opened when the debug process starts
        ide.addEventListener("init.ext/debugger/debugger", function(){
            tabDebug.getPages().concat(tabDebugButtons.getPages()).each(function(page){
                page.addEventListener("afterclose", function(e){
                    if (_self.autoHidePanel() && !stProcessRunning.active) {
                        this.$dockbutton.$dockData.hidden = 1;
                    }
                });
            });
        });

        this.hotitems["run"]  = [btnRun];
        this.hotitems["stop"] = [btnStop];
    },

    checkAutoHide : function(){
        /*var value = settings.model.queryValue("auto/configurations/@autohide");
        var bar = dock.getBars("ext/debugger/debugger", "pgDebugNav")[0];

        if (value && bar.cache && bar.cache.visible)
            dock.hideSection("ext/debugger/debugger");
        else if (!value && bar.cache && !bar.cache.visible)
            dock.showSection("ext/debugger/debugger");*/
    },

    init : function(amlNode){
        this.panel = winRunPanel;

        colLeft.appendChild(winRunPanel);
        this.nodes.push(winRunPanel);

        lstRunCfg.addEventListener("afterremove", function(e){
            mnuRunCfg.childNodes.each(function(item){
                if (item.node == e.args[0].xmlNode)
                    item.destroy(true, true);
            });
        });
    },

    duplicate : function() {
        var config = lstRunCfg.selected;
        if (!config)
            return;

        var duplicate = config.cloneNode(true);
        apf.b(config).after(duplicate);
        lstRunCfg.select(duplicate);
        winRunPanel.show();
    },

    addConfig : function() {
        var path, name, file = ide.getActivePageModel();
        var extension = "";
        
        if(!file)
            return;
            
        path  = file.getAttribute("path").slice(ide.davPrefix.length + 1); //@todo inconsistent
        name  = file.getAttribute("name").replace(/\.(js|py)$/,
            function(full, ext){ extension = ext; return ""; });

        var cfg = apf.n("<config />")
            .attr("path", path)
            .attr("name", name)
            .attr("extension", extension)
            .attr("args", "").node();

        var node = mdlRunConfigurations.appendXml(cfg);
        this.$addMenuItem(node);
        lstRunCfg.select(cfg);
    },

    showRunConfigs : function() {
        panels.activate(this);
    },

    autoHidePanel : function(){
        return apf.isTrue(settings.model.queryValue("auto/configurations/@autohide"));
    },

    shouldRunInDebugMode : function(){
        return apf.isTrue(settings.model.queryValue('auto/configurations/@debug'));
    },

    run : function(debug) {
        this.runConfig(window.winRunPanel && winRunPanel.visible
            ? lstRunCfg.selected
            : (mdlRunConfigurations.queryNode("node()[@last='true']")
                || mdlRunConfigurations.queryNode("config[@curfile]")),
            this.shouldRunInDebugMode());
        ide.dispatchEvent("track_action", {type: debug ? "debug" : "run"});
    },

    $populateMenu : function() {
        var menu = mnuRunCfg;

        var item = menu.firstChild;
        while (item && item.tagName !== "a:divider") {
            menu.removeChild(item);
            item = menu.firstChild;
        }
        var divider = item;

        var configs = mdlRunConfigurations.queryNodes("config");
        if (!configs.length)
            menu.insertBefore(new apf.item({disabled:true, caption: "No run history"}), divider);
        else {
            for (var i =  0, l = configs.length; i < l; i++) {
                this.$addMenuItem(configs[i], divider);
            }
        }
    },

    $addMenuItem : function(cfg, divider){
        var _self = this;

        if (!divider)
            divider = mnuRunCfg.getElementsByTagNameNS(apf.ns.aml, "divider")[0];

        mnuRunCfg.insertBefore(new apf.item({
            caption  : "[{this.node}::@name]",
            node     : cfg,
            type     : "radio",
            selected : "[{this.node}::@last]",
            onclick  : function() {
                _self.runConfig(this.node, _self.shouldRunInDebugMode());
                if (self.lstRunCfg)
                    lstRunCfg.select(this.node);
            }
        }), divider)
    },

    runConfig : function(config, debug) {
        ext.initExtension(this);
        var model = settings.model;
        var saveallbeforerun = apf.isTrue(model.queryValue("general/@saveallbeforerun"));
        if (saveallbeforerun)
            save.saveall();

        if (debug === undefined)
            debug = config.parentNode.getAttribute("debug") == "1";

        var lastNode = apf.queryNode(config, "../node()[@last]");
        if (lastNode)
            apf.xmldb.removeAttribute(lastNode, "last");
        apf.xmldb.setAttribute(config, "last", "true");

        // dispatch here instead of in the implementation because the implementations
        // will vary over time
        ide.dispatchEvent("beforeRunning");

        noderunner.run(
            config.getAttribute("path"),
            (config.getAttribute("args") || "").split(" "),
            debug,
            ddRunnerSelector.value
        );
    },

    stop : function() {
        noderunner.stop();

        //dock.hideSection(["ext/run/run", "ext/debugger/debugger"]);
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

        panels.unregister(this);
    }
});

});
/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var fs = require("ext/filesystem/filesystem");
var css = require("text!ext/save/save.css");
var markup = require("text!ext/save/save.xml");

module.exports = ext.register("ext/save/save", {
    dev         : "Ajax.org",
    name        : "Save",
    alone       : true,
    type        : ext.GENERAL,
    markup      : markup,
    css         : css,
    deps        : [fs],
    offline     : true,

    commands    : {
        "quicksave": {hint: "save the currently active file to disk"},
        "saveas": {hint: "save the file to disk with a different filename"},
        "reverttosaved": {hint: "downgrade the currently active file to the last saved version"}
    },
    hotitems    : {},
    nodes       : [],
    saveBuffer  : {},

    hook : function(){
        if (!self.tabEditors) return;

        var _self = this;

        tabEditors.addEventListener("close", this.$close = function(e) {
            var at = e.page.$at;
            if (!at.undo_ptr)
                at.undo_ptr = at.$undostack[0];
            var node = e.page.$doc.getNode();
            if (node && at.undo_ptr && at.$undostack[at.$undostack.length-1] !== at.undo_ptr
              || !at.undo_ptr && node.getAttribute("changed") == 1
              && e.page.$doc.getValue()) {
                ext.initExtension(_self);

                var pages   = tabEditors.getPages(),
                currIdx = pages.indexOf(e.page);
                tabEditors.set(pages[currIdx].id); //jump to file

                var filename = node.getAttribute("path").replace(ide.workspaceDir, "").replace(ide.davPrefix, "");

                winCloseConfirm.page = e.page;
                winCloseConfirm.all  = -100;
                winCloseConfirm.show();

                fileDesc.insertMarkup("<div><h3>Save " +  "?</h3><div>This file has unsaved changes. Your changes will be lost if you don't save them.</div></div>");

                winCloseConfirm.addEventListener("hide", function(){
                    if (winCloseConfirm.all != -100) {
                        var f = function(resetUndo){
                            var page;
                            if (!(page=winCloseConfirm.page))
                                return;

                            tabEditors.remove(page, true, page.noAnim);
                            delete page.noAnim;
                            if (resetUndo)
                                page.$at.undo(-1);
                            delete winCloseConfirm.page;
                            page.dispatchEvent("aftersavedialogclosed");
                        };

                        if (winCloseConfirm.all == -200)
                            _self.quicksave(winCloseConfirm.page, f);
                        else
                            f(true);
                        /*winSaveAs.page = winCloseConfirm.page;*/
                    }
                    else
                        tabEditors.dispatchEvent("aftersavedialogcancel");

                    winCloseConfirm.removeEventListener("hide", arguments.callee);
                });

                btnYesAll.hide();
                btnNoAll.hide();

                e.preventDefault();
            }
        });

        this.nodes.push(ide.barTools.appendChild(new apf.button({
            id       : "btnSave",
            icon     : "save.png",
            tooltip  : "Save",
            skin     : "c9-toolbarbutton",
            disabled : "{!!!tabEditors.activepage}",
            onclick  : this.quicksave.bind(this)
        })));

        var saveItem, saveAsItem;
        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.divider(), ide.mnuFile.firstChild),

            ide.mnuFile.insertBefore(new apf.item({
                caption : "Save All",
                onclick : function(){
                    _self.saveall();
                },
                disabled : "{!!!tabEditors.activepage}"
            }), ide.mnuFile.firstChild),

            saveAsItem = ide.mnuFile.insertBefore(new apf.item({
                caption : "Save As...",
                onclick : function () {
                    _self.saveas();
                },
                disabled : "{!!!tabEditors.activepage}"
            }), ide.mnuFile.firstChild),

            saveItem = ide.mnuFile.insertBefore(new apf.item({
                caption : "Save",
                onclick : this.quicksave.bind(this),
                disabled : "{!!!tabEditors.activepage}"
            }), ide.mnuFile.firstChild),

            ide.mnuFile.insertBefore(new apf.divider(), ide.mnuFile.firstChild),

            ide.mnuFile.insertBefore(new apf.item({
                caption : "Revert to Saved",
                onclick : function(){
                    _self.reverttosaved();
                },
                disabled : "{!!!tabEditors.activepage}"
            }), ide.mnuFile.firstChild)
        );

        this.hotitems.quicksave = [saveItem];
        this.hotitems.saveas = [saveAsItem];
    },

    init : function(amlNode){
        this.fileDesc = winCloseConfirm.selectSingleNode("a:vbox");

        apf.importCssString((this.css || ""));
        winCloseConfirm.onafterrender = function(){
            btnYesAll.addEventListener("click", function(){
                winCloseConfirm.all = 1;
                winCloseConfirm.hide();
            });
            btnNoAll.addEventListener("click", function(){
                winCloseConfirm.all = -1;
                winCloseConfirm.hide();
            });
            btnSaveYes.addEventListener("click", function(){
                winCloseConfirm.all = -200;
                winCloseConfirm.hide();
            });
            btnSaveNo.addEventListener("click", function(){
                winCloseConfirm.all = 0;
                winCloseConfirm.hide();
            });
            btnSaveCancel.addEventListener("click", function(){
                winCloseConfirm.all = -100;
                winCloseConfirm.hide();
            });
        };

        winSaveAs.addEventListener("hide", function(){
            if (winSaveAs.page) {
                tabEditors.remove(winSaveAs.page, true);
                winSaveAs.page.$at.undo(-1);
                delete winSaveAs.page;
            }
        });
    },

    reverttosaved : function(){
        ide.dispatchEvent("reload", {doc : tabEditors.getPage().$doc});
    },

    saveall : function(){
        tabEditors.getPages().forEach(this.quicksave, this);
    },

    saveAllInteractive : function(pages, callback){
        ext.initExtension(this);

        winCloseConfirm.all = 0;

        var _self = this;
        apf.asyncForEach(pages, function(item, next) {
            var at = item.$at;
            if (at.undo_ptr && at.$undostack[at.$undostack.length-1] !== at.undo_ptr) {
                if (winCloseConfirm.all == 1)
                    _self.quicksave(item);

                if (winCloseConfirm.all)
                    return next();

                tabEditors.set(item);
                winCloseConfirm.page = item;
                winCloseConfirm.show();
                winCloseConfirm.addEventListener("hide", function(){
                    if (winCloseConfirm.all == 1)
                        _self.quicksave(item);

                    winCloseConfirm.removeEventListener("hide", arguments.callee);
                    next();
                });

                btnYesAll.setProperty("visible", pages.length > 1);
                btnNoAll.setProperty("visible", pages.length > 1);
            }
            else
                next();
        },
        function() {
            callback(winCloseConfirm.all);
        });
    },

    // `silentsave` indicates whether the saving of the file is forced by the user or not.
    quicksave : function(page, callback, silentsave) {
        if (!page || !page.$at)
            page = tabEditors.getPage();

        if (!page)
            return;

        var doc  = page.$doc;
        var node = doc.getNode();
        var path = node.getAttribute("path");

        if (node.getAttribute("debug"))
            return;

        if (ide.dispatchEvent("beforefilesave", {node: node, doc: doc }) === false)
            return;

        if (node.getAttribute("newfile")){
            this.saveas(page, callback);
            return;
        }

        if (callback) {
            ide.addEventListener("afterfilesave", function(e) {
                if (e.node == node) {
                    callback();
                    this.removeEventListener("afterfilesave", arguments.callee);
                }
            });
        }

        // check if we're already saving!
        var saving = parseInt(node.getAttribute("saving"), 10);
        if (saving) {
            this.saveBuffer[path] = page;
            return;
        }

        apf.xmldb.setAttribute(node, "saving", "1");

        var _self = this, panel = sbMain.firstChild;
        panel.setAttribute("caption", "Saving file " + path);

        var value = doc.getValue();

        fs.saveFile(path, value, function(data, state, extra){
            if (state != apf.SUCCESS) {
                util.alert(
                    "Could not save document",
                    "An error occurred while saving this document",
                    "Please see if your internet connection is available and try again. "
                        + (state == apf.TIMEOUT
                            ? "The connection timed out."
                            : "The error reported was " + extra.message));
            }

            panel.setAttribute("caption", "Saved file " + path);

            ide.dispatchEvent("afterfilesave", {
                node: node,
                doc: doc,
                value: value,
                silentsave: silentsave
            });

            ide.dispatchEvent("track_action", {
                type: "save as filetype",
                fileType: node.getAttribute("name").split(".").pop(),
                success: state != apf.SUCCESS ? "false" : "true"
            });

            apf.xmldb.removeAttribute(node, "saving");
            apf.xmldb.removeAttribute(node, "new");
            apf.xmldb.setAttribute(node, "modifieddate", apf.queryValue(extra.data, "//d:getlastmodified"));

            if (_self.saveBuffer[path]) {
                delete _self.saveBuffer[path];
                _self.quicksave(page);
            }
        });

        var at = page.$at
        at.undo_ptr = at.$undostack[at.$undostack.length-1];
        page.$at.dispatchEvent("afterchange");
        return false;
    },

    _saveAsNoUI: function(page, path, newPath) {
        if (!page || !path)
            return;

        newPath = newPath || path;

        var file = page.$model.data;
        var saving = parseInt(file.getAttribute("saving"), 10);

        if (saving) {
            this.saveBuffer[path] = page;
            return;
        }
        apf.xmldb.setAttribute(file, "saving", "1");

        var self = this;
        var panel = sbMain.firstChild;
        var value = page.$doc.getValue();
        fs.saveFile(newPath, value, function(value, state, extra) {
            if (state != apf.SUCCESS) {
                util.alert("Could not save document",
                  "An error occurred while saving this document",
                  "Please see if your internet connection is available and try again.");
            }
            panel.setAttribute("caption", "Saved file " + newPath);

            var model = page.$model;
            var node = model.getXml();
            var doc = page.$doc;

            if (path !== newPath || parseInt(node.getAttribute("newfile") || 0, 10) === 1) {
                model.load(node);
                file = model.data;
                fs.beforeRename(file, null, newPath, false);
                doc.setNode(file);
            }

            apf.xmldb.removeAttribute(node, "saving");

            if (self.saveBuffer[path]) {
                delete self.saveBuffer[path];
                self._saveAsNoUI(page);
            }

            if (parseInt(file.getAttribute("newfile") || "0", 10) === 1) {
                apf.xmldb.removeAttribute(file, "newfile");
                apf.xmldb.removeAttribute(file, "changed");
                var xpath = newPath.replace(new RegExp("\/" + cloud9config.davPrefix.split("/")[1]), "")
                                    .replace(new RegExp("\/" + file.getAttribute("name")), "")
                                    .replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                                    .replace(/\/node\(\)\[@name="workspace"\]/, "")
                                    .replace(/\//, "");
                if (xpath) {
                    var oNode  = trFiles.queryNode(xpath);
                    if (oNode && !trFiles.queryNode('//node()[@path="' + newPath + '"]'))
                        apf.xmldb.appendChild(oNode, file);
                }
            }

            ide.dispatchEvent("afterfilesave", {
                node: node,
                doc: doc,
                value: value,
                silentsave: false // It is a forced save, comes from UI
            });
        });

        var at = page.$at
        at.undo_ptr = at.$undostack[at.$undostack.length-1];
        page.$at.dispatchEvent("afterchange");
    },

    choosePath : function(path, select) {
        fs.list((path.match(/(.*)\/[^/]*/) || {})[1] || path, function (data, state, extra) {
            if (new RegExp("<folder.*" + path + ".*>").test(data)) {
                path  = path.replace(new RegExp('\/' + cloud9config.davPrefix.split('/')[1]), '')
                            .replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                            .replace(/\/node\(\)\[@name="workspace"\]/, "")
                            .replace(/\//, "");

                trSaveAs.expandList([path], function() {
                    var node = trSaveAs.getModel().data.selectSingleNode(path);
                    trSaveAs.select(node);
                });
            }
        });
    },

    // Function called from the 'Save As' menu dialog, and from the C9 CLI.
    // It saves a file with a different name, involving UI.
    saveas : function(page, callback){
        if (!page || !page.$at)
            page = tabEditors.getPage();

        if (!page)
            return;

        var path = page ? page.$model.data.getAttribute("path") : false;
        if (!path)
            return;

        ext.initExtension(this);

        if (callback) {
            var doc = page.$doc;
            ide.addEventListener("afterfilesave", function(e){
                if (e.doc == doc) {
                    callback();
                    this.removeEventListener("afterfilesave", arguments.callee);
                }
            });
        }

        var fooPath = path.split('/');
        txtSaveAs.setValue(fooPath.pop());
        lblPath.setProperty('caption', fooPath.join('/') + '/');
        winSaveAs.show();
    },

    // Called by the UI 'confirm' button in winSaveAs.
    confirmSaveAs : function(page) {
        page = page || tabEditors.getPage();
        var file = page.$model.data;
        var path = file.getAttribute("path");
        var newPath = lblPath.getProperty('caption') + txtSaveAs.getValue();

        // check if we're already saving!
        var saving = parseInt(file.getAttribute("saving"), 10);
        if (saving) {
            this.saveBuffer[path] = page;
            return;
        }

        //apf.xmldb.setAttribute(file, "saving", "1");

        var self = this;
        var doSave = function() {
            winConfirm.hide();
            winSaveAs.hide();
            self._saveAsNoUI(page, path, newPath);
        };

        if (path !== newPath || parseInt(file.getAttribute("newfile") || 0, 10) === 1) {
            fs.exists(newPath, function (exists) {
                if (exists) {
                    var name = newPath.match(/\/([^/]*)$/)[1];
                    var folder = newPath.match(/\/([^/]*)\/[^/]*$/)[1];

                    util.confirm(
                        "Are you sure?",
                        "\"" + name + "\" already exists, do you want to replace it?",
                        "A file or folder with the same name already exists in the folder "
                        + folder + ". "
                        + "Replacing it will overwrite it's current contents.",
                        doSave);
                }
                else {
                    doSave();
                }
            });
        }
        else {
            doSave();
        }
    },

    expandTree : function(){
        var _self = this;
        setTimeout(function(){
            var tabPage = tabEditors.getPage(),
                path    = tabPage ? tabPage.$model.data.getAttribute('path') : false,
                isNew   = tabPage.$model.data.getAttribute('newfile');
            if(!isNew)
                _self.choosePath(path);
            else
                trSaveAs.slideOpen(null, trSaveAs.getModel().data.selectSingleNode('//folder'));
        });
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

        tabEditors.removeEventListener("close", this.$close);
    }
});

});
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
        this.btnFind.onclick = this.execFind.bind(this);

        var _self = this;
        
        winSearchInFiles.onhide = function() {
            if (typeof ceEditor != "undefined")
                ceEditor.focus();
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
        //ideConsole.show();
    },
    
    setSearchSelection: function(e){
        var selectedNode;
        // If originating from an event
        if (e && e.selected)
            selectedNode = e.selected;
        else
            selectedNode = this.getSelectedTreeNode();
        // get selected node in tree and set it as selection
        var name = selectedNode.getAttribute("name");
        if (name.length > 25)
            name = name.substr(0, 22) + "...";
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
/**
 * Searchreplace Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var code = require("ext/code/code");
var search = require("ace/search");
var editors = require("ext/editors/editors");
var markup = require("text!ext/searchreplace/searchreplace.xml");

module.exports = ext.register("ext/searchreplace/searchreplace", {
    name    : "Searchreplace",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    commands : {
        "search": {hint: "search for a string inside the active document"},
        "searchreplace": {hint: "search for a string inside the active document and replace it"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Search...",
                onclick : function() {
                    _self.toggleDialog(false);
                }
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Search & Replace...",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }))
        );

        this.hotitems.search = [this.nodes[1]];
        this.hotitems.searchreplace = [this.nodes[2]];

        code.commandManager.addCommand({
            name: "replace",
            exec: function(editor) {
                _self.setEditor(editor, editor.getSelection()).toggleDialog(true, true);
            }
        });

    },

    init : function(amlNode){
        var _self = this;
        
        this.txtFind       = txtFind;//winSearchReplace.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        this.txtReplace    = txtReplace;//winSearchReplace.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        //bars
        this.barReplace    = barReplace;//winSearchReplace.selectSingleNode("a:vbox/a:hbox[2]");
        //buttons
        this.btnReplace    = btnReplace;//winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[1]");
        this.btnReplace.onclick = this.replace.bind(this);
        this.btnReplaceAll = btnReplaceAll;//winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[2]");
        this.btnReplaceAll.onclick = this.replaceAll.bind(this);
        this.btnFind       = btnFind;//winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[3]");
        this.btnFind.onclick = this.findNext.bind(this);
        winSearchReplace.onclose = function() {
            ceEditor.focus();
        }
        
        this.txtFind.addEventListener("keydown", function(e){
            switch (e.keyCode){
//                case 13: //ENTER
//                    _self.execSearch(false, !!e.shiftKey);
//                    return false;
//                case 27: //ESCAPE
//                    _self.toggleDialog(-1);
//                    if (e.htmlEvent)
//                        apf.stopEvent(e.htmlEvent)
//                    else if (e.stop)
//                        e.stop();
//                    return false;
                case 38: //UP
                    _self.navigateList("prev");
                break;
                case 40: //DOWN
                    _self.navigateList("next");
                break;
                case 36: //HOME
                    if (!e.ctrlKey) return;
                    _self.navigateList("first");
                break;
                case 35: //END
                    if (!e.ctrlKey) return;
                    _self.navigateList("last");
                break;
            }
        });
    },
    
    navigateList : function(type){
        var settings = require("ext/settings/settings");
        if (!settings) return;
        
        var model = settings.model;
        var lines = model.queryNodes("search/word");
        
        var next;
        if (type == "prev")
            next = Math.max(0, this.position - 1);
        else if (type == "next")
            next = Math.min(lines.length - 1, this.position + 1);
        else if (type == "last")
            next = Math.max(lines.length - 1, 0);
        else if (type == "first")
            next = 0;

        if (lines[next]) {
            this.txtFind.setValue(lines[next].getAttribute("key"));
            this.txtFind.select();
            this.position = next;
        }
    },
    
    toggleDialog: function(isReplace, forceShow) {
        ext.initExtension(this);

        if (!winSearchReplace.visible || forceShow || this.$lastState != isReplace) {
            this.setupDialog(isReplace);

            var value;
            var editor = editors.currentEditor;
            if (editor) {
                if (editor.ceEditor)
                    value = editor.ceEditor.getLastSearchOptions().needle;

                if (!value) {
                    var sel   = editor.getSelection();
                    var doc   = editor.getDocument();
                    var range = sel.getRange();
                    value = doc.getTextRange(range);
                }
                
                if (value)
                    this.txtFind.setValue(value);

                winSearchReplace.setAttribute("title", isReplace
                        ? "Search & Replace" : "Search");
                winSearchReplace.show();
            }
        }
        else
            winSearchReplace.hide();
        return false;
    },

    onHide : function() {
        var editor = require('ext/editors/editors').currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.focus();
    },

    search: function() {
        return this.setEditor().toggleDialog(false, true);
    },

    searchreplace: function() {
        return this.setEditor().toggleDialog(true, true);
    },

    setupDialog: function(isReplace) {
        this.$lastState = isReplace;
        this.position = 0;

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
            caseSensitive: chkMatchCase.checked,
            wholeWord: chkWholeWords.checked,
            regExp: chkRegEx.checked,
            scope: chkSearchSelection.checked ? search.Search.SELECTION : search.Search.ALL
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
            this.$editor.find(txt, options);
        }
        chkSearchSelection.setAttribute("checked", false);
    },

    replace: function() {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;
        if (!this.barReplace.visible)
            return;
        var options = this.getOptions();
        options.needle = this.txtFind.getValue();
        options.scope = search.Search.SELECTION;
        this.$editor.replace(this.txtReplace.getValue() || "", options);
        //this.$editor.find(this.$crtSearch, options);
        this.findNext();
        ide.dispatchEvent("track_action", {type: "replace"});
    },

    replaceAll: function() {
        if (!this.editor)
            this.setEditor();
        if (!this.$editor)
            return;
        this.$crtSearch = null;
        var options = this.getOptions();
        options.needle = this.txtFind.getValue();
        this.$editor.replaceAll(this.txtReplace.getValue() || "", options);
        ide.dispatchEvent("track_action", {type: "replace"});
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

});/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/settings/settings.xml");
var panels = require("ext/panels/panels");
var skin = require("text!ext/settings/skin.xml");
var settings = require("core/settings");

module.exports = ext.register("ext/settings/settings", {
    name    : "Preferences",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    skin    : {
        id   : "prefs",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/settings/images/"
    },
    
    defaultWidth : 250,
    
    commands : {
        "showsettings": {hint: "open the settings window"}
    },
    hotitems: {},

    nodes : [],

    //Backwards compatible
    save : function() {
        settings.save();
    },

    saveSettingsPanel: function() {
        var pages   = self.pgSettings ? pgSettings.getPages() : [],
            i       = 0,
            l       = pages.length,
            changed = false;
        for (; i < l; ++i) {
            if (!pages[i].$at) continue;
            if (pages[i].$at.undolength > 0) {
                pages[i].$commit(pages[i]);
                changed = true;
            }
        }
        if (ide.dispatchEvent("savesettings", {
            model : this.model
        }) !== false || changed)
            settings.save();
    },

    addSection : function(tagName, name, xpath, cbCommit){
        var node = this.model.queryNode(xpath + "/" + tagName);
        if (!node)
            this.model.appendXml('<' + tagName + ' name="' + name +'" />', xpath);
    },

    hook : function(){
        panels.register(this, {
            position : 100000,
            caption: "Preferences",
            "class": "preferences"
        });
        
        //Backwards compatible
        this.model = settings.model;
    },
    
    headings : {},
    getHeading : function(name){
        if (this.headings[name])
            return this.headings[name];
        
        var heading = barSettings.appendChild(new apf.bar({
            skin: "basic"
        }));
        heading.$int.innerHTML = '<div class="header"><span></span><div>' 
            + name + '</div></div>';
        
        this.headings[name] = heading;
        
        return heading;
    },

    init : function(amlNode){
        this.panel = winSettings;

        colLeft.appendChild(winSettings);
        
        this.nodes.push(winSettings);
    },

    showsettings: function(e) {
        panels.activate(this);
        this.enable();
        return false;
    },

    saveSettings: function() {
        winSettings.hide();
        this.saveSettingsPanel();
    },

    applySettings: function() {
        this.saveSettingsPanel();
    },

    cancelSettings: function() {
        winSettings.hide();
        var pages = pgSettings.getPages(),
            i     = 0,
            l     = pages.length;
        for (; i < l; ++i) {
            if (!pages[i].$at) continue;
            pages[i].$at.undo(-1);
        }
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
        
        panels.unregister(this);
    }
});

});
/**
 * Editor status bar for Cloud9 IDE
 * 
 * @TODO
 * 
 * Error icon from acebugs
 * 
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var markup = require("text!ext/statusbar/statusbar.xml");
var skin = require("text!ext/statusbar/skin.xml");

module.exports = ext.register("ext/statusbar/statusbar", {
    name     : "Status bar",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    skin     : {
        id   : "statusbar",
        data : skin,
        "media-path" : ide.staticPrefix + "/style/images/",
        "icon-path"  : ide.staticPrefix + "/style/icons/"
    },
    expanded: false,
    nodes : [],
    toolItems: [],
    prefsItems: [],
    horScrollAutoHide : "false",
    edgeDistance : 3,
    offsetWidth : 0,

    hook : function(){
        var _self = this;
        ide.addEventListener("afteropenfile", this.$aofListener = function() {
            ext.initExtension(_self);
            ide.removeEventListener("afteropenfile", _self.$aofListener);
        });

        ide.addEventListener("loadsettings", function(e){
            var strSettings = e.model.queryValue("auto/statusbar");
            if (strSettings === "true") {
                if (_self.inited)
                    _self.toggleStatusBar();
                else
                    _self.toggleOnInit = true;
            }

            var codeSettings = e.model.queryNode("//editors/code");
            if (codeSettings && codeSettings.hasAttribute("autohidehorscrollbar")) {
                _self.horScrollAutoHide = codeSettings.getAttribute("autohidehorscrollbar");
            }
        });

        ide.addEventListener("savesettings", function(e){
            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/statusbar/text()");
            xmlSettings.nodeValue = _self.expanded;
            return true;
        });

        ide.addEventListener("theme_change", function(e){
            var theme = e.theme || "ace/theme/textmate";
            _self.checkTheme(theme);
        });

        ide.addEventListener("vim.changeMode", function(e) {
            if (!window["lblInsertActive"])
                return;

            if (e.mode === "insert")
                lblInsertActive.show();
            else
                lblInsertActive.hide();
        });
    },

    init : function(){
        var _self = this;

        ide.addEventListener("minimap.visibility", function(e) {
            if (e.visibility === "shown")
                _self.offsetWidth = e.width;
            else
                _self.offsetWidth = 0;

            _self.setPosition();
        });

        tabEditors.addEventListener("afterswitch", function() {
            if (_self.$changeEvent)
                _self.editorSession.selection.removeEventListener("changeSelection", _self.$changeEvent);

            setTimeout(function() {
                if(editors.currentEditor.ceEditor) {
                    _self.setSelectionLength();

                    _self.editorSession = editors.currentEditor.ceEditor.$editor.session;
                    _self.editorSession.selection.addEventListener("changeSelection", _self.$changeEvent = function(e) {
                        _self.setSelectionLength();
                    });
                }
            }, 200);
        });

        tabEditors.addEventListener("resize", function() {
            _self.setPosition();
        });
        
        var editor = editors.currentEditor;
        if (editor && editor.ceEditor) {
            editor.ceEditor.parentNode.appendChild(barIdeStatus);
            this.sbWidth = ceEditor.$editor.renderer.scrollBar.width;
            barIdeStatus.setAttribute("right", this.sbWidth + this.edgeDistance);
            barIdeStatus.setAttribute("bottom", this.sbWidth + this.edgeDistance);
        }

        hboxStatusBarSettings.$ext.style.overflow = "hidden";

        for(var i = 0, l = this.toolItems.length; i < l; i++) {
            var tItem = this.toolItems[i];
            if (typeof tItem.pos === "number")
                mnuStatusBarTools.insertBefore(tItem.item, mnuStatusBarPrefs.childNodes[tItem.pos]);
            else
                mnuStatusBarTools.appendChild(tItem.item);
        }

        for(var i = 0, l = this.prefsItems.length; i < l; i++) {
            var pItem = this.prefsItems[i];
            if (typeof pItem.pos === "number")
                mnuStatusBarPrefs.insertBefore(pItem.item, mnuStatusBarPrefs.childNodes[pItem.pos]);
            else
                mnuStatusBarPrefs.appendChild(pItem.item);
        }

        var editor = ceEditor.$editor;
        var theme = editor && editor.getTheme() || "ace/theme/textmate";
        this.checkTheme(theme);

        if (this.toggleOnInit)
            this.toggleStatusBar();

        ceEditor.addEventListener("prop.autohidehorscrollbar", function(e) {
            if (e.changed) {
                _self.horScrollAutoHide = e.value ? "true" : "false";
                apf.layout.forceResize(tabEditors.parentNode.$ext);
            }
        });

        ide.addEventListener("track_action", function(e) {
            if(e.type === "vim" && window["lblInsertActive"]) {
                if(e.action === "disable")
                    lblInsertActive.hide();
                else if (e.mode === "insert")
                    lblInsertActive.show();
            }
        });

        this.inited = true;
    },

    addToolsItem: function(menuItem, position){
        if(!self["mnuStatusBarTools"]) {
            this.toolItems.push({ item : menuItem, pos : position });
        }
        else {
            if (typeof position === "number")
                mnuStatusBarTools.insertBefore(menuItem, mnuStatusBarTools.childNodes[position]);
            else
                mnuStatusBarTools.appendChild(menuItem);
        }
    },

    addPrefsItem: function(menuItem, position){
        if(!self["mnuStatusBarPrefs"]) {
            this.prefsItems.push({ item: menuItem, pos : position });
        }
        else {
            if (typeof position === "number")
                mnuStatusBarPrefs.insertBefore(menuItem, mnuStatusBarPrefs.childNodes[position]);
            else
                mnuStatusBarPrefs.appendChild(menuItem);
        }
    },
    
    setSelectionLength : function() {
        if (typeof lblSelectionLength === "undefined")
            return;

        var range = ceEditor.$editor.getSelectionRange();
        if (range.start.row != range.end.row || range.start.column != range.end.column) {
            var doc = ceEditor.getDocument();
            var value = doc.getTextRange(range);
            lblSelectionLength.setAttribute("caption", "(" + value.length + " Bytes)");
            lblSelectionLength.show();
        } else {
            lblSelectionLength.setAttribute("caption", "");
            lblSelectionLength.hide();
        }
    },

    toggleStatusBar: function(){
        if(this.expanded) {
            this.expanded = false;
            apf.setStyleClass(barIdeStatus.$ext, '', ["expanded"]);
            apf.tween.single(hboxStatusBarSettings.$ext, {
                type  : "width",
                anim  : apf.tween.easeOutQuint,
                from  : apf.isWebkit ? 50 : 52,
                to    : 1,
                steps : 8,
                interval : 5,
                onfinish : function(){
                    hboxStatusBarSettings.hide();
                }
            });
        }
        else {
            this.expanded = true;
            apf.setStyleClass(barIdeStatus.$ext, "expanded");
            hboxStatusBarSettings.show();
            apf.tween.single(hboxStatusBarSettings.$ext, {
                type  : "width",
                anim  : apf.tween.easeOutQuint,
                from  : 1,
                to    : apf.isWebkit ? 50 : 52,
                steps : 8,
                interval : 5
            });
        }
    },

    checkTheme: function(theme){
        require(["require", theme], function (require) {
            var reqTheme = require(theme);
            if(reqTheme.isDark)
                apf.setStyleClass(barIdeStatus.$ext, "ace_dark");
            else
                apf.setStyleClass(barIdeStatus.$ext, '', ["ace_dark"]);

            var aceBg = apf.getStyle(ceEditor.$editor.renderer.scroller, "background-color");
            aceBg = aceBg.replace("rgb", "rgba").replace(")", "");
            apf.setStyleRule(".bar-status", "background-color", aceBg + ", 0.0)");
            apf.setStyleRule(".bar-status:hover", "background-color", aceBg + ", 0.95)");
        });
    },

    setPosition : function() {
        if (typeof ceEditor != "undefined" && ceEditor.$editor) {
            var _self = this;
            var cw = ceEditor.$editor.renderer.scroller.clientWidth;
            var sw = ceEditor.$editor.renderer.scroller.scrollWidth;
            var bottom = this.edgeDistance;
            if (cw < sw || this.horScrollAutoHide === "false")
                bottom += this.sbWidth;

            if (this.$barMoveTimer)
                clearTimeout(this.$barMoveTimer);
            this.$barMoveTimer = setTimeout(function() {
                if (typeof barIdeStatus !== "undefined") {
                    barIdeStatus.setAttribute("bottom", bottom);
                    barIdeStatus.setAttribute("right", _self.sbWidth + _self.edgeDistance + _self.offsetWidth);
                }
            }, 50);
        }
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
/**
 * Strip whitespace extension for the Cloud9 IDE client
 *
 * Strips whitespace at the end of each line in the current buffer.
 *
 * @author Sergi Mansilla
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function (require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var extSettings = require("ext/settings/settings");

// Attaching to exports.module for testing purposes
var strip = module.exports.strip = function () {
    if (!editors.currentEditor.ceEditor)
        return;

    var editor = editors.currentEditor.ceEditor.$editor;
    var session = editor.getSession();

    var doc = session.getDocument();
    var lines = doc.getAllLines();

    for (var i = 0, l=lines.length; i < l; i++) {
        var line = lines[i];
        var index = line.search(/\s+$/);

        if (index !== -1)
            doc.removeInLine(i, index, line.length);
    }
    session.$syncInformUndoManager();
};

module.exports = ext.register("ext/stripws/stripws", {
    name: "Strip Whitespace",
    dev: "Ajax.org",
    alone: true,
    type: ext.GENERAL,

    commands: {
        "stripws": {
            hint: "strip whitespace at the end of each line"
        }
    },

    nodes: [],

    init: function () {},

    hook: function () {
        var self = this;
        var menuItem = new apf.item({
                            caption: "Strip Whitespace",
                            onclick: function () {
                                ext.initExtension(self);
                                strip();
                            }
                        });
        var menuItemClone = menuItem.cloneNode(true);

        this.nodes.push(
            ide.mnuEdit.appendChild(new apf.divider()),
            ide.mnuEdit.appendChild(menuItem),
            menuItemClone
        );

        ide.addEventListener("init.ext/statusbar/statusbar", function (e) {
            e.ext.addToolsItem(menuItemClone, 2);
        });

        ide.addEventListener("beforefilesave", function(data) {
            var node =
                extSettings.model.data.selectSingleNode("editors/code/@stripws");

            // If the 'Strip whitespace on save' option is enabled, we strip
            // whitespaces from the node value just before the file is saved.
            if (node && node.firstChild && node.firstChild.nodeValue == "true") {
                strip();
            }
        });

        ide.addEventListener("init.ext/settings/settings", function (e) {
            var heading = e.ext.getHeading("General");
            heading.appendChild(new apf.checkbox({
                "class" : "underlined",
                skin  : "checkbox_grey",
                value : "[editors/code/@stripws]",
                label : "On Save, Strip Whitespace"
            }))
        });
    },

    stripws: function() {
        strip();
    },

    enable: function () {
        this.nodes.each(function (item) {
            item.enable();
        });
    },

    disable: function () {
        this.nodes.each(function (item) {
            item.disable();
        });
    },

    destroy: function () {
        this.nodes.each(function (item) {
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});
});
/**
 * Tab Behaviors for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var save = require("ext/save/save");
var panels = require("ext/panels/panels");
var openfiles = require("ext/openfiles/openfiles");

module.exports = ext.register("ext/tabbehaviors/tabbehaviors", {
    name       : "Tab Behaviors",
    dev        :  "Ajax.org",
    alone      : true,
    type       : ext.GENERAL,
    deps       : [panels],
    menus      : [],
    accessed   : [],
    $tabAccessCycle : 2,
    sep        : null,
    more       : null,
    menuOffset : 4, //This is fucking stupid
    commands   : {
        "closetab": {hint: "close the tab that is currently active", msg: "Closing active tab."},
        "closealltabs": {hint: "close all opened tabs", msg: "Closing all tabs."},
        "closeallbutme": {hint: "close all opened tabs, but the tab that is currently active", msg: "Closing tabs."},
        "gototabright": {hint: "navigate to the next tab, right to the tab that is currently active", msg: "Switching to right tab."},
        "gototableft": {hint: "navigate to the next tab, left to the tab that is currently active", msg: "Switching to left tab."},
        "tab1": {hint: "navigate to the first tab", msg: "Switching to tab 1."},
        "tab2": {hint: "navigate to the second tab", msg: "Switching to tab 2."},
        "tab3": {hint: "navigate to the third tab", msg: "Switching to tab 3."},
        "tab4": {hint: "navigate to the fourth tab", msg: "Switching to tab 4."},
        "tab5": {hint: "navigate to the fifth tab", msg: "Switching to tab 5."},
        "tab6": {hint: "navigate to the sixth tab", msg: "Switching to tab 6."},
        "tab7": {hint: "navigate to the seventh tab", msg: "Switching to tab 7."},
        "tab8": {hint: "navigate to the eighth tab", msg: "Switching to tab 8."},
        "tab9": {hint: "navigate to the ninth tab", msg: "Switching to tab 9."},
        "tab10": {hint: "navigate to the tenth tab", msg: "Switching to tab 10."},
        "revealtab": {hint: "reveal current tab in the file tree"},
        "nexttab": {hint: "navigate to the next tab in the stack of accessed tabs"},
        "previoustab": {hint: "navigate to the previous tab in the stack of accessed tabs"}
    },
    hotitems   : {},

    nodes      : [],

    init : function(amlNode){
        var _self = this;

        this.nodes.push(
            mnuTabs.appendChild(new apf.item({
                caption : "Reveal in File Tree",
                onclick : function() {
                    _self.revealtab(tabEditors.contextPage);
                },
                disabled : "{!!!tabEditors.activepage}"
            })),
            mnuTabs.appendChild(new apf.item({
                caption : "Close Tab",
                onclick : function() {
                    _self.closetab(tabEditors.contextPage);
                },
                disabled : "{!!!tabEditors.activepage}"
            })),
            mnuTabs.appendChild(new apf.item({
                caption : "Close All Tabs",
                onclick : this.closealltabs.bind(this),
                disabled : "{!!!tabEditors.activepage}"
            })),
            mnuTabs.appendChild(new apf.item({
                caption : "Close All But Current Tab",
                onclick : function() {
                    _self.closeallbutme();
                },
                disabled : "{!!!tabEditors.activepage}"
            })),
            mnuTabs.appendChild(new apf.item({
                caption : "Close Tabs to the Right",
                onclick : function() {
                    _self.closealltotheright();
                },
                disabled : "{!!!tabEditors.activepage}"
            })),
            mnuTabs.appendChild(new apf.item({
                caption : "Close Tabs to the Left",
                onclick : function() {
                    _self.closealltotheleft();
                },
                disabled : "{!!!tabEditors.activepage}"
            })),
            //mnuTabs.appendChild(new apf.divider()),
            apf.document.body.appendChild(new apf.menu({
                id : "mnuContextTabs",
                childNodes : [
                    new apf.item({
                        caption : "Reveal in File Tree",
                        onclick : function() {
                            _self.revealtab(tabEditors.contextPage);
                        },
                        disabled : "{!!!tabEditors.activepage}"
                    }),
                    new apf.item({
                        caption : "Close Tab",
                        onclick : function() {
                            _self.closetab(tabEditors.contextPage);
                        },
                        disabled : "{!!!tabEditors.activepage}"
                    }),
                    new apf.item({
                        caption : "Close All Tabs",
                        onclick : this.closealltabs.bind(this),
                        disabled : "{!!!tabEditors.activepage}"
                    }),
                    new apf.item({
                        caption : "Close Other Tabs",
                        onclick : function() {
                            _self.closeallbutme(tabEditors.contextPage);
                        },
                        disabled : "{!!!tabEditors.activepage}"
                    }),
                    new apf.item({
                        caption : "Close Tabs to the Right",
                        onclick : function() {
                            _self.closealltotheright();
                        },
                        disabled : "{!!!tabEditors.activepage}"
                    }),
                    new apf.item({
                        caption : "Close Tabs to the Left",
                        onclick : function() {
                            _self.closealltotheleft();
                        },
                        disabled : "{!!!tabEditors.activepage}"
                    })
                ]
            }))
        );
        
        this.hotitems.revealtab     = [this.nodes[0], mnuContextTabs.childNodes[0]];
        this.hotitems.closetab      = [this.nodes[1], mnuContextTabs.childNodes[1]];
        this.hotitems.closealltabs  = [this.nodes[2], mnuContextTabs.childNodes[2]];
        this.hotitems.closeallbutme = [this.nodes[3], mnuContextTabs.childNodes[3]];
        this.hotitems.closealltotheright = [this.nodes[4], mnuContextTabs.childNodes[4]];
        this.hotitems.closealltotheleftt = [this.nodes[5], mnuContextTabs.childNodes[5]];
        
        tabEditors.setAttribute("contextmenu", "mnuContextTabs");

        mnuContextTabs.addEventListener("prop.visible", function(e) {
            // If there are only 0 or 1 pages, disable both and return
            if (tabEditors.getPages().length <= 1) {
                mnuContextTabs.childNodes[3].setAttribute('disabled', true);
                mnuContextTabs.childNodes[4].setAttribute('disabled', true);
                mnuContextTabs.childNodes[5].setAttribute('disabled', true);
                return;
            }

            var page = tabEditors.getPage();
            var pages = tabEditors.getPages();

            // be optimistic, reset menu items to disabled
            mnuContextTabs.childNodes[3].setAttribute('disabled', false);
            mnuContextTabs.childNodes[4].setAttribute('disabled', false);
            mnuContextTabs.childNodes[5].setAttribute('disabled', false);

            // if last tab, remove "close to the right"
            if (page.nextSibling.localName !== "page") {
                mnuContextTabs.childNodes[4].setAttribute('disabled', true);
            }
            // if first tab, remove "close to the left"
            else if (pages.indexOf(page) == 0) {
                mnuContextTabs.childNodes[5].setAttribute('disabled', true);
            }
        });
        
        tabEditors.addEventListener("close", function(e) {
            if (!e || !e.htmlEvent)
                return;
            var page = e.page;
            e = e.htmlEvent;
            if (e.shiftKey) { // Shift = close all
                return _self.closealltabs();
            }
            else if(e.altKey) { // Alt/ Option = close all but this
                return _self.closeallbutme(page);
            }
        });

        tabEditors.addEventListener("DOMNodeInserted", function(e) {
            var page = e.currentTarget;
            if (page.localName != "page" || e.relatedNode != this || page.nodeType != 1)
                return;

            if (e.$isMoveWithinParent) {
                if (page.$tabMenu) {
                    mnuTabs.insertBefore(page.$tabMenu,
                        page.nextSibling ? page.nextSibling.$tabMenu : null);

                    _self.updateState();
                }
            }
            else if (page.fake)
                _self.addItem(page);
        });

        tabEditors.addEventListener("DOMNodeRemoved", function(e) {
            if (e.$doOnlyAdmin)
                return;

            var page = e.currentTarget;
            _self.removeItem(page);

            if (page.localName != "page" || e.relatedNode != this || page.nodeType != 1)
                return;

            if (!e.$doOnlyAdmin)
                _self.accessed.remove(page);
        });

        var cycleKeyPressed, cycleKey = apf.isMac ? 18 : 17;
        tabEditors.addEventListener("afterswitch", function(e) {
            var page = e.nextPage;

            if (!cycleKeyPressed) {
                _self.accessed.remove(page);
                _self.accessed.push(page);
            }
        });

        tabEditors.addEventListener("close", function(e) {
            if (tabEditors.getPage() == e.page)
                this.nextTabInLine = _self.accessed[_self.accessed.length - _self.$tabAccessCycle];
        });

        apf.addEventListener("keydown", function(eInfo) {
            if (eInfo.keyCode == cycleKey)
                cycleKeyPressed = true;
        });

        apf.addEventListener("keyup", function(eInfo) {
            if (eInfo.keyCode == cycleKey && cycleKeyPressed) {
                var page = tabEditors.getPage();
                if (page) {
                    _self.accessed.remove(page);
                    _self.accessed.push(page);
                }
                _self.$tabAccessCycle = 2;
                cycleKeyPressed = false;
            }
        });

        tabEditors.addEventListener("aftersavedialogcancel", function(e) {
            if (!_self.changedPages)
                return

            var i, l, page;
            for (i = 0, l = _self.changedPages.length; i < l; i++) {
                page = _self.changedPages[i];
                page.removeEventListener("aftersavedialogclosed", arguments.callee);
            }
        });
    },
    
    closetab: function() {
        var page = tabEditors.getPage();
        tabEditors.remove(page);
        return false;
    },

    closealltabs: function(callback) {
        callback = typeof callback == "function" ? callback : null;
        this.closeallbutme(1, callback);
    },

    // ignore is the page that shouldn't be closed, null to close all tabs
    closeallbutme: function(ignore, callback) {
        // if ignore isn't a page instance then fallback to current page
        if (!(ignore instanceof apf.page)) {
            ignore = null;
        }
        
        ignore = ignore || tabEditors.getPage();
        this.changedPages = [];
        this.unchangedPages = [];

        var page;
        var pages = tabEditors.getPages();

        var _self = this;
        for (var i = 0, l = pages.length; i < l; i++) {
            page = pages[i];

            if (ignore && (page == ignore || ignore.hasOwnProperty(i))) {
                continue;
            }

            if (page.$doc.getNode().getAttribute("changed") == "1") {
                page.noAnim = true; // turn off animation on closing tab
                this.changedPages.push(page);

                page.addEventListener("aftersavedialogclosed", function(e) {
                    var curPage = _self.changedPages[0];
                    if (_self.changedPages.length && curPage.caption != e.currentTarget.caption)
                        return
                    _self.changedPages.shift();
                    this.removeEventListener("aftersavedialogclosed", arguments.callee);
                    if (_self.changedPages.length == 0) {
                        _self.closeUnchangedPages(function() {
                            if (callback)
                                callback();
                        });
                    }
                    else {
                        tabEditors.remove(_self.changedPages[0], null, true);
                    }
                });
            }
            else {
                this.unchangedPages.push(page);
            }
        }

        if (this.changedPages.length) {
            tabEditors.remove(this.changedPages[0], null, true);
        }
        else {
            this.closeUnchangedPages(function() {
                if (callback)
                    callback();
            });
        }
    },

    closeUnchangedPages : function(callback) {
        var page;
        for (var i = 0, l = this.unchangedPages.length; i < l; i++) {
            page = this.unchangedPages[i];
            tabEditors.remove(page, null, true);
        }

        if (callback)
            callback();
    },

    closealltotheright : function() {
        var page = tabEditors.getPage();
        var pages = tabEditors.getPages();
    
        var currIdx = pages.indexOf(page);
        var ignore = {};
            
        for (var j = 0; j <= currIdx; j++) {
            ignore[j] = page;
        }

        this.closeallbutme(ignore);
    },

    closealltotheleft : function() {
        var page = tabEditors.getPage();
        var pages = tabEditors.getPages();
    
        var currIdx = pages.indexOf(page);
        var ignore = {};
            
        for (var j = pages.length - 1; j >= currIdx; j--) {
            ignore[j] = page;
        }
        
        this.closeallbutme(ignore);
    },
    
    nexttab : function(){
        var n = this.accessed.length - this.$tabAccessCycle++;
        if (n < 0) {
            n = this.accessed.length - 1;
            this.$tabAccessCycle = 2;
        }

        var next = this.accessed[n];
        if (next == tabEditors.getPage())
            return this.nexttab();

        tabEditors.set(next);
    },

    previoustab : function(){
        var n = this.accessed.length - --this.$tabAccessCycle;
        if (n ===  this.accessed.length) {
            n = 0;
            this.$tabAccessCycle = this.accessed.length;
        }

        var next = this.accessed[n];
        if (next == tabEditors.getPage())
            return this.previoustab();

        tabEditors.set(next);
    },

    gototabright: function() {
        return this.cycleTab("right");
    },

    gototableft: function() {
        return this.cycleTab("left");
    },

    cycleTab: function(dir) {
        var bRight  = dir == "right",
            tabs    = tabEditors,
            pages   = tabs.getPages(),
            curr    = tabs.getPage(),
            currIdx = pages.indexOf(curr);
        if (!curr || pages.length == 1)
            return;
        var idx = currIdx + (bRight ? 1 : -1);
        if (idx < 0)
            idx = pages.length - 1;
        if (idx > pages.length -1)
            idx = 0;

        // other plugins may modify this behavior
        var res = ide.dispatchEvent("beforecycletab", {
            index: idx,
            dir: dir,
            pages: pages
        });
        if (res === false)
            return;
        if (typeof res == "number")
            idx = res;

        tabs.set(pages[idx].id);
        return false;
    },

    tab1: function() {return this.showTab(1);},
    tab2: function() {return this.showTab(2);},
    tab3: function() {return this.showTab(3);},
    tab4: function() {return this.showTab(4);},
    tab5: function() {return this.showTab(5);},
    tab6: function() {return this.showTab(6);},
    tab7: function() {return this.showTab(7);},
    tab8: function() {return this.showTab(8);},
    tab9: function() {return this.showTab(9);},
    tab10: function() {return this.showTab(10);},

    showTab: function(nr) {
        // our indexes are 0 based an the number coming in is 1 based
        nr--;
        var pages = tabEditors.getPages();
        if (!pages[nr]) {
            return false;
        }
        
        tabEditors.set(pages[nr]);
        return false;
    },

    /**
     * Scrolls to the selected tab's file path in the "Project Files" tree
     *
     * Works by Finding the node related to the active tab in the tree, and
     * unfolds its parent folders until the node can be reached by an xpath
     * selector and focused, to finally scroll to the selected node.
     */
    revealtab: function(page) {
        if (!page || page.command)
            page = tabEditors.getPage();
        if (!page)
            return false;

        this.revealfile(page.$doc.getNode());
    },

    revealfile : function(docNode) {
        var path = docNode.getAttribute('path');
        var node = trFiles.queryNode('//file[@path="' + path + '"]');

        require("ext/panels/panels").activate(require("ext/tree/tree"));

        if (node) {
            trFiles.expandAndSelect(node);
            trFiles.focus();
            scrollToFile();
        }
        else {
            var parts = path.substr(ide.davPrefix.length).replace(/^\//, "").split("/");
            var file = parts.pop();
            var pathList = ["folder[1]"];
            var str = "";

            parts.forEach(function(part) {
                str += '/folder[@name="' + part + '"]';
                pathList.push("folder[1]" + str);
            });

            var xpath = pathList[pathList.length - 1];

            trFiles.expandList(pathList, function() {
                trFiles.select(trFiles.queryNode(xpath + '/file[@name="' + file + '"]'));
                trFiles.focus();
                scrollToFile();
            });
        }

        var parts = path.substr(ide.davPrefix.length).replace(/^\//, "").split("/");
        var file = parts.pop();
        var pathList = ["folder[1]"];
        var str = "";

        parts.forEach(function(part) {
            str += '/folder[@name="' + part + '"]';
            pathList.push("folder[1]" + str);
        });

        var xpath = pathList[pathList.length - 1];
        //var docNode = page.$doc.getNode();
        // Show spinner in active tab the file is being looked up
        apf.xmldb.setAttribute(docNode, "lookup", "1");

        trFiles.expandList(pathList, function() {
            trFiles.select(trFiles.queryNode(xpath + '/file[@name="' + file + '"]'));
            trFiles.focus();
            scrollToFile();
            // Hide spinner in active tab
            apf.xmldb.removeAttribute(docNode, "lookup");
        });

        function scrollToFile() {
            var tree = trFiles;
            var htmlNode = apf.xmldb.getHtmlNode(tree.selected, tree);
            if (!htmlNode)
                return;
            var itemPos = apf.getAbsolutePosition(htmlNode, tree.$container);
            var top = tree.$container.scrollTop;
            var bottom = top + tree.$container.offsetHeight;

            // No scrolling needed when item is between visible boundaries.
            if (itemPos[1] >= top && itemPos[1] <= bottom) {
                return;
            }
            
            var center = (tree.$container.offsetHeight / 2) | 0;
            var newTop = itemPos[1] - center;
            tree.$ext.scrollTop = newTop;
        }
    },

    addItem: function(page) {
        if (this.more)
            return; // no more items allowed...

        var mnu = mnuTabs.appendChild(new apf.item({
            caption : page.getAttribute("caption"),
            model   : page.$model,
            relPage : page.id,
            onclick : function() {
                tabEditors.set(this.relPage);
            }
        }));
        var no = this.nodes.push(mnu) - 1;

        page.$tabMenu = mnu;
        this.accessed.push(page);

        this.updateState();
    },

    removeItem: function(page) {
        var item, idx, keyId;
        var i = this.menuOffset;
        var l = this.nodes.length;
        var _self = this;
        for (; i < l; ++i) {
            if ((item = this.nodes[i]).relPage == page.id) {
                item.destroy(true, true);
                this.nodes.splice(i, 1);
                idx   = i - this.menuOffset + 1;
                keyId = "tab" + (idx == 10 ? 0 : idx);
                if (this.commands[keyId] && typeof this.commands[keyId].hotkey != "undefined")
                    apf.hotkeys.remove(this.commands[keyId].hotkey);

                setTimeout(function(){
                    _self.updateState();
                });
                return;
            }
        }
    },

    updateState: function(force) {
        var len = this.nodes.length - this.menuOffset;
        if (this.sep && !len) {
            this.sep.destroy(true, true);
            this.sep = null;
        }
        else if (!this.sep && (len || force)) {
            this.sep = mnuTabs.insertBefore(new apf.divider(), mnuTabs.childNodes[this.menuOffset]);
        }

        if (len < (force ? 19 : 20)) { // we already have 9 other menu items
            if (this.more) {
                this.more.destroy(true, true);
                this.more = null;
            }
        }
        else if (!this.more) {
            this.more = mnuTabs.appendChild(new apf.item({
                caption : "More...",
                onclick : function() {
                    panels.activate(openfiles);
                }
            }));
        }

        // update hotkeys and hotitems:
        var keyId, pages = tabEditors.getPages();
        for (var i = 0, l = pages.length; i < l; ++i) {
            keyId = "tab" + (i + 1 == 10 ? 0 : i + 1);
            this.hotitems[keyId] = [pages[i].$tabMenu];
            if (pages[i].$tabMenu && this.commands[keyId] && typeof this.commands[keyId].hotkey != "undefined")
                pages[i].$tabMenu.setAttribute("hotkey", this.commands[keyId].hotkey);
            else
                pages[i].$tabMenu.removeAttribute("hotkey");
        }
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
/**
 * Tab Sessions for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var settings = require("ext/settings/settings");
var tabbehaviors = require("ext/tabbehaviors/tabbehaviors");
var css = require("text!ext/save/save.css");
var markup = require("text!ext/tabsessions/tabsessions.xml");
var tabbeh = require("ext/tabbehaviors/tabbehaviors");

tabbeh.menuOffset = 10;

module.exports = ext.register("ext/tabsessions/tabsessions", {
    name       : "Tab Sessions",
    dev        :  "Ajax.org",
    alone      : true,
    type       : ext.GENERAL,
    markup     : markup,
    css         : css,
    nodes      : [],
    commands   : {
        "savetabsession": {hint: "save the current tab state as a new session", msg: "Save tab session."},
    },
    hotitems   : [],
    init : function(amlNode){
        apf.importCssString((this.css || ""));
        
        var _self = this;
        ide.addEventListener("loadsettings", function(e) {            
            var model = e && e.model || settings.model;
        
            _self.nodes.push(
                apf.document.body.appendChild(new apf.menu({
                    id : "mnuTabLoadSessions",
                    onitemclick : function(e){
                        _self.loadSession(e.relatedNode.value);
                    }
                })),
                apf.document.body.appendChild(new apf.menu({
                    id : "mnuTabDeleteSessions",
                    onitemclick : function(e){
                        _self.removeSession(e.relatedNode.value);
                    }
                }))
            );
            
            var sessions = model.queryNodes("auto/sessions/session");
            
            // get sessionnames to order alfabetically
            var sessionnames = [];
            for (var i = 0, l = sessions.length; i < l; i++){ 
                sessionnames.push(sessions[i].getAttribute("name"));
            }
            sessionnames.sort();
            
            var name;
            sessionnames.forEach(function(name) {
                mnuTabLoadSessions.appendChild(new apf.item({
                    caption : name,
                    //type    : "radio",
                    value   : name
                }));
                mnuTabDeleteSessions.appendChild(new apf.item({
                    caption : name,
                    //type    : "radio",
                    value   : name
                }));
            });
    
            _self.nodes.push(
                mnuTabs.appendChild(new apf.divider()),
                mnuTabs.appendChild(new apf.item({
                    id      : "mnuFileLoadSession",
                    caption : "Load Tab Session",
                    submenu : "mnuTabLoadSessions",
                    disabled: !sessions.length
                })),
    
                mnuTabs.appendChild(new apf.item({
                    caption : "Save Tab Session",
                    onclick : function(){
                        winSaveSessionAs.show();
                    },
                    disabled : "{!!!tabEditors.activepage}"
                })),
                
                mnuTabs.appendChild(new apf.item({
                    id      : "mnuFileDeleteSession",
                    caption : "Delete Tab Session",
                    submenu : "mnuTabDeleteSessions",
                    disabled: !sessions.length
                }))
            );
            _self.hotitems["savetabsession"] = [_self.nodes[4]];
        });
    },
    
    saveSession : function(name, overwrite) {
        if (!name) {
            if (!txtSaveSessionAs.getValue() && trSaveSessionAs.selected)
                name = trSaveSessionAs.selected.getAttribute("name");
            else
                name = txtSaveSessionAs.getValue();
        }
        
        // check if session with given name already exists
        var session = settings.model.queryNode("auto/sessions/session[@name=\"" + name + "\"]");
        if (session && !overwrite) {
            var _self = this;
            return util.confirm("Overwrite Session", "Overwrite Session",
                "You're about to overwrite the session named " + name + ". Are you sure you want to do this?",
                function() {
                    _self.saveSession(name, true);
                    winSaveSessionAs.hide();
                    return;
                }
            );
        }
        
        if (!settings.model.queryNode("auto/sessions"))
            settings.model.appendXml("<sessions />", "auto");
        
        var files = settings.model.queryNode("auto/files");
        if (!files)
            return;
            
        // if session with given name already exist remove it
        if (session)
            settings.model.removeXml(session);
        else {
            mnuTabLoadSessions.appendChild(new apf.item({
                caption : name,
                //type    : "radio",
                value   : name
            }));
            mnuTabDeleteSessions.appendChild(new apf.item({
                caption : name,
                //type    : "radio",
                value   : name
            }));
        }
        
        session = apf.getXml("<session name=\"" + name + "\" />");
        session.appendChild(files);
        settings.model.appendXml(session, "auto/sessions");
        
        mnuFileLoadSession.enable();
        mnuFileDeleteSession.enable();
        
        settings.save();
        winSaveSessionAs.hide();
    },
    
    loadSession : function(name) {
        var _self = this;
        tabbehaviors.closealltabs(function() {
            _self.openSessionFiles(name);
        });
    },
    
    openSessionFiles : function(name) {
        var active = settings.model.queryValue("auto/sessions/session[@name=\"" + name + "\"]/files/@active");
        var nodes  = settings.model.queryNodes("auto/sessions/session[@name=\"" + name + "\"]/files/file");
        
        var sessionfiles = settings.model.queryNode("auto/sessions/session[@name=\"" + name + "\"]/files");
        if (!sessionfiles)
            return; // or display error
            
        for (var doc, i = 0, l = nodes.length; i < l; i++) {
            var node = nodes[i];
            if (node.getAttribute("newfile") != "1")
                node.removeAttribute("changed");
            doc = ide.createDocument(node);
            doc.parentNode = {};
            
            var state = node.getAttribute("state");
            if (state) {
                try {
                    doc.state = JSON.parse(state);
                }
                catch(e) {}
            }
            
            ide.dispatchEvent("openfile", {
                doc    : doc,
                init   : true,
                active : active 
                    ? active == node.getAttribute("path")
                    : i == l - 1
            });
        }
  
        var oldfiles = settings.model.queryNode("auto/files");
        if (oldfiles)
            settings.model.removeXml("auto/files");
        
        settings.model.appendXml(sessionfiles.cloneNode(true), "auto");
        settings.save();
    },
    
    removeSession : function(name) {
        if (!settings.model.queryNode("auto/sessions/session[@name=\"" + name + "\"]"))
            return;
        
        settings.model.removeXml("auto/sessions/session[@name=\"" + name + "\"]");
        
        settings.save();
        var menuitems = mnuTabLoadSessions.childNodes.concat(mnuTabDeleteSessions.childNodes);
        for (var i = 0, l = menuitems.length; i < l; i++) {
            item = menuitems[i];
            if (item.value == name)
                mnuTabLoadSessions.removeChild(item);
        }
        
        if (menuitems.length == 2) {
            mnuFileLoadSession.disable();
            mnuFileDeleteSession.disable();
        }
        
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
/**
 * Test Panel for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var panels = require("ext/panels/panels");
var markup = require("text!ext/testpanel/testpanel.xml");
var fs = require("ext/filesystem/filesystem");
var settings = require("ext/settings/settings");

function escapeXpathString(name){
    if (name.indexOf('"') > -1) {
        var out = [], parts = name.split('"');
        parts.each(function(part) {
            out.push(part == '' ? "'\"'" : '"' + part + '"');
        })
        return "concat(" + out.join(", ") + ")";
    }
    return '"' + name + '"';
}

module.exports = ext.register("ext/testpanel/testpanel", {
    name            : "Test Panel",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    markup          : markup,
    appliedFilter   : "all",
    nodes           : [],
    
    defaultWidth    : 290,

    hook : function(){
        panels.register(this, {
            position : 4000,
            caption: "Test",
            "class": "testing"
        });
        
        var _self = this;

        //ide.addEventListener("init.testrunner", function(){
            apf.document.body.appendChild(new apf.state({
                id : "stTestRun"
            }));
            
            apf.document.body.appendChild(new apf.menu({
                id : "mnuRunSettings"
                //pinned : "true"
            }));
            
            //ide.removeEventListener("init.testrunner", arguments.callee);
        //});
        
        ide.addEventListener("loadsettings", function(e){
            if (!e.model.queryValue("auto/testpanel/@autorun"))
                e.model.setQueryValue("auto/testpanel/@autorun", "none");
        });
        
        ide.addEventListener("afterfilesave", function(e) {
            var autoRun = settings.model.queryValue("auto/testpanel/@autorun");
            
            if (stRunning.active)
                return;
            
            if (autoRun == "none")
                return;
            
            if (autoRun == "selection") {
                var sel = dgTestProject.getSelection();
                if (sel.length)
                    _self.run(sel);
            }
            else if (autoRun == "pattern") {
                var list = (new Function('path', _self.getPattern()))(
                    e.node.getAttribute("path"));
                
                if (!list || list.dataType != apf.ARRAY) {
                    util.alert("Wrong output from pattern",
                        "Wrong output from pattern",
                        "Pattern did not generate list of strings");
                    return;
                }
                
                var nodes = [], node;
                list.forEach(function(path){
                    node = mdlTests.queryNode("//node()[@path=" 
                        + escapeXpathString(path) + "]");
                    if (node)
                        nodes.push(node);
                });
                
                if (nodes.length)
                    _self.run(nodes);
            }
        });
    },

    init : function() {
        var _self  = this;
        this.panel = winTestPanel;
        
        this.nodes.push(winTestPanel);
        
        ide.dispatchEvent("init.testrunner");

        colLeft.appendChild(winTestPanel);
        
        mnuFilter.onitemclick = function(e){
            if (e.value && e.relatedNode.type == "radio")
                _self.filter(e.value);
        }
    
        var altKey;
        apf.addListener(document, "keydown", function(e){
            altKey = (e || event).altKey;
        });
        
        apf.addListener(document, "keyup", function(e){
            altKey = (e || event).altKey ? false : altKey;
        });
    
        dgTestProject.addEventListener("afterchoose", function(e){
            var node = this.selected;
            if (!node || this.selection.length > 1)
                return;

            //Open
            if (altKey) {
                if (node.tagName != "file"
                  || !ide.onLine && !ide.offlineFileSystemSupport)
                    return;
                        
                ide.dispatchEvent("openfile", {doc: ide.createDocument(node)});
                
                //@todo choose a test or an assert should select that code
                //      inside ace.
            }
            //Run
            else {
                if ("file|test|repo".indexOf(node.tagName) == -1 || !ide.onLine)
                    return;
                
                _self.run([node]);
            }
        });
        
        ide.addEventListener("afteroffline", function(){
            btnTestRun.disable();
            _self.stop(true);
        });
        
        ide.addEventListener("afteronline", function(){
            btnTestRun.enable();
        });
        
        this.submodules = [];
        fs.readFile("/workspace/.git/config", function(data){
            data.replace(/\[submodule "([^"]*)"\]/g, function(s, m){
                var doc = mdlTests.data.ownerDocument;
                var node = doc.createElement("repo");
                node.setAttribute("name", m);
                mdlTests.appendXml(node);
                
                _self.submodules.push(m);
            });
        });
    },
    
    getPattern : function(){
        return settings.model.queryValue("auto/testpanel/pattern/text()") ||
            "// Enter any code below that returns the paths of the tests in an array of strings.\n"
            + "// You have access to the 'path' variable.\n"
            + "// Save this file to store the pattern.\n"
            + "var tests = [];\n"
            + "return tests.pushUnique(\n"
            + "    path.replace(/(?:_test)?\.js$/, \"_test.js\"),\n"
            + "    path.replace(/(?:_Test)?\.js$/, \"Test.js\")\n"
            + ");";
    },
    
    editAutoRunPattern : function(){
        var node = apf.getXml("<file />");
        node.setAttribute("name", "Pattern.js");
        node.setAttribute("path", "/workspace/.c9.test.pattern");
        node.setAttribute("changed", "1");
        node.setAttribute("newfile", "1");
                
        var pattern = this.getPattern();
                
        var doc = ide.createDocument(node);
        doc.cachedValue = pattern;
                    
        ide.dispatchEvent("openfile", {doc: doc, node: node});
        
        ide.addEventListener("beforefilesave", function(e){
            if (e.node == node) {
                
                var value = doc.getValue();
                settings.model.setQueryValue("auto/testpanel/pattern/text()", value);
                node.removeAttribute("changed");
                node.removeAttribute("newfile");
                
                var page = tabEditors.getPage("/workspace/.c9.test.pattern");
                tabEditors.remove(page);
                
                ide.removeEventListener("beforefilesave", arguments.callee);
                
                return false;
            }
        });
    },
    
    findParent : function(path){
        var _self = this;
        for (var i = 0; i < _self.submodules.length; i++) {
            if (path.match(new RegExp("^\/workspace\/" + _self.submodules[i].replace(/\//g, "\\\/"))))
                return mdlTests.queryNode("repo[@name='" + _self.submodules[i].replace(/'/g, "\\'") + "']");
        }
        
        return mdlTests.queryNode("repo[1]");
    },
    
    filter : function(value){
        this.appliedFilter = value;
        
        dgTestProject.setAttribute("each", value == "all"
            ? "[repo|file|test|assert|error]"
            : "[repo|file[@type='" + value + "']|test|assert|error]");
    },
    
    parseFile : function(xmlNode){
        ide.dispatchEvent("test.expand." + xmlNode.getAttribute("type"), {
            xmlNode : xmlNode
        });
        
        return "<file />";
    },
    
    getIcon : function(tagName, value, type) {
        if (tagName == "repo")
            return "folder.png";
        if (tagName == "assert" || tagName == "error" || tagName == "test") {
            if (!value || value == -1)
                return "bullet_blue.png";
            else if (value == 5) //running
                return "bullet_go.png";
            else if (value == 1) //ran
                return "bullet_green.png";
            else if (value == 0) //error
                return "exclamation.png";//bullet_red.png";
        }
        if (tagName == "error")
            return "exclamation.png";
        else
            return ide.dispatchEvent("test.icon." + type) || "page_white_text.png";
    },
    
    run : function(nodes){
        var _self = this;
        
        if (!nodes || stTestRun.active)
            return;
        
        mnuRunSettings.hide();
        
        var finish = function(){
            stTestRun.deactivate();
        }
        
        //Clean nodes
        nodes.each(function(node) {
            if (node.tagName == "test")
                node = node.parentNode;
            
            var cleanNodes = node.selectNodes(".//file|.//test");
            for (var k = 0; k < cleanNodes.length; k++) {
                apf.xmldb.removeAttribute(cleanNodes[k], "status");
            }
            [".//error", ".//assert"].forEach(function(type){
                var nodes = node.selectNodes(type);
                for (var k = 0; k < nodes.length; k++) {
                    apf.xmldb.removeNode(nodes[k]);
                }
            });
        });
        
        //Expand list
        var total = [];
        nodes.each(function(node){
            if (node.tagName == "repo")
                total = total.concat(apf.getArrayFromNodelist(node.selectNodes("file" + 
                    (_self.appliedFilter == "all" 
                        ? "" 
                        : "[@type='" + _self.appliedFilter + "']"))));
            else if (node.tagName == "file")
                total.push(node);
            else if (node.tagName == "test")
                total.push(node.parentNode);
        });
        
        stTestRun.activate();
        
        var i = 0;
        var next = function(){
            if (total[i]) {
                _self.setLog(total[i], "connecting");
                ide.dispatchEvent("test.run." + total[i].getAttribute("type"), {
                    xmlNode : total[i++],
                    next    : next
                });
            }
            else {
                finish();
            }
        };
        next();
    },
    
    stop : function(immediate){
        if (!stTestRun.active)
            return;
        
        ide.dispatchEvent("test.stop");
        stTestRun.setAttribute("stopping", 1);
        
        var _self = this;
        clearTimeout(this.$stopTimer);
        this.$stopTimer = setTimeout(function(){
            ide.dispatchEvent("test.hardstop");
            
            _self.stopped();
        }, immediate ? 0 : 10000);
    },
    
    stopped : function(){
        stTestRun.deactivate();
        stTestRun.removeAttribute("stopping");
        
        clearTimeout(this.$stopTimer);
    },
    
    setPass : function(xmlNode, msg){
        apf.xmldb.setAttribute(xmlNode, "status", 1);
        apf.xmldb.setAttribute(xmlNode, "status-message", msg || "");
    },
    setError : function(xmlNode, msg){
        apf.xmldb.setAttribute(xmlNode, "status", 0);
        apf.xmldb.setAttribute(xmlNode, "status-message", msg || "");
    },
    setLog : function(xmlNode, msg){
        apf.xmldb.setAttribute(xmlNode, "status", -1);
        apf.xmldb.setAttribute(xmlNode, "status-message", msg || "");
    },
    lastExecuteNode : null,
    setExecute : function(xmlNode, msg){
        if (xmlNode) {
            apf.xmldb.setAttribute(xmlNode, "status", 5);
            apf.xmldb.setAttribute(xmlNode, "status-message", msg || "");
            
            ide.dispatchEvent("test.pointer." + apf.queryValue(xmlNode, "ancestor-or-self::test/../@type"), {
                xmlNode : xmlNode
            });
        }
        if (this.lastExecuteNode 
          && this.lastExecuteNode.getAttribute("status") == 5) {
            apf.xmldb.setAttribute(this.lastExecuteNode, "status", 1);
            apf.xmldb.setAttribute(this.lastExecuteNode, "status-message", "");
        }
        this.lastExecuteNode = xmlNode;
    },
    
    showSubmodules : true,
    toggleSubmodules : function(value){
        this.showSubmodules = value;
        
        if (value) {
            dgTestProject.setAttribute("each", 
                "[" + dgTestProject.each.replace(/repo\[1\]/, "repo") + "]");
        }
        else {
            dgTestProject.setAttribute("each", 
                "[" + dgTestProject.each.replace(/repo/, "repo[1]") + "]");
        }
    },
    
    expandTests : true,
    toggleExpandTests : function(value){
        this.expandTests = value;
        
        if (value) {
            if (!expTestRule.parentNode)
                dgTestProject.appendChild(expTestRule);
        }
        else {
            if (expTestRule.parentNode)
                dgTestProject.removeChild(expTestRule);
        }
    },
    
    show : function(){
        if (navbar.current) {
            if (navbar.current == this)
                return;
            navbar.current.disable();
        }
        
        panels.initPanel(this);
        this.enable();
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
        this.stop();
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
        
        panels.unregister(this);
    }
});

});
/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/themes/themes", {
    name    : "Themes",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    nodes   : [],
    currTheme : "",
    saved   : false,

    register : function(themes){
        var _self = this;
        
        for (var name in themes) {
            this.nodes.push(
                mnuThemes.appendChild(new apf.item({
                    caption : name,
                    type    : "item",
                    value   : themes[name],
                    onmouseover: function(e) {
                        _self.currTheme = settings.model.queryValue("editors/code/@theme");
                        settings.model.setQueryValue("editors/code/@theme", this.value);
                        _self.saved = false;
                    },
                    onmouseout: function(e) {
                        if (!_self.saved) {
                            settings.model.setQueryValue("editors/code/@theme", _self.currTheme);
                            _self.saved = false;
                        }
                    }
                }))
            );
        }
    },

    set : function(path, dispatch){
        //Save theme settings
        settings.model.setQueryValue("editors/code/@theme", path);
        settings.save();
        ide.dispatchEvent("theme_change", {theme: path});
        this.saved = true;
        ide.dispatchEvent("track_action", {type: "theme change", theme: path});
    },

    init : function(){
        var _self = this;
        var menuItem = new apf.item({
            caption : "Themes",
            submenu : "mnuThemes"
        });

        this.nodes.push(
            mnuView.appendChild(menuItem),
            apf.document.body.appendChild(new apf.menu({
                id : "mnuThemes",
                onitemclick : function(e){
                    _self.set(e.relatedNode.value);
                }
            }))
        );

        ide.addEventListener("init.ext/code/code", function() {
            if (ceEditor && ceEditor.$editor)
                mnuThemes.select(null, ceEditor.$editor.getTheme());
        });
    },
    
    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});
/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var themes = require("ext/themes/themes");

module.exports = ext.register("ext/themes_default/themes_default", {
    name    : "Themes",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],

    themes  : {
        "Chrome" : "ace/theme/chrome",
        "Clouds" : "ace/theme/clouds",
        "Clouds Midnight" : "ace/theme/clouds_midnight",
        "Cobalt" : "ace/theme/cobalt",
        "Crimson Editor" : "ace/theme/crimson_editor",
        "Dawn" : "ace/theme/dawn",
        "Eclipse" : "ace/theme/eclipse",
        "Idle Fingers" : "ace/theme/idle_fingers",
        "Kr Theme" : "ace/theme/kr_theme",
        "Merbivore" : "ace/theme/merbivore",
        "Merbivore Soft" : "ace/theme/merbivore_soft",
        "Mono Industrial" : "ace/theme/mono_industrial",
        "Monokai" : "ace/theme/monokai",
        "Pastel On Dark" : "ace/theme/pastel_on_dark",
        "Solarized Dark" : "ace/theme/solarized_dark",
        "Solarized Light" : "ace/theme/solarized_light",
        "TextMate" : "ace/theme/textmate",
        "Tomorrow" : "ace/theme/tomorrow",
        "Tomorrow Night" : "ace/theme/tomorrow_night",
        "Tomorrow Night Blue" : "ace/theme/tomorrow_night_blue",
        "Tomorrow Night Bright" : "ace/theme/tomorrow_night_bright",
        "Tomorrow Night Eighties" : "ace/theme/tomorrow_night_eighties",
        "Twilight" : "ace/theme/twilight",
        "Vibrant Ink" : "ace/theme/vibrant_ink"
    },

    init : function(){
        themes.register(this.themes);
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});/**
 * Code Editor for the Cloud9 IDE
 *
 * @TODO
 * - Save & load scroll position of tree
 * - Comment everything
 * 
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var fs = require("ext/filesystem/filesystem");
var settings = require("ext/settings/settings");
var panels = require("ext/panels/panels");
var markup = require("text!ext/tree/tree.xml");

module.exports = ext.register("ext/tree/tree", {
    name             : "Project Files",
    dev              : "Ajax.org",
    alone            : true,
    type             : ext.GENERAL,
    markup           : markup,

    defaultWidth     : 200,

    deps             : [fs],

    currentSettings  : [],
    loadedSettings   : 0,
    expandedList     : {},
    treeSelection    : { path : null, type : null },
    loading          : false,
    changed          : false,
    animControl      : {},
    nodes            : [],
    model            : null,

    "default"        : true,

    hook : function(){
        // Register this panel on the left-side panels
        panels.register(this, {
            position : 1000,
            caption: "Project Files",
            "class": "project_files"
        });

        var _self = this;

        /**
         * Wait for the filesystem extension to load before we set up our
         * model
         */
        ide.addEventListener("init.ext/filesystem/filesystem", function(e) {
            _self.model = e.ext.model;

            // loadedSettings is set after "loadsettings" is dispatched.
            // Thus if we have our model setup and we have the cached expanded
            // folders, then we can load the project tree
            if (_self.loadedSettings > 0 && _self.inited)
                _self.onReady();
        });

        ide.addEventListener("loadsettings", function(e){
            var model = e.model;
            (davProject.realWebdav || davProject).setAttribute("showhidden",
                apf.isTrue(model.queryValue('auto/projecttree/@showhidden')));

            // auto/projecttree contains the saved expanded nodes
            var strSettings = model.queryValue("auto/projecttree");
            if (strSettings) {
                try {
                    _self.currentSettings = JSON.parse(strSettings);
                }
                catch (ex) {
                    _self.currentSettings = [ide.davPrefix];
                }

                // Get the last selected tree node
                var savedTreeSelection = model.queryNode("auto/tree_selection");
                if (savedTreeSelection) {
                    _self.treeSelection.path = model.queryValue('auto/tree_selection/@path');
                    _self.treeSelection.type = model.queryValue('auto/tree_selection/@type');
                }

                _self.loadedSettings = 1;

                // Please see note above about waiting for both the model and
                // the settings to be loaded before loading the project tree
                if (_self.model && _self.inited)
                    _self.onReady();
            }
            else {
                _self.loadedSettings = 2;
                if (_self.model && _self.inited)
                    _self.onReady();
            }
        });

        ide.addEventListener("savesettings", function(e){
            if (!_self.changed)
                return;

            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/projecttree/text()");
            _self.currentSettings = [];

            var path, id;
            
            // expandedList keeps an active record of all the expanded nodes
            // so that on each save this gets serialized into the auto/projecttree
            // settings node
            for (id in _self.expandedList) {
                path = _self.expandedList[id].getAttribute("path");
                if (!path) {
                    delete _self.expandedList[id];
                }
                else {
                    _self.currentSettings.push(path);
                }
            }

            xmlSettings.nodeValue = apf.serialize(_self.currentSettings);
            _self.changed = false;
            return true;
        });

        /**
         * This receives updates from the tree watcher on the backend
         * I haven't looked deeply at this code, but it looks like it removes
         * and adds nodes
         */
        ide.addEventListener("treechange", function(e) {
            var path = e.path.replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                                .replace(/\[@name="workspace"\]/, "")
                                .replace(/\//, "");
            var parent = trFiles.getModel().data.selectSingleNode(path);

            if (!parent)
                return;

            var nodes   = parent.childNodes;
            var files   = e.files;
            var removed = [];

            for (var i = 0; i < nodes.length; ++i) {
                var node = nodes[i],
                    name = node.getAttribute("name");

                if (files && files[name])
                    delete files[name];
                else
                    removed.push(node);
            }
            removed.forEach(function (node) {
                apf.xmldb.removeNode(node);
            });
            path = parent.getAttribute("path");
            for (var filename in files) {
                var file = files[filename];

                var xmlNode = "<" + file.type +
                    " type='" + file.type + "'" +
                    " name='" + filename + "'" +
                    " path='" + path + "/" + filename + "'" +
                "/>";
                trFiles.add(xmlNode, parent);
            }
        });
        
        ext.initExtension(this);
    },

    onReady : function() {
        var _self = this;
        trFiles.setAttribute("model", this.model);
        if(this.loadedSettings === 1) {
            setTimeout(function() {
                _self.loadProjectTree();
            }, 1000);
        }

        // If no settings were found, then we set the "get" attribute of
        // the AML insert rule for the tree and expand the root. The
        // "get" attr is originally empty by default so when we run
        // this.loadProjectTree() the tree itself doesn't try to duplicate
        // our actions
        else {
            trFilesInsertRule.setAttribute("get", "{davProject.readdir([@path])}");
            trFiles.expandAll();
        }
    },

    init : function() {
        var _self = this;

        // Set the panel var for the panels extension
        this.panel = winFilesViewer;
        this.nodes.push(winFilesViewer);

        colLeft.appendChild(winFilesViewer);

        // This adds a "Show Hidden Files" item to the settings dropdown
        // from the Project Files header
        mnuFilesSettings.appendChild(new apf.item({
            id      : "mnuitemHiddenFiles",
            type    : "check",
            caption : "Show Hidden Files",
            visible : "{trFiles.visible}",
            checked : "[{require('ext/settings/settings').model}::auto/projecttree/@showhidden]",
            onclick : function(e){
                setTimeout(function() {
                    _self.changed = true;
                    (davProject.realWebdav || davProject)
                        .setAttribute("showhidden", e.currentTarget.checked);

                    _self.refresh();
                });
            }
        }));

        this.setupTreeListeners();

        if (_self.loadedSettings > 0 && _self.model)
            _self.onReady();
    },

    /**
     * Sets up listeners on tree events
     */
    setupTreeListeners : function() {
        var _self = this;

        // After an item in the tree has been clicked on, this saves that
        // selection in the settings model
        trFiles.addEventListener("afterselect", this.$afterselect = function(e) {
            if (settings.model && settings.model.data && trFiles.selected) {
                var nodePath          = trFiles.selected.getAttribute("path");
                var nodeType          = trFiles.selected.getAttribute("type");
                var settingsData      = settings.model.data;
                var treeSelectionNode = settingsData.selectSingleNode("auto/tree_selection");
                if(treeSelectionNode) {
                    apf.xmldb.setAttribute(treeSelectionNode, "path", nodePath);
                    apf.xmldb.setAttribute(treeSelectionNode, "type", nodeType);
                }
                else {
                    apf.xmldb.appendChild(settingsData.selectSingleNode("auto"),
                        apf.getXml('<tree_selection path="' + nodePath +
                            '" type="' + nodeType + '" />')
                    );
                }

                // Also update our own internal selection vars for when the
                // user refreshes the tree
                _self.treeSelection.path = nodePath;
                _self.treeSelection.type = nodeType;
            }
        });

        // Opens a file after the user has double-clicked
        trFiles.addEventListener("afterchoose", this.$afterchoose = function() {
            var node = this.selected;
            if (!node || node.tagName != "file" || this.selection.length > 1 ||
                !ide.onLine && !ide.offlineFileSystemSupport) //ide.onLine can be removed after update apf
                    return;

            ide.dispatchEvent("openfile", {doc: ide.createDocument(node)});
        });

        trFiles.addEventListener("beforecopy", this.$beforecopy = function(e) {
            if (!ide.onLine && !ide.offlineFileSystemSupport)
                return false;

            var args     = e.args[0].args,
                filename = args[1].getAttribute("name");

            var count = 0;
            filename.match(/\.(\d+)$/, "") && (count = parseInt(RegExp.$1, 10));
            while (args[0].selectSingleNode("node()[@name='" + filename.replace(/'/g, "\\'") + "']")) {
                filename = filename.replace(/\.(\d+)$/, "") + "." + ++count;
            }
            args[1].setAttribute("newname", filename);

            setTimeout(function () {
                fs.beforeRename(args[1], null,
                    args[0].getAttribute("path").replace(/[\/]+$/, "") +
                    "/" + filename, true);
                args[1].removeAttribute("newname");
            });
        });

        trFiles.addEventListener("beforestoprename", this.$beforestoprename = function(e) {
            if (!ide.onLine && !ide.offlineFileSystemSupport)
                return false;

            return fs.beforeStopRename(e.value);
        });

        trFiles.addEventListener("beforerename", this.$beforerename = function(e){
            if (!ide.onLine && !ide.offlineFileSystemSupport) return false;

            if(trFiles.$model.data.firstChild == trFiles.selected)
                return false;

            // check for a path with the same name, which is not allowed to rename to:
            var path = e.args[0].getAttribute("path"),
                newpath = path.replace(/^(.*\/)[^\/]+$/, "$1" + e.args[1]).toLowerCase();

            var exists, nodes = trFiles.getModel().queryNodes(".//node()");
            for (var i = 0, len = nodes.length; i < len; i++) {
                var pathLwr = nodes[i].getAttribute("path").toLowerCase();
                if (nodes[i] != e.args[0] && pathLwr === newpath) {
                    exists = true;
                    break;
                }
            }

            if (exists) {
                util.alert("Error", "Unable to Rename",
                    "That name is already taken. Please choose a different name.");
                trFiles.getActionTracker().undo();
                return false;
            }

            fs.beforeRename(e.args[0], e.args[1]);
        });

        trFiles.addEventListener("beforemove", this.$beforemove = function(e){
            if (!ide.onLine && !ide.offlineFileSystemSupport)
                return false;

            setTimeout(function(){
                var changes = e.args;
                for (var i = 0; i < changes.length; i++) {
                    // If any file exists in its future destination, cancel the event.
                    fs.beforeMove(changes[i].args[0], changes[i].args[1], trFiles);
                }
            });
        });

        trFiles.addEventListener("beforeadd", this.cancelWhenOffline);
        trFiles.addEventListener("renamestart", this.cancelWhenOffline);
        trFiles.addEventListener("beforeremove", this.cancelWhenOffline);
        trFiles.addEventListener("dragstart", this.cancelWhenOffline);
        trFiles.addEventListener("dragdrop", this.cancelWhenOffline);

        // When a folder has been expanded, save it in expandedList
        trFiles.addEventListener("expand", this.$expand = function(e){
            if (!e.xmlNode)
                return;
            _self.expandedList[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)] = e.xmlNode;

            // Only save if we are not loading the tree
            if (!_self.loading) {
                _self.changed = true;
                settings.save();
            }
        });

        // When a folder has been expanded, remove it from expandedList
        trFiles.addEventListener("collapse", this.$collapse = function(e){
            if (!e.xmlNode)
                return;
            delete _self.expandedList[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)];

            if (!_self.loading) {
                _self.changed = true;
                settings.save();
            }
        });
    },

    $cancelWhenOffline : function() {
        if (!ide.onLine && !ide.offlineFileSystemSupport)
            return false;
    },

    moveFile : function(path, newpath){
        davProject.move(path, newpath);
        trFiles.enable();
        trFiles.focus();
    },

    /**
     * Loads the project tree based on currentSettings, which is an arry of
     * folders that were previously expanded, otherwise it contains only the
     * root identifier (i.e. ide.davPrefix)
     * 
     * @param callback callback Called fired when the tree is fully loaded
     */
    loadProjectTree : function(callback) {
        this.loading = true;

        var currentSettings = this.currentSettings;
        var len = currentSettings.length;
        var _self = this;

        /**
         * Called recursively. `i` is used as the iterator moving through
         * the currentSettings array
         * 
         * @param number i The iterator for referencing currentSettings' elements
         */
        function getLoadPath(i) {
            if (i >= len)
                return onFinish();

            var path = currentSettings[i];

            // At some point davProject.realWebdav is set but you'll note that
            // tree.xml is able ot use just davProject (which is an intended
            // global). Why we cannot use that here escapes me, so we have to
            // check which one is available for us to use (and yes, realWebdav
            // can sometimes not be set on initial load)
            (davProject.realWebdav || davProject).readdir(path, function(data, state, extra) {
                // Strip the extra "/" that webDav adds on
                var realPath = extra.url.substr(0, extra.url.length-1);

                // Get the parent node of the new items. If the path is the
                // same as `ide.davPrefix`, then we append to root
                var parentNode;
                if (realPath === ide.davPrefix)
                    parentNode = trFiles.queryNode("folder[@root=1]");
                else
                    parentNode = trFiles.queryNode('//folder[@path="' + realPath + '"]');

                // Hmm? Folder deleted?
                if (!parentNode)
                    return getLoadPath(++i);

                var dataXml = apf.getXml(data);
                for (var x = 0, xmlLen = dataXml.childNodes.length; x < xmlLen; x++) {
                    // Since appendChild removes the node from the array, we
                    // must first clone the node and then append it to the parent
                    var clonedNode = dataXml.childNodes[x].cloneNode(true);
                    apf.xmldb.appendChild(parentNode, clonedNode);
                }

                // If the load status is not set, then APF assumes the child
                // nodes still need to be loaded and the folder icon is replaced
                // with a perennial spinner
                trFiles.$setLoadStatus(parentNode, "loaded");

                // Slide open the folder and then get the next cached folder's
                // contents
                trFiles.slideToggle(apf.xmldb.getHtmlNode(parentNode, trFiles), 1, true, null, function() {
                    getLoadPath(++i);
                });
            });
        }

        // Called when every cached node has been loaded
        function onFinish() {
            _self.loading = false;

            // Re-select the last selected item
            if(_self.treeSelection.path) {
                var xmlNode = trFiles.$model.queryNode('//node()[@path="' +
                    _self.treeSelection.path + '" and @type="' +
                    _self.treeSelection.type + '"]');
                trFiles.select(xmlNode);
            }
            else {
                trFiles.select(trFiles.$model.queryNode("node()"));
            }

            // Now set the "get" attribute of the <a:insert> rule so the tree
            // knows to ask webdav for expanded folders' contents automatically
            trFilesInsertRule.setAttribute("get", "{davProject.readdir([@path])}");

            settings.save();

            if (callback)
                return callback();
        }

        // Let's kick this sucker off!
        getLoadPath(0);
    },

    /**
     * Called when the user hits the refresh button in the Project Files header
     */
    refresh : function(){
        trFiles.getModel().load("<data><folder type='folder' name='" +
            ide.projectName + "' path='" + ide.davPrefix + "' root='1'/></data>");
        this.expandedList = {};

        // Make sure the "get" attribute is empty so the file tree doesn't
        // think it's the one loading up all the data when loadProjectTree
        // expands folders
        trFilesInsertRule.setAttribute("get", "");

        ide.dispatchEvent("track_action", { type: "reloadtree" });

        this.loadProjectTree();
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
        trFiles.removeEventListener("afterselect", this.$afterselect);
        trFiles.removeEventListener("afterchoose", this.$afterchoose);
        trFiles.removeEventListener("expand", this.$expand);
        trFiles.removeEventListener("collapse", this.$collapse);
        trFiles.removeEventListener("beforemove", this.$beforemove);
        trFiles.removeEventListener("beforerename", this.$beforerename);
        trFiles.removeEventListener("beforestoprenam", this.$beforestoprename);
        trFiles.removeEventListener("beforecopy", this.$beforecopy);
        trFiles.removeEventListener("beforeadd", this.$cancelWhenOffline);
        trFiles.removeEventListener("renamestart", this.$cancelWhenOffline);
        trFiles.removeEventListener("beforeremove", this.$cancelWhenOffline);
        trFiles.removeEventListener("dragstart", this.$cancelWhenOffline);
        trFiles.removeEventListener("dragdrop", this.$cancelWhenOffline);

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];

        panels.unregister(this);
    }
});

});
/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var panels = require("ext/panels/panels");

module.exports = ext.register("ext/editors/editors", {
    name    : "Editors",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],
    visible : true,

    contentTypes  : {},

    register : function(oExtension){
        //var id = "rb" + oExtension.path.replace(/\//g, "_");

        /*oExtension.$rbEditor = barButtons.appendChild(new apf.radiobutton({
            id        : id,
            label     : oExtension.name,
            value     : oExtension.path,
            margin    : "0 -1 0 0",
            visible   : "{require('ext/editors/editors').isEditorAvailable(tabEditors.activepage, '" + oExtension.path + "')}",
            onclick   : function(){
                require('ext/editors/editors').switchEditor(this.value);
            }
        }));*/

        //Add a menu item to the list of editors
        /*oExtension.$itmEditor = ide.mnuEditors.appendChild(new apf.item({
            type    : "radio",
            caption : oExtension.name,
            value   : oExtension.path,
            onclick : function(){
                require('ext/editors/editors').switchEditor(this.value);
            }
        }));*/

        var _self = this;
        oExtension.contentTypes.each(function(mime){
            (_self.contentTypes[mime] || (_self.contentTypes[mime] = [])).push(oExtension);
        });

        if (!this.contentTypes["default"])
            this.contentTypes["default"] = oExtension;
    },

    unregister : function(oExtension){
        //oExtension.$rbEditor.destroy(true, true);
        //oExtension.$itmEditor.destroy(true, true);

        var _self = this;
        oExtension.contentTypes.each(function(fe){
            _self.contentTypes[fe].remove(oExtension);
            if (!_self.contentTypes[fe].length)
                delete _self.contentTypes[fe];
        });

        if (this.contentTypes["default"] == oExtension) {
            delete this.contentTypes["default"];

            for (var prop in this.contentTypes) {
                this.contentTypes["default"] = this.contentTypes[prop][0];
                break;
            }
        }
    },

    addTabSection : function(){
        var _self = this;
        var vbox = this.hbox.appendChild(
            new apf.bar({id:"tabPlaceholder", flex:1, skin:"basic"})
        );

        var tab = new apf.bar({
            skin     : "basic",
            style    : "padding : 0 0 33px 0;position:absolute;", //53px
            htmlNode : document.body,
            childNodes: [
                new apf.tab({
                    id       : "tabEditors",
                    skin     : "editor_tab",
                    style    : "height : 100%",
                    buttons  : "close,scale",
                    onfocus  : function(e){
                        _self.switchfocus(e);
                    },
                    onbeforeswitch : function(e){
                        _self.beforeswitch(e);
                    },
                    onafterswitch : function(e){
                        _self.afterswitch(e);
                    },
                    onclose : function(e){
                        _self.close(e.page);
                    }
                })/*,
                new apf.hbox({
                    id      : "barButtons",
                    edge    : "0 0 0 6",
                    "class" : "relative",
                    zindex  : "1000",
                    bottom  : "0",
                    left    : "0",
                    right   : "0"
                })*/
            ]
        });
        
        tabPlaceholder.addEventListener("resize", function(e){
            var ext = tab.$ext, ph;
            var pos = apf.getAbsolutePosition(ph = tabPlaceholder.$ext);
            ext.style.left = pos[0] + "px";
            ext.style.top  = pos[1] + "px";
            var d = apf.getDiff(ext);
            ext.style.width = (ph.offsetWidth - d[0]) + "px";
            ext.style.height = (ph.offsetHeight - d[1]) + "px";
        });

        return vbox;
    },

    isEditorAvailable : function(page, path){
        var editor = ext.extLut[path];
        if (!editor)
            return false;

        var contentTypes = editor.contentTypes;
        var isEnabled = contentTypes.indexOf(tabEditors.getPage(page).contentType) > -1;
        
        if (!isEnabled && this.contentTypes["default"] == editor)
            return true; 
        else
            return isEnabled;
    },

    initEditor : function(editor){
        //Create Page Element
        var editorPage = new apf.page({
            id        : editor.path,
            mimeTypes : editor.contentTypes,
            visible   : false,
            realtime  : false
        });
        tabEditors.appendChild(editorPage);

        //Initialize Content of the page
        ext.initExtension(editor, editorPage);

        return editorPage;
    },

    switchEditor : function(path){
        var page = tabEditors.getPage();
        if (!page || page.type == path)
            return;

        var lastType = page.type;

        var editor = ext.extLut[path];
        if (!editor.inited)
            this.initEditor(editor);

        //editor.$itmEditor.select();
        //editor.$rbEditor.select();

        page.setAttribute("type", path);

        this.beforeswitch({nextPage: page});
        this.afterswitch({nextPage: page, previousPage: {type: lastType}});
    },

    openEditor : function(doc, init, active) {
        var xmlNode  = doc.getNode();
        var filepath = xmlNode.getAttribute("path");

        var page = tabEditors.getPage(filepath);
        if (page) {
            tabEditors.set(page);
            return;
        }

        var contentType = (xmlNode.getAttribute("contenttype") || "").split(";")[0];
        var editor = this.contentTypes[contentType] && this.contentTypes[contentType][0] || this.contentTypes["default"];

        if (!init && this.currentEditor)
            this.currentEditor.disable();

        if (!editor) {
            util.alert(
                "No editor is registered",
                "Could not find an editor to display content",
                "There is something wrong with the configuration of your IDE. No editor plugin is found.");
            return;
        }

        if (!editor.inited)
            var editorPage = this.initEditor(editor);
        else
            editorPage = tabEditors.getPage(editor.path);

        //Create Fake Page
        if (init)
            tabEditors.setAttribute("buttons", "close");
        
        var model = new apf.model(), 
            fake = tabEditors.add("{([@changed] == 1 ? '*' : '') + [@name]}", filepath, editor.path, null, function(page){
                page.contentType = contentType;
                page.$at     = new apf.actiontracker();
                page.$doc    = doc;
                page.$editor = editor;
                
                page.setAttribute("model", page.$model = model);
                page.$model.load(xmlNode);
            });

        if (init)
            tabEditors.setAttribute("buttons", "close,scale");

        fake.$at.addEventListener("afterchange", function() {
            if (e.action == "reset") {
                delete this.undo_ptr;
                return;
            }            

            var val;
            if (fake.$at.ignoreChange) {
                val = undefined;
                fake.$at.ignoreChange = false;
            } else if(this.undolength === 0 && !this.undo_ptr)
                val = undefined;
            else
                val = (this.$undostack[this.$undostack.length-1] !== this.undo_ptr) ? 1 : undefined;
                
            if (fake.changed !== val) {
                fake.changed = val;
                model.setQueryValue("@changed", (val ? "1" : "0"));
            }
        });
        
        if (init && !active)
            return;

        //Set active page
        tabEditors.set(filepath);

        //if (editorPage.model != model)
            //this.beforeswitch({nextPage: fake});

        //Open tab, set as active and wait until opened
        /*fake.addEventListener("afteropen", function(){

        });*/

        editor.enable();
        //editor.$itmEditor.select();
        //editor.$rbEditor.select();

        this.currentEditor = editor;
    },

    close : function(page){
        page.addEventListener("afterclose", this.$close);
    },

    $close : function() {
        var page = this;
        var at   = page.$at;
        var mdl  = page.$model;
        
        page.$doc.dispatchEvent("close");

        mdl.removeXml("data");
        ide.dispatchEvent("clearfilecache", {xmlNode: mdl.data});

        //mdl.unshare();
        mdl.destroy();

        at.reset();
        at.destroy();

        //Destroy the app page if it has no application instance
        //if (!tabEditors.selectNodes("page[@type='" + page.type + "']").length && editorPage)
            //editorPage.destroy(true, true);
    },

    switchfocus : function(e){

    },

    beforeswitch : function(e) {
        var page       = e.nextPage,
            editorPage = tabEditors.getPage(page.type);
        if (!editorPage) return;

        if (editorPage.model != page.$model)
            editorPage.setAttribute("model", page.$model);
        if (editorPage.actiontracker != page.$at)
            editorPage.setAttribute("actiontracker", page.$at);
        
        page.$editor.setDocument(page.$doc, page.$at);
    },

    afterswitch : function(e) {
        var page = e.nextPage;
        var fromHandler, toHandler = ext.extLut[page.type];

        if (e.previousPage && e.previousPage != e.nextPage)
            fromHandler = ext.extLut[e.previousPage.type];

        if (fromHandler != toHandler) {
            if (fromHandler)
                fromHandler.disable();
            toHandler.enable();
        }

        //toHandler.$itmEditor.select();
        //toHandler.$rbEditor.select();

        /*if (self.TESTING) {}
            //do nothing
        else if (page.appid)
            app.navigateTo(page.appid + "/" + page.id);
        else if (!page.id)
            app.navigateTo(app.loc || (app.loc = "myhome"));*/
    },

    /**** Init ****/

    hook : function(){
        panels.register(this);
    },

    init : function(){
        var _self = this;
        ext.addType("Editor", function(oExtension){
            _self.register(oExtension);
          }, function(oExtension){
            _self.unregister(oExtension);
          });

        ide.addEventListener("openfile", function(e){
            _self.openEditor(e.doc, e.init, e.active);
        });

        ide.addEventListener("filenotfound", function(e) {
            var page = tabEditors.getPage(e.path);
            if (page)
                tabEditors.remove(page);
        });

        var vbox  = colMiddle;
        this.hbox = vbox.appendChild(new apf.hbox({flex : 1, padding : 5, splitters : true}));
        //this.splitter = vbox.appendChild(new apf.splitter());
        this.nodes.push(this.addTabSection());

        this.panel = this.hbox;

        /**** Support for state preservation ****/

        this.$settings = {}, _self = this;
        ide.addEventListener("loadsettings", function(e){
            var model = e.model;
            ide.addEventListener("extload", function(){
                var active = model.queryValue("auto/files/@active");
                var nodes  = model.queryNodes("auto/files/file");
                for (var i = 0, l = nodes.length; i < l; i++) {
                    ide.dispatchEvent("openfile", {
                        doc    : ide.createDocument(nodes[i]),
                        init   : true,
                        active : active 
                            ? active == nodes[i].getAttribute("path")
                            : i == l - 1
                    });
                }
            });
        });

        ide.addEventListener("savesettings", function(e){
            var changed = false,
                pNode   = e.model.data.selectSingleNode("auto/files"),
                state   = pNode && pNode.xml,
                pages   = tabEditors.getPages();

            if (pNode) {
                pNode.parentNode.removeChild(pNode);
                pNode = null;
            }

            if (pages.length) {
                var active = tabEditors.activepage;
                e.model.setQueryValue("auto/files/@active", active);
                
                pNode = apf.createNodeFromXpath(e.model.data, "auto/files");
                for (var i = 0, l = pages.length; i < l; i++) {
                    var file = pages[i].$model.data;
                    if (file.getAttribute("debug"))
                        continue;

                    var copy = apf.xmldb.cleanNode(file.cloneNode(false));
                    copy.removeAttribute("changed");
                    pNode.appendChild(copy);
                }
            }

            if (state != (pNode && pNode.xml))
                return true;
        });
    },

    enable : function(){
        this.hbox.show();
        //this.splitter.show();
    },

    disable : function(){
        this.hbox.hide();
        //this.splitter.hide();
    },

    destroy : function(){
        this.hbox.destroy(true, true);
        //this.splitter.destroy(true, true);
        panels.unregister(this);
    }
});

});
/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
 
module.exports = ext.register("ext/undo/undo", {
    dev    : "Ajax.org",
    name   : "Undo",
    alone  : true,
    type   : ext.GENERAL,
    commands: {
        "undo": {hint: "undo one edit step in the active document"},
        "redo": {hint: "redo one edit step in the active document"}
    },

    nodes : [],

    init : function(amlNode){
        this.nodes.push(
            mnuEdit.appendChild(new apf.item({
                caption : "Undo",
                onclick : this.undo
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Redo",
                onclick : this.redo
            }))
        );

        this.hotitems = {
            "undo" : [this.nodes[0]],
            "redo" : [this.nodes[1]]
        };
    },

    undo: function() {
        var _tabPage;
        if(_tabPage = tabEditors.getPage())
            _tabPage.$at.undo();
    },

    redo: function() {
        var _tabPage;
        if(_tabPage = tabEditors.getPage())
            _tabPage.$at.redo();
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

});/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi AT c9 DOT io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var save;
var cmds = module.exports = {
    w: function(editor, data) {
        if (!save)
            save = require("ext/save/save");

        var page = tabEditors.getPage();
        if (!page)
            return;

        var lines = editor.session.getLength();
        if (data.argv.length === 2) {
            var path = ("/workspace/" + data.argv[1]).replace(/\/+/, "/");
            page.$model.data.setAttribute("path", path);

            save.saveas(page, function() {
                console.log(path + " [New] " + lines + "L, ##C written");
            });
        }
        else {
            save.quicksave(null, function() {
                console.log(page.name + " " + lines +"L, ##C written");
            });
        }
    }
};

// aliases
cmds.write = cmds.w;

});
/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi AT c9 DOT io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

"use strict";

var util = require("ext/vim/maps/util");
var motions = require("ext/vim/maps/motions");
var operators = require("ext/vim/maps/operators");
var alias = require("ext/vim/maps/aliases");
var registers = require("ext/vim/registers");

var NUMBER = 1;
var OPERATOR = 2;
var MOTION = 3;
var ACTION = 4;
var HMARGIN = 8; // Minimum amount of line separation between margins;

exports.searchStore = {
    current: "",
    options: {
        needle: "",
        backwards: false,
        wrap: true,
        caseSensitive: false,
        wholeWord: false,
        regExp: false
    }
};

var repeat = function repeat(fn, count, args) {
    count = parseInt(count, 10);
    while (0 < count--)
        fn.apply(this, args);
};

var toggleCase = function toggleCase(ch) {
    if (ch.toUpperCase() === ch)
        return ch.toLowerCase();
    else
        return ch.toUpperCase();
};

var ensureScrollMargin = function(editor) {
    setTimeout(function() {
        var curPos = editor.getCursorPosition().row;
        var topRow = editor.renderer.layerConfig.firstRow;
        var linesToBottom = editor.renderer.layerConfig.lastRow - curPos;
        var linesToTop = curPos - topRow;

        if (linesToBottom >= 0 && linesToBottom < HMARGIN) {
            editor.scrollToRow(topRow + (HMARGIN - linesToBottom));
        }
        else if (linesToTop >= 0 && linesToTop < HMARGIN) {
            editor.scrollToRow(topRow - (HMARGIN - linesToTop));
        }
    }, 20); // Delay introduced to ensure scroll after async find operation.
};

var actions = {
    "z": {
        param: true,
        fn: function(editor, range, count, param) {
            switch (param) {
                case "z":
                    editor.centerSelection();
                    break;
                case "t":
                    editor.scrollToRow(editor.getCursorPosition().row);
                    break;
            }
        }
    },
    "r": {
        param: true,
        fn: function(editor, range, count, param) {
            param = util.toRealChar(param);
            if (param && param.length) {
                repeat(function() { editor.insert(param); }, count || 1);
                editor.navigateLeft();
            }
        }
    },
    // "~" HACK
    "shift-`": {
        fn: function(editor, range, count) {
            repeat(function() {
                var pos = editor.getCursorPosition();
                var line = editor.session.getLine(pos.row);
                var ch = line[pos.column];
                editor.insert(toggleCase(ch));
            }, count || 1);
        }
    },
    "*": {
        fn: function(editor, range, count, param) {
            editor.selection.selectWord();
            editor.findNext();
            ensureScrollMargin(editor);
            var cursor = editor.selection.getCursor();
            range = editor.session.getWordRange(cursor.row, cursor.column);
            editor.selection.setSelectionRange(range, true);
        }
    },
    "#": {
        fn: function(editor, range, count, param) {
            editor.selection.selectWord();
            editor.findPrevious();
            ensureScrollMargin(editor);
            var cursor = editor.selection.getCursor();
            range = editor.session.getWordRange(cursor.row, cursor.column);
            editor.selection.setSelectionRange(range, true);
        }
    },
    "n": {
        fn: function(editor, range, count, param) {
            var options = editor.getLastSearchOptions();
            options.backwards = false;

            editor.findNext(options);

            ensureScrollMargin(editor);
            editor.selection.clearSelection();
        }
    },
    "shift-n": {
        fn: function(editor, range, count, param) {
            var options = editor.getLastSearchOptions();
            options.backwards = true;

            editor.navigateWordLeft();
            editor.findPrevious(options);
            ensureScrollMargin(editor);
            editor.selection.clearSelection();
        }
    },
    "v": {
        fn: function(editor, range, count, param) {
            editor.selection.selectRight();
            util.onVisualMode = true;
            util.onVisualLineMode = false;
            var cursor = document.getElementsByClassName("ace_cursor")[0];
            cursor.style.display = "none";
        }
    },
    "shift-v": {
        fn: function(editor, range, count, param) {
            util.onVisualLineMode = true;
            //editor.selection.selectLine();
            //editor.selection.selectLeft();
            var row = editor.getCursorPosition().row;
            editor.selection.clearSelection();
            editor.selection.moveCursorTo(row, 0);
            editor.selection.selectLineEnd();
            editor.selection.visualLineStart = row;
        }
    },
    "shift-y": {
        fn: function(editor, range, count, param) {
            util.copyLine(editor);
        }
    },
    "p": {
        fn: function(editor, range, count, param) {
            var defaultReg = registers._default;

            editor.setOverwrite(false);
            if (defaultReg.isLine) {
                var pos = editor.getCursorPosition();
                var lines = defaultReg.text.split("\n");
                editor.session.getDocument().insertLines(pos.row + 1, lines);
                editor.moveCursorTo(pos.row + 1, 0);
            }
            else {
                editor.navigateRight();
                editor.insert(defaultReg.text);
                editor.navigateLeft();
            }
            editor.setOverwrite(true);
            editor.selection.clearSelection();
        }
    },
    "shift-p": {
        fn: function(editor, range, count, param) {
            var defaultReg = registers._default;
            editor.setOverwrite(false);

            if (defaultReg.isLine) {
                var pos = editor.getCursorPosition();
                var lines = defaultReg.text.split("\n");
                editor.session.getDocument().insertLines(pos.row, lines);
                editor.moveCursorTo(pos.row, 0);
            }
            else {
                editor.insert(defaultReg.text);
            }
            editor.setOverwrite(true);
            editor.selection.clearSelection();
        }
    },
    "shift-j": {
        fn: function(editor, range, count, param) {
            var pos = editor.getCursorPosition();

            if (editor.session.getLength() === pos.row + 1)
                return;

            var nextLine = editor.session.getLine(pos.row + 1);
            var cleanLine = /^\s*(.*)$/.exec(nextLine)[1];

            editor.navigateDown();
            editor.removeLines();

            if (editor.session.getLength() > editor.getCursorPosition().row + 1)
                editor.navigateUp();

            editor.navigateLineEnd();
            editor.insert(" " + (cleanLine || ""));
            editor.moveCursorTo(pos.row, pos.column);

        }
    },
    "u": {
        fn: function(editor, range, count, param) {
            count = parseInt(count || 1, 10);
            for (var i = 0; i < count; i++) {
                editor.undo();
            }
            editor.selection.clearSelection();
        }
    },
    "ctrl-r": {
        fn: function(editor, range, count, param) {
            count = parseInt(count || 1, 10);
            for (var i = 0; i < count; i++) {
                editor.redo();
            }
            editor.selection.clearSelection();
        }
    },
    ":": {
        fn: function(editor, range, count, param) {
            editor.blur();
            txtConsoleInput.focus();
            txtConsoleInput.setValue(":");
        }
    },
    "/": {
        fn: function(editor, range, count, param) {
            editor.blur();
            txtConsoleInput.focus();
            txtConsoleInput.setValue("/");
        }
    },
    ".": {
        fn: function(editor, range, count, param) {
            util.onInsertReplaySequence = inputBuffer.lastInsertCommands;
            var previous = inputBuffer.previous;
            if (previous) // If there is a previous action
                inputBuffer.exec(editor, previous.action, previous.param);
        }
    }
};

var inputBuffer = exports.inputBuffer = {
    accepting: [NUMBER, OPERATOR, MOTION, ACTION],
    currentCmd: null,
    //currentMode: 0,
    currentCount: "",

    // Types
    operator: null,
    motion: null,

    lastInsertCommands: [],

    push: function(editor, char, keyId) {
        if (char && char.length > 1) { // There is a modifier key
            if (!char[char.length - 1].match(/[A-za-z]/) && keyId) // It is a letter
                char = keyId;
        }

        this.idle = false;
        var wObj = this.waitingForParam;
        if (wObj) {
            this.exec(editor, wObj, char);
        }
        // If input is a number (that doesn't start with 0)
        else if (!(char === "0" && !this.currentCount.length) &&
            (char.match(/^\d+$/) && this.isAccepting(NUMBER))) {
            // Assuming that char is always of type String, and not Number
            this.currentCount += char;
            this.currentCmd = NUMBER;
            this.accepting = [NUMBER, OPERATOR, MOTION, ACTION];
        }
        else if (!this.operator && this.isAccepting(OPERATOR) && operators[char]) {
            this.operator = {
                char: char,
                count: this.getCount()
            };
            this.currentCmd = OPERATOR;
            this.accepting = [NUMBER, MOTION, ACTION];
            this.exec(editor, { operator: this.operator });
        }
        else if (motions[char] && this.isAccepting(MOTION)) {
            this.currentCmd = MOTION;

            var ctx = {
                operator: this.operator,
                motion: {
                    char: char,
                    count: this.getCount()
                }
            };

            if (motions[char].param)
                this.waitForParam(ctx);
            else
                this.exec(editor, ctx);
        }
        else if (alias[char] && this.isAccepting(MOTION)) {
            alias[char].operator.count = this.getCount();
            this.exec(editor, alias[char]);
        }
        else if (actions[char] && this.isAccepting(ACTION)) {
            var actionObj = {
                action: {
                    fn: actions[char].fn,
                    count: this.getCount()
                }
            };

            if (actions[char].param) {
                this.waitForParam(actionObj);
            }
            else {
                this.exec(editor, actionObj);
            }
        }
        else if (this.operator) {
            this.exec(editor, { operator: this.operator }, char);
        }
        else {
            this.reset();
        }
    },

    waitForParam: function(cmd) {
        this.waitingForParam = cmd;
    },

    getCount: function() {
        var count = this.currentCount;
        this.currentCount = "";
        return count;
    },

    exec: function(editor, action, param) {
        var m = action.motion;
        var o = action.operator;
        var a = action.action;

        if (o) {
            this.previous = {
                action: action,
                param: param
            };
        }

        if (o && !editor.selection.isEmpty()) {
            if (operators[o.char].selFn) {
                operators[o.char].selFn(editor, editor.getSelectionRange(), o.count, param);
                this.reset();
            }
            return;
        }

        // There is an operator, but no motion or action. We try to pass the
        // current char to the operator to see if it responds to it (an example
        // of this is the 'dd' operator).
        else if (!m && !a && o && param) {
            operators[o.char].fn(editor, null, o.count, param);
            this.reset();
        }
        else if (m) {
            var run = function(fn) {
                if (fn && typeof fn === "function") { // There should always be a motion
                    if (m.count)
                        repeat(fn, m.count, [editor, null, m.count, param]);
                    else
                        fn(editor, null, m.count, param);
                }
            };

            var motionObj = motions[m.char];
            var selectable = motionObj.sel;

            if (!o) {
                if ((util.onVisualMode || util.onVisualLineMode) && selectable)
                    run(motionObj.sel);
                else
                    run(motionObj.nav);
            }
            else if (selectable) {
                repeat(function() {
                    run(motionObj.sel);
                    operators[o.char].fn(editor, editor.getSelectionRange(), o.count, param);
                }, o.count || 1);
            }
            this.reset();
        }
        else if (a) {
            a.fn(editor, editor.getSelectionRange(), a.count, param);
            this.reset();
        }
        handleCursorMove();
    },

    isAccepting: function(type) {
        return this.accepting.indexOf(type) !== -1;
    },

    reset: function() {
        this.operator = null;
        this.motion = null;
        this.currentCount = "";
        this.accepting = [NUMBER, OPERATOR, MOTION, ACTION];
        this.idle = true;
        this.waitingForParam = null;
    }
};

function setPreviousCommand(fn) {
    inputBuffer.previous = { action: { action: { fn: fn } } };
}

exports.commands = {
    start: {
        exec: function start(editor) {
            util.insertMode(editor);
            setPreviousCommand(start);
        }
    },
    startBeginning: {
        exec: function startBeginning(editor) {
            editor.navigateLineStart();
            util.insertMode(editor);
            setPreviousCommand(startBeginning);
        }
    },
    // Stop Insert mode as soon as possible. Works like typing <Esc> in
    // insert mode.
    stop: {
        exec: function stop(editor) {
            inputBuffer.reset();
            util.onVisualMode = false;
            util.onVisualLineMode = false;
            inputBuffer.lastInsertCommands = util.normalMode(editor);
        }
    },
    append: {
        exec: function append(editor) {
            var pos = editor.getCursorPosition();
            var lineLen = editor.session.getLine(pos.row).length;
            if (lineLen)
                editor.navigateRight();
            util.insertMode(editor);
            setPreviousCommand(append);
        }
    },
    appendEnd: {
        exec: function appendEnd(editor) {
            editor.navigateLineEnd();
            util.insertMode(editor);
            setPreviousCommand(appendEnd);
        }
    }
};

var handleCursorMove = exports.onCursorMove = function() {
    var editor = ceEditor.$editor;

    if(util.currentMode === 'insert' || handleCursorMove.running)
        return;
    else if(!ceEditor.$editor.selection.isEmpty()) {
        handleCursorMove.running = true;
        if(util.onVisualLineMode) {
            var originRow = editor.selection.visualLineStart;
            var cursorRow = editor.getCursorPosition().row;
            if(originRow <= cursorRow) {
                var endLine = editor.session.getLine(cursorRow);
                editor.selection.clearSelection();
                editor.selection.moveCursorTo(originRow, 0);
                editor.selection.selectTo(cursorRow, endLine.length);
            } else {
                var endLine = editor.session.getLine(originRow);
                editor.selection.clearSelection();
                editor.selection.moveCursorTo(originRow, endLine.length);
                editor.selection.selectTo(cursorRow, 0);
            }
        }
        handleCursorMove.running = false;
        return;
    }
    else {
        handleCursorMove.running = true;
        var pos = editor.getCursorPosition();
        var lineLen = editor.session.getLine(pos.row).length;

        if (lineLen && pos.column === lineLen)
            editor.navigateLeft();
        handleCursorMove.running = false;
    }
};
});

define(function(require, exports, module) {

"use strict";

var StateHandler = require("ace/keyboard/state_handler").StateHandler;
var cmds = require("ext/vim/commands");
var editors = require("ext/editors/editors");

var matchChar = function(buffer, hashId, key, symbolicName, keyId) {
    // If no command keys are pressed, then catch the input.
    // If only the shift key is pressed and a character key, then
    // catch that input as well.
    // Otherwise, we let the input got through.
    var matched = ((hashId === 0) || (((hashId === 1) || (hashId === 4)) && key.length === 1));
    //console.log("INFO", arguments)

    if (matched) {
        if (keyId) {
            keyId = String.fromCharCode(parseInt(keyId.replace("U+", "0x")));
        }

        var editor = editors.currentEditor.ceEditor.$editor;
        editor.commands.addCommand({
            name: "builder",
            exec: function(editor) {
                cmds.inputBuffer.push.call(cmds.inputBuffer, editor, symbolicName, keyId);
            }
        });
    }
    return matched;
};

var inIdleState = function() {
    if (cmds.inputBuffer.idle) {
        return true;
    }
    return false;
};

var states = exports.states = {
    start: [ // normal mode
        {
            key: "esc",
            exec: "stop",
            then: "start"
        },
        {
            regex: "^i$",
            match: inIdleState,
            exec: "start",
            then: "insertMode"
        },
        {
            regex: "^shift-i$",
            match: inIdleState,
            exec: "startBeginning",
            then: "insertMode"
        },
        {
            regex: "^a$",
            match: inIdleState,
            exec: "append",
            then: "insertMode"
        },
        {
            regex: "^shift-a$",
            match: inIdleState,
            exec: "appendEnd",
            then: "insertMode"
        },
        {
            // The rest of input will be processed here
            match: matchChar,
            exec: "builder"
        }
    ],
    insertMode: [
        {
            key: "esc",
            exec: "stop",
            then: "start"
        },
        {
            key: "backspace",
            exec: "backspace"
        }
    ]
};

exports.handler = new StateHandler(states);
});
"use strict"

define(function(require, exports, module) {
module.exports = {
    "x": {
        operator: {
            char: "d",
            count: 1
        },
        motion: {
            char: "l",
            count: 1
        }
    },
    "shift-x": {
        operator: {
            char: "d",
            count: 1
        },
        motion: {
            char: "h",
            count: 1
        }
    },
    "shift-d": {
        operator: {
            char: "d",
            count: 1
        },
        motion: {
            char: "$",
            count: 1
        }
    },
    "shift-c": {
        operator: {
            char: "c",
            count: 1
        },
        motion: {
            char: "$",
            count: 1
        }
    },
    "s": {
        operator: {
            char: "c",
            count: 1
        },
        motion: {
            char: "l",
            count: 1
        }
    },
    "shift-s": {
        operator: {
            char: "c",
            count: 1
        },
        motion: {
            char: "l",
            count: 1
        }
    }
};
});

"use strict"

define(function(require, exports, module) {

var util = require("ext/vim/maps/util");

var keepScrollPosition = function(editor, fn) {
    var scrollTopRow = editor.renderer.getScrollTopRow();
    var initialRow = editor.getCursorPosition().row;
    var diff = initialRow - scrollTopRow;
    fn && fn.call(editor);
    editor.renderer.scrollToRow(editor.getCursorPosition().row - diff);
};

module.exports = {
    "w": {
        nav: function(editor) {
            editor.navigateWordRight();
        },
        sel: function(editor) {
            editor.selection.selectWordRight();
        }
    },
    "b": {
        nav: function(editor) {
            editor.navigateWordLeft();
        },
        sel: function(editor) {
            editor.selection.selectWordLeft();
        }
    },
    "l": {
        nav: function(editor) {
            editor.navigateRight();
        },
        sel: function(editor) {
            var pos = editor.getCursorPosition();
            var col = pos.column;
            var lineLen = editor.session.getLine(pos.row).length;

            // Solving the behavior at the end of the line due to the
            // different 0 index-based colum positions in ACE.
            if (lineLen && col !== lineLen) //In selection mode you can select the newline
                editor.selection.selectRight();
        }
    },
    "h": {
        nav: function(editor) {
            var pos = editor.getCursorPosition();
            if (pos.column > 0)
                editor.navigateLeft();
        },
        sel: function(editor) {
            var pos = editor.getCursorPosition();
            if (pos.column > 0)
                editor.selection.selectLeft();
        }
    },
    "k": {
        nav: function(editor) {
            editor.navigateUp();
        },
        sel: function(editor) {
            editor.selection.selectUp();
        }
    },
    "j": {
        nav: function(editor) {
            editor.navigateDown();
        },
        sel: function(editor) {
            editor.selection.selectDown();
        }
    },
    "i": {
        param: true,
        sel: function(editor, range, count, param) {
            switch (param) {
                case "w":
                    editor.selection.selectWord();
            }
        }
    },
    "a": {
        param: true,
        sel: function(editor, range, count, param) {
            switch (param) {
                case "w":
                    editor.selection.selectAWord();
            }
        }
    },
    "f": {
        param: true,
        nav: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getRightNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.selection.clearSelection(); // Why does it select in the first place?
                ed.moveCursorTo(cursor.row, column + cursor.column + 1);
            }
        },
        sel: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getRightNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.moveCursorTo(cursor.row, column + cursor.column + 1);
            }
        }
    },
    "shift-f": {
        param: true,
        nav: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getLeftNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.selection.clearSelection(); // Why does it select in the first place?
                ed.moveCursorTo(cursor.row, cursor.column - column + 1);
            }
        },
        sel: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getLeftNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.moveCursorTo(cursor.row, cursor.column - column + 1);
            }
        }
    },
    "t": {
        param: true,
        nav: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getRightNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.selection.clearSelection(); // Why does it select in the first place?
                ed.moveCursorTo(cursor.row, column + cursor.column);
            }
        },
        sel: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getRightNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.moveCursorTo(cursor.row, column + cursor.column);
            }
        }
    },
    "^": {
        nav: function(editor) {
            editor.navigateLineStart();
        },
        sel: function(editor) {
            editor.selection.selectLineStart();
        }
    },
    "$": {
        nav: function(editor) {
            editor.navigateLineEnd();
        },
        sel: function(editor) {
            editor.selection.selectLineEnd();
        }
    },
    "0": {
        nav: function(editor) {
            var ed = editor;
            ed.navigateTo(ed.selection.selectionLead.row, 0);
        },
        sel: function(editor) {
            var ed = editor;
            ed.selectTo(ed.selection.selectionLead.row, 0);
        }
    },
    "shift-g": {
        nav: function(editor, range, count, param) {
            count = parseInt(count, 10);
            if (!count && count !== 0) { // Stupid JS
                count = editor.session.getLength();
            }
            editor.gotoLine(count);
        },
        sel: function(editor, range, count, param) {
            count = parseInt(count, 10);
            if (!count && count !== 0) { // Stupid JS
                count = editor.session.getLength();
            }
            editor.selection.selectTo(count, 0);
        }
    },
    "ctrl-d": {
        nav: function(editor, range, count, param) {
            editor.selection.clearSelection();
            keepScrollPosition(editor, editor.gotoPageDown);
        },
        sel: function(editor, range, count, param) {
            keepScrollPosition(editor, editor.selectPageDown);
        }
    },
    "ctrl-u": {
        nav: function(editor, range, count, param) {
            editor.selection.clearSelection();
            keepScrollPosition(editor, editor.gotoPageUp);

        },
        sel: function(editor, range, count, param) {
            keepScrollPosition(editor, editor.selectPageUp);
        }
    },
    "g": {
        param: true,
        nav: function(editor, range, count, param) {
            switch(param) {
                case "m":
                    console.log("Middle line");
                    break;
                case "e":
                    console.log("End of prev word");
                    break;
                case "g":
                    editor.gotoLine(count || 0);
            }
        },
        sel: function(editor, range, count, param) {
            switch(param) {
                case "m":
                    console.log("Middle line");
                    break;
                case "e":
                    console.log("End of prev word");
                    break;
                case "g":
                    editor.selection.selectTo(count || 0, 0);
            }
        }
    },
    "o": {
        nav: function(editor, range, count, param) {
            count = count || 1;
            var content = "";
            while (0 < count--)
                content += "\n";

            if (content.length) {
                editor.navigateLineEnd()
                editor.insert(content);
                util.insertMode(editor);
            }
        }
    },
    "shift-o": {
        nav: function(editor, range, count, param) {
            var row = editor.getCursorPosition().row;
            count = count || 1;
            var content = "";
            while (0 < count--)
                content += "\n";

            if (content.length) {
                if(row > 0) {
                    editor.navigateUp();
                    editor.navigateLineEnd()
                    editor.insert(content);
                } else {
                    editor.session.insert({row: 0, column: 0}, content);
                    editor.navigateUp();
                }
                util.insertMode(editor);
            }
        }
    },
    "%": {
        nav: function(editor, range, count, param) {
            var cursor = editor.getCursorPosition();
            var match = editor.session.findMatchingBracket({
                row: cursor.row,
                column: cursor.column + 1
            });

            if (match)
                editor.moveCursorTo(match.row, match.column);
        }
    }
};

module.exports.backspace = module.exports.left = module.exports.h;
module.exports.right = module.exports.l;
module.exports.up = module.exports.k;
module.exports.down = module.exports.j;
module.exports.pagedown = module.exports["ctrl-d"];
module.exports.pageup = module.exports["ctrl-u"];

});
define(function(require, exports, module) {

"use strict";

var util = require("ext/vim/maps/util");
var registers = require("ext/vim/registers");

module.exports = {
    "d": {
            selFn: function(editor, range, count, param) {
                registers._default.text = editor.getCopyText();
                registers._default.isLine = util.onVisualLineMode;
                if(util.onVisualLineMode)
                    editor.removeLines();
                else
                    editor.session.remove(range);
                util.normalMode(editor);
            },
            fn: function(editor, range, count, param) {
                count = parseInt(count || 1, 10);
                switch (param) {
                    case "d":
                        registers._default.text = "";
                        registers._default.isLine = true;
                        for (var i=0; i<count; i++) {
                            editor.selection.selectLine();
                            registers._default.text += editor.getCopyText();
                            var selRange = editor.getSelectionRange();
                            editor.session.remove(selRange);
                            editor.selection.clearSelection();
                        }
                        registers._default.text = registers._default.text.replace(/\n$/, "");
                        break;
                    default:
                        if (range) {
                            editor.selection.setSelectionRange(range);
                            registers._default.text = editor.getCopyText();
                            registers._default.isLine = false;
                            editor.session.remove(range);
                            editor.selection.clearSelection();
                        }
                }
            }
    },
    "c": {
            selFn: function(editor, range, count, param) {
                editor.session.remove(range);
                util.insertMode(editor);
            },
            fn: function(editor, range, count, param) {
                count = parseInt(count || 1, 10);
                switch (param) {
                    case "c":
                        for (var i=0; i < count; i++) {
                            editor.removeLines();
                            util.insertMode(editor);
                        }

                        break;
                    default:
                        if (range) {
                            editor.session.remove(range);
                            util.insertMode(editor);
                        }
                }
            }
    },
    "y": {
        selFn: function(editor, range, count, param) {
            registers._default.text = editor.getCopyText();
            registers._default.isLine = util.onVisualLineMode;
            editor.selection.clearSelection();
            util.normalMode(editor);
        },
        fn: function(editor, range, count, param) {
            count = parseInt(count || 1, 10);
            switch (param) {
                case "y":
                    var pos = editor.getCursorPosition();
                    editor.selection.selectLine();
                    for (var i = 0; i < count - 1; i++) {
                        editor.selection.moveCursorDown();
                    }
                    registers._default.text = editor.getCopyText().replace(/\n$/, "");
                    editor.selection.clearSelection();
                    registers._default.isLine = true;
                    editor.moveCursorToPosition(pos);
                    break;
                default:
                    if (range) {
                        var pos = editor.getCursorPosition();
                        editor.selection.setSelectionRange(range);
                        registers._default.text = editor.getCopyText();
                        registers._default.isLine = false;
                        editor.selection.clearSelection();
                        editor.moveCursorTo(pos.row, pos.column);
                    }
            }
        }
    },
    ">": {
        selFn: function(editor, range, count, param) {
            count = parseInt(count || 1, 10);
            for (var i = 0; i < count; i++) {
                editor.indent();
            }
            util.normalMode(editor);
        },
        fn: function(editor, range, count, param) {
            count = parseInt(count || 1, 10);
            switch (param) {
                case ">":
                    var pos = editor.getCursorPosition();
                    editor.selection.selectLine();
                    for (var i = 0; i < count - 1; i++) {
                        editor.selection.moveCursorDown();
                    }
                    editor.indent();
                    editor.selection.clearSelection();
                    editor.moveCursorToPosition(pos);
                    editor.navigateLineEnd();
                    editor.navigateLineStart();
                    break;
            }
        }
    },
    "<": {
        selFn: function(editor, range, count, param) {
            count = parseInt(count || 1, 10);
            for (var i = 0; i < count; i++) {
                editor.blockOutdent();
            }
            util.normalMode(editor);
        },
        fn: function(editor, range, count, param) {
            count = parseInt(count || 1, 10);
            switch (param) {
                case "<":
                    var pos = editor.getCursorPosition();
                    editor.selection.selectLine();
                    for (var i = 0; i < count - 1; i++) {
                        editor.selection.moveCursorDown();
                    }
                    editor.blockOutdent();
                    editor.selection.clearSelection();
                    editor.moveCursorToPosition(pos);
                    editor.navigateLineEnd();
                    editor.navigateLineStart();
                    break;
            }
        }
    }
};
});
"use strict";

define(function(require, exports, module) {
var registers = require("ext/vim/registers");
var ide = require("core/ide");

module.exports = {
    onVisualMode: false,
    onVisualLineMode: false,
    currentMode: 'normal',
    insertMode: function(editor) {
        var _self = this;
        var theme = editor && editor.getTheme() || "ace/theme/textmate";

        ide.dispatchEvent("vim.changeMode", { mode : "insert" });

        require(["require", theme], function (require) {
            var isDarkTheme = require(theme).isDark;

            _self.currentMode = 'insert';
            // Switch editor to insert mode
            editor.unsetStyle('insert-mode');

            var cursor = document.getElementsByClassName("ace_cursor")[0];
            if (cursor) {
                cursor.style.display = null;
                cursor.style.backgroundColor = null;
                cursor.style.opacity = null;
                cursor.style.border = null;
                cursor.style.borderLeftColor = isDarkTheme? "#eeeeee" : "#333333";
                cursor.style.borderLeftStyle = "solid";
                cursor.style.borderLeftWidth = "2px";
            }

            editor.setOverwrite(false);
            editor.keyBinding.$data.buffer = "";
            editor.keyBinding.$data.state = "insertMode";
            _self.onVisualMode = false;
            _self.onVisualLineMode = false;
            if(_self.onInsertReplaySequence) {
                // Ok, we're apparently replaying ("."), so let's do it
                editor.commands.macro = _self.onInsertReplaySequence;
                editor.commands.replay(editor);
                _self.onInsertReplaySequence = null;
                _self.normalMode(editor);
            } else {
                // Record any movements, insertions in insert mode
                if(!editor.commands.recording)
                    editor.commands.toggleRecording();
            }
        });
    },
    normalMode: function(editor) {
        // Switch editor to normal mode
        this.currentMode = 'normal';
        
        ide.dispatchEvent("vim.changeMode", { mode : "normal" });

        editor.setStyle('normal-mode');
        editor.clearSelection();

        var cursor = document.getElementsByClassName("ace_cursor")[0];
        if (cursor) {
            cursor.style.display = null;
            cursor.style.backgroundColor = "red";
            cursor.style.opacity = ".5";
            cursor.style.border = "0";
        }

        var pos;
        if (!editor.getOverwrite()) {
            pos = editor.getCursorPosition();
            if (pos.column > 0)
                editor.navigateLeft();
        }
        editor.setOverwrite(true);
        editor.keyBinding.$data.buffer = "";
        editor.keyBinding.$data.state = "start";
        this.onVisualMode = false;
        this.onVisualLineMode = false;
        // Save recorded keystrokes
        if(editor.commands.recording) {
            editor.commands.toggleRecording();
            return editor.commands.macro;
        }
        else {
            return [];
        }
    },
    getRightNthChar: function(editor, cursor, char, n) {
        var line = editor.getSession().getLine(cursor.row);
        var matches = line.substr(cursor.column + 1).split(char);

        return n < matches.length ? matches.slice(0, n).join(char).length : 0;
    },
    getLeftNthChar: function(editor, cursor, char, n) {
        var line = editor.getSession().getLine(cursor.row);
        var matches = line.substr(0, cursor.column).split(char);

        return n < matches.length ? matches.slice(-1 * n).join(char).length + 2 : 0;
    },
    toRealChar: function(char) {
        if (char.length === 1)
            return char;

        if (/^shift-./.test(char))
            return char[char.length - 1].toUpperCase();
        else
            return "";
    },
    copyLine: function(editor) {
        var pos = editor.getCursorPosition();
        editor.selection.clearSelection();
        editor.moveCursorTo(pos.row, pos.column);
        editor.selection.selectLine();
        registers._default.isLine = true;
        registers._default.text = editor.getCopyText().replace(/\n$/, "");
        editor.selection.clearSelection();
        editor.moveCursorTo(pos.row, pos.column);
    }
};
});

define(function(require, exports, module) {

"use strict";

module.exports = {
    _default: {
        text: "",
        isLine: false
    }
};

});
/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi@c9.io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {
"use strict";

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var code = require("ext/code/code");
var handler = require("ext/vim/keyboard").handler;
var cmdModule = require("ext/vim/commands");
var commands = cmdModule.commands;
var cliCmds = require("ext/vim/cli");
var settings = require("ext/settings/settings");
var util = require("ext/vim/maps/util");

var VIM_ENABLED = false;
var OLD_HANDLER;

var onConsoleCommand = function onConsoleCommand(e) {
    var cmd = e.data.command;
    if (cmd && typeof cmd === "string") {
        
        if (cmd[0] === ":") {
            cmd = cmd.substr(1);

            if (cliCmds[cmd]) {
                cliCmds[cmd](ceEditor.$editor, e.data);
            }
            else if (cmd.match(/^\d+$/)) {
                ceEditor.$editor.gotoLine(parseInt(cmd, 10), 0);
                ceEditor.$editor.navigateLineStart();
            }
            else {
                console.log("Vim command '" + cmd + "' not implemented.");
            }

            ceEditor.focus();
            e.returnValue = false;
        }
        else if (cmd[0] === "/") {
            cmd = cmd.substr(1);
            cmdModule.searchStore.current = cmd;
            ceEditor.$editor.find(cmd, cmdModule.searchStore.options);
            ceEditor.focus();
            e.returnValue = false;
        }
    }
};

var addCommands = function addCommands(editor, commands) {
    Object.keys(commands).forEach(function(name) {
        var command = commands[name];
        if ("function" === typeof command)
            command = { exec: command };

        if (!command.name)
            command.name = name;

        editor.commands.addCommand(command);
    });
};

var removeCommands = function removeCommands(editor, commands) {
    Object.keys(commands).forEach(function(name) {
        editor.commands.removeCommand(commands[name]);
    });
};

var onCursorMove = function() {
    cmdModule.onCursorMove();
    onCursorMove.scheduled = false;
};

var enableVim = function enableVim() {
    ext.initExtension(this);

    var editor = ceEditor.$editor;
    addCommands(editor, commands);
    editor.renderer.container.addEventListener("click", onCursorMove, false);

    // Set Vim's own keyboard handle and store the old one.
    OLD_HANDLER = OLD_HANDLER || editor.getKeyboardHandler();
    editor.setKeyboardHandler(handler);

    // Set Vim in command (normal) mode
    commands.stop.exec(editor);
    VIM_ENABLED = true;
        
    ide.dispatchEvent("track_action", {type: "vim", action: "enable", mode: util.currentMode});
};

var disableVim = function() {
    var editor = ceEditor.$editor;
    removeCommands(editor, commands);
    editor.setKeyboardHandler(OLD_HANDLER);
    commands.start.exec(editor);
    editor.renderer.container.removeEventListener("click", onCursorMove, false);
    VIM_ENABLED = false;

    ide.dispatchEvent("track_action", { type: "vim", action: "disable" });
};

module.exports = ext.register("ext/vim/vim", {
    name  : "Vim mode",
    dev   : "Ajax.org",
    type  : ext.GENERAL,
    deps  : [editors, code, settings],
    nodes : [],
    alone : true,

    hook : function() {
        var self = this;
        var menuItem = new apf.item({
            caption: "Vim mode",
            type: "check",
            checked: "[{require('ext/settings/settings').model}::editors/code/@vimmode]",
            onclick: function() { self.toggle(); }
        });

        ide.addEventListener("init.ext/statusbar/statusbar", function (e) {
            e.ext.addToolsItem(menuItem.cloneNode(true), 0);
        });

        ide.addEventListener("init.ext/settings/settings", function (e) {
            e.ext.getHeading("Code Editor").appendChild(new apf.checkbox({
                "class" : "underlined",
                skin  : "checkbox_grey",
                value : "[editors/code/@vimmode]",
                label : "Vim mode",
                onclick: function() { self.toggle(); }
            }));
        });

        var tryEnabling = function () {
            if (settings.model) {
                VIM_ENABLED = apf.isTrue(settings.model.queryNode("editors/code").getAttribute("vimmode"));
            }
            self.enable(VIM_ENABLED === true);
        };
        ide.addEventListener("init.ext/code/code", tryEnabling);
        ide.addEventListener("code.ext:defaultbindingsrestored", tryEnabling);
    },

    toggle: function(show) {
        this.enable(VIM_ENABLED === false);
        if (typeof ceEditor !== "undefined") {
            ceEditor.focus();
        }
    },

    init: function() {
        txtConsoleInput.addEventListener("keydown", function(e) {
            if (e.keyCode === 27 && typeof ceEditor !== "undefined") { // ESC is pressed in the CLI
                ceEditor.focus();
            }
        });
    },

    // Enable accepts a `doEnable` argument which executes `disable` if false.
    enable: function(doEnable) {
        if (doEnable !== false) {
            ide.removeEventListener("consolecommand", onConsoleCommand);
            ide.addEventListener("consolecommand", onConsoleCommand);
            enableVim.call(this);
        }
        else {
            this.disable();
        }
    },

    disable: function() {
        ide.removeEventListener("consolecommand", onConsoleCommand);
        disableVim();
    },

    destroy: function() {
        this.nodes.forEach(function(item) { item.destroy(); });
        this.nodes = [];
    }
});
});
"use strict"

define(function(require, exports, module) {
module.exports = {
    "x": {
        operator: {
            char: "d",
            count: 1
        },
        motion: {
            char: "l",
            count: 1
        }
    },
    "shift-x": {
        operator: {
            char: "d",
            count: 1
        },
        motion: {
            char: "h",
            count: 1
        }
    },
    "shift-d": {
        operator: {
            char: "d",
            count: 1
        },
        motion: {
            char: "$",
            count: 1
        }
    },
    "shift-c": {
        operator: {
            char: "c",
            count: 1
        },
        motion: {
            char: "$",
            count: 1
        }
    },
    "s": {
        operator: {
            char: "c",
            count: 1
        },
        motion: {
            char: "l",
            count: 1
        }
    },
    "shift-s": {
        operator: {
            char: "c",
            count: 1
        },
        motion: {
            char: "l",
            count: 1
        }
    }
};
});

"use strict"

define(function(require, exports, module) {

var util = require("ext/vim/maps/util");

var keepScrollPosition = function(editor, fn) {
    var scrollTopRow = editor.renderer.getScrollTopRow();
    var initialRow = editor.getCursorPosition().row;
    var diff = initialRow - scrollTopRow;
    fn && fn.call(editor);
    editor.renderer.scrollToRow(editor.getCursorPosition().row - diff);
};

module.exports = {
    "w": {
        nav: function(editor) {
            editor.navigateWordRight();
        },
        sel: function(editor) {
            editor.selection.selectWordRight();
        }
    },
    "b": {
        nav: function(editor) {
            editor.navigateWordLeft();
        },
        sel: function(editor) {
            editor.selection.selectWordLeft();
        }
    },
    "l": {
        nav: function(editor) {
            editor.navigateRight();
        },
        sel: function(editor) {
            var pos = editor.getCursorPosition();
            var col = pos.column;
            var lineLen = editor.session.getLine(pos.row).length;

            // Solving the behavior at the end of the line due to the
            // different 0 index-based colum positions in ACE.
            if (lineLen && col !== lineLen) //In selection mode you can select the newline
                editor.selection.selectRight();
        }
    },
    "h": {
        nav: function(editor) {
            var pos = editor.getCursorPosition();
            if (pos.column > 0)
                editor.navigateLeft();
        },
        sel: function(editor) {
            var pos = editor.getCursorPosition();
            if (pos.column > 0)
                editor.selection.selectLeft();
        }
    },
    "k": {
        nav: function(editor) {
            editor.navigateUp();
        },
        sel: function(editor) {
            editor.selection.selectUp();
        }
    },
    "j": {
        nav: function(editor) {
            editor.navigateDown();
        },
        sel: function(editor) {
            editor.selection.selectDown();
        }
    },
    "i": {
        param: true,
        sel: function(editor, range, count, param) {
            switch (param) {
                case "w":
                    editor.selection.selectWord();
            }
        }
    },
    "a": {
        param: true,
        sel: function(editor, range, count, param) {
            switch (param) {
                case "w":
                    editor.selection.selectAWord();
            }
        }
    },
    "f": {
        param: true,
        nav: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getRightNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.selection.clearSelection(); // Why does it select in the first place?
                ed.moveCursorTo(cursor.row, column + cursor.column + 1);
            }
        },
        sel: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getRightNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.moveCursorTo(cursor.row, column + cursor.column + 1);
            }
        }
    },
    "shift-f": {
        param: true,
        nav: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getLeftNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.selection.clearSelection(); // Why does it select in the first place?
                ed.moveCursorTo(cursor.row, cursor.column - column + 1);
            }
        },
        sel: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getLeftNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.moveCursorTo(cursor.row, cursor.column - column + 1);
            }
        }
    },
    "t": {
        param: true,
        nav: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getRightNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.selection.clearSelection(); // Why does it select in the first place?
                ed.moveCursorTo(cursor.row, column + cursor.column);
            }
        },
        sel: function(editor, range, count, param) {
            count = parseInt(count, 10) || 1;
            var ed = editor;
            var cursor = ed.getCursorPosition();
            var column = util.getRightNthChar(editor, cursor, param, count);

            if (typeof column === "number") {
                ed.moveCursorTo(cursor.row, column + cursor.column);
            }
        }
    },
    "^": {
        nav: function(editor) {
            editor.navigateLineStart();
        },
        sel: function(editor) {
            editor.selection.selectLineStart();
        }
    },
    "$": {
        nav: function(editor) {
            editor.navigateLineEnd();
        },
        sel: function(editor) {
            editor.selection.selectLineEnd();
        }
    },
    "0": {
        nav: function(editor) {
            var ed = editor;
            ed.navigateTo(ed.selection.selectionLead.row, 0);
        },
        sel: function(editor) {
            var ed = editor;
            ed.selectTo(ed.selection.selectionLead.row, 0);
        }
    },
    "shift-g": {
        nav: function(editor, range, count, param) {
            count = parseInt(count, 10);
            if (!count && count !== 0) { // Stupid JS
                count = editor.session.getLength();
            }
            editor.gotoLine(count);
        },
        sel: function(editor, range, count, param) {
            count = parseInt(count, 10);
            if (!count && count !== 0) { // Stupid JS
                count = editor.session.getLength();
            }
            editor.selection.selectTo(count, 0);
        }
    },
    "ctrl-d": {
        nav: function(editor, range, count, param) {
            editor.selection.clearSelection();
            keepScrollPosition(editor, editor.gotoPageDown);
        },
        sel: function(editor, range, count, param) {
            keepScrollPosition(editor, editor.selectPageDown);
        }
    },
    "ctrl-u": {
        nav: function(editor, range, count, param) {
            editor.selection.clearSelection();
            keepScrollPosition(editor, editor.gotoPageUp);

        },
        sel: function(editor, range, count, param) {
            keepScrollPosition(editor, editor.selectPageUp);
        }
    },
    "g": {
        param: true,
        nav: function(editor, range, count, param) {
            switch(param) {
                case "m":
                    console.log("Middle line");
                    break;
                case "e":
                    console.log("End of prev word");
                    break;
                case "g":
                    editor.gotoLine(count || 0);
            }
        },
        sel: function(editor, range, count, param) {
            switch(param) {
                case "m":
                    console.log("Middle line");
                    break;
                case "e":
                    console.log("End of prev word");
                    break;
                case "g":
                    editor.selection.selectTo(count || 0, 0);
            }
        }
    },
    "o": {
        nav: function(editor, range, count, param) {
            count = count || 1;
            var content = "";
            while (0 < count--)
                content += "\n";

            if (content.length) {
                editor.navigateLineEnd()
                editor.insert(content);
                util.insertMode(editor);
            }
        }
    },
    "shift-o": {
        nav: function(editor, range, count, param) {
            var row = editor.getCursorPosition().row;
            count = count || 1;
            var content = "";
            while (0 < count--)
                content += "\n";

            if (content.length) {
                if(row > 0) {
                    editor.navigateUp();
                    editor.navigateLineEnd()
                    editor.insert(content);
                } else {
                    editor.session.insert({row: 0, column: 0}, content);
                    editor.navigateUp();
                }
                util.insertMode(editor);
            }
        }
    },
    "%": {
        nav: function(editor, range, count, param) {
            var cursor = editor.getCursorPosition();
            var match = editor.session.findMatchingBracket({
                row: cursor.row,
                column: cursor.column + 1
            });

            if (match)
                editor.moveCursorTo(match.row, match.column);
        }
    }
};

module.exports.backspace = module.exports.left = module.exports.h;
module.exports.right = module.exports.l;
module.exports.up = module.exports.k;
module.exports.down = module.exports.j;
module.exports.pagedown = module.exports["ctrl-d"];
module.exports.pageup = module.exports["ctrl-u"];

});
define(function(require, exports, module) {

"use strict";

var util = require("ext/vim/maps/util");
var registers = require("ext/vim/registers");

module.exports = {
    "d": {
            selFn: function(editor, range, count, param) {
                registers._default.text = editor.getCopyText();
                registers._default.isLine = util.onVisualLineMode;
                if(util.onVisualLineMode)
                    editor.removeLines();
                else
                    editor.session.remove(range);
                util.normalMode(editor);
            },
            fn: function(editor, range, count, param) {
                count = parseInt(count || 1, 10);
                switch (param) {
                    case "d":
                        registers._default.text = "";
                        registers._default.isLine = true;
                        for (var i=0; i<count; i++) {
                            editor.selection.selectLine();
                            registers._default.text += editor.getCopyText();
                            var selRange = editor.getSelectionRange();
                            editor.session.remove(selRange);
                            editor.selection.clearSelection();
                        }
                        registers._default.text = registers._default.text.replace(/\n$/, "");
                        break;
                    default:
                        if (range) {
                            editor.selection.setSelectionRange(range);
                            registers._default.text = editor.getCopyText();
                            registers._default.isLine = false;
                            editor.session.remove(range);
                            editor.selection.clearSelection();
                        }
                }
            }
    },
    "c": {
            selFn: function(editor, range, count, param) {
                editor.session.remove(range);
                util.insertMode(editor);
            },
            fn: function(editor, range, count, param) {
                count = parseInt(count || 1, 10);
                switch (param) {
                    case "c":
                        for (var i=0; i < count; i++) {
                            editor.removeLines();
                            util.insertMode(editor);
                        }

                        break;
                    default:
                        if (range) {
                            editor.session.remove(range);
                            util.insertMode(editor);
                        }
                }
            }
    },
    "y": {
        selFn: function(editor, range, count, param) {
            registers._default.text = editor.getCopyText();
            registers._default.isLine = util.onVisualLineMode;
            editor.selection.clearSelection();
            util.normalMode(editor);
        },
        fn: function(editor, range, count, param) {
            count = parseInt(count || 1, 10);
            switch (param) {
                case "y":
                    var pos = editor.getCursorPosition();
                    editor.selection.selectLine();
                    for (var i = 0; i < count - 1; i++) {
                        editor.selection.moveCursorDown();
                    }
                    registers._default.text = editor.getCopyText().replace(/\n$/, "");
                    editor.selection.clearSelection();
                    registers._default.isLine = true;
                    editor.moveCursorToPosition(pos);
                    break;
                default:
                    if (range) {
                        var pos = editor.getCursorPosition();
                        editor.selection.setSelectionRange(range);
                        registers._default.text = editor.getCopyText();
                        registers._default.isLine = false;
                        editor.selection.clearSelection();
                        editor.moveCursorTo(pos.row, pos.column);
                    }
            }
        }
    },
    ">": {
        selFn: function(editor, range, count, param) {
            count = parseInt(count || 1, 10);
            for (var i = 0; i < count; i++) {
                editor.indent();
            }
            util.normalMode(editor);
        },
        fn: function(editor, range, count, param) {
            count = parseInt(count || 1, 10);
            switch (param) {
                case ">":
                    var pos = editor.getCursorPosition();
                    editor.selection.selectLine();
                    for (var i = 0; i < count - 1; i++) {
                        editor.selection.moveCursorDown();
                    }
                    editor.indent();
                    editor.selection.clearSelection();
                    editor.moveCursorToPosition(pos);
                    editor.navigateLineEnd();
                    editor.navigateLineStart();
                    break;
            }
        }
    },
    "<": {
        selFn: function(editor, range, count, param) {
            count = parseInt(count || 1, 10);
            for (var i = 0; i < count; i++) {
                editor.blockOutdent();
            }
            util.normalMode(editor);
        },
        fn: function(editor, range, count, param) {
            count = parseInt(count || 1, 10);
            switch (param) {
                case "<":
                    var pos = editor.getCursorPosition();
                    editor.selection.selectLine();
                    for (var i = 0; i < count - 1; i++) {
                        editor.selection.moveCursorDown();
                    }
                    editor.blockOutdent();
                    editor.selection.clearSelection();
                    editor.moveCursorToPosition(pos);
                    editor.navigateLineEnd();
                    editor.navigateLineStart();
                    break;
            }
        }
    }
};
});
"use strict";

define(function(require, exports, module) {
var registers = require("ext/vim/registers");
var ide = require("core/ide");

module.exports = {
    onVisualMode: false,
    onVisualLineMode: false,
    currentMode: 'normal',
    insertMode: function(editor) {
        var _self = this;
        var theme = editor && editor.getTheme() || "ace/theme/textmate";

        ide.dispatchEvent("vim.changeMode", { mode : "insert" });

        require(["require", theme], function (require) {
            var isDarkTheme = require(theme).isDark;

            _self.currentMode = 'insert';
            // Switch editor to insert mode
            editor.unsetStyle('insert-mode');

            var cursor = document.getElementsByClassName("ace_cursor")[0];
            if (cursor) {
                cursor.style.display = null;
                cursor.style.backgroundColor = null;
                cursor.style.opacity = null;
                cursor.style.border = null;
                cursor.style.borderLeftColor = isDarkTheme? "#eeeeee" : "#333333";
                cursor.style.borderLeftStyle = "solid";
                cursor.style.borderLeftWidth = "2px";
            }

            editor.setOverwrite(false);
            editor.keyBinding.$data.buffer = "";
            editor.keyBinding.$data.state = "insertMode";
            _self.onVisualMode = false;
            _self.onVisualLineMode = false;
            if(_self.onInsertReplaySequence) {
                // Ok, we're apparently replaying ("."), so let's do it
                editor.commands.macro = _self.onInsertReplaySequence;
                editor.commands.replay(editor);
                _self.onInsertReplaySequence = null;
                _self.normalMode(editor);
            } else {
                // Record any movements, insertions in insert mode
                if(!editor.commands.recording)
                    editor.commands.toggleRecording();
            }
        });
    },
    normalMode: function(editor) {
        // Switch editor to normal mode
        this.currentMode = 'normal';
        
        ide.dispatchEvent("vim.changeMode", { mode : "normal" });

        editor.setStyle('normal-mode');
        editor.clearSelection();

        var cursor = document.getElementsByClassName("ace_cursor")[0];
        if (cursor) {
            cursor.style.display = null;
            cursor.style.backgroundColor = "red";
            cursor.style.opacity = ".5";
            cursor.style.border = "0";
        }

        var pos;
        if (!editor.getOverwrite()) {
            pos = editor.getCursorPosition();
            if (pos.column > 0)
                editor.navigateLeft();
        }
        editor.setOverwrite(true);
        editor.keyBinding.$data.buffer = "";
        editor.keyBinding.$data.state = "start";
        this.onVisualMode = false;
        this.onVisualLineMode = false;
        // Save recorded keystrokes
        if(editor.commands.recording) {
            editor.commands.toggleRecording();
            return editor.commands.macro;
        }
        else {
            return [];
        }
    },
    getRightNthChar: function(editor, cursor, char, n) {
        var line = editor.getSession().getLine(cursor.row);
        var matches = line.substr(cursor.column + 1).split(char);

        return n < matches.length ? matches.slice(0, n).join(char).length : 0;
    },
    getLeftNthChar: function(editor, cursor, char, n) {
        var line = editor.getSession().getLine(cursor.row);
        var matches = line.substr(0, cursor.column).split(char);

        return n < matches.length ? matches.slice(-1 * n).join(char).length + 2 : 0;
    },
    toRealChar: function(char) {
        if (char.length === 1)
            return char;

        if (/^shift-./.test(char))
            return char[char.length - 1].toUpperCase();
        else
            return "";
    },
    copyLine: function(editor) {
        var pos = editor.getCursorPosition();
        editor.selection.clearSelection();
        editor.moveCursorTo(pos.row, pos.column);
        editor.selection.selectLine();
        registers._default.isLine = true;
        registers._default.text = editor.getCopyText().replace(/\n$/, "");
        editor.selection.clearSelection();
        editor.moveCursorTo(pos.row, pos.column);
    }
};
});
/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var tree = require("ext/tree/tree");

module.exports = ext.register("ext/watcher/watcher", {
    name    : "Watcher",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    markup  : null,
    visible : true,
    deps    : [tree],

    init : function() {
        // console.log("Initializing watcher");

        var removedPaths        = {},
            removedPathCount    = 0,
            changedPaths        = {},
            changedPathCount    = 0,
            expandedPaths       = {},
            _self               = this;

        function sendWatchFile(path) {
            ide.send({
                "command"     : "watcher",
                "type"        : "watchFile",
                "path"        : path.slice(ide.davPrefix.length).replace(/^\//, "")
            });
        }

        function sendUnwatchFile(path) {
            ide.send({
                "command"     : "watcher",
                "type"        : "unwatchFile",
                "path"        : path.slice(ide.davPrefix.length).replace(/^\//, "")
            });
        }

        function checkPage() {
            var page = tabEditors.getPage(),
                data = page.$model.data;
            if (!data || !data.getAttribute)
                return;

            var path = data.getAttribute("path");
            if (removedPaths[path]) {
                util.question(
                    "File removed, keep tab open?",
                    path + " has been deleted, or is no longer available.",
                    "Do you wish to keep the file open in the editor?",
                    function() { // Yes
                        apf.xmldb.setAttribute(data, "changed", "1");
                        delete removedPaths[path];
                        --removedPathCount;
                        winQuestion.hide();
                    },
                    function() { // Yes to all
                        var pages = tabEditors.getPages();

                        pages.forEach(function(page) {
                           apf.xmldb.setAttribute(page.$model.data, "changed", "1");
                        });
                        removedPaths = {};
                        removedPathCount = 0;
                        winQuestion.hide();
                    },
                    function() { // No
                        tabEditors.remove(page);
                        delete removedPaths[path];
                        --removedPathCount;
                        winQuestion.hide();
                    },
                    function() { // No to all
                        var pages = tabEditors.getPages();

                        pages.forEach(function(page) {
                            if (removedPaths[page.$model.data.getAttribute("path")])
                                tabEditors.remove(page);
                        });
                        removedPaths = {};
                        removedPathCount = 0;
                        winQuestion.hide();
                    }
                );
                btnQuestionYesToAll.setAttribute("visible", removedPathCount > 1);
                btnQuestionNoToAll.setAttribute("visible", removedPathCount > 1);
            } else if (changedPaths[path]) {
                util.question(
                    "File changed, reload tab?",
                    path + " has been changed by another application.",
                    "Do you want to reload it?",
                    function() { // Yes
                        ide.dispatchEvent("reload", {doc : page.$doc});
                        delete changedPaths[path];
                        --changedPathCount;
                        winQuestion.hide();
                    },
                    function() { // Yes to all
                        var pages = tabEditors.getPages();

                        pages.forEach(function (page) {
                            if (changedPaths[page.$model.data.getAttribute("path")])
                                ide.dispatchEvent("reload", {doc : page.$doc});
                        });
                        changedPaths = {};
                        changedPathCount = 0;
                        winQuestion.hide();
                    },
                    function() { // No
                        delete changedPaths[path];
                        --changedPathCount;
                        winQuestion.hide();
                    },
                    function() { // No to all
                        changedPaths = {};
                        changedPathCount = 0;
                        winQuestion.hide();
                    }
                );
                btnQuestionYesToAll.setAttribute("visible", changedPathCount > 1);
                btnQuestionNoToAll.setAttribute("visible", changedPathCount > 1);
            }
        }

        stServerConnected.addEventListener("activate", function() {
            if (_self.disabled) return;

            var pages = tabEditors.getPages();
            pages.forEach(function (page) {
                if(page.$model)
                    sendWatchFile(page.$model.data.getAttribute("path"));
            });
            for (var path in expandedPaths)
                sendWatchFile(path);
        });

        ide.addEventListener("openfile", function(e) {
            var path = e.doc.getNode().getAttribute("path");

            // console.log("Opened file " + path);
            sendWatchFile(path);
        });

        ide.addEventListener("closefile", function(e) {
            if (_self.disabled) return;

            var path = e.xmlNode.getAttribute("path");
            sendUnwatchFile(path);
        });

        ide.addEventListener("socketMessage", function(e) {
            if (_self.disabled) return;

            var pages = tabEditors.getPages();
            var message = e.message;
            if ((message.type && message.type != "watcher") || !message.path)
                return;

            var path = ide.davPrefix + message.path.slice(ide.workspaceDir.length);

            if (expandedPaths[path])
                return ide.dispatchEvent("treechange", {
                    path    : path,
                    files   : message.files
                });
            if (!pages.some(function (page) {
                return page.$model.data.getAttribute("path") == path;
            }))
                return;
            switch (message.subtype) {
            case "create":
                break;
            case "remove":
                if (!removedPaths[path]) {
                    removedPaths[path] = path;
                    ++removedPathCount;
                    checkPage();
                    /*
                    ide.dispatchEvent("treeremove", {
                        path : path
                    });
                    */
                }
                break;
            case "change":
                if (!changedPaths[path] &&
                    (new Date(message.lastmod).getTime() != new Date(tabEditors.getPage().$model.queryValue('@modifieddate')).getTime())) {
                    changedPaths[path] = path;
                    ++changedPathCount;
                    checkPage();
                }
                break;
            }
        });

        tabEditors.addEventListener("afterswitch", function(e) {
            if (_self.disabled) return;

            checkPage();
        });

        ide.addEventListener("init.ext/tree/tree", function(){
            trFiles.addEventListener("expand", function(e) {
                if (_self.disabled) return;

                var node = e.xmlNode;
                if (node && (node.getAttribute("type") == "folder" || node.tagName == "folder")) {
                    var path = node.getAttribute("path");

                    expandedPaths[path] = path;
                    sendWatchFile(path);
                }
            });

            trFiles.addEventListener("collapse", function (e) {
                if (_self.disabled) return;

                var node = e.xmlNode;
                if (node && (node.getAttribute("type") == "folder" || node.tagName == "folder")) {
                    var path = node.getAttribute("path");

                    delete expandedPaths[path];
                    sendUnwatchFile(path);
                }
            });
        });
    },

    enable : function(){
        this.disabled = false;

        //@todo add code here to set watchers again based on the current state
    },

    disable : function(){
        this.disabled = true;
    },

    destroy : function(){

    }
});

});
define(function(require, exports, module) {
FirminCSSMatrix=function(c){this.m11=this.m22=this.m33=this.m44=1;this.m12=this.m13=this.m14=this.m21=this.m23=this.m24=this.m31=this.m32=this.m34=this.m41=this.m42=this.m43=0;if(typeof c=="string"){this.setMatrixValue(c)}};FirminCSSMatrix.displayName="FirminCSSMatrix";FirminCSSMatrix.degreesToRadians=function(c){return c*Math.PI/180};FirminCSSMatrix.determinant2x2=function(c,b,a,d){return c*d-b*a};FirminCSSMatrix.determinant3x3=function(c,b,a,d,e,j,f,g,h){var i=FirminCSSMatrix.determinant2x2;return c*i(e,j,g,h)-d*i(b,a,g,h)+f*i(b,a,e,j)};FirminCSSMatrix.determinant4x4=function(c){var b=FirminCSSMatrix.determinant3x3,a=c.m11,d=c.m21,e=c.m31,j=c.m41,f=c.m12,g=c.m22,h=c.m32,i=c.m42,k=c.m13,l=c.m23,m=c.m33,n=c.m43,o=c.m14,p=c.m24,q=c.m34,r=c.m44;return a*b(g,l,p,h,m,q,i,n,r)-d*b(f,k,o,h,m,q,i,n,r)+e*b(f,k,o,g,l,p,i,n,r)-j*b(f,k,o,g,l,p,h,m,q)};[["m11","a"],["m12","b"],["m21","c"],["m22","d"],["m41","e"],["m42","f"]].forEach(function(b){var a=b[0],d=b[1];Object.defineProperty(FirminCSSMatrix.prototype,d,{set:function(c){this[a]=c},get:function(){return this[a]}})});FirminCSSMatrix.prototype.isAffine=function(){return this.m13===0&&this.m14===0&&this.m23===0&&this.m24===0&&this.m31===0&&this.m32===0&&this.m33===1&&this.m34===0&&this.m43===0&&this.m44===1};FirminCSSMatrix.prototype.multiply=function(c){var b=this,a=c,d=new FirminCSSMatrix();d.m11=b.m11*a.m11+b.m12*a.m21+b.m13*a.m31+b.m14*a.m41;d.m12=b.m11*a.m12+b.m12*a.m22+b.m13*a.m32+b.m14*a.m42;d.m13=b.m11*a.m13+b.m12*a.m23+b.m13*a.m33+b.m14*a.m43;d.m14=b.m11*a.m14+b.m12*a.m24+b.m13*a.m34+b.m14*a.m44;d.m21=b.m21*a.m11+b.m22*a.m21+b.m23*a.m31+b.m24*a.m41;d.m22=b.m21*a.m12+b.m22*a.m22+b.m23*a.m32+b.m24*a.m42;d.m23=b.m21*a.m13+b.m22*a.m23+b.m23*a.m33+b.m24*a.m43;d.m24=b.m21*a.m14+b.m22*a.m24+b.m23*a.m34+b.m24*a.m44;d.m31=b.m31*a.m11+b.m32*a.m21+b.m33*a.m31+b.m34*a.m41;d.m32=b.m31*a.m12+b.m32*a.m22+b.m33*a.m32+b.m34*a.m42;d.m33=b.m31*a.m13+b.m32*a.m23+b.m33*a.m33+b.m34*a.m43;d.m34=b.m31*a.m14+b.m32*a.m24+b.m33*a.m34+b.m34*a.m44;d.m41=b.m41*a.m11+b.m42*a.m21+b.m43*a.m31+b.m44*a.m41;d.m42=b.m41*a.m12+b.m42*a.m22+b.m43*a.m32+b.m44*a.m42;d.m43=b.m41*a.m13+b.m42*a.m23+b.m43*a.m33+b.m44*a.m43;d.m44=b.m41*a.m14+b.m42*a.m24+b.m43*a.m34+b.m44*a.m44;return d};FirminCSSMatrix.prototype.isIdentityOrTranslation=function(){var c=this;return c.m11===1&&c.m12===0&&c.m13===0&&c.m14===0&&c.m21===0&&c.m22===1&&c.m23===0&&c.m24===0&&c.m31===0&&c.m31===0&&c.m33===1&&c.m34===0&&c.m44===1};FirminCSSMatrix.prototype.adjoint=function(){var c=new FirminCSSMatrix(),b=this,a=FirminCSSMatrix.determinant3x3,d=b.m11,e=b.m12,j=b.m13,f=b.m14,g=b.m21,h=b.m22,i=b.m23,k=b.m24,l=b.m31,m=b.m32,n=b.m33,o=b.m34,p=b.m41,q=b.m42,r=b.m43,s=b.m44;c.m11=a(h,m,q,i,n,r,k,o,s);c.m21=-a(g,l,p,i,n,r,k,o,s);c.m31=a(g,l,p,h,m,q,k,o,s);c.m41=-a(g,l,p,h,m,q,i,n,r);c.m12=-a(e,m,q,j,n,r,f,o,s);c.m22=a(d,l,p,j,n,r,f,o,s);c.m32=-a(d,l,p,e,m,q,f,o,s);c.m42=a(d,l,p,e,m,q,j,n,r);c.m13=a(e,h,q,j,i,r,f,k,s);c.m23=-a(d,g,p,j,i,r,f,k,s);c.m33=a(d,g,p,e,h,q,f,k,s);c.m43=-a(d,g,p,e,h,q,j,i,r);c.m14=-a(e,h,m,j,i,n,f,k,o);c.m24=a(d,g,l,j,i,n,f,k,o);c.m34=-a(d,g,l,e,h,m,f,k,o);c.m44=a(d,g,l,e,h,m,j,i,n);return c};FirminCSSMatrix.prototype.inverse=function(){var c,b,a,d,e;if(this.isIdentityOrTranslation()){c=new FirminCSSMatrix();if(!(this.m41===0&&this.m42===0&&this.m43===0)){c.m41=-this.m41;c.m42=-this.m42;c.m43=-this.m43}return c}a=this.adjoint();b=FirminCSSMatrix.determinant4x4(this);if(Math.abs(b)<1e-8)return null;for(d=1;d<5;d++){for(e=1;e<5;e++){a[("m"+d)+e]/=b}}return a};FirminCSSMatrix.prototype.rotate=function(c,b,a){var d=FirminCSSMatrix.degreesToRadians;if(typeof c!="number"||isNaN(c))c=0;if((typeof b!="number"||isNaN(b))&&(typeof a!="number"||isNaN(a))){a=c;c=0;b=0}if(typeof b!="number"||isNaN(b))b=0;if(typeof a!="number"||isNaN(a))a=0;c=d(c);b=d(b);a=d(a);var e=new FirminCSSMatrix(),j=new FirminCSSMatrix(),f=new FirminCSSMatrix(),g,h,i;a/=2;g=Math.sin(a);h=Math.cos(a);i=g*g;f.m11=f.m22=1-2*i;f.m12=f.m21=2*g*h;f.m21*=-1;b/=2;g=Math.sin(b);h=Math.cos(b);i=g*g;j.m11=j.m33=1-2*i;j.m13=j.m31=2*g*h;j.m13*=-1;c/=2;g=Math.sin(c);h=Math.cos(c);i=g*g;e.m22=e.m33=1-2*i;e.m23=e.m32=2*g*h;e.m32*=-1;return f.multiply(j).multiply(e).multiply(this)};FirminCSSMatrix.prototype.rotateAxisAngle=function(c,b,a,d){if(typeof c!="number"||isNaN(c))c=0;if(typeof b!="number"||isNaN(b))b=0;if(typeof a!="number"||isNaN(a))a=0;if(typeof d!="number"||isNaN(d))d=0;if(c===0&&b===0&&a===0)a=1;var e=new FirminCSSMatrix(),j=Math.sqrt(c*c+b*b+a*a),f,g,h,i,k,l,m;d=(FirminCSSMatrix.degreesToRadians(d)||0)/2;f=Math.cos(d);g=Math.sin(d);h=g*g;if(j===0){c=0;b=0;a=1}else if(j!==1){c/=j;b/=j;a/=j}if(c===1&&b===0&&a===0){e.m22=e.m33=1-2*h;e.m23=e.m32=2*f*g;e.m32*=-1}else if(c===0&&b===1&&a===0){e.m11=e.m33=1-2*h;e.m13=e.m31=2*f*g;e.m13*=-1}else if(c===0&&b===0&&a===1){e.m11=e.m22=1-2*h;e.m12=e.m21=2*f*g;e.m21*=-1}else{i=g*f;k=c*c;l=b*b;m=a*a;e.m11=1-2*(l+m)*h;e.m12=2*(c*b*h+a*i);e.m13=2*(c*a*h-b*i);e.m21=2*(b*c*h-a*i);e.m22=1-2*(m+k)*h;e.m23=2*(b*a*h+c*i);e.m31=2*(a*c*h+b*i);e.m32=2*(a*b*h-c*i);e.m33=1-2*(k+l)*h}return this.multiply(e)};FirminCSSMatrix.prototype.scale=function(c,b,a){var d=new FirminCSSMatrix();if(typeof c!="number"||isNaN(c))c=1;if(typeof b!="number"||isNaN(b))b=c;if(typeof a!="number"||isNaN(a))a=1;d.m11=c;d.m22=b;d.m33=a;return this.multiply(d)};FirminCSSMatrix.prototype.translate=function(c,b,a){var d=new FirminCSSMatrix();if(typeof c!="number"||isNaN(c))c=0;if(typeof b!="number"||isNaN(b))b=0;if(typeof a!="number"||isNaN(a))a=0;d.m41=c;d.m42=b;d.m43=a;return this.multiply(d)};FirminCSSMatrix.prototype.setMatrixValue=function(c){c=c.trim();var b=c.match(/^matrix(3d)?\(\s*(.+)\s*\)$/),a,d,e,j,f,g;if(!b)return;a=!!b[1];d=b[2].split(/\s*,\s*/);e=d.length;j=new Array(e);if((a&&e!==16)||!(a||e===6))return;for(f=0;f<e;f++){g=d[f];if(g.match(/^-?\d+(\.\d+)?$/)){j[f]=parseFloat(g)}else return}for(f=0;f<e;f++){point=a?("m"+(Math.floor(f/4)+1))+(f%4+1):String.fromCharCode(f+97);this[point]=j[f]}};FirminCSSMatrix.prototype.toString=function(){var b=this,a,d;if(this.isAffine()){d="matrix(";a=["a","b","c","d","e","f"]}else{d="matrix3d(";a=["m11","m12","m13","m14","m21","m22","m23","m24","m31","m32","m33","m34","m41","m42","m43","m44"]}return d+a.map(function(c){return b[c].toFixed(6)}).join(", ")+")"};
Firmin=(typeof Firmin=='undefined')?{}:Firmin;Firmin.CSSMatrix=(typeof WebKitCSSMatrix=='object')?WebKitCSSMatrix:FirminCSSMatrix;Firmin.prefix=(function(){var a=document.createElement("div"),b=["webkit","Moz","O"],c=3,d;while(c--){d=b[c];a.style.cssText="-"+d.toLowerCase()+"-transition-property:opacity;";if(typeof a.style[d+"TransitionProperty"]!="undefined")return d}return d})();Firmin.matrixToString=function(d){if(Firmin.prefix!="Moz")return d.toString();var e="matrix(",f=["a","b","c","d","e","f"];return e+f.map(function(a,b){var c=d[a].toFixed(6);if(b>3)c+="px";return c}).join(", ")+")"};Firmin.angleToRadians=function(a,b){var c;switch(a){case"rad":return b;case"deg":c=Math.PI/180;break;case"grad":c=Math.PI/200;break;case"turn":c=Math.PI*2;break}return c*b};Firmin.pointToVector=function(a){if(!a)return null;return a instanceof Array?a:[a.x,a.y,a.z]};Firmin.NUMBER_PATTERN=/^-?\d+(\.\d+)?/;Firmin.parseNumeric=function(e,f){return function(b){var c,d;if(typeof b=="number"){return[f,b]}else if(typeof b!="string"){return null}d=(b.match(Firmin.NUMBER_PATTERN)||[""])[0];if(d.length===b.length){c=f}else{c=e.filter(function(a){return b.substr(d.length)===a})[0]}return c&&d?[c,parseFloat(d)]:null}};Firmin.parseAngle=Firmin.parseNumeric(["deg","grad","rad","turn"],"deg");Firmin.parseTime=Firmin.parseNumeric(["s","ms"],"s");Firmin.Transform=function(a,b){this.ctm=a||new Firmin.CSSMatrix();this.centre=Firmin.pointToVector(b)||["50%","50%",0]};Firmin.Transform.methods=["translate","translate3d","translateX","translateY","translateZ","scale","scale3d","scaleX","scaleY","scaleZ","rotate","rotate3d","rotateX","rotateY","rotateZ","skew","skewX","skewY","matrix","matrix3d"];Firmin.Transform.parse=function(a,b){var c=Firmin.Transform.methods,d={},e=null,f,g;if(typeof b==="object"&&b.transform){f=b.transform.ctm;g=b.transform.centre;e=new Firmin.Transform(f,g)}for(property in a){if(c.indexOf(property)!==-1){e=e||new Firmin.Transform();e[property](a[property])}else if(property==="origin"){e=e||new Firmin.Transform();e[property](a[property])}else{d[property]=a[property]}}return{result:e,remainder:d}};Firmin.Transform.prototype.build=function(a){var b=this.centre;if(Firmin.prefix=="O"){b=b.slice(0,2)}a=a||{};a[Firmin.prefix+"Transform"]=Firmin.matrixToString(this.ctm);a[Firmin.prefix+"TransformOrigin"]=b.join(" ");return a};Firmin.Transform.prototype.matrix=Firmin.Transform.prototype.matrix3d=function(a){var b=new Firmin.CSSMatrix();if(a.length===6){b.a=a[0];b.b=a[1];b.c=a[2];b.d=a[3];b.e=a[4];b.f=a[5]}else{b.m11=a[0];b.m12=a[1];b.m13=a[2];b.m14=a[3];b.m21=a[4];b.m22=a[5];b.m23=a[6];b.m24=a[7];b.m31=a[8];b.m32=a[9];b.m33=a[10];b.m34=a[11];b.m41=a[12];b.m42=a[13];b.m43=a[14];b.m44=a[15]}this.ctm=this.ctm.multiply(b)};Firmin.Transform.prototype.translate=Firmin.Transform.prototype.translate3d=function(a){var b,c,d,e;if(typeof a=="number"||typeof a=="string"){c=d=parseInt(a,10)||0;e=0}else{b=Firmin.pointToVector(a);c=b[0];d=b[1];e=b[2];if(typeof c!="number")c=parseInt(c,10)||0;if(typeof d!="number")d=parseInt(d,10)||0;if(typeof e!="number")e=parseInt(e,10)||0}this.ctm=this.ctm.translate(c,d,e)};Firmin.Transform.prototype.translateX=function(a){this.translate([a,0])};Firmin.Transform.prototype.translateY=function(a){this.translate([0,a])};Firmin.Transform.prototype.translateZ=function(a){this.translate3d([0,0,a])};Firmin.Transform.prototype.scale=Firmin.Transform.prototype.scale3d=function(a){var b,c,d,e;if(typeof a=="number"){c=d=a;e=1}else{b=Firmin.pointToVector(a);c=b[0];d=b[1];e=b[2]}this.ctm=this.ctm.scale(c,d,e)};Firmin.Transform.prototype.scaleX=function(a){this.scale3d([a,1,1])};Firmin.Transform.prototype.scaleY=function(a){this.scale3d([1,a,1])};Firmin.Transform.prototype.scaleZ=function(a){this.scale3d([1,1,a])};Firmin.Transform.prototype.skew=function(a){var b=Firmin.parseAngle,c=Firmin.angleToRadians,d,e;if(typeof a=="number"||typeof a=="string"){d=e=c.apply(null,b(a))||0}else{a=Firmin.pointToVector(a);d=c.apply(null,b(a[0]))||0;e=c.apply(null,b(a[1]))||0}this.matrix([1,Math.tan(e),Math.tan(d),1,0,0])};Firmin.Transform.prototype.skewX=function(a){this.skew([a,0])};Firmin.Transform.prototype.skewY=function(a){this.skew([0,a])};Firmin.Transform.prototype.rotate=function(a){a=Firmin.angleToRadians.apply(null,Firmin.parseAngle(a))*(180/Math.PI);this.ctm=this.ctm.rotate(0,0,a)};Firmin.Transform.prototype.rotate3d=function(a){var b=a.x,c=a.y,d=a.z,e=a.angle;if(typeof b!="number")b=0;if(typeof c!="number")c=0;if(typeof d!="number")d=0;e=Firmin.angleToRadians.apply(null,Firmin.parseAngle(e))*(180/Math.PI);this.ctm=this.ctm.rotateAxisAngle(b,c,d,e)};Firmin.Transform.prototype.rotateX=function(a){this.rotate3d({x:1,angle:a})};Firmin.Transform.prototype.rotateY=function(a){this.rotate3d({y:1,angle:a})};Firmin.Transform.prototype.rotateZ=function(a){this.rotate3d({z:1,angle:a})};Firmin.Transform.prototype.origin=function(a){var b=Firmin.pointToVector(a),c,d,e;if((v0=b[0]))this.centre[0]=v0;if((c=b[1]))this.centre[1]=c;if((d=b[2]))this.centre[2]=d};Firmin.Transition=function(){this.properties=["all"];this.duration=["ms",0];this.delay=["ms",0];this.timingFunction="ease"};Firmin.Transition.methods=["properties","timingFunction","duration","delay"];Firmin.Transition.parse=function(a,b){var c=Firmin.Transition.methods,d={},e=new Firmin.Transition(),f,g;for(p in a){if(c.indexOf(p)!==-1){if(p==="properties"&&typeof p=="string"){e[p]=[a[p]]}else if(p==="timingFunction"&&typeof a[p]!="string"){e[p]="cubic-bezier("+a[p].join(",")+")"}else if(p==="duration"){f=Firmin.parseTime(a[p]);if(f){e[p]=f}}else if(p==="delay"){g=Firmin.parseTime(a[p]);if(g){e[p]=g}}else{e[p]=a[p]}}else{d[p]=a[p]}}return{result:e,remainder:d}};Firmin.Transition.prototype.hasDuration=function(){return this.duration[1]!==0};Firmin.Transition.prototype.getDuration=function(){var a=this.duration;return a[0]==="s"?a[1]*1000:a[1]};Firmin.Transition.prototype.hasDelay=function(){return this.delay[1]!==0};Firmin.Transition.prototype.getDelay=function(){var a=this.delay;return a[0]==="s"?a[1]*1000:a[1]};Firmin.Transition.prototype.build=function(a){a=a||{};if(typeof this.properties=="string"){a[Firmin.prefix+"TransitionProperty"]=this.properties}else{a[Firmin.prefix+"TransitionProperty"]=this.properties.join(", ")}a[Firmin.prefix+"TransitionDuration"]=this.duration[1]+this.duration[0];a[Firmin.prefix+"TransitionDelay"]=this.delay[1]+this.delay[0];if(this.timingFunction){a[Firmin.prefix+"TransitionTimingFunction"]=this.timingFunction}return a};Firmin.Animation=function(a,b){var c,d;if(typeof a.callback=="function"){this.callback=a.callback}delete a.callback;c=Firmin.Transition.parse(a,b);this.transition=c.result;d=Firmin.Transform.parse(c.remainder,b);this.transform=d.result;this.style=d.remainder};Firmin.Animation.prototype.hasDuration=function(){return this.transition&&this.transition.hasDuration()};Firmin.Animation.prototype.getTotalDuration=function(){return this.transition?this.transition.getDuration()+this.transition.getDelay():0};Firmin.Animation.prototype.exec=function(a){var b=this.style,c;if(this.transition)b=this.transition.build(b);if(this.transform)b=this.transform.build(b);for(c in b){a.style[c]=b[c]}};Firmin.Animated=function(a){var b=this;this.element=a;this.operations=[];this.callback=null};Firmin.Animated.prototype.run=function(){var a=this.operations.shift(),b=this;if(!a){this.fired=true;return this}setTimeout(function(){a.exec(b.element)},10);setTimeout(function(){b.fireCallback();b.run()},a.getTotalDuration()||10);this.callback=a.callback;return this};Firmin.Animated.prototype.fireCallback=function(){var a=this.callback;if(typeof a==="function"){a.call(null,this.element)}};Firmin.Animated.prototype.__animate__=function(a){this.operations.push(a);this.__lastAnim=a;if(this.fired){this.fired=false;this.run()}return this};Firmin.Animated.prototype.animate=function(a,b,c){a.duration=b;a.callback=c;return this.__animate__(new Firmin.Animation(a))};Firmin.Animated.prototype.animateR=function(a,b,c){a.duration=b;a.callback=c;return this.__animate__(new Firmin.Animation(a,this.__lastAnim))};Firmin.animate=function(a,b,c,d){var e=new Firmin.Animated(a);e.animate(b,c,d);return e.run()};Firmin.animateR=function(a,b,c,d){var e=new Firmin.Animated(a),f=new Firmin.Animation({}),g=new Firmin.Transform(),h=new Firmin.CSSMatrix(),i=a.style[Firmin.prefix+"Transform"];h.setMatrixValue(i);g.ctm=h;f.transform=g;e.__lastAnim=f;e.animateR(b,c,d);return e.run()};Firmin.Transform.methods.forEach(function(f){var g=f+"R";Firmin[f]=function(a,b,c,d){var e={};e[f]=b;return Firmin.animate(a,e,c,d)};Firmin[g]=function(a,b,c,d){var e={};e[f]=b;return Firmin.animateR(a,e,c,d)};Firmin.Animated.prototype[f]=function(a,b,c){var d={};d[f]=a;return this.animate(d,b,c)};Firmin.Animated.prototype[g]=function(a,b,c){var d={};d[f]=a;return this.animateR(d,b,c)}});
});/**
 * Zen mode
 *
 * @TODO
 * - Disabling the extension doesn't call the disable() function
 * - Exit zen mode when doing any keybinding operation (except openfiles, quicksearch, gotoline)
 * - While animating, disable ability to toggle zen mode (better: cancel and reverse the operation)
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

require("ext/zen/firmin-all-min");

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var settings = require("ext/settings/settings");
var markup = require("text!ext/zen/zen.xml");
var skin = require("text!ext/zen/skin.xml");

module.exports = ext.register("ext/zen/zen", {
    name     : "Zen mode",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    skin     : {
        id   : "zen",
        data : skin,
        "media-path" : ide.staticPrefix + "/style/images/",
        "icon-path"  : ide.staticPrefix + "/style/icons/"
    },
    isFocused : false,
    neverShown : true,

    defaultOffset : 11,
    offsetWidth : 11,
    initialWidth : 0.70,

    handleLeftMove : false,
    handleRightMove : false,

    commands : {
        "zen": {hint: "toggle zen mode"},
        "zenslow": {hint: "toggle zen mode in slow-motion"}
    },

    nodes : [],

    hook : function(){
        var _self = this;
        ide.addEventListener("openfile", function() {
            if (_self.neverShown) {
                setTimeout(function() {
                    ext.initExtension(_self);
                }, 1000);
                _self.neverShown = false;
            }
        });

        ide.addEventListener("loadsettings", function(e){
            var strSettings = e.model.queryValue("auto/zen");
            if (strSettings)
                _self.initialWidth = strSettings;
        });

        ide.addEventListener("savesettings", function(e){
            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/zen/text()");
            xmlSettings.nodeValue = _self.initialWidth;
            return true;
        });

        ide.addEventListener("minimap.visibility", function(e) {
            if (e.visibility === "shown")
                _self.offsetWidth = _self.defaultOffset + e.width;
            else
                _self.offsetWidth = _self.defaultOffset;

            _self.updateButtonPosition();
        });
    },

    init : function(amlNode){
        // Create all the elements used here
        this.animateZen = document.createElement("div");
        this.animateZen.setAttribute("id", "animateZen");
        this.animateZen.setAttribute("style", "display: none");
        document.body.appendChild(this.animateZen);

        this.animateZenPosition = document.createElement("div");
        this.animateZenPosition.setAttribute("id", "animateZenPosition");
        this.animateZenPosition.setAttribute("style", "display: none");
        document.body.appendChild(this.animateZenPosition);

        this.zenHandleLeft = document.createElement("div");
        this.zenHandleLeft.setAttribute("id", "zenHandleLeft");
        this.zenHandleLeft.setAttribute("style", "opacity: 0.0");
        document.body.appendChild(this.zenHandleLeft);

        this.zenHandleRight = document.createElement("div");
        this.zenHandleRight.setAttribute("id", "zenHandleRight");
        this.zenHandleRight.setAttribute("style", "opacity: 0.0");
        document.body.appendChild(this.zenHandleRight);

        this.setupHandleListeners();

        var editor = editors.currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.parentNode.appendChild(btnZenFullscreen);

        vbMain.parentNode.appendChild(new apf.vbox({
            anchors: "0 0 0 0",
            id: "vbZen",
            "class": "vbZen",
            visible: false
        }));

        setTimeout(function() {
            _self.updateButtonPosition();
        });

        this.animateZen = document.getElementById("animateZen");
        this.animateZenPosition = document.getElementById("animateZenPosition");

        var _self = this;
        vbZen.addEventListener("resize", function(e) {
            if (_self.isFocused) {
                _self.calculatePositions();
            }
        });
    },

    updateButtonPosition : function() {
        if (!window["btnZenFullscreen"])
            return;

        // Extra safe default width
        var sbWidth = 20;
        if (ceEditor && ceEditor.$editor)
            sbWidth = ceEditor.$editor.renderer.scrollBar.width;

        btnZenFullscreen.setAttribute("right", sbWidth + this.offsetWidth);
    },

    calculatePositions : function() {
        // Calculate the position
        var _self = this;
        var height = (window.innerHeight-32) + "px";
        tabEditors.parentNode.$ext.style.height = height;
        _self.animateZen.style.height = window.innerHeight + "px";
        var width = window.innerWidth * _self.initialWidth;
        var widthDiff = (window.innerWidth - width) / 2;
        tabEditors.parentNode.$ext.style.width = _self.animateZen.style.width = width + "px";
        _self.animateZen.style.left = widthDiff + "px";

        // Set the resize handle positions
        _self.zenHandleLeft.style.height = window.innerHeight + "px";
        _self.zenHandleLeft.style.left = (widthDiff+0) + "px";
        _self.zenHandleRight.style.height = window.innerHeight + "px";
        _self.zenHandleRight.style.left = ((widthDiff + width) - 5) + "px";
    },

    // @TODO implement removeListeners
    setupHandleListeners : function() {
        var _self = this;

        apf.addListener(this.zenHandleLeft, "mousedown", function(e) {
            _self.browserWidth = window.innerWidth;
            _self.handleLeftMove = true;
        });

        apf.addListener(this.zenHandleRight, "mousedown", function(e) {
            _self.browserWidth = window.innerWidth;
            _self.handleRightMove = true;
        });

        apf.addListener(document, "mousemove", function(e) {
            if (_self.isFocused) {
                // Now resize those love handles!
                function afterCalculation() {
                    if (_self.initialWidth < 0.4)
                        _self.initialWidth = 0.4;
                    else if (_self.initialWidth > 0.95)
                        _self.initialWidth = 1.0;
                    _self.calculatePositions();
                    apf.layout.forceResize(tabEditors.parentNode.$ext);
                }
                if (_self.handleLeftMove) {
                    _self.initialWidth = 1.0 - ((e.clientX * 2)/_self.browserWidth);
                    afterCalculation();
                }
                else if (_self.handleRightMove) {
                    var fakeLeftCalc = _self.browserWidth - e.clientX;
                    _self.initialWidth = 1.0 - ((fakeLeftCalc * 2)/_self.browserWidth);
                    afterCalculation();
                }
            }
        });

        apf.addListener(document, "mouseup", function() {
            if (!_self.isFocused)
                return;

            if (_self.handleLeftMove || _self.handleRightMove)
                settings.save();
            _self.handleLeftMove = false;
            _self.handleRightMove = false;
            apf.layout.forceResize();
        });
    },

    /**
     * Method attached to key combination (Cmd/Ctrl + E)
     */
    zen : function() {
        this.toggleFullscreenZen();
    },

    /**
     * Method attached to key combo for slow mode (Shift)
     */
    zenslow : function() {
        this.toggleFullscreenZen({ htmlEvent : { shiftKey : true }});
    },

    /**
     * Method invoked to do the actual toggling of zen mode
     * Detects if zened or not
     *
     * @param {amlEvent} e Event from click
     */
    toggleFullscreenZen : function(e) {
        var shiftKey = false;
        if (e)
            shiftKey = e.htmlEvent.shiftKey;

        if (this.isFocused)
            this.escapeFromZenMode(shiftKey);
        else
            this.enterIntoZenMode(shiftKey);
    },

    /**
     * Checks if the current browser supports fancy shmancy animations
     *
     * @return {boolean} true if supported, false otherwise
     */
    checkBrowserCssTransforms : function() {
        var isWebkitCapable = apf.isWebkit && (apf.versionSafari >= 3.1 || apf.versionChrome >= 11);
        var isGeckoCapable = apf.isGecko && apf.versionGecko >= 4;
        var isOperaCapable = apf.isOpera && apf.versionOpera >= 10;
        return isWebkitCapable || isGeckoCapable || isOperaCapable;
    },

    /**
     * Enters the editor into fullscreen/zen mode
     *
     * @param {boolean} slow Whether to slow down the animation
     */
    enterIntoZenMode : function(slow) {
        var _self = this;

        this.saveTabEditorsParentStyles();
        if (self.btnZenFullscreen)
            btnZenFullscreen.setAttribute("class", "full");

        // Calculates the destination position and dimensions of
        // the animated container
        var browserWidth = window.innerWidth;
        var afWidth = browserWidth * this.initialWidth;
        var leftOffset = (browserWidth-afWidth)/2 + "px";
        var afHeight = window.innerHeight + "px";

        // Do fancy animation
        if (this.checkBrowserCssTransforms()) {
            this.matchAnimationWindowPosition();
            this.setAceThemeBackground();

            editors.disableTabResizeEvent();
            this.placeTabIntoAnimationWindow();

            Firmin.animate(this.animateZen, {
                height: afHeight,
                left: leftOffset,
                top: "0",
                width: afWidth + "px",
                timingFunction: "ease-in-out"
            }, slow ? 3.7 : 0.7, function() {

                _self.isFocused = true;

                // Frustratingly, Firmin does not remove the csstransform attributes
                // after the animation is complete, so we must do it ourselves
                var astyles = "display:block;top:0;height:" + afHeight + ";left:" + leftOffset + ";width:" + afWidth + "px";
                _self.animateZen.setAttribute("style", astyles);

                apf.layout.forceResize();

                Firmin.animate(_self.zenHandleLeft, {
                    opacity : 1.0,
                    timingFunction: "ease-in-out"
                }, 0.7).animate({
                    opacity : 0.0
                }, 0.5);

                Firmin.animate(_self.zenHandleRight, {
                    opacity : 1.0,
                    timingFunction: "ease-in-out"
                }, 0.7).animate({
                    opacity : 0.0
                }, 0.5);

                setTimeout(function() {
                    if (self.ceEditor)
                        ceEditor.focus();
                    apf.layout.forceResize(tabEditors.parentNode.$ext);
                }, 100);
            });

            vbZen.show();
            Firmin.animate(vbZen.$ext, {
                opacity: "1"
            }, slow ? 3.5 : 0.5);
        }

        else {
            this.isFocused = true;
            vbZen.show();
            vbZen.$ext.style.opacity = "1";

            editors.disableTabResizeEvent();
            this.placeTabIntoAnimationWindow();
            this.animateZen.style.display = "block";

            var astyles = "display:block;top:0;height:" + afHeight + ";left:" + leftOffset + ";width:" + afWidth + "px";
            this.animateZen.setAttribute("style", astyles);

            _self.zenHandleLeft.style.opacity = "1.0";
            _self.zenHandleRight.style.opacity = "1.0";

            setTimeout(function() {
                apf.tween.single(_self.zenHandleLeft, {
                    type     : "opacity",
                    anim     : apf.tween.easeInOutCubic,
                    from     : 1.0,
                    to       : 0.0,
                    steps    : 8,
                    interval : 20,
                    control  : (this.control = {}),
                    onfinish : function(){
                    }
                });
                apf.tween.single(_self.zenHandleRight, {
                    type     : "opacity",
                    anim     : apf.tween.easeInOutCubic,
                    from     : 1.0,
                    to       : 0.0,
                    steps    : 8,
                    interval : 20,
                    control  : (this.control = {}),
                    onfinish : function(){
                    }
                });
            }, 700);
            apf.layout.forceResize();

            setTimeout(function() {
                ceEditor.focus();
            }, 100);
        }
    },

    /**
     * Returns the editor to its original, non-zen,
     * non-fullscreen state
     *
     * @param {boolean} slow Whether to slow down the animation
     */
    escapeFromZenMode : function(slow) {
        var _self = this;

        btnZenFullscreen.setAttribute("class", "notfull");
        this.isFocused = false;

        this.zenHandleLeft.style.opacity = "0.0";
        this.zenHandleRight.style.opacity = "0.0";

        tabEditors.parentNode.$ext.style.width = "100%";

        if (this.checkBrowserCssTransforms()) {
            // Get the destination values
            editors.setTabResizeValues(this.animateZenPosition);
            var left = this.animateZenPosition.style.left;
            var top = this.animateZenPosition.style.top;
            var width = this.animateZenPosition.style.width;
            var height = this.animateZenPosition.style.height;

            // Set the width to its actual width instead of "85%"
            var afWidth = apf.getHtmlInnerWidth(this.animateZen);
            this.animateZen.style.width = afWidth + "px";
            var afHeight = apf.getHtmlInnerHeight(this.animateZen);
            this.animateZen.style.height = afHeight + "px";

            Firmin.animate(this.animateZen, {
                height: height,
                width: width,
                left: left,
                top: top,
                timingFunction: "ease-in-out"
            }, slow ? 3.7 : 0.7, function() {
                _self.animateZen.style.display = "none";
                // Reset values
                _self.resetTabEditorsParentStyles();

                apf.document.body.appendChild(tabEditors.parentNode);

                editors.enableTabResizeEvent();
                apf.layout.forceResize(tabEditors.parentNode.$ext);

                tabEditors.parentNode.$ext.style.position = "absolute";

                setTimeout(function() {
                    if (self.ceEditor)
                        ceEditor.focus();
                    apf.layout.forceResize(tabEditors.parentNode.$ext);
                }, 100);
            });

            Firmin.animate(vbZen.$ext, {
                opacity: "0"
            }, slow ? 3.5 : 0.5, function() {
                vbZen.hide();
            });
        }
        else {
            this.resetTabEditorsParentStyles();

            apf.document.body.appendChild(tabEditors.parentNode);

            editors.enableTabResizeEvent();
            this.animateZen.style.display = "none";
            vbZen.$ext.style.opacity = "0";
            vbZen.hide();

            tabEditors.parentNode.$ext.style.position = "absolute";

            apf.layout.forceResize();
            setTimeout(function() {
                ceEditor.focus();
            }, 100);
        }

    },

    /**
     * Retrieves and saves the styles of tabEditors.parentNode
     * so that when we reset the position of it back to unzen mode,
     * all those position details remain intact
     */
    saveTabEditorsParentStyles : function() {
        this.teMarginLeft = tabEditors.parentNode.$ext.style.marginLeft;
        this.teMarginRight = tabEditors.parentNode.$ext.style.marginRight;
        this.teLeft = tabEditors.parentNode.$ext.style.left;
        this.teTop = tabEditors.parentNode.$ext.style.top;
    },

    /**
     * Resets the position and style properties of tabEditors.parent
     * to what they were when we saved them in #this.saveTabEditorsParentStyles
     */
    resetTabEditorsParentStyles : function() {
        tabEditors.parentNode.$ext.style.marginLeft = this.teMarginLeft;
        tabEditors.parentNode.$ext.style.marginRight = this.teMarginRight;
        tabEditors.parentNode.$ext.style.left = this.teLeft;
        tabEditors.parentNode.$ext.style.top = this.teTop;
    },

    /**
     * Gets the position and dimensions of tabEditors.parentNode
     * and applies those values to the window that temporarily
     * holds tabEditors.parentNode during the animation
     */
    matchAnimationWindowPosition : function() {
        var tePos = apf.getAbsolutePosition(tabEditors.parentNode.$ext);
        var teWidth = tabEditors.parentNode.getWidth();
        var teHeight = tabEditors.parentNode.getHeight();

        this.animateZen.style.left = tePos[0] + "px";
        this.animateZen.style.top = tePos[1] + "px";
        this.animateZen.style.width = teWidth + "px";
        this.animateZen.style.height = teHeight + "px";
        this.animateZen.style.display = "block";
    },

    /**
     * Gets the class selectors from the ace_editor element and
     * gets the corresponding bg color for the theme. Then it
     * applies that bg color to the scroller element
     *
     * Otherwise the default background color is grayish and the
     * animation exposes that bg color - making it look bad
     *
     * This is hacked and should probably be in Ace already
     */
    setAceThemeBackground : function() {
        // Set the background color so animating doesn't show a dumb gray background
        var ace_editor = document.getElementsByClassName("ace_editor")[0];
        if (!ace_editor)
            return;

        var classNames = ace_editor.getAttribute("class").split(" ");
        for (var cn = 0; cn < classNames.length; cn++) {
            if (classNames[cn].indexOf("ace-") === 0) {
                var selectorString = "." + classNames[cn] + " .ace_scroller";
                var bgColor = apf.getStyleRule(selectorString, "background-color");
                if (!bgColor)
                    bgColor = apf.getStyleRule(".ace_scroller", "background-color");
                ace_editor.style.backgroundColor = bgColor;
                break;
            }
        }
    },

    /**
     * Calls appendChild on the animation window to receive
     * tabEditors.parentNode - then sets the styles of
     * tabEditors.parentNode so it fits properly into the
     * animation window
     */
    placeTabIntoAnimationWindow : function() {
        var reappendlist = [];
        var iframelist   = apf.getArrayFromNodelist(
            tabEditors.parentNode.$ext.getElementsByTagName("iframe"));

        for (var i = 0; i < iframelist.length; i++) {
            reappendlist[i] = [
                iframelist[i].parentNode,
                iframelist[i].nextSibling,
                document.adoptNode(iframelist[i]),
            ]
        }

        this.animateZen.appendChild(tabEditors.parentNode.$ext);

        for (var i = reappendlist.length - 1; i >= 0; i--) {
            reappendlist[i][0].insertBefore(
                reappendlist[i][2],
                reappendlist[i][1]);
        }

        //this.animateZen.appendChild(tabEditors.parentNode.$ext);
        tabEditors.parentNode.$ext.style.width = "100%";
        tabEditors.parentNode.$ext.style.height = "100%";
        tabEditors.parentNode.$ext.style.position = "relative";
        tabEditors.parentNode.$ext.style.left = "0px";
        tabEditors.parentNode.$ext.style.top = "0px";
    },

    /**
     * Called during the onmouseover event from the zen button
     */
    fadeZenButtonIn : function() {
        apf.tween.single(btnZenFullscreen, {
            type     : "opacity",
            anim     : apf.tween.easeInOutCubic,
            from     : 0.01,
            to       : 1,
            steps    : 8,
            interval : 20,
            control  : (this.control = {}),
            onfinish : function(){
            }
        });
    },

    /**
     * Called during the onmouseout event from the zen button
     */
    fadeZenButtonOut : function() {
        if (self["btnZenFullscreen"]) {// for the guided tour
            apf.tween.single(btnZenFullscreen, {
                type     : "opacity",
                anim     : apf.tween.easeInOutCubic,
                from     : 1,
                to       : 0.01,
                steps    : 8,
                interval : 20,
                control  : (this.control = {}),
                onfinish : function(){
                }
            });
        } 
    },

    enable : function(){
        btnZenFullscreen.show();
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        if (this.isFocused)
            this.escapeFromZenMode();
        btnZenFullscreen.hide();
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
