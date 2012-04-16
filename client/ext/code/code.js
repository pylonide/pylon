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
var menus = require("ext/menus/menus");
var EditSession = require("ace/edit_session").EditSession;
var HashHandler = require("ace/keyboard/hash_handler").HashHandler;
var useragent = require("ace/lib/useragent");
var Document = require("ace/document").Document;
var Range = require("ace/range").Range;
var MultiSelectCommands = require("ace/multi_select").commands.defaultCommands;
var ProxyDocument = require("ext/code/proxydocument");
var CommandManager = require("ace/commands/command_manager").CommandManager;
var defaultCommands = require("ace/commands/default_commands").commands;
var markup = require("text!ext/code/code.xml");
var settings = require("core/settings");
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

var ModesCaption = {
    "C#" : true,
    "C/C++" : true,
    "Clojure" : true,
    "CoffeeScript" : true,
    "Coldfusion" : true,
    "CSS" : true,
    "Groovy" : true,
    "Java" : true,
    "JavaScript" : true,
    "Latex" : true,
    "Script" : true,
    "Lua" : true,
    "Markdown" : true,
    "OCaml" : true,
    "PHP" : true,
    "Perl" : true,
    "Powershell" : true,
    "Python" : true,
    "Ruby" : true,
    "Scala" : true,
    "SCSS" : true,
    "SQL" : true,
    "Textile" : true,
    "HTML" : true,
    "XML" : true
}

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
    "application/x-sh": "sh",
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
    "sql": "text/x-sql",

    "sh": "application/x-sh",
    "bash": "application/x-sh"
};

