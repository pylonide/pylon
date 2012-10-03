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
var util = require("core/util");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var EditSession = require("ace/edit_session").EditSession;
var Document = require("ace/document").Document;
var Range = require("ace/range").Range;
var MultiSelectCommands = require("ace/multi_select").commands;
var ProxyDocument = require("ext/code/proxydocument");
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

// name: ["Caption", "extension", "content-type"]
var SupportedModes = {
    c9search: ["C9Search", "c9search", "text/x-c9search"],
    coffee: ["CoffeeScript", "coffee|*Cakefile", "text/x-script.coffeescript"],
    coldfusion: ["ColdFusion", "cfm", "text/x-coldfusion"],
    csharp: ["C#", "cs", "text/x-csharp"],
    css: ["CSS", "css", "text/css"],
    golang: ["Go", "go", "text/x-go"],
    groovy: ["Groovy", "groovy", "text/x-groovy"],
    haxe: ["haXe", "hx", "text/haxe"],
    html: ["HTML", "htm|html|xhtml", "text/html"],
    c_cpp: ["C/C++", "c|cc|cpp|cxx|h|hh|hpp", "text/x-c"],
    clojure: ["Clojure", "clj", "text/x-script.clojure"],
    java: ["Java", "java", "text/x-java-source"],
    javascript: ["JavaScript", "js", "application/javascript"],
    json: ["JSON", "json", "application/json"],
    latex: ["LaTeX", "latex|tex|ltx|bib", "application/x-latex"],
    less: ["LESS", "less", "text/x-less"],
    liquid: ["Liquid", "liquid", "text/x-liquid"],
    lua: ["Lua", "lua", "text/x-lua"],
    markdown: ["Markdown", "md|markdown", "text/x-markdown"],
    ocaml: ["OCaml", "ml|mli", "text/x-script.ocaml"],
    perl: ["Perl", "pl|pm", "text/x-script.perl"],
    pgsql: ["pgSQL", "pgsql", "text/x-pgsql"],
    php: ["PHP", "php|phtml", "application/x-httpd-php"],
    powershell: ["Powershell", "ps1", "text/x-script.powershell"],
    python: ["Python", "py", "text/x-script.python"],
    ruby: ["Ruby", "ru|gemspec|rake|rb", "text/x-script.ruby"],
    scad: ["OpenSCAD", "scad", "text/x-scad", "hidden"],
    scala: ["Scala", "scala", "text/x-scala"],
    scss: ["SCSS", "scss|sass", "text/x-scss"],
    sh: ["SH", "sh|bash|bat", "application/x-sh"],
    sql: ["SQL", "sql", "text/x-sql"],
    svg: ["SVG", "svg", "image/svg+xml"],
    text: ["Text", "txt", "text/plain", "hidden"],
    textile: ["Textile", "textile", "text/x-web-textile"],
    typescript: ["Typescript", "ts|str", "text/x-typescript"],
    xml: ["XML", "xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl", "application/xml"],
    xquery: ["XQuery", "xq", "text/x-xquery"],
    yaml: ["YAML", "yaml", "text/x-yaml"]
};

var fileExtensions = {}, ModesCaption = {}, contentTypes = {};
Object.keys(SupportedModes).forEach(function(name) {
    var mode = SupportedModes[name];
    mode.caption = mode[0];
    mode.mime = mode[2];
    mode.hidden = !!mode[3];
    mode.ext = mode[1];
    mode.ext.split("|").forEach(function(ext) {
        fileExtensions[ext] = name;
    });
    ModesCaption[mode.caption] = name;
    contentTypes[mode.mime] = name;
});

