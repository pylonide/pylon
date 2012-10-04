/**
 * Tab Behaviors for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var panels = require("ext/panels/panels");
var menus = require("ext/menus/menus");
var openfiles = require("ext/openfiles/openfiles");
var commands = require("ext/commands/commands");
var editors = require("ext/editors/editors");
var settings = require("core/settings");
var clientSettings = require("ext/settings/settings");
var markupSettings =  require("text!ext/tabbehaviors/settings.xml");

module.exports = ext.register("ext/tabbehaviors/tabbehaviors", {
    name       : "Tab Behaviors",
    dev        :  "Ajax.org",
    alone      : true,
    type       : ext.GENERAL,
    deps       : [panels],
    menus      : [],
    accessList  : [],
    accessedTab : 0,
    sep        : null,
    more       : null,
    menuOffset : 4, //@todo this should use new menus api

    commands   : [
        ["closetab", "Option-W", "Ctrl-W", "close the tab that is currently active", "Closing active tab.", function(){ return ide.onLine && tabEditors.activepage; }],
        ["closealltabs", "Option-Shift-W", "Ctrl-Shift-W", "close all opened tabs", "Closing all tabs.", function(){ return ide.onLine && tabEditors.activepage; }],
        ["closeallbutme", "Option-Ctrl-W", "Ctrl-Alt-W", "close all opened tabs, but the tab that is currently active", "Closing tabs.", function(){ return ide.onLine && tabEditors.length > 1 }],
        ["gototabright", "Command-]", "Ctrl-]", "navigate to the next tab, right to the tab that is currently active", "Switching to right tab.", function(){ return tabEditors.length > 1 }],
        ["gototableft", "Command-[", "Ctrl-[", "navigate to the next tab, left to the tab that is currently active", "Switching to left tab.", function(){ return tabEditors.length > 1 }],
        ["movetabright", "Command-Option-]", "Ctrl-Alt-]", "move the tab that is currently active to the right", "Moving tab to the right.", function(){ return tabEditors.length > 1 }],
        ["movetableft", "Command-Option-[", "Ctrl-Alt[", "move the tab that is currently active to the left", "Moving tab to the left.", function(){ return tabEditors.length > 1 }],
        ["tab1", "Command-1", "Ctrl-1", "navigate to the first tab", "Switching to tab 1."],
        ["tab2", "Command-2", "Ctrl-2", "navigate to the second tab", "Switching to tab 2."],
        ["tab3", "Command-3", "Ctrl-3", "navigate to the third tab", "Switching to tab 3."],
        ["tab4", "Command-4", "Ctrl-4", "navigate to the fourth tab", "Switching to tab 4."],
        ["tab5", "Command-5", "Ctrl-5", "navigate to the fifth tab", "Switching to tab 5."],
        ["tab6", "Command-6", "Ctrl-6", "navigate to the sixth tab", "Switching to tab 6."],
        ["tab7", "Command-7", "Ctrl-7", "navigate to the seventh tab", "Switching to tab 7."],
        ["tab8", "Command-8", "Ctrl-8", "navigate to the eighth tab", "Switching to tab 8."],
        ["tab9", "Command-9", "Ctrl-9", "navigate to the ninth tab", "Switching to tab 9."],
        ["tab0", "Command-0", "Ctrl-0", "navigate to the tenth tab", "Switching to tab 10."],
        ["revealtab", "Shift-Command-L", "Ctrl-Shift-L", "reveal current tab in the file tree", function(){ return ide.onLine && tabEditors.activepage }],
        ["nexttab", "Option-Tab", "Ctrl-Tab", "navigate to the next tab in the stack of accessed tabs", function(){ return tabEditors.length > 1 }],
        ["previoustab", "Option-Shift-Tab", "Ctrl-Shift-Tab", "navigate to the previous tab in the stack of accessed tabs", function(){ return tabEditors.length > 1 }]
    ],
    
    nodes      : [],

    init : function(amlNode){
        var _self = this;
        
        this.commands.each(function(item){
            var a = item[item.length - 1];
            commands.addCommand({
                name: item[0],
                bindKey: {mac: item[1], win: item[2]},
                hint: item[3],
                msg: item[4],
                isAvailable : typeof a == "function" && a,
                exec: function () {
                    _self[item[0]]();
                }
            });
        });
        
        commands.addCommand({
            name: "closealltotheright",
            isAvailable : function(){
                return ide.onLine && tabEditors.length > 1 
                  && tabEditors.getPage().nextSibling
                  && tabEditors.getPage().nextSibling.localName == "page";
            },
            exec: function (editor, args) { 
                _self.closealltotheright(args[0]); 
            }
        });
        
        commands.addCommand({
            name: "closealltotheleft",
            isAvailable : function(){
                return ide.onLine && tabEditors.length > 1 
                  && tabEditors.getPages().indexOf(mnuContextTabs.$page) != 0;
            },
            exec: function (editor, args) { 
                _self.closealltotheleft(args[0]); 
            }
        });
        
        this.nodes.push(
            this.mnuTabs = menus.addItemByPath("View/Tabs/", null, 175),
            
            menus.addItemByPath("File/~", new apf.divider(), 100000),
            menus.addItemByPath("File/Close File", new apf.item({
                command: "closetab"
            }), 110000),
            menus.addItemByPath("File/Close All Files", new apf.item({
                command : "closealltabs"
            }), 120000),
            
            menus.addItemByPath("View/Tabs/Close Tab", new apf.item({
                command : "closetab"
            }), 100),
            menus.addItemByPath("View/Tabs/Close All Tabs", new apf.item({
                command : "closealltabs"
            }), 200),
            menus.addItemByPath("View/Tabs/Close All But Current Tab", new apf.item({
                command : "closeallbutme"
            }), 300),

            menus.addItemByPath("Goto/~", new apf.divider(), 300),

            menus.addItemByPath("Goto/Switch File/", null, 301),

            menus.addItemByPath("Goto/Switch File/Next File", new apf.item({
                command : "gototabright"
            }), 100),

            menus.addItemByPath("Goto/Switch File/Previous File", new apf.item({
                command : "gototableft"
            }), 200),
            
            menus.addItemByPath("Goto/Switch File/~", new apf.divider(), 300),

            menus.addItemByPath("Goto/Switch File/Next File in Stack", new apf.item({
                command : "nexttab"
            }), 400),

            menus.addItemByPath("Goto/Switch File/Previous File in Stack", new apf.item({
                command : "previoustab"
            }), 500),
            
            mnuContext = this.menu = new apf.menu({id : "mnuContextTabs", "onprop.visible" : menus.$checkItems})
        );
        
        this.mnuTabs.addEventListener("prop.visible", function(e) {
            if (btnEditorTabsBehavior.value)
                apf.setStyleClass(_self.mnuTabs.$ext, "tabsContextMenu");
            else
                apf.setStyleClass(_self.mnuTabs.$ext, "", ["tabsContextMenu"]);
        });
        
        mnuContext.addEventListener("prop.visible", function(e) {
            if (e.value && window.event) {
                this.$page = apf.findHost(document.elementFromPoint(
                    window.event.clientX, 
                    window.event.clientY));
            }
        }, true);
        
        menus.addItemByPath("Reveal in File Tree", new apf.item({
            command : "revealtab"
        }), 100, mnuContext);
        menus.addItemByPath("~", new apf.divider(), 200, mnuContext);
        menus.addItemByPath("Close Tab", new apf.item({
            command : "closetab"
        }), 300, mnuContext);
        menus.addItemByPath("Close All Tabs", new apf.item({
            command : "closealltabs"
        }), 400, mnuContext);
        menus.addItemByPath("Close Other Tabs", new apf.item({
            command : "closeallbutme"
        }), 500, mnuContext);
        menus.addItemByPath("~", new apf.divider(), 600, mnuContext);
        menus.addItemByPath("Close Tabs to the Right", new apf.item({
            //command : "closealltotheright",
            isAvailable : commands.commands["closealltotheright"].isAvailable,
            onclick : function(){
                var page = apf.findHost(document.elementFromPoint(
                    parseInt(mnuContextTabs.$ext.style.left), 
                    parseInt(mnuContextTabs.$ext.style.top)));

                commands.exec("closealltotheright", null, [page]);
            }
        }), 600, mnuContext);
        menus.addItemByPath("Close Tabs to the Left", new apf.item({
            //command : "closealltotheleft",
            isAvailable : commands.commands["closealltotheleft"].isAvailable,
            onclick : function(){
                var page = apf.findHost(document.elementFromPoint(
                    parseInt(mnuContextTabs.$ext.style.left), 
                    parseInt(mnuContextTabs.$ext.style.top)));

                commands.exec("closealltotheleft", null, [page]);
            }
        }), 700, mnuContext);

        tabEditors.setAttribute("contextmenu", "mnuContextTabs");

        //@todo store the stack for availability after reload
        tabEditors.addEventListener("close", function(e) {
            if (!e || !e.htmlEvent)
                return;
            var page = e.page;
            e = e.htmlEvent;
            if (e.shiftKey) { // Shift = close all
                return _self.closealltabs();
            }
            else if (e.altKey) { // Alt/ Option = close all but this
                return _self.closeallbutme(page);
            }
        });

        tabEditors.addEventListener("DOMNodeInserted", function(e) {
            var page = e.currentTarget;
            if (page.localName != "page" || e.relatedNode != this || page.nodeType != 1)
                return;

            if (e.$isMoveWithinParent) {
                if (page.$tabMenu) {
                    _self.mnuTabs.insertBefore(page.$tabMenu,
                        page.nextSibling ? page.nextSibling.$tabMenu : null);

                    _self.updateState();
                }
            }
            else if (page.fake) {
                _self.addItem(page);
                
                if (_self.accessList.indexOf(page) == -1) {
                    var idx = _self.accessList.indexOf(page.id);
                    if (idx == -1) //Load accesslist from index
                        _self.accessList.unshift(page);
                    else
                        _self.accessList[idx] = page;
                }
            }
        });

        tabEditors.addEventListener("DOMNodeRemoved", function(e) {
            if (e.$doOnlyAdmin)
                return;

            var page = e.currentTarget;
            if (page.localName != "page" || e.relatedNode != this || page.nodeType != 1)
                return;

            _self.removeItem(page);
            _self.accessList.remove(page);
        });

        var cycleKey = apf.isMac ? 18 : 17;
        ide.addEventListener("tab.afterswitch", function(e) {
            var page = e.nextPage;

            if (!_self.cycleKeyPressed) {
                _self.accessList.remove(page);
                _self.accessList.unshift(page);
                
                _self.accessList.changed = true;
                settings.save();
            }
            
            if (settings.model.queryValue("auto/panels/@active") == "ext/tree/tree" && apf.isTrue(settings.model.queryValue('general/@revealfile'))) {
                _self.revealtab(page, true);
            }
        });

        tabEditors.addEventListener("close", function(e) {
            if (tabEditors.getPage() == e.page)
                this.nextTabInLine = _self.accessList[1];
        });

        apf.addEventListener("keydown", function(eInfo) {
            if (eInfo.keyCode == cycleKey) {
                _self.cycleKeyPressed = true;
            }
        });

        apf.addEventListener("keyup", function(eInfo) {
            if (eInfo.keyCode == cycleKey && _self.cycleKeyPressed) {
                _self.cycleKeyPressed = false;
                
                if (_self.$dirtyNextTab) {
                    _self.accessedTab = 0;
                    
                    var page = tabEditors.getPage();
                    if (_self.accessList[_self.accessedTab] != page) {
                        _self.accessList.remove(page);
                        _self.accessList.unshift(page);
                        
                        _self.accessList.changed = true;
                        settings.save();
                    }
                    
                    _self.$dirtyNextTab = false;
                }
            }
        });

        tabEditors.addEventListener("aftersavedialogcancel", function(e) {
            if (!_self.changedPages)
                return;

            var i, l, page;
            for (i = 0, l = _self.changedPages.length; i < l; i++) {
                page = _self.changedPages[i];
                page.removeEventListener("aftersavedialogclosed", arguments.callee);
            }
        });

        ide.addEventListener("settings.save", function(e){
            if (_self.accessList.changed) {
                var list = _self.accessList.slice(0);
                list.forEach(function(page, i){
                    if (page && page.id)
                        this[i] = page.id;
                }, list);
                e.model.setQueryValue("auto/tabcycle/text()", JSON.stringify(list));
                _self.accessList.changed = false;
            }
        });
        
        ide.addEventListener("settings.load", function(e){
            var list, json = e.model.queryValue("auto/tabcycle/text()");
            if (json) {
                try { 
                    list = JSON.parse(json);
                }
                catch(e) {
                    return;
                }
            }
            
            if (list) {
                list.remove(null);
                _self.accessList = list;
            }
        });
        
        ide.addEventListener("settings.load", function(e){
            settings.setDefaults("general", [["revealfile", false]]);
        });
        
        clientSettings.addSettings("General", markupSettings);
    },
    
    closetab: function(page) {
        if (!page) {
            page = tabEditors.getPage();
            var corrected = ide.dispatchEvent("beforeclosetab", {
                page: page
            });
            if (corrected)
                page = corrected;
        }
        var pages = tabEditors.getPages();
        var isLast = pages[pages.length - 1] == page;
        
        tabEditors.remove(page);
        
        editors.resizeTabs(isLast);
        
        return false;
    },
    
    closealltabs: function(callback) {
        callback = typeof callback == "function" ? callback : null;

        this.changedPages = [];
        this.unchangedPages = [];
        
        var pages = tabEditors.getPages();
        for (var i = 0, l = pages.length; i < l; i++) {
            this.closepage(pages[i], callback);
        }
        
        this.checkPageRender(callback);
    },

    closeallbutme: function(ignore, callback) {
        // if ignore isn't a page instance, then fallback to current page, unless it's an object from closealltotheright/left
        if (!(ignore instanceof apf.page)) {
            if (typeof ignore === "undefined" || typeof ignore.closeall === "undefined") {
                ignore = tabEditors.getPage();
            }
        }

        this.changedPages = [];
        this.unchangedPages = [];

        var page;
        var pages = tabEditors.getPages();

        for (var i = 0, l = pages.length; i < l; i++) {
            page = pages[i];

            if (ignore && (page == ignore || ignore.hasOwnProperty(i))) {
                continue;
            }
            else {
                this.closepage(page, callback);
            }
        }
        
        editors.resizeTabs();

        this.checkPageRender(callback);
    },

    closepage : function(page, callback) {
        var node = page.$doc.getNode();
        if (node.getAttribute("changed") == "1" 
          && (!node.getAttribute("newfile") || page.$doc.getValue())) {
            this.changedPages.push(page);
        }
        else {
            this.unchangedPages.push(page);
        }
    },
    
    checkPageRender : function(callback) {
        if (this.changedPages.length) {
            var pages = this.changedPages.slice(0);
            var i = 0;
            var _self = this;
            
            function close(e) {
                this.removeEventListener("aftersavedialogclosed", close);
                next();
            }
            
            function next(){
                var page = pages[i];
                if (page) {
                    page.noAnim = true; // turn off animation on closing tab
                    page.addEventListener("aftersavedialogclosed", close);
                    tabEditors.remove(page, null, true);
                    i++;
                }
                else {
                    _self.closeUnchangedPages(function() {
                        if (callback)
                            callback();
                    });
                }
            }
            
            next();
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

    closealltotheright : function(page) {
        if (!page)
            page = tabEditors.getPage();
        var pages = tabEditors.getPages();
    
        var currIdx = pages.indexOf(page);
        var ignore = {};
            
        for (var j = 0; j <= currIdx; j++) {
            ignore[j] = page;
        }

        ignore.closeall = true;
        this.closeallbutme(ignore);
    },

    closealltotheleft : function(page) {
        if (!page)
            page = tabEditors.getPage();
        var pages = tabEditors.getPages();
    
        var currIdx = pages.indexOf(page);
        var ignore = {};
            
        for (var j = pages.length - 1; j >= currIdx; j--) {
            ignore[j] = page;
        }
        
        ignore.closeall = true;
        this.closeallbutme(ignore);
    },
    
    nexttab : function(){
        if (tabEditors.length === 1)
            return;

        if (++this.accessedTab >= this.accessList.length)
            this.accessedTab = 0;

        var next = this.accessList[this.accessedTab];
        if (typeof next != "object")
            return this.nexttab();
        tabEditors.set(next);
        
        this.$dirtyNextTab = true;
    },

    previoustab : function(){
        if (tabEditors.length === 1)
            return;

        if (--this.accessedTab < 0)
            this.accessedTab = this.accessList.length - 1;

        var next = this.accessList[this.accessedTab];
        if (typeof next != "object")
            return this.nexttab();
        tabEditors.set(next);
        
        this.$dirtyNextTab = true;
    },

    gototabright: function(e) {
        return this.cycleTab("right");
    },

    gototableft: function() {
        return this.cycleTab("left");
    },

    cycleTab: function(dir) {
        var bRight  = dir == "right";
        var tabs    = tabEditors;
        var pages   = tabs.getPages();
        var curr    = tabs.getPage();
        var currIdx = pages.indexOf(curr);
        if (!curr || pages.length == 1)
            return;
        var idx = currIdx + (bRight ? 1 : -1);
        if (idx < 0)
            idx = pages.length - 1;
        if (idx > pages.length - 1)
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
    
    movetabright: function() {
        this.moveTab("right");
    },
    
    movetableft: function() {
        this.moveTab("left");
    },
    
    moveTab: function(dir) {
        var bRight  = dir == "right";
        var tabs    = tabEditors;
        var pages   = tabs.getPages();
        var curr    = tabs.getPage();
        var currIdx = pages.indexOf(curr);
        var append  = false;
        if (!curr || pages.length == 1)
            return;
        var idx = currIdx + (bRight ? 2 : -1);
        if (idx < 0 || idx === pages.length)
            append = true;
        if (idx > pages.length - 1)
            idx = 0;

        // other plugins may modify this behavior
        var res = ide.dispatchEvent("beforemovetab", {
            index: idx,
            dir: dir,
            pages: pages
        });
        if (res === false)
            return;
        if (typeof res == "number")
            idx = res;

        if (append)
            tabs.appendChild(curr)
        else
            tabs.insertBefore(curr, pages[idx]);
        tabs.dispatchEvent("reorder", { page: curr });
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
    revealtab: function(page, noFocus) {
        if (!page || page.command)
            page = tabEditors.getPage();
        if (!page)
            return false;

        // Tell other extensions to exit their fullscreen mode (for ex. Zen)
        // so this operation is visible
        ide.dispatchEvent("exitfullscreen");

        this.revealInTree(page.$doc.getNode(), noFocus);
    },

    revealInTree : function(docNode, noFocus) {
        var _self = this;

        if (this.control && this.control.stop)
            this.control.stop();

        panels.activate(require("ext/tree/tree"));
        
        var parts, file, pathList, str, xpath;
        var type = docNode.tagName || "file";
        var path = docNode.getAttribute('path');
        var node = trFiles.queryNode('//' + type + '[@path=' + util.escapeXpathString(path) + ']');

        if (node) {
            trFiles.expandAndSelect(node);
            if (!noFocus)
                trFiles.focus();
            scrollToFile();
        }
        else {
            parts = path.substr(ide.davPrefix.length).replace(/^\//, "").split("/");
            file = parts.pop();
            pathList = ["folder[1]"];
            str = "";

            parts.forEach(function(part) {
                str += '/folder[@name="' + part + '"]';
                pathList.push("folder[1]" + str);
            });

            xpath = pathList[pathList.length - 1];

            trFiles.expandList(pathList, function() {
                trFiles.select(trFiles.queryNode(xpath + '/' + type + '[@name="' + file + '"]'));
                if (!noFocus)
                    trFiles.focus();
                scrollToFile();
            });
        }

        parts = path.substr(ide.davPrefix.length).replace(/^\//, "").split("/");
        file = parts.pop();
        pathList = ["folder[1]"];
        str = "";

        parts.forEach(function(part) {
            str += '/folder[@name="' + part + '"]';
            pathList.push("folder[1]" + str);
        });

        xpath = pathList[pathList.length - 1];
        //var docNode = page.$doc.getNode();
        // Show spinner in active tab the file is being looked up
        apf.xmldb.setAttribute(docNode, "lookup", "1");

        trFiles.expandList(pathList, function() {
            trFiles.select(trFiles.queryNode(xpath + '/' + type + '[@name="' + file + '"]'));
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

            apf.tween.single(trFiles, {
                type    : "scrollTop",
                from    : trFiles.$ext.scrollTop,
                to      : newTop,
                control : (_self.control = {})
            });
        }
    },

    addItem: function(page) {
        if (this.more)
            return; // no more items allowed...

        var mnu = this.mnuTabs.appendChild(new apf.item({
            caption : page.getAttribute("caption"),
            model   : page.$model,
            relPage : page.id,
            onclick : function() {
                tabEditors.set(this.getAttribute("relPage"));
            }
        }));
        this.nodes.push(mnu) - 1;

        page.$tabMenu = mnu;

        this.updateState();
    },

    removeItem: function(page) {
        var item, idx, keyId;
        var i = 0;
        var l = this.nodes.length;
        var _self = this;

        var updateState = function(){
            _self.updateState();
        };

        for (; i < l; i++) {
            if ((item = this.nodes[i]).getAttribute("relPage") == page.id) {
                item.destroy(true, true);
                this.nodes.splice(i, 1);

                setTimeout(updateState);
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
            this.sep = this.mnuTabs.insertBefore(new apf.divider(), 
                this.mnuTabs.childNodes[this.menuOffset]);
        }

        if (len < (force ? 19 : 20)) { // we already have 9 other menu items
            if (this.more) {
                this.more.destroy(true, true);
                this.more = null;
            }
        }
        else if (!this.more) {
            this.more = this.mnuTabs.appendChild(new apf.item({
                caption : "More...",
                onclick : function() {
                    panels.activate(openfiles);
                }
            }));
        }

        // update menu items:
        var keyId, pages = tabEditors.getPages();
        for (var i = 0, l = pages.length; i < l; ++i) {
            keyId = "tab" + (i == 9 ? 0 : i + 1);
            if (pages[i].$tabMenu && i < 10)
                pages[i].$tabMenu.setAttribute("command", keyId);
            else if (pages[i].$tabMenu)
                pages[i].$tabMenu.removeAttribute("command");
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
        menus.remove("View/Tabs");
        menus.remove(mnuContextTabs);
        
        commands.removeCommandsByName(["closealltotheright", "closealltotheleft"]);
        
        this.commands.each(function(item){
            commands.removeCommandByName(item[0]);
        });
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
