/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

/*global tabEditors mnuSyntax codeEditor_dontEverUseThisVariable */

require("ppc/elements/codeeditor");

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var EditSession = require("ace/edit_session").EditSession;
var Document = require("ace/document").Document;
var Range = require("ace/range").Range;
var MultiSelectCommands = require("ace/multi_select").commands;
var defaultCommands = require("ace/commands/default_commands").commands;
var markup = require("text!ext/code/code.xml");
var settings = require("ext/settings/settings");
var themes = require("ext/themes/themes");
var markupSettings = require("text!ext/code/settings.xml");
var editors = require("ext/editors/editors");
var UndoManager = require("ace/undomanager").UndoManager;

require("ace/config").setDefaultValue("renderer", "vScrollBarAlwaysVisible", true);

var modes = require("./modes");
var SupportedModes = modes.all;

var fileExtensions = modes.extensions;
var ModesCaption = modes.captions;
var contentTypes = modes.types;

module.exports = ext.register("ext/code/code", {
    name    : "Code Editor",
    extName : "ext/code/code",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    markup  : markup,
    deps    : [editors],

    nodes : [],
    menus : [],

    fileExtensions : Object.keys(fileExtensions),
    supportedModes : Object.keys(SupportedModes),
    prevSelection : null,

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
        var ext;

        if (mode) {
            ext = contentTypes[mode.split(";")[0]] ;
            if (ext)
                mode = fileExtensions[contentTypes[mode]];
        }
        else {
            var fileName = node.getAttribute("name");
            var dotI = fileName.lastIndexOf(".") + 1;
            ext = dotI ? fileName.substr(dotI).toLowerCase() : "*" + fileName;
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

            ppc.xmldb.setAttribute(file, "customtype", value);
            fileExtensions[ext] = value;
        }
        else {
            ppc.xmldb.removeAttribute(file, "customtype", "");

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
        if (this.amlEditor)
            this.amlEditor.setAttribute("syntax", this.getSyntax(file));
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

        var amlEditor = this.amlEditor;

        if (doc.acesession) {
            amlEditor.setProperty("value", doc.acesession);
        }
        else {
            doc.isInited = doc.hasValue();
            doc.acedoc = doc.acedoc || new Document(doc.getValue() || "");
            var syntax = _self.getSyntax(doc.getNode());
            var mode = amlEditor.getMode(syntax);
            doc.acesession = new EditSession(doc.acedoc, mode);
            doc.acesession.syntax = syntax;
            doc.acedoc = doc.acesession.getDocument();
            doc.acesession.c9doc = doc;

            doc.acesession.setUndoManager(new UndoManager());
            
            if (doc.isInited && doc.state)
                 _self.setState(doc, doc.state);

            var onPropValue;
            doc.addEventListener("prop.value", onPropValue = function(e) {
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

                amlEditor.setAttribute("syntax", syntax);
                amlEditor.setAttribute("value", doc.acesession);
                // force tokenize first visible rows
                var rowCount = Math.min(50, doc.acesession.getLength());
                doc.acesession.bgTokenizer.getTokens(0, rowCount);
            });

            if (!isLazy)
                amlEditor.setProperty("value", doc.acesession || "");

            var onRetrieveValue;
            doc.addEventListener("retrievevalue", onRetrieveValue = function(e) {
                if (this.editor != _self || !doc)
                    return;

                if (!doc.isInited)
                    return e.value;
                else
                    return doc.acesession.getValue();
            });

            var onClose;
            doc.addEventListener("close", onClose = function(e){
                if (this.editor != _self)
                    return;

                doc.removeEventListener("close", onClose);
                doc.removeEventListener("retrievevalue", onRetrieveValue);
                doc.removeEventListener("prop.value", onPropValue);

                //??? destroy doc.acesession
                setTimeout(function() {
                    if (doc.acedoc) {
                        doc.acedoc.$lines = [];
                        doc.acedoc._eventRegistry = null;
                        doc.acedoc._defaultHandlers = null;
                        doc.acedoc = null;
                    }
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
            
            doc.acesession.addEventListener("change", function(e) {
              if(doc.isInited) {
                doc.$page.dispatchEvent("afterchange", {
                  action   : "do"
                });
              }
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
        this.wrapAceCommands();

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
                ["behaviors", "true"],
                ["wrapbehaviors", "false"],
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

            // Enable bracket insertion by default, even if it was disabled before,
            // migrating old users that had it disabled by default
            var defaulted = e.model.queryValue("editors/code/@behaviorsdefaulted");
            if (defaulted !== "true") {
                e.model.setQueryValue("editors/code/@behaviorsdefaulted", "true");
                e.model.setQueryValue("editors/code/@behaviors", "true");
                e.model.setQueryValue("editors/code/@wrapbehaviors", "false");
            }

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
                    e.nextPage.name).replace(/^\/+/, "");

                editor.afterOpenFile(editor.getSession(), path);
            }
        });

        this.registerMenuItems();
    },

    wrapAceCommands: function() {
        var fnWrap = function(command){
            command.readOnly = command.readOnly || false;
            command.focusContext = true;

            var isAvailable = command.isAvailable;
            command.isAvailable = function(editor, event) {
                if (event instanceof KeyboardEvent &&
                 (!ppc.activeElement || ppc.activeElement.localName != "codeeditor"))
                    return false;

                return isAvailable ? isAvailable(editor) : true;
            };

            command.findEditor = function(editor) {
                if (editor && editor.amlEditor)
                    return editor.amlEditor.$editor;
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


        // Override ACE key bindings (conflict with goto definition)
        commands.commands.togglerecording.bindKey = { mac: "Command-Shift-R", win: "Alt-Shift-R" };
        commands.commands.replaymacro.bindKey = { mac: "Command-Ctrl-R", win: "Alt-R" };
        commands.addCommand(commands.commands.togglerecording);
        commands.addCommand(commands.commands.replaymacro);
    },

    registerMenuItems: function() {
        var _self = this;
        var c = 20000;
        this.menus.push(
            menus.addItemByPath("Tools/~", new ppc.divider(), c += 100),
            addEditorMenu("Tools/Toggle Macro Recording", "togglerecording"), //@todo this needs some more work
            addEditorMenu("Tools/Play Macro", "replaymacro")//@todo this needs some more work
        );

        c = 600;
        this.menus.push(
            menus.addItemByPath("Edit/~", new ppc.divider(), c += 100),
            menus.addItemByPath("Edit/Line/", null, c += 100),
            menus.addItemByPath("Edit/Comment/", null, c += 100),
            menus.addItemByPath("Edit/Text/", null, c += 100),
            menus.addItemByPath("Edit/Code Folding/", null, c += 100),
            menus.addItemByPath("Edit/Convert Case/", null, c += 100)
        );

        function addEditorMenu(path, commandName) {
            return menus.addItemByPath(path, new ppc.item({
                command : commandName
            }), c += 100);
        }

        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Line/Indent", "indent"),
            addEditorMenu("Edit/Line/Outdent", "outdent"),
            addEditorMenu("Edit/Line/Move Line Up", "movelinesup"),
            addEditorMenu("Edit/Line/Move Line Down", "movelinesdown"),

            menus.addItemByPath("Edit/Line/~", new ppc.divider(), c += 100),
            addEditorMenu("Edit/Line/Copy Lines Up", "copylinesup"),
            addEditorMenu("Edit/Line/Copy Lines Down", "copylinesdown"),

            menus.addItemByPath("Edit/Line/~", new ppc.divider(), c += 100),
            addEditorMenu("Edit/Line/Remove Line", "removeline"),
            addEditorMenu("Edit/Line/Remove to Line End", "removetolineend"),
            addEditorMenu("Edit/Line/Remove to Line Start", "removetolinestart"),

            menus.addItemByPath("Edit/Line/~", new ppc.divider(), c += 100),
            addEditorMenu("Edit/Line/Split Line", "splitline")
        );

        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Comment/Toggle Comment", "togglecomment")
        );

        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Text/Align", "alignCursors"),
            addEditorMenu("Edit/Text/Sort Lines", "sortlines"),
            menus.addItemByPath("Edit/Text/~", new ppc.divider(), c += 100),
            addEditorMenu("Edit/Text/Increase Number at Cursor", "modifyNumberUp"),
            addEditorMenu("Edit/Text/Decrease Number at Cursor", "modifyNumberDown"),
            menus.addItemByPath("Edit/Text/~", new ppc.divider(), c += 100),
            addEditorMenu("Edit/Text/Remove Word Right", "removewordright"),
            addEditorMenu("Edit/Text/Remove Word Left", "removewordleft"),
            menus.addItemByPath("Edit/Text/~", new ppc.divider(), c += 100),
            addEditorMenu("Edit/Text/Transpose Letters", "transposeletters")
        );

        c = 0;
        this.menus.push(
            addEditorMenu("Edit/Code Folding/Fold", "fold"),
            addEditorMenu("Edit/Code Folding/Unfold", "unfold"),

            menus.addItemByPath("Edit/Code Folding/~", new ppc.divider(), c += 100),
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

            menus.addItemByPath("Selection/~", new ppc.divider(), c += 100),
            menus.addItemByPath("Selection/Multiple Selections/", null, c += 100),

            menus.addItemByPath("Selection/~", new ppc.divider(), c += 100),
            addEditorMenu("Selection/Select Word Right", "selectwordright"),
            addEditorMenu("Selection/Select Word Left", "selectwordleft"),

            menus.addItemByPath("Selection/~", new ppc.divider(), c += 100),
            addEditorMenu("Selection/Select to Line End", "selecttolineend"),
            addEditorMenu("Selection/Select to Line Start", "selecttolinestart"),

            menus.addItemByPath("Selection/~", new ppc.divider(), c += 100),
            addEditorMenu("Selection/Select to Document End", "selecttoend"),
            addEditorMenu("Selection/Select to Document Start", "selecttostart")
        );

        c = 0;
        this.menus.push(
            addEditorMenu("Selection/Multiple Selections/Add Cursor Up", "addCursorAbove"),
            addEditorMenu("Selection/Multiple Selections/Add Cursor Down", "addCursorBelow"),
            addEditorMenu("Selection/Multiple Selections/Move Active Cursor Up", "addCursorAboveSkipCurrent"),
            addEditorMenu("Selection/Multiple Selections/Move Active Cursor Down", "addCursorBelowSkipCurrent"),

            menus.addItemByPath("Selection/Multiple Selections/~", new ppc.divider(), c += 100),
            addEditorMenu("Selection/Multiple Selections/Add Next Selection Match", "selectMoreAfter"),
            addEditorMenu("Selection/Multiple Selections/Add Previous Selection Match", "selectMoreBefore"),

            menus.addItemByPath("Selection/Multiple Selections/~", new ppc.divider(), c += 100),
            addEditorMenu("Selection/Multiple Selections/Merge Selection Range", "splitIntoLines")
        );

        var grpSyntax, grpNewline;

        /**** View ****/
        this.menus.push(
            menus.addItemByPath("View/Gutter", new ppc.item({
                type    : "check",
                checked : "[{require('core/settings').model}::editors/code/@gutter]"
            }), 500),

            menus.addItemByPath("View/~", new ppc.divider(), 290000),

            menus.addItemByPath("View/Syntax/", new ppc.menu({
                "onprop.visible" : function(e){
                    if (e.value) {
                        if (!editors.currentEditor || !editors.currentEditor.amlEditor)
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

            grpNewline = new ppc.group(),

            menus.addItemByPath("View/Newline Mode/", new ppc.menu({
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

            menus.addItemByPath("View/Newline Mode/Auto", new ppc.item({
                type    : "radio",
                value   : "auto",
                group   : grpNewline
            }), 100),

            menus.addItemByPath("View/Newline Mode/~", new ppc.divider(), 110),

            menus.addItemByPath("View/Newline Mode/Windows (CRLF)", new ppc.item({
                type    : "radio",
                value   : "windows",
                group   : grpNewline
            }), 200),

            menus.addItemByPath("View/Newline Mode/Unix (LF)", new ppc.item({
                type    : "radio",
                value   : "unix",
                group   : grpNewline
            }), 300),

            menus.addItemByPath("View/~", new ppc.divider(), 400000),

            menus.addItemByPath("View/Wrap Lines", new ppc.item({
                type    : "check",
                checked : "[{tabEditors.activepage && tabEditors.getPage(tabEditors.activepage).$model}::@wrapmode]"
            }), 500000),

            menus.addItemByPath("View/Wrap To Viewport", new ppc.item({
                id : "mnuWrapView",
                type     : "check",
                checked  : "[{require('core/settings').model}::editors/code/@wrapmodeViewport]"
            }), 600000)
        );

        c = 0;

        var otherGrpSyntax;
        this.menus.push(
            grpSyntax = new ppc.group(),

            menus.addItemByPath("View/Syntax/Auto-Select", new ppc.item({
                type: "radio",
                value: "auto",
                group : grpSyntax
            }), c += 100),

            menus.addItemByPath("View/Syntax/Plain Text", new ppc.item({
                type: "radio",
                value: "text",
                group : grpSyntax
            }), c += 100),

            otherGrpSyntax = window.otherGrpSyntax = new ppc.group({
                type : ""
            }),

            menus.addItemByPath("View/Syntax/Other", new ppc.item({
                group : otherGrpSyntax
            }), c + 90000),

            menus.addItemByPath("View/Syntax/~", new ppc.divider(), c += 100)
        );

        function onModeClick(e) {
            if (!_self.prevSelection)
                _self.prevSelection = this;
            else {
                _self.prevSelection.uncheck();
                if (_self.prevSelection.group.selectedItem.caption == "Other") {
                    _self.prevSelection.group.selectedItem.$ext.setAttribute("class", "menu_item submenu");
                }
                _self.prevSelection = this;
            }
            _self.setSyntax(e.currentTarget.value);
        }

        for (var key in SupportedModes) {
            var mode = SupportedModes[key];
            if (mode.hidden)
                continue;
            
            this.menus.push(
                menus.addItemByPath("View/Syntax/" + (mode.isPrimary ? mode.caption : "Other/" + mode.caption), new ppc.item({
                    type: "radio",
                    value: mode.id,
                    group : mode.isPrimary ? grpSyntax : otherGrpSyntax,
                    onclick : onModeClick
                }), c += 100)
            );
        }
        
        var syntaxMenu = window[menus.getMenuId("View/Syntax/Other")];
        syntaxMenu.addEventListener("prop.visible", function(){
            syntaxMenu.$ext.style.maxHeight = window.innerHeight - 50 + "px";
            syntaxMenu.$ext.style.overflowY = "auto";
        })
        
        c = 0;
        this.menus.push(
            /**** Goto ****/

            menus.addItemByPath("Goto/~", new ppc.divider(), c = 399),

            addEditorMenu("Goto/Word Right", "gotowordright"),
            addEditorMenu("Goto/Word Left", "gotowordleft"),
            menus.addItemByPath("Goto/~", new ppc.divider(), 600),

            addEditorMenu("Goto/Line End", "gotolineend"),
            addEditorMenu("Goto/Line Start", "gotolinestart"),
            menus.addItemByPath("Goto/~", new ppc.divider(), c += 100),

            addEditorMenu("Goto/Jump to Matching Brace", "jumptomatching"),
            menus.addItemByPath("Goto/~", new ppc.divider(), c += 100),

            addEditorMenu("Goto/Scroll to Selection", "centerselection")
        );

        ide.addEventListener("tab.afterswitch", function(e) {
            var method = e.nextPage.$editor.path != "ext/code/code" ? "disable" : "enable";

            menus.menus["Edit"][method]();
            menus.menus["Selection"][method]();
            menus.menus["Find"][method]();
            menus.menus["View/Syntax"][method]();
            menus.menus["View/Font Size"][method]();
            menus.menus["View/Syntax/Other"][method]();
            menus.menus["View/Syntax"][method]();
            menus.menus["View/Newline Mode"][method]();
            // WY U NO WORK??
            menus.menus["Goto"][method]();
        });
    },

    init: function(amlPage) {
        var _self = this;

        _self.amlEditor = codeEditor_dontEverUseThisVariable;
        _self.amlEditor.show();

        _self.amlEditor.$editor.$nativeCommands = _self.amlEditor.$editor.commands;
        _self.amlEditor.$editor.commands = commands;

        // preload common language modes
        var noop = function() {};
        _self.amlEditor.getMode("javascript", noop);
        _self.amlEditor.getMode("html", noop);
        _self.amlEditor.getMode("css", noop);

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

            if (acesession.doc.getValue() === e.data) {
                return;
            }

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
                    doc.acesession.setMode(_self.amlEditor.getMode(syntax));
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
            if (!_self.amlEditor.$ext.offsetHeight)
                return;

            var renderer, delta;
            if (e.type == "editor") {
                renderer = _self.amlEditor.$editor.renderer;
                renderer.onResize(true, null, null, _self.amlEditor.getHeight() + e.delta);
            }
            else if (e.type == "splitbox") {
                if (e.options.height !== undefined && ppc.isChildOf(e.other, _self.amlEditor, true)) {
                    delta = e.which.getHeight() - Number(e.options.height);
                    if (delta < 0) return;

                    renderer = _self.amlEditor.$editor.renderer;
                    renderer.onResize(true, null, null, _self.amlEditor.getHeight() + delta);
                }
                else if (e.options.width !== undefined && ppc.isChildOf(e.other, _self.amlEditor, true)) {
                    delta = e.which.getWidth() - Number(e.options.width);
                    if (delta < 0) return;

                    renderer = _self.amlEditor.$editor.renderer;
                    renderer.onResize(true, null, _self.amlEditor.getWidth() + delta);
                }
            }
        });

        // display feedback while loading files
        var isOpen, bgMessage, loaderProgress, loaderBg, updateProgressInterval, animationEndTimeout;
        var checkLoading = function(e) {
            if (!_self.amlEditor.xmlRoot)
                return;
            var xmlRoot = _self.amlEditor.xmlRoot;
            var loading = xmlRoot.hasAttribute("loading");
            var container = _self.amlEditor.$editor.container;

            // loading calcs
            var padding = container.offsetWidth / 5;
            var loadingWidth = container.offsetWidth - 2*padding;

            function updateProgress (progress) {
                xmlRoot.setAttribute("loading_progress", progress);
                loaderProgress.style.width = (progress * loadingWidth / 100) + "px";
            }

            function clearProgress() {
                xmlRoot.setAttribute("loading_progress", 0);
                loaderProgress.style.width = 0 + "px";
            }

            if (loading) {
                var theme = themes.getActiveTheme();
                if (!bgMessage) {
                    bgMessage = document.createElement("div");
                    bgMessage.className = "ace_smooth_loading";

                    loaderBg = document.createElement("div");
                    loaderBg.className = "loading_bg";

                    bgMessage.appendChild(loaderBg);

                    loaderProgress = document.createElement("div");
                    loaderProgress.className = "loading_progress";
                    bgMessage.appendChild(loaderProgress);
                    updateProgress(10);
                }

                if (!bgMessage.parentNode)
                    container.parentNode.appendChild(bgMessage);

                bgMessage.style.backgroundColor = theme ? theme.bg : "gray";
                loaderBg.style.width = loadingWidth + "px";
                loaderBg.style.left = padding + "px";
                loaderBg.style.top = 0.4 * container.offsetHeight + "px";
                loaderProgress.style.left = padding + "px";
                loaderProgress.style.top = 0.4 * container.offsetHeight + "px";
                container.style.transitionProperty = "opacity";
                container.style.transitionDuration = "100ms";
                container.style.pointerEvents = "none";
                container.style.opacity = 0;
                isOpen = true;

                clearInterval(updateProgressInterval);
                updateProgressInterval = setInterval(function () {
                    var progress = parseFloat(xmlRoot.getAttribute("loading_progress"), 10);
                    var step;
                    if (progress < 35)
                        step = 3;
                    else if (progress < 70)
                        step = 1;
                    else if (progress < 90)
                        step = 0.25;
                    if (step)
                        updateProgress(progress + step);
                }, 30);
                clearTimeout(animationEndTimeout);
            } else if (isOpen) {
                clearInterval(updateProgressInterval);
                updateProgress(100);
                setTimeout(function () {
                    isOpen = false;
                    clearProgress();
                    container.style.opacity = 1;
                    container.style.pointerEvents = "";
                }, 40);

                animationEndTimeout = setTimeout(function() {
                    if (bgMessage.parentNode)
                        bgMessage.parentNode.removeChild(bgMessage);
                }, 100);
            }
        };

        ide.addEventListener("openfile", function(){
            setTimeout(checkLoading, 0);
        });
        ide.addEventListener("afteropenfile", checkLoading);
        ide.addEventListener("tab.afterswitch", checkLoading);
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
                ppc.xmldb.removeAttribute(node, "ext");
            else if (mode)
                node = settings.model.appendXml('<mime filename="' + name + '" />', "auto/customtypes");
        }
        if (mode)
            ppc.xmldb.setAttribute(node, "name", mode);
        else if (node)
            ppc.xmldb.removeNode(node);
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
            customTypes = ppc.createNodeFromXpath(model.data, "auto/customtypes");

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
        this.$enable();

        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function() {
        this.$disable();

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

        if (this.amlEditor) {
            this.amlEditor.destroy(true, true);
            mnuSyntax.destroy(true, true);
        }
        this.$destroy();
    }
});

});


