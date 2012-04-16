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
        
        c = 0;
        this.menus.push(
            menus.addItemByPath("Edit/Line/Indent", new apf.item({
                hotkey : apf.isMac ? "Tab" : "Tab" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Line/Outdent", new apf.item({
                hotkey : apf.isMac ? "Shift-Tab" : "Shift-Tab" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Line/Move Line Up", new apf.item({
                hotkey : apf.isMac ? "Option-Up" : "Alt-Up" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Line/Move Line Down", new apf.item({
                hotkey : apf.isMac ? "Option-Down" : "Alt-Down" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Line/~", new apf.divider(), c += 100),

            menus.addItemByPath("Edit/Line/Copy Lines Up", new apf.item({
                hotkey : apf.isMac ? "Command-Option-Up" : "Ctrl-Alt-Up" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Line/Copy Lines Down", new apf.item({
                hotkey : apf.isMac ? "Command-Option-Down" : "Ctrl-Alt-Down" // TODO: Don't hardcode this
            }), c += 100),
            
            menus.addItemByPath("Edit/Line/~", new apf.divider(), c += 100),

            menus.addItemByPath("Edit/Line/Remove Line", new apf.item({
                hotkey : apf.isMac ? "Command-D" : "Ctrl-D" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Line/Remove to Line End", new apf.item({
                hotkey : apf.isMac ? "Ctrl-K" : "" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Line/Remove to Line Start", new apf.item({
                hotkey : apf.isMac ? "Option-Backspace" : "" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Line/~", new apf.divider(), c += 100),

            menus.addItemByPath("Edit/Line/Split Line", new apf.item({
                hotkey : apf.isMac ? "Ctrl-O" : "" // TODO: Don't hardcode this
            }), c += 100)
        )
        
        c = 0;
        this.menus.push(
            menus.addItemByPath("Edit/Comment/Toggle Comment", new apf.item({
                hotkey : apf.isMac ? "Command-7" : "Ctrl-7" // TODO: Don't hardcode this
            }), c += 100)
        );
        
        c = 0;
        this.menus.push(
            menus.addItemByPath("Edit/Text/Remove Word Right", new apf.item({
                hotkey : apf.isMac ? "Alt-Delete" : "" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Text/Remove Word Left", new apf.item({
                hotkey : apf.isMac ? "Alt-Backspace|Ctrl-Alt-Backspace" : "" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Text/~", new apf.divider(), c += 100),

            menus.addItemByPath("Edit/Text/Transpose Letters", new apf.item({
                hotkey : apf.isMac ? "Ctrl-T" : "Ctrl-T" // TODO: Don't hardcode this
            }), c += 100)
        );

        c = 0;
        this.menus.push(
            menus.addItemByPath("Edit/Code Folding/Fold", new apf.item({
                hotkey : apf.isMac ? "Alt-L" : "Alt-L" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Code Folding/Unfold", new apf.item({
                hotkey : apf.isMac ? "Shift-Alt-L" : "Shift-Alt-L" // TODO: Don't hardcode this
            }), c += 100),
        
            menus.addItemByPath("Edit/Code Folding/~", new apf.divider(), c += 100),
            
            menus.addItemByPath("Edit/Code Folding/Fold All", new apf.item({
                hotkey : apf.isMac ? "Option-0" : "Alt-0" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Code Folding/Unfold All", new apf.item({
                hotkey : apf.isMac ? "Option-Shift-0" : "Alt-Shift-0" // TODO: Don't hardcode this
            }), c += 100)
        );
        
        c = 0
        this.menus.push(
            menus.addItemByPath("Edit/Convert Case/Upper Case", new apf.item({
                hotkey : apf.isMac ? "Ctrl-U" : "Ctrl-U" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Edit/Convert Case/Lower Case", new apf.item({
                hotkey : apf.isMac ? "Ctrl-Shift-U" : "Ctrl-Shift-U" // TODO: Don't hardcode this
            }), c += 100)
        );
        
        c = 0;
        this.menus.push(
            menus.addItemByPath("Selection/Select All", new apf.item({
                hotkey : apf.isMac ? "Command-A" : "Ctrl-A" // TODO: Don't hardcode this
            }), c += 100),
            
            menus.addItemByPath("Selection/Single Selection", new apf.item({
                hotkey : apf.isMac ? "Esc" : "Esc" // TODO: Don't hardcode this
            }), c += 100),
            
            /* {CTRL+ALT+UP} Put an extra cursor on the line above
* {CTRL+ALT+DOWN} Put an extra cursor on the line below
* {CTRL+ALT+SHIFT+UP} Move the cursor up, but introduce a new cursor in the place of the current one
* {CTRL+ALT+SHIFT+DOWN} Move the cursor down, but introduce a new cursor in the place of the current one
* {CTRL+ALT+RIGHT} Add the next instance of the selected text to your selection
* {CTRL+ALT+LEFT} Add the previous instance of the selected text to your selection
* {CTRL+ALT+SHIFT+RIGHT} Select the next instance of the selected text
* {CTRL+ALT+SHIFT+LEFT} Select the previous instance of the selected text
* {CTRL+SHIFT+L} Merge the selected parts by creating a new selection that ranges from the start of the first selection to the end of the last one
*/

            menus.addItemByPath("Selection/~", new apf.divider(), c += 100),

            menus.addItemByPath("Selection/Multiple Cursor Down", new apf.item({
                hotkey : apf.isMac ? "Ctrl-Alt-Down" : "" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Selection/Multiple Cursor Up", new apf.item({
                hotkey : apf.isMac ? "Ctrl-Alt-Up" : "" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Selection/~", new apf.divider(), c += 100),

            menus.addItemByPath("Selection/Select Word Right", new apf.item({
                hotkey : apf.isMac ? "Option-Shift-Right" : "Ctrl-Shift-Right" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Selection/Select Word Left", new apf.item({
                hotkey : apf.isMac ? "Option-Shift-Left" : "Ctrl-Shift-Left" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Selection/~", new apf.divider(), c += 100),

            menus.addItemByPath("Selection/Select to Line End", new apf.item({
                hotkey : apf.isMac ? "Command-Shift-Right" : "Alt-Shift-Right" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Selection/Select to Line Start", new apf.item({
                hotkey : apf.isMac ? "Command-Shift-Left" : "Alt-Shift-Left" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Selection/~", new apf.divider(), c += 100),

            menus.addItemByPath("Selection/Select to Document Start", new apf.item({
                hotkey : apf.isMac ? "Command-Shift-Up" : "Ctrl-Shift-Home|Alt-Shift-Up" // TODO: Don't hardcode this
            }), c += 100),

            menus.addItemByPath("Selection/Select to Document End", new apf.item({
                hotkey : apf.isMac ? "Command-Shift-Down" : "Ctrl-Shift-End|Alt-Shift-Down" // TODO: Don't hardcode this
            }), c += 100),
            
            /**** View ****/

            menus.addItemByPath("View/Gutter", new apf.item({
                type    : "check",
                checked : "[{require('ext/settings/settings').model}::editors/code/@gutter]"
            }), 500),
            
            menus.addItemByPath("View/Syntax", new apf.item({
                submenu : "mnuSyntax"
            }), 300000),

            menus.addItemByPath("View/Newline Mode/", null, 310000),

            menus.addItemByPath("View/Newline Mode/Auto", new apf.item({
                type    : "check",
                checked : "[{require('ext/settings/settings').model}::editors/code/@newlinemode]"
            }), 100),

            menus.addItemByPath("View/Newline Mode/Windows (CRLF)", new apf.item({
                type    : "check",
                checked : "[{require('ext/settings/settings').model}::editors/code/@newlinemode]"
            }), 200),

            menus.addItemByPath("View/Newline Mode/Unix (LF)", new apf.item({
                type    : "check",
                checked : "[{require('ext/settings/settings').model}::editors/code/@newlinemode]"
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
            }), 600000),
            
            /**** Goto ****/

            menus.addItemByPath("Goto/~", new apf.divider(), 399),

            menus.addItemByPath("Goto/Word Right", new apf.item({
                hotkey : apf.isMac ? "Option-Right" : "Ctrl-Right" // TODO: Don't hardcode this
            }), 400),

            menus.addItemByPath("Goto/Word Left", new apf.item({
                hotkey : apf.isMac ? "Option-Left" : "Tab" // TODO: Don't hardcode this
            }), 500),

            menus.addItemByPath("Goto/~", new apf.divider(), 600),

            menus.addItemByPath("Goto/Line End", new apf.item({
                hotkey : apf.isMac ? "Command-Right|End|Ctrl-E" : "Alt-Right|End" // TODO: Don't hardcode this
            }), 900),

            menus.addItemByPath("Goto/Line Start", new apf.item({
                hotkey : apf.isMac ? "Command-Left|Home|Ctrl-A" : "Alt-Left|Home" // TODO: Don't hardcode this
            }), 1000),
            
            menus.addItemByPath("Goto/~", new apf.divider(), 1100),
            
            menus.addItemByPath("Goto/Scroll to Selection", new apf.item({
                hotkey : apf.isMac ? "Ctrl-L" : "" // TODO: Don't hardcode this
            }), 1200),

            /**** Tools ****/

            menus.addItemByPath("Tools/~", new apf.divider(), 30000),

            menus.addItemByPath("Tools/Git/", null, 40000),

            menus.addItemByPath("Tools/Git/Push", new apf.item({
            }), 1000),

            menus.addItemByPath("Tools/Git/Pull", new apf.item({
 
            }), 2000),

            menus.addItemByPath("Tools/Git/Stash", new apf.item({
 
            }), 3000),

            menus.addItemByPath("Tools/Git/Commit", new apf.item({
 
            }), 4000),

            menus.addItemByPath("Tools/Git/Checkout", new apf.item({

            }), 5000),

            // should probably do HG, too...

            menus.addItemByPath("Tools/~", new apf.divider(), 50000),

            menus.addItemByPath("Tools/NPM/", null, 60000),

            menus.addItemByPath("Tools/NPM/Install", new apf.item({
 
            }), 1000),

            menus.addItemByPath("Tools/NPM/Uninstall", new apf.item({

            }), 2000)
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
