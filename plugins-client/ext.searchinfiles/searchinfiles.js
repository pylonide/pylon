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
var settings = require("core/settings");
var editors = require("ext/editors/editors");
var fs = require("ext/filesystem/filesystem");
var ideConsole = require("ext/console/console");
var menus = require("ext/menus/menus");
var skin = require("text!ext/searchinfiles/skin.xml");
var markup = require("text!ext/searchinfiles/searchinfiles.xml");
var commands = require("ext/commands/commands");
var tooltip = require("ext/tooltip/tooltip");
var libsearch = require("ext/searchreplace/libsearch");
var searchreplace = require("ext/searchreplace/searchreplace");

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
                ["console", "true"]
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
        
        ide.addEventListener("init.ext/console/console", function(e){
            mainRow.insertBefore(winSearchInFiles, e.ext.splitter);
        });
        if (winSearchInFiles.parentNode != mainRow) {
            mainRow.insertBefore(winSearchInFiles, 
                self.winDbgConsole && winDbgConsole.previousSibling || null);
        }

        winSearchInFiles.addEventListener("prop.visible", function(e) {
            if (e.value) {
                if (self.trFiles)
                    trFiles.addEventListener("afterselect", _self.setSearchSelection);
                _self.setSearchSelection();
            }
            else {
                var editor = editors.currentEditor;
                if (editor)
                    editor.focus();
        
                if (self.trFiles)
                    trFiles.removeEventListener("afterselect", 
                        this.setSearchSelection);
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
        
        var kb = this.addSearchKeyboardHandler(txtSFPatterns, "searchwhere");
        kb.bindKeys({
            "Return|Shift-Return": function(){ _self.replace(); }
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
        
        var blur = function(e) {
            if ( self.winSearchInFiles && !apf.isChildOf(winSearchInFiles, e.toElement))
                _self.toggleDialog(-1, null, true);
        }

        winSearchInFiles.addEventListener("blur", blur);
    },

    setSearchSelection: function(e){
        var selectedNode;
        
        if (self.trFiles) {
            // If originating from an event
            if (e && e.selected)
                selectedNode = e.selected;
            else
                selectedNode = this.getSelectedTreeNode();
    
            var filepath = selectedNode.getAttribute("path").split("/");
    
            var name = "";
            // get selected node in tree and set it as selection
            if (selectedNode.getAttribute("type") == "folder") {
                name = filepath[filepath.length - 1];
            }
            else if (selectedNode.getAttribute("type") == "file") {
                name = filepath[filepath.length - 2];
            }
    
            if (name.length > 25) {
                name = name.substr(0, 22) + "...";
            }
        }
        else {
            var path = settings.model.queryValue("auto/tree_selection/@path");
            if (!path)
                return;
            
            var p;
            if ((name = (p = path.split("/")).pop()).indexOf(".") > -1)
                name = p.pop();
        }

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
            winSearchInFiles.$ext.style.height 
                = winSearchInFiles.$ext.offsetHeight + "px";
            
            this.position = -1;

            var editor = editors.currentEditor;
            if (editor) {
                var sel   = editor.getSelection();
                var doc   = editor.getDocument();
                var range = sel.getRange();
                var value = doc.getTextRange(range);
    
                if (value) {
                    txtSFFind.setValue(value);
                    
                    this.$setRegexpMode(txtSFFind, chkSFRegEx.checked);
                }
            }

            winSearchInFiles.show();
            txtSFFind.focus();
            txtSFFind.select();
            
            winSearchInFiles.$ext.scrollTop = 0;
            document.body.scrollTop = 0;
            
            //Animate
            if (animate && !apf.isGecko) {
            Firmin.animate(winSearchInFiles.$ext, {
                height: "102px",
                timingFunction: "cubic-bezier(.10, .10, .25, .90)"
            }, 0.2, function() {
                winSearchInFiles.$ext.style[apf.CSSPREFIX + "TransitionDuration"] = "";
                winSearchInFiles.$ext.style.height = "";
                
                setTimeout(function(){
                    apf.layout.forceResize();
                }, 200);
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
            
            winSearchInFiles.$ext.style.height 
                = winSearchInFiles.$ext.offsetHeight + "px";

            Firmin.animate(winSearchInFiles.$ext, {
                height: "0px",
                timingFunction: "ease-in-out"
            }, 0.2, function(){
                winSearchInFiles.visible = true;
                winSearchInFiles.hide();
                
                winSearchInFiles.$ext.style[apf.CSSPREFIX + "TransitionDuration"] = "";

                if (!noselect && editors.currentEditor)
                    editors.currentEditor.ceEditor.focus();
                
                setTimeout(function(){
                    callback 
                        ? callback()
                        : apf.layout.forceResize();
                }, 50);
            });
        }
            else {
                winSearchInFiles.hide();
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
            casesensitive: chkSFMatchCase.checked ? "1" : "0",
            regexp: chkSFRegEx.checked ? "1" : "0",
            replaceAll: _self.replaceAll ? "true" : "false",
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
   
        if (btnSFFind.$ext.innerText == "Find") 
            btnSFFind.$ext.innerText = "Cancel";
        else if (btnSFFind.$ext.innerText == "Cancel") {
            btnSFFind.$ext.innerText = "Find"
            this.cancelFind();
            return;
        }
        
        if (chkSFConsole.checked) {
            // show the console
            ideConsole.show();
            
            this.makeSearchResultsPanel();
        }
        
        // Determine the scope of the search
        var path;
        if (grpSFScope.value == "projects") {
            path = ide.davPrefix;
        }
        else if (!self.trFiles) {
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
        var node = apf.getXml("<file />");
        node.setAttribute("name", "Search Results");
        node.setAttribute("path", this.searchFilePath);
        node.setAttribute("customtype", util.getContentType(this.searchContentType));
        node.setAttribute("tooltip", "Search Results");
        node.setAttribute("newfile", "0");
        node.setAttribute("ignore", "1");
        node.setAttribute("saving", "1");
        node.setAttribute("changed", "0");
                    
        var doc = ide.createDocument(node);
        
        // arrange beginning message
        var messageHeader = this.messageHeader(path, options);
        
        if (chkSFConsole.checked) {
            // the search results already exist
            if (_self.consoleacedoc !== undefined && _self.consoleacedoc.$lines !== undefined && _self.consoleacedoc.$lines.length > 0) { // append to tab editor if it exists
                _self.appendLines(_self.consoleacedoc, messageHeader);
                _self.searchConsole.$editor.gotoLine(_self.consoleacedoc.getLength() + 2);
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
        }
        else {
            if (this.searchPage === null) { // the results are not open, create a new page
                doc.cachedValue = messageHeader;
                ide.dispatchEvent("openfile", {doc: doc, node: node});
                
                _self.searchPage = tabEditors.getPage();
                _self.searcheditor = _self.searchPage.$editor.amlEditor.$editor;
                _self.apfeditor = _self.searchPage.$editor.ceEditor;
                _self.tabacedoc = _self.searchPage.$doc.acedoc;
                
                apf.setStyleClass(_self.apfeditor.$ext, "aceSearchResults")
                
                this.setLaunchEvents(_self.searchPage, false);
            }
            else {
                this.appendLines(_self.tabacedoc, messageHeader);
                tabEditors.set(tabEditors.getPages().indexOf(_self.searchPage) + 1);
                
                _self.searcheditor.scrollToLine(_self.tabacedoc.getLength() + 2, true);
            } 
        }
        
        var dataCompleted = false, lastLine = "", start = 0, http;
        this.id = davProject.report(path, "codesearch", options, function(data, state, extra) {   
            dataCompleted = true;
            http          = extra.http;
        });

        // Start streaming
        this.timer = setInterval(function() {
            if (!http) {
                var q = davProject.realWebdav.queue[_self.id];
                http = q && q.http;
            }
            
            if (http) {
                var data = lastLine + http.responseText;
                if (!data.length)
                    return;
                
                var lines = (data).split("\n");
                lastLine = lines.pop();
                
                if (!chkSFConsole.checked)
                    _self.appendLines(_self.tabacedoc, lines);
                else
                    _self.appendLines(_self.consoleacedoc, lines);
            }
            
            if (dataCompleted && !q) {
                http     = null;
                lastLine = "";
                
                if (!chkSFConsole.checked) {
                    apf.xmldb.removeAttribute(node, "saving");
                    node.setAttribute("changed", "0");
                }
                btnSFFind.$ext.innerText = "Find";
                return clearInterval(_self.timer);
            }
        }, 50);
        
        this.saveHistory(options.query, "searchfiles");
        this.position = 0;

        ide.dispatchEvent("track_action", {type: "searchinfiles"});
    },
    
    launchFileFromSearch : function(editor) {
        var session = editor.getSession();
        var currRow = editor.getCursorPosition().row;
        var path = null;
        
        if (editor.getSession().getLine(currRow).length == 0) // no text in this row
            return;
        
        var clickedLine = session.getLine(currRow).trim().split(":"); // number:text
        
        if (clickedLine.length < 2) // not a line number with text row
            return;
        
        // "string" type is the parent filename
        while (currRow > 0 && session.getTokenAt(currRow, 0).type.indexOf("string") < 0) {
          currRow--;
        }
        
        path = editor.getSession().getLine(currRow);
        
        if (path.charAt(path.length - 1) == ":")
            path = path.substring(0, path.length-1);
        
        if (path !== undefined && path.length > 0)
            editors.showFile(ide.davPrefix + "/" + path, clickedLine[0], 0, clickedLine[1]);
    },

    appendLines : function(doc, content) {
        if (content.length == 0) // blank lines can get through
            return;
            
        var currLength = doc.getLength();
        
        var contentArray = typeof content == "string" 
            ? content.split("\n")
            : content;
        var contentLength = contentArray.length;
        
        // reached the end of grep
        if (contentLength > 0 && contentArray[contentLength - 1].indexOf("Results:") == 0) {
            var count = contentArray.pop();
            count = count.substring(count.indexOf(" ") + 1);
            
            var countJSON = JSON.parse(count);
            var finalMessage = this.messageFooter(countJSON);
        }
        
        if (content.length > 0)
            doc.insertLines(currLength, contentArray);
        
        if (countJSON !== undefined)
            doc.insertLines(doc.getLength(), ["\n", finalMessage, "\n", "\n"]);
    },
    
    messageHeader : function(path, options) {
        var optionsDesc = [];
        
        if (options.regexp === true) {
            optionsDesc.push("regexp");
        }
        if (options.casesensitive === true) {
            optionsDesc.push("case sensitive");
        }
        if (options.wholeword === true) {
            optionsDesc.push("whole word");
        }
        
        if (optionsDesc.length > 0) {
            optionsDesc = "(" + optionsDesc.join(", ") + ")";
        }
        else {
            optionsDesc = "";
        }
        
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
        if (!this.$panel) {
            this.$panel = tabConsole.add(this.pageTitle, this.pageID);
            this.$panel.setAttribute("closebtn", true);
                 
            tabConsole.set(_self.pageID);
            
            this.searchConsole = this.$panel.appendChild(new apf.codeeditor({
                syntax            : "c9search",
                "class"           : "nocorner aceSearchConsole aceSearchResults",
                anchors           : "0 0 0 0",
                theme             : "ace/theme/monokai",
                overwrite         : "[{require('core/settings').model}::editors/code/@overwrite]",
                folding           : "true",
                behaviors         : "[{require('core/settings').model}::editors/code/@behaviors]",
                selectstyle       : "[{require('core/settings').model}::editors/code/@selectstyle]",
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
            
            this.setLaunchEvents(_self.searchConsole.$editor, true);
            
            this.searchConsole.$editor.renderer.scroller.addEventListener("mousemove", function(e) {
                var x = 3;
                
                var y = 3 + 5;
            });
            
            this.$panel.addEventListener("afterclose", function(){
                this.removeNode();
                return false;
            });
        }
        else {
            tabConsole.appendChild(this.$panel);
            tabConsole.set(this.pageID);
            this.searchConsole.$editor.session.getDocument().setValue("");
        }
    },
    
    setLaunchEvents : function(editor, isConsole) {
        var _self = this;
        function enterHandler(e) {
            if (e.keyCode == 13) {
                if (e.altKey === false) {
                    _self.launchFileFromSearch(editor);
                    if (e.shiftKey === true) {
                        _self.searchConsole.focus();
                    }
                }
                else {
                    editor.insert("\n");
                }
                return false;
            }
        };
        
        if (isConsole) {
            this.searchConsole.addEventListener("keydown", enterHandler);
            
            this.searchConsole.$editor.renderer.scroller.addEventListener("dblclick", function() {
                _self.launchFileFromSearch(editor);
            });
        }
        else {
            this.apfeditor.addEventListener("keydown", enterHandler);
            
            this.searchPage.addEventListener("dblclick", function() {
                _self.launchFileFromSearch(editor);
            });
        }
    },
    
    cancelFind : function() {
        clearInterval(this.timer); // still need to handle actual kill for server
    
        var killMessage = "Search ended prematurely.";
        
        if (chkSFConsole.checked) {
            this.appendLines(this.consoleacedoc,killMessage);
        }
        else {
            this.appendLines(this.tabacedoc, killMessage);
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
        menus.remove("Find/~", 10000);
        menus.remove("Find in Files...");
        
        commands.removeCommandByName("searchinfiles");
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
}, libsearch));

});