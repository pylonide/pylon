/**
 * Searchinfiles Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*global tabEditors searchRow winSearchInFiles winSearchReplace  rbSFSelection
    txtSFFind chkSFRegEx tooltipSearchInFiles txtSFReplace txtSFPatterns
    trFiles chkSFMatchCase chkSFRegEx chkSFConsole tabConsole btnSFFind,
    chkSFWholeWords, grpSFScope */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var settings = require("core/settings");
var editors = require("ext/editors/editors");
var fs = require("ext/filesystem/filesystem");
var menus = require("ext/menus/menus");
var skin = require("text!ext/searchinfiles/skin.xml");
var markup = require("text!ext/searchinfiles/searchinfiles.xml");
var commands = require("ext/commands/commands");
var tooltip = require("ext/tooltip/tooltip");
var libsearch = require("ext/searchreplace/libsearch");
var searchreplace = require("ext/searchreplace/searchreplace");
var anims = require("ext/anims/anims");

// Ace dependencies
var EditSession = require("ace/edit_session").EditSession;
var Document = require("ace/document").Document;
var ProxyDocument = require("ext/code/proxydocument");

module.exports = ext.register("ext/searchinfiles/searchinfiles", apf.extend({
    name     : "Search in files",
    dev      : "Ajax.org",
    type     : ext.GENERAL,
    alone    : true,
    offline  : false,
    autodisable  : ext.ONLINE | ext.LOCAL,
    replaceAll : false,
    markup   : markup,
    skin     : {
        id   : "searchinfiles",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/searchinfiles/images/"
    },
    pageTitle: "Search Results",
    pageID   : "pgSFResults",

    nodes    : [],

    searchPage : null,
    searchFilePath : ide.davPrefix + "/search_results.c9search",
    searchContentType : "c9search",

    hook : function(){
        var _self = this;

        this.markupInsertionPoint = searchRow;

        commands.addCommand({
            name: "searchinfiles",
            hint: "search for a string through all files in the current workspace",
            bindKey: {mac: "Shift-Command-F", win: "Ctrl-Shift-F"},
            exec: function () {
                _self.toggleDialog(1);
            }
        });

        this.nodes.push(
            menus.addItemByPath("Find/~", new apf.divider(), 10000),
            menus.addItemByPath("Find/Find in Files...", new apf.item({
                command : "searchinfiles"
            }), 20000)
        );
    },

    init : function(amlNode){
        var _self = this;

        ide.addEventListener("settings.load", function(e){
            e.ext.setDefaults("editors/code/filesearch", [
                ["regex", "false"],
                ["matchcase", "false"],
                ["wholeword", "false"],
                ["console", "true"],
                ["consolelaunch", "false"]
            ]);
        });

        ide.addEventListener("c9searchclose", function(e){
            _self.searchPage = null;
        });

        commands.addCommand({
            name: "hidesearchinfiles",
            bindKey: {mac: "ESC", win: "ESC"},
            isAvailable : function(editor){
                return winSearchInFiles.visible;
            },
            exec: function(env, args, request) {
                _self.toggleDialog(-1);
            }
        });

        winSearchInFiles.addEventListener("prop.visible", function(e) {
            if (e.value) {
                if (trFiles)
                    trFiles.addEventListener("afterselect", _self.setSearchSelection);
                _self.setSearchSelection();
            }
            else {
                var editor = editors.currentEditor;
                if (editor)
                    editor.focus();

                if (trFiles)
                    trFiles.removeEventListener("afterselect",
                        _self.setSearchSelection);
            }
        });
        ide.addEventListener("init.ext/tree/tree", function(){
            trFiles.addEventListener("afterselect", _self.setSearchSelection);
        });

        txtSFFind.ace.session.on("change", function() {
            if (chkSFRegEx.checked)
                _self.checkRegExp(txtSFFind, tooltipSearchInFiles, winSearchInFiles);
        });
        this.addSearchKeyboardHandler(txtSFFind, "searchfiles");

        var kb = this.addSearchKeyboardHandler(txtSFReplace, "replacefiles");
        kb.bindKeys({
            "Return|Shift-Return": function(){ _self.replace(); }
        });

        kb = this.addSearchKeyboardHandler(txtSFPatterns, "searchwhere");
        kb.bindKeys({
            "Return|Shift-Return": function(){ _self.execFind(); }
        });

        var tt = document.body.appendChild(tooltipSearchInFiles.$ext);

        chkSFRegEx.addEventListener("prop.value", function(e){
            _self.$setRegexpMode(txtSFFind, apf.isTrue(e.value));
        });

        var cbs = winSearchInFiles.getElementsByTagNameNS(apf.ns.aml, "checkbox");
        cbs.forEach(function(cb){
            tooltip.add(cb.$ext, {
                message : cb.label,
                width : "auto",
                timeout : 0,
                tooltip : tt,
                animate : false,
                getPosition : function(){
                    var pos = apf.getAbsolutePosition(winSearchInFiles.$ext);
                    var left = pos[0] + cb.getLeft();
                    var top = pos[1];
                    return [left, top - 16];
                }
            });
        });

        ide.addEventListener("aftereditorfocus", function(e) {
            if (_self.searchConsole && _self.returnFocus)
                _self.searchConsole.focus();
        });
    },

    setSearchSelection: function(e){
        var selectedNode, name;

        if (trFiles) {
            // If originating from an event
            if (e && e.selected)
                selectedNode = e.selected;
            else
                selectedNode = this.getSelectedTreeNode();

            var filepath = selectedNode.getAttribute("path").split("/");

            name = "";
            // get selected node in tree and set it as selection
            if (selectedNode.getAttribute("type") == "folder")
                name = filepath[filepath.length - 1];
            else if (selectedNode.getAttribute("type") == "file")
                name = filepath[filepath.length - 2];

            if (name.length > 25)
                name = name.substr(0, 22) + "...";
        }
        else {
            var path = settings.model.queryValue("auto/tree_selection/@path");
            if (!path)
                return;

            var p;
            if ((name = (p = path.split("/")).pop()).indexOf(".") > -1)
                name = p.pop();
        }

        rbSFSelection.setAttribute("label", apf.escapeXML("Selection ( " + name + " )"));
    },

    getSelectedTreeNode: function() {
        var node = trFiles ? trFiles.selected : fs.model.queryNode("folder[1]");
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder[1]");
        while (node.tagName != "folder")
            node = node.parentNode;
        return node;
    },

    toggleDialog: function(force, isReplace, noselect, callback) {
        var _self = this;

        ext.initExtension(this);

        tooltipSearchInFiles.$ext.style.display = "none";

        var animate = apf.isTrue(settings.model.queryValue("general/@animateui"));
        if (!force && !winSearchInFiles.visible || force > 0) {
            if (winSearchInFiles.visible) {
                txtSFFind.focus();
                txtSFFind.select();
                return;
            }

            if (searchreplace.inited && winSearchReplace.visible) {
                ext.initExtension(this);
                winSearchReplace.$ext.style.height = "0px";
                txtSFFind.focus();

                searchreplace.toggleDialog(-1, null, null, function(){
                    _self.toggleDialog(force, isReplace, noselect);
                });
                return;
            }

            winSearchInFiles.$ext.style.overflow = "hidden";
            winSearchInFiles.$ext.style.height =
                winSearchInFiles.$ext.offsetHeight + "px";

            this.position = -1;

            var editor = editors.currentEditor;
            if (editor && editor.getSelection) {
                var sel   = editor.getSelection();
                var doc   = editor.getDocument();
                var range = sel.getRange();
                var value = doc.getTextRange(range);

                if (value) {
                    txtSFFind.setValue(value);

                    this.$setRegexpMode(txtSFFind, chkSFRegEx.checked);
                }
            }

            searchRow.appendChild(winSearchInFiles);
            winSearchInFiles.show();
            txtSFFind.focus();
            txtSFFind.select();

            winSearchInFiles.$ext.scrollTop = 0;
            document.body.scrollTop = 0;

            //Animate
            if (animate) {
                anims.animateSplitBoxNode(winSearchInFiles, {
                    height: "102px",
                        timingFunction: "cubic-bezier(.10, .10, .25, .90)",
                        duration: 0.2
                    }, function() {
                    winSearchInFiles.$ext.style[apf.CSSPREFIX + "TransitionDuration"] = "";
                    winSearchInFiles.$ext.style.height = "";

                    setTimeout(function(){
                        apf.layout.forceResize();
                    }, 50);
                });
            }
            else {
                winSearchInFiles.$ext.style.height = "";
                apf.layout.forceResize();
            }
        }
        else if (winSearchInFiles.visible) {
            if (txtSFFind.getValue())
                _self.saveHistory(txtSFFind.getValue());

            //Animate
            if (animate && !apf.isGecko) {
                winSearchInFiles.visible = false;

                winSearchInFiles.$ext.style.height =
                    winSearchInFiles.$ext.offsetHeight + "px";

                anims.animateSplitBoxNode(winSearchInFiles, {
                    height: "0px",
                    timingFunction: "ease-in-out",
                    duration : 0.2
                }, function(){
                    winSearchInFiles.visible = true;
                    winSearchInFiles.hide();
                    winSearchInFiles.parentNode.removeChild(winSearchInFiles);

                    winSearchInFiles.$ext.style[apf.CSSPREFIX + "TransitionDuration"] = "";

                    if (!noselect && editors.currentEditor)
                        editors.currentEditor.amlEditor.focus();

                    setTimeout(function(){
                        callback
                            ? callback()
                            : apf.layout.forceResize();
                    }, 50);
                });
            }
            else {
                winSearchInFiles.hide();
                winSearchInFiles.parentNode.removeChild(winSearchInFiles);

                callback
                    ? callback()
                    : apf.layout.forceResize();
            }
        }

        return false;
    },

    searchinfiles: function() {
        this.toggleDialog(1);
    },

    getOptions: function() {
        var _self = this;

        return {
            query: txtSFFind.getValue(),
            needle: txtSFFind.getValue(),
            pattern: txtSFPatterns.getValue(),
            casesensitive: chkSFMatchCase.checked,
            regexp: chkSFRegEx.checked,
            replaceAll: _self.replaceAll,
            replacement: txtSFReplace.getValue(),
            wholeword: chkSFWholeWords.checked
        };
    },

    replace : function(){
        this.replaceAll = true;
        this.execFind();
        this.replaceAll = false;
    },

    execFind: function() {
        var _self = this;

        // Determine the scope of the search
        var path;
        if (grpSFScope.value == "projects") {
            path = ide.davPrefix;
        }
        else if (!trFiles) {
            path = settings.model.queryValue("auto/tree_selection/@path");
            if (!path)
                return;

            var p;
            if ((name = (p = path.split("/")).pop()).indexOf(".") > -1)
                name = p.pop();
        }
        if (!path) {
            var node = this.getSelectedTreeNode();
            path = node.getAttribute("path");
        }

        var options = this.getOptions();
        var query = txtSFFind.getValue();
        options.query = query.replace(/\n/g, "\\n");

        // even if there's text in the "replace" field, don't send it when not replacing
        if (!this.replaceAll)
            options.replacement = "";

        // prepare new Ace document to handle search results
        var node = apf.n("<file/>")
            .attr("name", "Search Results")
            .attr("path", this.searchFilePath)
            .attr("customtype", util.getContentType(this.searchContentType))
            .attr("tooltip", "Search Results")
            .attr("newfile", "0")
            .attr("ignore", "1")
            .attr("saving", "1")
            .node();

        var doc = ide.createDocument(node);

        // arrange beginning message
        var messageHeader = this.messageHeader(path, options);

        if (chkSFConsole.checked) {
            // show the console; require here is necessary for c9local, please do not change
            require("ext/console/console").show();

            this.makeSearchResultsPanel();

            // the search results already exist
            if (_self.consoleacedoc) {
                _self.appendLines(_self.consoleacedoc, messageHeader);
            }
            else {
                _self.searchConsole.$editor.setSession(new EditSession(new ProxyDocument(new Document(messageHeader)), "ace/mode/c9search"));
                _self.consoleacedoc = _self.searchConsole.$editor.session.getDocument().doc; // store a reference to the doc

                // set tab editor commands here
                _self.searchConsole.$editor.commands._defaultHandlers = commands._defaultHandlers;
                _self.searchConsole.$editor.commands.commands = commands.commands;
                _self.searchConsole.$editor.commands.commmandKeyBinding = commands.commmandKeyBinding;
                _self.searchConsole.$editor.getSession().setUndoManager(new apf.actiontracker());
            }

            _self.setHighlight(_self.searchConsole.$editor.getSession(), options.query);
        }
        else {
            if (_self.searchPage === null) { // the results are not open, create a new page
                doc.cachedValue = messageHeader;
                editors.gotoDocument({
                    doc      : doc,
                    node     : node,
                    forceOpen : true
                });

                _self.searchPage = ide.getActivePage();
                _self.searcheditor = _self.searchPage.$editor.amlEditor.$editor;
                _self.apfeditor = _self.searchPage.$editor.amlEditor;
                _self.tabacedoc = _self.searchPage.$doc.acedoc;
                _self.tabacedoc.node = node;

                apf.setStyleClass(_self.apfeditor.$ext, "aceSearchResults");

                _self.apfeditor.$editor.renderer.scroller.addEventListener("dblclick", function() {
                    _self.launchFileFromSearch(_self.apfeditor.$editor);
                });
            }
            else {
                _self.appendLines(_self.tabacedoc, messageHeader);
                tabEditors.set(tabEditors.getPages().indexOf(_self.searchPage) + 1);
            }

            _self.setHighlight(_self.searcheditor.getSession(), options.query);
        }

        if (options.query.length == 0)
            return;

        _self.toggleDialog(-1, null, true);

        this.firstRun = true;

        if (!this.$onMessage) {
            this.$onMessage = this.onMessage.bind(this)
            ide.addEventListener("socketMessage", this.$onMessage);
        }

        if (path.indexOf(ide.davPrefix) == 0)
            path = path.slice(ide.davPrefix.length).replace(/^\//,"");

        options.command = "codesearch";
        options.path = path;
        ide.send(options);

        this.saveHistory(options.query, "searchfiles");
        this.position = 0;

        ide.dispatchEvent("track_action", {type: "searchinfiles"});
    },

    onMessage : function(e) {
        var message = e.message;
        if (message.extra != "codesearch")
            return false;

        var doc = !chkSFConsole.checked ? this.tabacedoc : this.consoleacedoc;
        var editor = !chkSFConsole.checked ? this.searcheditor : this.searchConsole.$editor;
        if (this.firstRun) {
            var currLength = doc.getLength() - 2; // the distance to the last message
            editor.scrollToLine(currLength, false, true);
            this.firstRun = false;

        }
        this.appendLines(doc, message.data);

        // finish
        if (message.type == "exit") {
            var footer = ["\n"];
            // if process failed add that info to the message
            if (message.code && message.stderr) {
                footer.push("Search in files failed with code " + message.code +
                    " (" + message.stderr + ")");
            }
            else {
                // add info about the result of this search
                var footerData = { count: message.count, filecount: message.filecount };
                footer.push(this.messageFooter(footerData));
            }

            footer.push("\n", "\n", "\n");
            doc.insertLines(doc.getLength(), footer);

            if (!chkSFConsole.checked) {
                var node = doc.node;
                node.setAttribute("saving", "0");
                node.setAttribute("changed", "0");
            }
            btnSFFind.$ext.innerText = "Find";
            this.appendLines(doc, message);
        }
        return true;
    },

    launchFileFromSearch : function(editor) {
        var session = editor.getSession();
        var currRow = editor.getCursorPosition().row;

        var clickedLine = session.getLine(currRow).split(": "); // number:text
        if (clickedLine.length < 2) // some other part of the editor
            return;

        // "string" type is the parent filename
        while (currRow --> 0) {
            var token = session.getTokenAt(currRow, 0);
            if (token && token.type.indexOf("string") != -1)
                break;
        }

        var path = editor.getSession().getLine(currRow);

        if (path.charAt(path.length - 1) == ":")
            path = path.substring(0, path.length-1);

        // prevent double '//' in paths
        if(path[0] === '/')
            path = path.substring(1);

        if (!path)
            return;
        var row = parseInt(clickedLine[0], 10);
        var range = editor.getSelectionRange();
        var offset = clickedLine[0].length + 2;
        editors.gotoDocument({
            path: ide.davPrefix + "/" + path,
            row: row,
            column: range.start.column - offset,
            endColumn: range.end.column - offset
        });
    },

    appendLines : function(doc, content) {
        if (!content || (!content.length && !content.count)) // blank lines can get through
            return;

        if (typeof content == "string")
            content = content.split("\n");

        if (content.length > 0)
            doc.insertLines(doc.getLength(), content);
    },

    messageHeader : function(path, options) {
        var optionsDesc = [];

        if (options.regexp === true)
            optionsDesc.push("regexp");
        if (options.casesensitive === true)
            optionsDesc.push("case sensitive");
        if (options.wholeword === true)
            optionsDesc.push("whole word");

        if (optionsDesc.length > 0)
            optionsDesc = "(" + optionsDesc.join(", ") + ")";
        else
            optionsDesc = "";

        var replacement = "";
        if (this.replaceAll)
            replacement = "', replaced as '" + options.replacement ;

        return "Searching for '" + options.query + replacement + "' in " + path + optionsDesc + "\n";
    },

    messageFooter : function(countJSON) {
        var message = "Found " + countJSON.count;

        message += (countJSON.count > 1 || countJSON.count == 0) ? " matches" : " match";
        message += " in " + countJSON.filecount;
        message += (countJSON.filecount > 1 || countJSON.filecount == 0) ? " files" : " file";

        return message;
    },

    makeSearchResultsPanel : function() {
        var _self = this;
        // create editor if it does not exist
        if (this.$panel == null) {
            this.$panel = tabConsole.add(this.pageTitle, this.pageID);
            this.$panel.setAttribute("closebtn", true);

            tabConsole.set(this.pageID);

            this.searchConsole = this.$panel.appendChild(new apf.codeeditor({
                syntax            : "c9search",
                "class"           : "nocorner aceSearchConsole aceSearchResults",
                anchors           : "0 0 0 0",
                theme             : "ace/theme/monokai",
                overwrite         : "[{require('core/settings').model}::editors/code/@overwrite]",
                folding           : "true",
                behaviors         : "[{require('core/settings').model}::editors/code/@behaviors]",
                selectstyle       : "false",
                activeline        : "[{require('core/settings').model}::editors/code/@activeline]",
                gutterline        : "[{require('core/settings').model}::editors/code/@gutterline]",
                showinvisibles    : "false",
                showprintmargin   : "false",
                softtabs          : "[{require('core/settings').model}::editors/code/@softtabs]",
                tabsize           : "[{require('core/settings').model}::editors/code/@tabsize]",
                scrollspeed       : "[{require('core/settings').model}::editors/code/@scrollspeed]",
                newlinemode       : "[{require('core/settings').model}::editors/code/@newlinemode]",
                animatedscroll    : "[{require('core/settings').model}::editors/code/@animatedscroll]",
                fontsize          : "[{require('core/settings').model}::editors/code/@fontsize]",
                gutter            : "[{require('core/settings').model}::editors/code/@gutter]",
                highlightselectedword : "[{require('core/settings').model}::editors/code/@highlightselectedword]",
                autohidehorscrollbar  : "[{require('core/settings').model}::editors/code/@autohidehorscrollbar]",
                fadefoldwidgets   : "false",
                wrapmodeViewport  : "true"
            }));

            _self.searchConsole.$editor.session.setWrapLimitRange(null, null);

            this.$panel.addEventListener("afterclose", function() {
                this.removeNode();
                _self.$panel = null;
                _self.consoleacedoc = null;
                return false;
            });

            _self.searchConsole.addEventListener("keydown", function(e) {
                if (e.keyCode == 13) { // ENTER
                    if (e.altKey === false) {
                        _self.launchFileFromSearch(_self.searchConsole.$editor);
                        _self.returnFocus = false;
                    }
                    else {
                        _self.searchConsole.$editor.insert("\n");
                    }
                    return false;
                }
            });

            _self.searchConsole.addEventListener("keyup", function(e) {
                if (e.keyCode >= 37 && e.keyCode <= 40) { // KEYUP or KEYDOWN
                    if (apf.isTrue(settings.model.queryValue("editors/code/filesearch/@consolelaunch"))) {
                        _self.launchFileFromSearch(_self.searchConsole.$editor);
                        _self.returnFocus = true;
                        return false;
                    }
                }
            });

            _self.searchConsole.$editor.renderer.scroller.addEventListener("dblclick", function() {
                _self.launchFileFromSearch(_self.searchConsole.$editor);
            });

            tabConsole.addEventListener("afterswitch", function(e){
                if (e.currentTarget.activepage == "pgSFResults") {
                    apf.layout.forceResize(_self.searchConsole.$ext);
                }
            });
        }
        else {
            if (apf.isTrue(settings.model.queryValue("auto/console/@clearonrun")))
                this.consoleacedoc.removeLines(0, this.consoleacedoc.getLength());

            tabConsole.appendChild(this.$panel);
            tabConsole.set(this.pageID);
        }
    },

    setHighlight : function(session, query) {
        session.highlight(query);
        session.c9SearchHighlight = session.$searchHighlight;
        session.$searchHighlight = null;
    },

    destroy : function(){
        menus.remove("Find/~", 10000);
        menus.remove("Find in Files...");

        commands.removeCommandByName("searchinfiles");
        this.$destroy();
    }
}, libsearch));

});