module.exports = ext.register("ext/code/code", {
    name    : "Code Editor",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    markup  : markup,
    deps    : [editors],

    nodes : [],
    menus : [],

    fileExtensions : Object.keys(fileExtensions),
    supportedModes : Object.keys(SupportedModes),

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

        var mode = node.getAttribute("customtype");

        if (mode) {
            var ext = contentTypes[mode.split(";")[0]] ;
            if (ext)
                mode = fileExtensions[contentTypes[mode]];
        }

        if (!mode) {
            var fileName = node.getAttribute("name");
            var dotI = fileName.lastIndexOf(".") + 1;
            var ext = dotI ? fileName.substr(dotI).toLowerCase() : "*" + fileName;
            mode = fileExtensions[ext];
        }

        return SupportedModes[mode] ? mode : "text";
    },

    setSyntax : function(value) {
        value = SupportedModes[value] ? value : "";
        var file = ide.getActivePageModel();
        if (!file)
            return;

        var fileName = file.getAttribute("name");
        var dotI = fileName.lastIndexOf(".") + 1;
        var ext = dotI ? fileName.substr(dotI).toLowerCase() : "*" + fileName;
        if (value) {
            if (!SupportedModes[value])
                return;

            apf.xmldb.setAttribute(file, "customtype", value);
            fileExtensions[ext] = value;
        } else {
            apf.xmldb.removeAttribute(file, "customtype", "");

            delete fileExtensions[ext];
            for (var mode in SupportedModes) {
                if (SupportedModes[mode].ext.split("|").indexOf(ext) != -1) {
                    fileExtensions[ext] = mode;
                    break;
                }
        }
        }

        var mime = this.setCustomType(dotI ? ext : file, value);
        ide.dispatchEvent("track_action", {
            type: "syntax highlighting",
            fileType: ext,
            fileName: fileName,
            mime: mime,
            customType: value
        });
        if (self.ceEditor)
            self.ceEditor.setAttribute("syntax", this.getSyntax(file));
    },
    
    getContentType : function(node) {
        var syntax = this.getSyntax(node);
        if (!syntax)
            return "auto";
        
        return SupportedModes[syntax].mime || "auto";
    },

    getSelection : function(){
        if (typeof this.amlEditor == "undefined")
            return null;
        return this.amlEditor.getSelection();
    },

    getDocument : function(){
        if (typeof this.amlEditor == "undefined")
            return null;
        return this.amlEditor.getSession();
    },

    setDocument : function(doc, actiontracker, isLazy){
        var _self = this;

        var ceEditor = this.amlEditor;

        if (doc.acesession) {
            ceEditor.setProperty("value", doc.acesession);
        }
        else {
            doc.isInited = doc.hasValue();
            doc.acedoc = doc.acedoc || new ProxyDocument(new Document(doc.getValue() || ""));
            var syntax = _self.getSyntax(doc.getNode());
            var mode = ceEditor.getMode(syntax);
            doc.acesession = new EditSession(doc.acedoc, mode);
            doc.acesession.syntax = syntax;
            doc.acedoc = doc.acesession.getDocument();
            doc.acesession.c9doc = doc;

            doc.acesession.setUndoManager(actiontracker);

            if (doc.isInited && doc.state)
                 _self.setState(doc, doc.state);

            doc.addEventListener("prop.value", function(e) {
                if (this.editor != _self)
                    return;
                
                if (!doc || !doc.acesession)
                    return; //This is probably a deconstructed document

                doc.acesession.setValue(e.value || "");


                if (doc.state)
                    _self.setState(doc, doc.state);

                doc.isInited = true;

                if (this.$page.id != this.$page.parentNode.activepage)
                    return;

                ceEditor.setAttribute("syntax", syntax);
                ceEditor.setAttribute("value", doc.acesession);
                // force tokenize first visible rows
                var rowCount = Math.min(50, doc.acesession.getLength());
                doc.acesession.bgTokenizer.getTokens(0, rowCount);
            });

            if (!isLazy)
                ceEditor.setProperty("value", doc.acesession || "");

            doc.addEventListener("retrievevalue", function(e) {
                if (this.editor != _self || !doc)
                    return;

                if (!doc.isInited)
                    return e.value;
                else
                    return doc.acesession.getValue();
            });

            doc.addEventListener("close", function(e){
                if (this.editor != _self)
                    return;

                //??? destroy doc.acesession
                setTimeout(function() {
                    doc.acedoc.doc.$lines = [];
                    doc.acedoc.doc._eventRegistry = null;
                    doc.acedoc.doc._defaultHandlers = null;
                    doc.acedoc._eventRegistry = null;
                    doc.acedoc._defaultHandlers = null;
                    doc.acedoc = null;
                    doc.acesession.$stopWorker();
                    doc.acesession.bgTokenizer.lines = [];
                    doc.acesession.bgTokenizer.tokenizer = null;
                    doc.acesession.bgTokenizer = null;
                    doc.acesession.$rowCache = null;
                    doc.acesession.$mode = null;
                    doc.acesession.$origMode = null;
                    doc.acesession.$breakpoints = null;
                    doc.acesession.$annotations = null;
                    doc.acesession.languageAnnos = null;
                    doc.acesession = null;
                    doc = null;
                    //??? call doc.$page.destroy()
                });
            });
            
            doc.dispatchEvent("init");
        }

        if (doc.editor && doc.editor != this) {
            var value = doc.getValue();
            if (doc.acesession.getValue() !== value) {
                doc.editor = this;
                doc.dispatchEvent("prop.value", {value : value});
            }
        }

        doc.editor = this;
    },

    clear : function(){
        this.amlEditor.clear();
    },

    focus : function(){
        this.amlEditor.focus();
    },

    hook: function() {
        var _self = this;

        var fnWrap = function(command){
            command.readOnly = command.readOnly || false;
            command.focusContext = true;

            var isAvailable = command.isAvailable;
            command.isAvailable = function(editor, event) {
                if (event instanceof KeyboardEvent &&
                 (!apf.activeElement || apf.activeElement.localName != "codeeditor"))
                    return false;

                return isAvailable ? isAvailable(editor) : true;
            };

            command.findEditor = function(editor) {
                if (editor && editor.ceEditor)
                    return editor.ceEditor.$editor;
                return editor;
            };
        };

        if (!defaultCommands.wrapped) {
            defaultCommands.each(fnWrap, defaultCommands);
            defaultCommands.wrapped = true;
        }
        if (!MultiSelectCommands.wrapped) {
            MultiSelectCommands.each(fnWrap, MultiSelectCommands);
            MultiSelectCommands.wrapped = true;
        }

        commands.addCommands(defaultCommands, true);
        commands.addCommands(MultiSelectCommands, true);

        commands.addCommand({
            name: "syntax",
            exec: function(_, syntax) {
                if (typeof syntax == "object")
                    syntax = syntax.argv && syntax.argv[1] || "";
                syntax = ModesCaption[syntax] || fileExtensions[syntax] || syntax;
                _self.setSyntax(syntax);
            },
            commands: ModesCaption
        });

        //Settings Support
        ide.addEventListener("settings.load", function(e) {
            settings.setDefaults("editors/code", [
                ["overwrite", "false"],
                ["selectstyle", "line"],
                ["activeline", "true"],
                ["gutterline", "true"],
                ["showinvisibles", "false"],
                ["showprintmargin", "true"],
                ["showindentguides", "true"],
                ["printmargincolumn", "80"],
                ["behaviors", ""],
                ["softtabs", "true"],
                ["tabsize", "4"],
                ["scrollspeed", "2"],
                ["fontsize", "12"],
                ["wrapmode", "false"],
                ["wraplimitmin", ""],
                ["wraplimitmax", ""],
                ["wrapmodeViewport", "true"],
                ["gutter", "true"],
                ["folding", "true"],
                ["newlinemode", "auto"],
                ["highlightselectedword", "true"],
                ["autohidehorscrollbar", "true"],
                ["fadefoldwidgets", "true"],
                ["animatedscroll", "true"]
            ]);

            // pre load theme
            var theme = e.model.queryValue("editors/code/@theme");
            if (theme)
                require([theme], function() {});

            // pre load custom mime types
            _self.getCustomTypes(e.model);
        });

        settings.addSettings("Code Editor", markupSettings);

        ide.addEventListener("tab.afterswitch", function(e) {
            var editor = _self.amlEditor;
            if (typeof editor !== "undefined") {
                // path without dav prefix and without trailing slashes
                var path = (e.nextPage.name.indexOf(e.currentTarget.davPrefix) === 0 ?
                    e.nextPage.name.substr(e.currentTarget.davPrefix.length) :
                    e.nextPage.name).replace(/^\/+/, "")
                
                editor.afterOpenFile(editor.getSession(), path);
            }
        });

        // Override ACE key bindings (conflict with goto definition)
        commands.commands.togglerecording.bindKey = { mac: "Command-Shift-R", win: "Alt-Shift-R" };
        commands.commands.replaymacro.bindKey = { mac: "Command-Ctrl-R", win: "Alt-R" };
        commands.addCommand(commands.commands.togglerecording);
        commands.addCommand(commands.commands.replaymacro);

        c = 20000;
        this.menus.push(
            menus.addItemByPath("Tools/~", new apf.divider(), c += 100),
            addEditorMenu("Tools/Toggle Macro Recording", "togglerecording"), //@todo this needs some more work
            addEditorMenu("Tools/Play Macro", "replaymacro")//@todo this needs some more work
        );

        var c = 600;
        this.menus.push(
            menus.addItemByPath("Edit/~", new apf.divider(), c += 100),
            menus.addItemByPath("Edit/Line/", null, c += 100),
            menus.addItemByPath("Edit/Comment/", null, c += 100),
            menus.addItemByPath("Edit/Text/", null, c += 100),
            menus.addItemByPath("Edit/Code Folding/", null, c += 100),
            menus.addItemByPath("Edit/Convert Case/", null, c += 100)
        );

        function addEditorMenu(path, commandName) {
            return menus.addItemByPath(path, new apf.item({
                command : commandName
            }), c += 100);
        }

        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Line/Indent", "indent"),
            addEditorMenu("Edit/Line/Outdent", "outdent"),
            addEditorMenu("Edit/Line/Move Line Up", "movelinesup"),
            addEditorMenu("Edit/Line/Move Line Down", "movelinesdown"),

            menus.addItemByPath("Edit/Line/~", new apf.divider(), c += 100),
            addEditorMenu("Edit/Line/Copy Lines Up", "copylinesup"),
            addEditorMenu("Edit/Line/Copy Lines Down", "copylinesdown"),

            menus.addItemByPath("Edit/Line/~", new apf.divider(), c += 100),
            addEditorMenu("Edit/Line/Remove Line", "removeline"),
            addEditorMenu("Edit/Line/Remove to Line End", "removetolineend"),
            addEditorMenu("Edit/Line/Remove to Line Start", "removetolinestart"),

            menus.addItemByPath("Edit/Line/~", new apf.divider(), c += 100),
            addEditorMenu("Edit/Line/Split Line", "splitline")
        );

        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Comment/Toggle Comment", "togglecomment")
        );

        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Text/Remove Word Right", "removewordright"),
            addEditorMenu("Edit/Text/Remove Word Left", "removewordleft"),

            menus.addItemByPath("Edit/Text/~", new apf.divider(), c += 100),
            addEditorMenu("Edit/Text/Transpose Letters", "transposeletters")
        );

        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Code Folding/Fold", "fold"),
            addEditorMenu("Edit/Code Folding/Unfold", "unfold"),

            menus.addItemByPath("Edit/Code Folding/~", new apf.divider(), c += 100),
            addEditorMenu("Edit/Code Folding/Fold All", "foldall"),
            addEditorMenu("Edit/Code Folding/Unfold All", "unfoldall")
        );

        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Convert Case/Upper Case", "touppercase"),
            addEditorMenu("Edit/Convert Case/Lower Case", "tolowercase")
        );

        c = 0;
        this.menus.push(
            addEditorMenu("Selection/Select All", "selectall"),
            addEditorMenu("Selection/Split Into Lines", "splitIntoLines"),
            addEditorMenu("Selection/Single Selection", "singleSelection"),

            menus.addItemByPath("Selection/~", new apf.divider(), c += 100),
            menus.addItemByPath("Selection/Multiple Selections/", null, c += 100),

            menus.addItemByPath("Selection/~", new apf.divider(), c += 100),
            addEditorMenu("Selection/Select Word Right", "selectwordright"),
            addEditorMenu("Selection/Select Word Left", "selectwordleft"),

            menus.addItemByPath("Selection/~", new apf.divider(), c += 100),
            addEditorMenu("Selection/Select to Line End", "selecttolineend"),
            addEditorMenu("Selection/Select to Line Start", "selecttolinestart"),

            menus.addItemByPath("Selection/~", new apf.divider(), c += 100),
            addEditorMenu("Selection/Select to Document End", "selecttoend"),
            addEditorMenu("Selection/Select to Document Start", "selecttostart")
        );

        c = 0;
        this.menus.push(
            addEditorMenu("Selection/Multiple Selections/Add Cursor Up", "addCursorAbove"),
            addEditorMenu("Selection/Multiple Selections/Add Cursor Down", "addCursorBelow"),
            addEditorMenu("Selection/Multiple Selections/Move Active Cursor Up", "addCursorAboveSkipCurrent"),
            addEditorMenu("Selection/Multiple Selections/Move Active Cursor Down", "addCursorBelowSkipCurrent"),

            menus.addItemByPath("Selection/Multiple Selections/~", new apf.divider(), c += 100),
            addEditorMenu("Selection/Multiple Selections/Add Next Selection Match", "selectMoreAfter"),
            addEditorMenu("Selection/Multiple Selections/Add Previous Selection Match", "selectMoreBefore"),

            menus.addItemByPath("Selection/Multiple Selections/~", new apf.divider(), c += 100),
            addEditorMenu("Selection/Multiple Selections/Merge Selection Range", "splitIntoLines")
        );

        var grpSyntax, grpNewline;

        /**** View ****/
        this.menus.push(
            menus.addItemByPath("View/Gutter", new apf.item({
                type    : "check",
                checked : "[{require('core/settings').model}::editors/code/@gutter]"
            }), 500),

            menus.addItemByPath("View/~", new apf.divider(), 290000),

            menus.addItemByPath("View/Syntax/", new apf.menu({
                "onprop.visible" : function(e){
                    if (e.value) {
                        if (!editors.currentEditor || !editors.currentEditor.ceEditor)
                            this.disable();
                        else {
                            this.enable();

                            var page = tabEditors.getPage();
                            var node = page && page.$model.data;
                            grpSyntax.setValue(node
                                && node.getAttribute("customtype") || "auto");
                        }
                    }
                },
                "onitemclick" : function(e) {
                    _self.setSyntax(e.relatedNode.value);
                }
            }), 300000),

            grpNewline = new apf.group(),

            menus.addItemByPath("View/Newline Mode/", new apf.menu({
                "onprop.visible" : function(e){
                    if (e.value) {
                        grpNewline.setValue(
                            settings.model.queryValue("editors/code/@newlinemode"));
                    }
                },
                "onitemclick" : function(e){
                    settings.model.setQueryValue("editors/code/@newlinemode",
                        e.relatedNode.value);
                }
            }), 310000),

            menus.addItemByPath("View/Newline Mode/Auto", new apf.item({
                type    : "radio",
                value   : "auto",
                group   : grpNewline
            }), 100),

            menus.addItemByPath("View/Newline Mode/~", new apf.divider(), 110),

            menus.addItemByPath("View/Newline Mode/Windows (CRLF)", new apf.item({
                type    : "radio",
                value   : "windows",
                group   : grpNewline
            }), 200),

            menus.addItemByPath("View/Newline Mode/Unix (LF)", new apf.item({
                type    : "radio",
                value   : "unix",
                group   : grpNewline
            }), 300),

            menus.addItemByPath("View/~", new apf.divider(), 400000),

            menus.addItemByPath("View/Wrap Lines", new apf.item({
                type    : "check",
                checked : "[{tabEditors.activepage && tabEditors.getPage(tabEditors.activepage).$model}::@wrapmode]",
                isAvailable : function(editor){
                    return editor && editor.ceEditor;
                }
            }), 500000),

            menus.addItemByPath("View/Wrap To Viewport", new apf.item({
                id : "mnuWrapView",
                type     : "check",
                checked  : "[{require('core/settings').model}::editors/code/@wrapmodeViewport]",
                isAvailable : function(editor){
                    if (!editor || !editor.ceEditor)
                        return false;
                        
                    var page = tabEditors.getPage();
                    if (page.$model) 
                        return apf.isTrue(page.$model.queryValue("@wrapmode"));
                    
                    return false;
                }
            }), 600000)
        );

        c = 0;
        this.menus.push(
            grpSyntax = new apf.group(),

            menus.addItemByPath("View/Syntax/Auto-Select", new apf.item({
                type: "radio",
                value: "auto",
                group : grpSyntax
            }), c += 100),

            menus.addItemByPath("View/Syntax/Plain Text", new apf.item({
                type: "radio",
                value: "text/plain",
                group : grpSyntax
            }), c += 100),

            menus.addItemByPath("View/Syntax/~", new apf.divider(), c += 100)
        );

        for (var mode in ModesCaption) {
            if (ModesCaption[mode][3] == "hidden")
                continue;
            this.menus.push(
                menus.addItemByPath("View/Syntax/" + mode, new apf.item({
                    type: "radio",
                    value: ModesCaption[mode],
                    group : grpSyntax
                }), c += 100)
            );
        }

        c = 0;
        this.menus.push(
            /**** Goto ****/

            menus.addItemByPath("Goto/~", new apf.divider(), c = 399),

            addEditorMenu("Goto/Word Right", "gotowordright"),
            addEditorMenu("Goto/Word Left", "gotowordleft"),
            menus.addItemByPath("Goto/~", new apf.divider(), 600),

            addEditorMenu("Goto/Line End", "gotolineend"),
            addEditorMenu("Goto/Line Start", "gotolinestart"),
            menus.addItemByPath("Goto/~", new apf.divider(), c += 100),

            addEditorMenu("Goto/Jump to Matching Brace", "jumptomatching"),
            menus.addItemByPath("Goto/~", new apf.divider(), c += 100),

            addEditorMenu("Goto/Scroll to Selection", "centerselection")
        );
    },

    init: function(amlPage) {
        var _self = this;

        this.ceEditor = this.amlEditor = ceEditor;
        this.amlEditor.show();

        this.amlEditor.$editor.$nativeCommands = ceEditor.$editor.commands;
        this.amlEditor.$editor.commands = commands;

        // preload common language modes
        var noop = function() {};
        ceEditor.getMode("javascript", noop);
        ceEditor.getMode("html", noop);
        ceEditor.getMode("css", noop);

        ide.addEventListener("reload", function(e) {
            var doc = e.doc;
            doc.state = doc.$page.$editor.getState
                && doc.$page.$editor.getState(doc);
        });

        ide.addEventListener("afterreload", function(e) {
            var doc         = e.doc;
            var acesession  = doc.acesession;

            if (!acesession)
                return;

            acesession.doc.setValue(e.data);

            if (doc.state) {
                var editor = doc.$page.$editor;
                editor.setState && editor.setState(doc, doc.state);
            }
        });

        ide.addEventListener("updatefile", function(e){
            var page = tabEditors.getPage(e.xmlNode.getAttribute("path"));
            if (!page || !page.$doc || !page.$doc.acesession)
                return;

            // this needs to be called after rename but there is only event before
            setTimeout(function() {
                var doc = page.$doc;
                var syntax = _self.getSyntax(doc.getNode());
                // This event is triggered also when closing files, so session may be gone already.
                if(doc.acesession) {
                    doc.acesession.setMode(ceEditor.getMode(syntax));
                    doc.acesession.syntax = syntax;
                }
            });
        });

        ide.addEventListener("afteroffline", function(){
            menus.menus["View/Syntax"].disable();
        });

        ide.addEventListener("afteronline", function(){
            menus.menus["View/Syntax"].enable();
        });
        
        ide.addEventListener("animate", function(e){
            if (!ceEditor.$ext.offsetHeight)
                return;
        
            if (e.type == "editor") {
                var renderer = ceEditor.$editor.renderer;
                renderer.onResize(true, null, null, ceEditor.getHeight() + e.delta);
            }
            else if (e.type == "splitbox") {
                if (e.options.height != undefined && apf.isChildOf(e.other, ceEditor, true)) {
                    var delta = e.which.getHeight() - parseInt(e.options.height);
                    if (delta < 0) return;
                    
                    var renderer = ceEditor.$editor.renderer;
                    renderer.onResize(true, null, null, ceEditor.getHeight() + delta);
                }
                else if (e.options.width != undefined && apf.isChildOf(e.other, ceEditor, true)) {
                    var delta = e.which.getWidth() - parseInt(e.options.width);
                    if (delta < 0) return;
                    
                    var renderer = ceEditor.$editor.renderer;
                    renderer.onResize(true, null, ceEditor.getWidth() + delta);
                }
            }
        });
    },

    /**
     * Saves custom syntax for extension type in settings.xml
     *
     * @param {String|xmlNode} ext Contains the extension type shorthand
     * @param {String} mode ace mode the extension will be related to
     */
    setCustomType: function(ext, mode) {
        var node;

        if (typeof ext === "string") {
            node = settings.model.queryNode('auto/customtypes/mime[@ext="' + ext + '"]');
            if (!node && mode)
                node = settings.model.appendXml('<mime ext="' + ext + '" />', "auto/customtypes");
        } else {
            var name = ext.getAttribute("name") || "";
            node = settings.model.queryNode('auto/customtypes/mime[@filename="' + name + '"]');
            if (node)
                apf.xmldb.removeAttribute(node, "ext");
            else if (mode)
                node = settings.model.appendXml('<mime filename="' + name + '" />', "auto/customtypes");
        }
        if (mode)
            apf.xmldb.setAttribute(node, "name", mode);
        else if (node)
            apf.xmldb.removeNode(node);
        settings.save();
        return mode && SupportedModes[mode].mime;
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
            var ext = n.getAttribute("filename");
            ext = ext ? "*" + ext : n.getAttribute("ext");
            var mode = n.getAttribute("name");
            // old settings contained contenttype instead of mode
            if (contentTypes[mode])
                mode = contentTypes[mode];
            if (SupportedModes[mode])
                fileExtensions[ext] = mode;
        });
    },

    enable : function() {
        if (this.disabled === false)
            return;

        this.disabled = false;

        this.menus.each(function(item){
            item.enable();
        });

        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function() {
        if (this.disabled)
            return;

        this.disabled = true;

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

        commands.removeCommands(defaultCommands);
        commands.removeCommands(MultiSelectCommands);

        this.nodes.each(function(item){
            item.destroy(true, true);
        });

        if (this.amlEditor) {
            this.amlEditor.destroy(true, true);
            mnuSyntax.destroy(true, true);
        }

        this.nodes = [];
    }
});

});