module.exports = ext.register("ext/code/code", {
    name    : "Code Editor",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    markup  : markup,
    deps    : [editors],

    nodes : [],
    menus : [],

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
        ide.addEventListener("loadsettings", function(e) {
            settings.setDefaults("editors/code", [
                ["overwrite", "false"],
                ["selectstyle", "line"],
                ["activeline", "true"],
                ["showinvisibles", "false"],
                ["showprintmargin", "true"],
                ["printmargincolumn", "80"],
                ["softtabs", "true"],
                ["tabsize", "4"],
                ["scrollspeed", "2"],
                ["fontsize", "12"],
                ["wrapmode", "false"],
                ["wraplimitmin", ""],
                ["wraplimitmax", ""],
                ["gutter", "true"],
                ["folding", "true"],
                ["newlinemode", "auto"],
                ["highlightselectedword", "true"],
                ["autohidehorscrollbar", "true"],
                ["animatedscroll", "true"]
            ]);

            // pre load theme
            var theme = e.model.queryValue("editors/code/@theme");
            if (theme)
                require([theme], function() {});

            // pre load custom mime types
            _self.getCustomTypes(e.model);
        });
        
        ide.addEventListener("init.ext/settings/settings", function(e) {
            var heading = e.ext.getHeading("Code Editor");
            heading.insertMarkup(markupSettings);
        });

        ide.addEventListener("afteropenfile", function(e) {
            if (_self.setState)
                _self.setState(e.doc, e.doc.state);

            if (e.doc && e.doc.editor && e.doc.editor.ceEditor) {
                // check if there is a scriptid, if not check if the file is somewhere in the stack
                if (typeof mdlDbgStack != "undefined" && mdlDbgStack.data && e.node
                  && (!e.node.hasAttribute("scriptid") || !e.node.getAttribute("scriptid"))
                  && e.node.hasAttribute("scriptname") && e.node.getAttribute("scriptname")) {
                    var nodes = mdlDbgStack.data.selectNodes('//frame[@script="' + e.node.getAttribute("scriptname").replace(ide.workspaceDir + "/", "").replace(/"/g, "&quot;") + '"]');
                    if (nodes.length) {
                        e.node.setAttribute("scriptid", nodes[0].getAttribute("scriptid"));
                    }
                }
                e.doc.editor.ceEditor.afterOpenFile(e.doc.editor.ceEditor.getSession());
            }
        });

        tabEditors.addEventListener("afterswitch", function(e) {
            if(typeof ceEditor != "undefined")
                ceEditor.afterOpenFile(ceEditor.getSession());
        });
        
        var c = 600;
        this.menus.push(
            menus.addItemByPath("Edit/~", new apf.divider(), c += 100),
            menus.addItemByPath("Edit/Line/", null, c += 100),
            menus.addItemByPath("Edit/Comment/", null, c += 100),
            menus.addItemByPath("Edit/Text/", null, c += 100),
            menus.addItemByPath("Edit/Code Folding/", null, c += 100),
            menus.addItemByPath("Edit/Convert Case/", null, c += 100)
        );
        
        function addEditorMenu(path, key, commandName) {
            if (typeof key != "string")
                key = key[apf.isMac ? 0 : 1]; // TODO: Don't hardcode this

            return menus.addItemByPath(path, new apf.item({
                hotkey : key,
                onclick : function() {
                    var editor = ceEditor.$editor;
                    editor.commands.exec(commandName, editor);
                }
            }), c += 100);
        }
        
        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Line/Indent", "Tab", "indent"),

            addEditorMenu("Edit/Line/Outdent", "Shift-Tab", "outdent"),

            addEditorMenu("Edit/Line/Move Line Up", ["Option-Up", "Alt-Up"], "movelinesup"),

            addEditorMenu("Edit/Line/Move Line Down", ["Option-Down", "Alt-Down"], "movelinesdown"),

            menus.addItemByPath("Edit/Line/~", new apf.divider(), c += 100),

            addEditorMenu("Edit/Line/Copy Lines Up", [
                "Command-Option-Up", "Ctrl-Alt-Up"
            ], "copylinesup"),

            addEditorMenu("Edit/Line/Copy Lines Down", [
                "Command-Option-Down", "Ctrl-Alt-Down"
            ], "copylinesdown"),
            
            menus.addItemByPath("Edit/Line/~", new apf.divider(), c += 100),

            addEditorMenu("Edit/Line/Remove Line", ["Command-D", "Ctrl-D"], "removeline"),

            addEditorMenu("Edit/Line/Remove to Line End", ["Ctrl-K", "Alt-Delete"], "removetolineend"),

            addEditorMenu("Edit/Line/Remove to Line Start", [
                "Option-Backspace", "Alt-Backspace"
            ], "removetolinestart"),

            menus.addItemByPath("Edit/Line/~", new apf.divider(), c += 100),

            addEditorMenu("Edit/Line/Split Line", [
                "Ctrl-O", ""
            ], "splitline")
        )
        
        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Comment/Toggle Comment", [
                "Command-7", "Ctrl-7"
            ], "togglecomment")
        );
        
        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Text/Remove Word Right", [
                "Alt-Delete", "Alt-Delete"
            ], "removewordright"),

            addEditorMenu("Edit/Text/Remove Word Left", [
                "Alt-Backspace", "Alt-Backspace"
            ], "removewordleft"),

            menus.addItemByPath("Edit/Text/~", new apf.divider(), c += 100),

            addEditorMenu("Edit/Text/Transpose Letters", [
                "Ctrl-T", "Ctrl-T"
            ], "transposeletters")
        );

        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Code Folding/Fold", [
                "Alt-L", "Alt-L"
            ], "fold"),

            addEditorMenu("Edit/Code Folding/Unfold", [
                "Shift-Alt-L", "Shift-Alt-L"
            ], "unfold"),
        
            menus.addItemByPath("Edit/Code Folding/~", new apf.divider(), c += 100),
            
            addEditorMenu("Edit/Code Folding/Fold All", [
                "Option-0", "Alt-0"
            ], "foldall"),

            addEditorMenu("Edit/Code Folding/Unfold All", [
                "Option-Shift-0", "Alt-Shift-0"
            ], "unfoldall")
        );
        
        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Convert Case/Upper Case",[
                "Ctrl-U", "Ctrl-U"
            ], "touppercase"),

            addEditorMenu("Edit/Convert Case/Lower Case", [
                "Ctrl-Shift-U", "Ctrl-Shift-U"
            ], "tolowercase")
        );
        
        c = 0;
        this.menus.push(
            addEditorMenu("Selection/Select All",[
                "Command-A", "Ctrl-A"
            ], "selectall"),
            
            addEditorMenu("Selection/Single Selection", "Esc", "singleSelection"),
            
            menus.addItemByPath("Selection/~", new apf.divider(), c += 100),
            
            menus.addItemByPath("Selection/Multiple Selections/", null, c += 100),

            menus.addItemByPath("Selection/~", new apf.divider(), c += 100),

            addEditorMenu("Selection/Select Word Right", [
                "Option-Shift-Right", "Ctrl-Shift-Right" 
            ], "selectwordright"),

            addEditorMenu("Selection/Select Word Left", [
                "Option-Shift-Left", "Ctrl-Shift-Left"
            ], "selectwordleft"),

            menus.addItemByPath("Selection/~", new apf.divider(), c += 100),

            addEditorMenu("Selection/Select to Line End", [
                "Command-Shift-Right", "Shift-End|Alt-Shift-Right"
            ], "selecttolineend"),

            addEditorMenu("Selection/Select to Line Start", [
                "Command-Shift-Left", "Shift-Home|Alt-Shift-Left"
            ], "selecttolinestart"),

            menus.addItemByPath("Selection/~", new apf.divider(), c += 100),

            addEditorMenu("Selection/Select to Document Start", [
                "Command-Shift-Up", "Ctrl-Shift-Home|Alt-Shift-Up" 
            ], "selecttostart"),

            addEditorMenu("Selection/Select to Document End", [
                "Command-Shift-Down", "Ctrl-Shift-End|Alt-Shift-Down" 
            ], "selecttoend")
        );
        
        c = 0;
        this.menus.push(
            addEditorMenu("Selection/Multiple Selections/Add Cursor Up", [
                "Ctrl-Alt-Up", "Ctrl-Alt-Up"
            ], "addCursorAbove"),
            
            addEditorMenu("Selection/Multiple Selections/Add Cursor Down", [
                "Ctrl-Alt-Down", "Ctrl-Alt-Down"
            ], "addCursorBelow"),
            
            addEditorMenu("Selection/Multiple Selections/Move Active Cursor Up", [
                "Shift-Ctrl-Alt-Up", "Shift-Ctrl-Alt-Up"
            ], "addCursorAboveSkipCurrent"),
            
            addEditorMenu("Selection/Multiple Selections/Move Active Cursor Down", [
                "Shift-Ctrl-Alt-Down", "Shift-Ctrl-Alt-Down"
            ], "addCursorBelowSkipCurrent"),

            menus.addItemByPath("Selection/Multiple Selections/~", new apf.divider(), c += 100),
            
            addEditorMenu("Selection/Multiple Selections/Add Next Selection Match", [
                "Ctrl-Alt-Right", "Ctrl-Alt-Right"
            ], "selectMoreAfter"),
            
            addEditorMenu("Selection/Multiple Selections/Add Previous Selection Match", [
                "Ctrl-Alt-Left", "Ctrl-Alt-Left"
            ], "selectMoreBefore"),

            menus.addItemByPath("Selection/Multiple Selections/~", new apf.divider(), c += 100),
            
            addEditorMenu("Selection/Multiple Selections/Merge Selection Range", [
                "Ctrl-Shift-L", ""
            ], "splitIntoLines")
        );
            
        /**** View ****/
        this.menus.push(
            menus.addItemByPath("View/Gutter", new apf.item({
                type    : "check",
                checked : "[{require('ext/settings/settings').model}::editors/code/@gutter]"
            }), 500),
            
            menus.addItemByPath("View/~", new apf.divider(), 290000),
            
            menus.addItemByPath("View/Syntax/", new apf.item({
                onitemclick : function(e) {
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
                }
            }), 300000),

            menus.addItemByPath("View/Newline Mode/", null, 310000),

            menus.addItemByPath("View/Newline Mode/Auto", new apf.item({
                type    : "radio",
                value   : "auto",
                selected : "[{require('ext/settings/settings').model}::editors/code/@newlinemode]"
            }), 100),
            
            menus.addItemByPath("View/Newline Mode/~", new apf.divider(), 110),

            menus.addItemByPath("View/Newline Mode/Windows (CRLF)", new apf.item({
                type    : "radio",
                value   : "windows",
                selected : "[{require('ext/settings/settings').model}::editors/code/@newlinemode]"
            }), 200),

            menus.addItemByPath("View/Newline Mode/Unix (LF)", new apf.item({
                type    : "radio",
                value   : "unix",
                selected : "[{require('ext/settings/settings').model}::editors/code/@newlinemode]"
            }), 300),

            menus.addItemByPath("View/~", new apf.divider(), 400000),
            
            menus.addItemByPath("View/Wrap Lines", new apf.item({
                type    : "check",
                checked : "[{require('ext/settings/settings').model}::editors/code/@wrapmode]"
            }), 500000),
            
            menus.addItemByPath("View/Wrap To Viewport", new apf.item({
                disabled : "{!apf.isTrue(this.wrapmode)}",
                wrapmode : "[{require('ext/settings/settings').model}::editors/code/@wrapmode]",
                type     : "check",
                checked  : "[{require('ext/settings/settings').model}::editors/code/@wrapmodeViewport]"
            }), 600000)
        );
        
        c = 0;
        this.menus.push(
            menus.addItemByPath("View/Syntax/Auto-Select", new apf.item({
                value: "auto"
            }), c += 100),
            
            menus.addItemByPath("View/Syntax/Plain Text", new apf.item({
                value: "text/plain"
            }), c += 100)
        );
        
        for (var mode in ModesCaption) {
            this.menus.push(
                menus.addItemByPath("View/Syntax/" + mode, new apf.item({
                    value: contentTypes[mode.toLowerCase()]
                }), c += 100)
            )
        }
        
        c = 0;
        this.menus.push(  
            /**** Goto ****/

            menus.addItemByPath("Goto/~", new apf.divider(), c = 399),

            addEditorMenu("Goto/Word Right", [
                "Option-Right", "Ctrl-Right"
            ], "gotowordright"),

            addEditorMenu("Goto/Word Left", [
                "Option-Left", "Ctrl-Left"
            ], "gotowordleft"),

            menus.addItemByPath("Goto/~", new apf.divider(), 600),

            addEditorMenu("Goto/Line End", [
                "Command-Right|End|Ctrl-E", "Alt-Right|End"
            ], "gotolineend"),

            addEditorMenu("Goto/Line Start", [
                "Command-Left|Home|Ctrl-A", "Alt-Left|Home"
            ], "gotolinestart"),
            
            menus.addItemByPath("Goto/~", new apf.divider(), c += 100),
            
            addEditorMenu("Goto/Scroll to Selection", [
                "Ctrl-L", ""
            ], "centerselection")
        );
    },

    init: function(amlPage) {
        amlPage.appendChild(ceEditor);
        ceEditor.show();

        this.ceEditor = this.amlEditor = ceEditor;
        ceEditor.$editor.commands = this.commandManager;
        ceEditor.$editor.commands.addCommands(MultiSelectCommands);

        // preload common language modes
        var noop = function() {}; 
        ceEditor.getMode("javascript", noop);
        ceEditor.getMode("html", noop);
        ceEditor.getMode("css", noop);

        var _self = this;

        var menuShowInvisibles = new apf.item({
            type    : "check",
            caption : "Show Invisibles",
            checked : "[{require('ext/settings/settings').model}::editors/code/@showinvisibles]"
        });

        ide.addEventListener("init.ext/statusbar/statusbar", function (e) {
            // add preferences to the statusbar plugin
            e.ext.addPrefsItem(menuShowInvisibles.cloneNode(true), 0);
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
            item.enable();
        });
        
        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function() {
        this.menus.each(function(item){
            item.disable();
        });
        
        this.nodes.each(function(item){
            item.hide();
        });
    },

    destroy : function(){
        this.menus.each(function(item){
            item.destroy(true, true);
        });
        
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
