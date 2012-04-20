/**
 * Tab Behaviors for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var panels = require("ext/panels/panels");
var menus = require("ext/menus/menus");
var openfiles = require("ext/openfiles/openfiles");
var commands = require("ext/commands/commands");

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
    menuOffset : 4, //@todo this should use new menus api

    nodes      : [],

    init : function(amlNode){
        var _self = this;
        
        [
            ["closetab", "Option-W", "Ctrl-W", "close the tab that is currently active", "Closing active tab."],
            ["closealltabs", "Option-Shift-W", "Ctrl-Shift-W", "close all opened tabs", "Closing all tabs."],
            ["closeallbutme", "Option-Ctrl-W", "Ctrl-Alt-W", "close all opened tabs, but the tab that is currently active", "Closing tabs."],
            ["gototabright", "Command-]", "Ctrl-]", "navigate to the next tab, right to the tab that is currently active", "Switching to right tab."],
            ["gototableft", "Command-[", "Ctrl-[", "navigate to the next tab, left to the tab that is currently active", "Switching to left tab."],
            ["tab1", "Command-1", "Ctrl-1", "navigate to the first tab", "Switching to tab 1."],
            ["tab2", "Command-2", "Ctrl-2", "navigate to the second tab", "Switching to tab 2."],
            ["tab3", "Command-3", "Ctrl-3", "navigate to the third tab", "Switching to tab 3."],
            ["tab4", "Command-4", "Ctrl-4", "navigate to the fourth tab", "Switching to tab 4."],
            ["tab5", "Command-5", "Ctrl-5", "navigate to the fifth tab", "Switching to tab 5."],
            ["tab6", "Command-6", "Ctrl-6", "navigate to the sixth tab", "Switching to tab 6."],
            ["tab7", "Command-7", "Ctrl-7", "navigate to the seventh tab", "Switching to tab 7."],
            ["tab8", "Command-8", "Ctrl-8", "navigate to the eighth tab", "Switching to tab 8."],
            ["tab9", "Command-9", "Ctrl-9", "navigate to the ninth tab", "Switching to tab 9."],
            ["tab9", "Command-0", "Ctrl-0", "navigate to the tenth tab", "Switching to tab 10."],
            ["revealtab", "Shift-Command-L", "Ctrl-Shift-L", "reveal current tab in the file tree"],
            ["nexttab", "Option-Tab", "Ctrl-Tab", "navigate to the next tab in the stack of accessed tabs"],
            ["previoustab", "Option-Shift-Tab", "Ctrl-Shift-Tab", "navigate to the previous tab in the stack of accessed tabs"]
        ].each(function(item){
            commands.addCommand({
                name: item[0],
                bindKey: {mac: item[1], win: item[2]},
                hint: item[3],
                msg: item[4],
                exec: function () {
                    _self[item[0]]();
                }
            });
        });
        
        commands.addCommand({
            name: "closealltotheright",
            exec: function () { _self.closealltotheright(); }
        });
        
        commands.addCommand({
            name: "closealltotheleft",
            exec: function () { _self.closealltotheleft(); }
        });
        
        var mnuContext, itmLeft, itmRight, itmStackLeft, itmStackRight;
        var itmCloseFile, itmCloseAllFiles, itmCloseTab, itmCloseAllTabs, itmCloseOtherTabs;
        this.nodes.push(
            this.mnuTabs = menus.addItemByPath("View/Tabs/", null, 175),
            
            menus.addItemByPath("File/~", new apf.divider(), 100000),
            itmCloseFile = menus.addItemByPath("File/Close File", new apf.item({
                command: "closetab",
                disabled : "{!!!tabEditors.activepage}"
            }), 110000),
            itmCloseAllFiles = menus.addItemByPath("File/Close All Files", new apf.item({
                command : "closealltabs",
                disabled : "{!!!tabEditors.activepage}"
            }), 120000),
            
            itmCloseTab = menus.addItemByPath("View/Tabs/Close Tab", new apf.item({
                command : "closetab",
                disabled : "{!!!tabEditors.activepage}"
            }), 100),
            itmCloseAllTabs = menus.addItemByPath("View/Tabs/Close All Tabs", new apf.item({
                command : "closealltabs",
                disabled : "{!!!tabEditors.activepage}"
            }), 200),
            itmCloseOtherTabs = menus.addItemByPath("View/Tabs/Close All But Current Tab", new apf.item({
                command : "closeallbutme",
                disabled : "{!!!tabEditors.activepage}"
            }), 300),

            menus.addItemByPath("Goto/~", new apf.divider(), 300),

            menus.addItemByPath("Goto/Switch File/", null, 301),

            itmLeft = menus.addItemByPath("Goto/Switch File/Next File", new apf.item({
                command : "gototabright"
            }), 100),

            itmRight = menus.addItemByPath("Goto/Switch File/Previous File", new apf.item({
                command : "gototableft"
            }), 200),
            
            menus.addItemByPath("Goto/Switch File/~", new apf.divider(), 300),

            itmStackLeft = menus.addItemByPath("Goto/Switch File/Next File in Stack", new apf.item({
                command : "nexttab"
            }), 400),

            itmStackRight = menus.addItemByPath("Goto/Switch File/Previous File in Stack", new apf.item({
                command : "previoustab"
            }), 500),
            
            mnuContext = new apf.menu({id : "mnuContextTabs"})
        );
        
        var itmReveal = menus.addItemByPath("Reveal in File Tree", new apf.item({
            command : "revealtab",
            disabled : "{!!!tabEditors.activepage}"
        }), 100, mnuContext);
        menus.addItemByPath("~", new apf.divider(), 200, mnuContext);
        menus.addItemByPath("Close Tab", new apf.item({
            command : "closetab",
            disabled : "{!!!tabEditors.activepage}"
        }), 300, mnuContext);
        menus.addItemByPath("Close All Tabs", new apf.item({
            command : "closealltabs",
            disabled : "{!!!tabEditors.activepage}"
        }), 400, mnuContext);
        var itmCloseOther = menus.addItemByPath("Close Other Tabs", new apf.item({
            command : "closeallbutme",
            disabled : "{!!!tabEditors.activepage}"
        }), 500, mnuContext);
        menus.addItemByPath("~", new apf.divider(), 600, mnuContext);
        var itmCloseRight = menus.addItemByPath("Close Tabs to the Right", new apf.item({
            command : "closealltotheright",
            disabled : "{!!!tabEditors.activepage}"
        }), 600, mnuContext);
        var itmCloseLeft = menus.addItemByPath("Close Tabs to the Left", new apf.item({
            command : "closealltotheleft",
            disabled : "{!!!tabEditors.activepage}"
        }), 700, mnuContext);
        
        mnuContextTabs.addEventListener("prop.visible", function(e) {
            // If there are only 0 or 1 pages, disable both and return
            if (tabEditors.getPages().length <= 1) {
                itmCloseOther.setAttribute('disabled', true);
                itmCloseRight.setAttribute('disabled', true);
                itmCloseLeft.setAttribute('disabled', true);
                itmRight.setAttribute('disabled', true);
                itmLeft.setAttribute('disabled', true);
                itmStackRight.setAttribute('disabled', true);
                itmStackLeft.setAttribute('disabled', true);
                return;
            }

            var page = tabEditors.getPage();
            var pages = tabEditors.getPages();

            // be optimistic, reset menu items to disabled
            itmCloseOther.setAttribute('disabled', false);
            itmCloseLeft.setAttribute('disabled', false);
            itmCloseRight.setAttribute('disabled', false);
            itmRight.setAttribute('disabled', false);
            itmLeft.setAttribute('disabled', false);
            itmStackRight.setAttribute('disabled', false);
            itmStackLeft.setAttribute('disabled', false);

            // if last tab, remove "close to the right"
            if (page.nextSibling.localName !== "page") {
                itmCloseRight.setAttribute('disabled', true);
            }
            // if first tab, remove "close to the left"
            else if (pages.indexOf(page) == 0) {
                itmCloseLeft.setAttribute('disabled', true);
            }
        });

        ide.addEventListener("init.ext/editors/editors", function(e) {
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
                    if (_self.accessed.indexOf(page) == -1)
                        _self.accessed.unshift(page);
                }
            });

            tabEditors.addEventListener("DOMNodeRemoved", function(e) {
                if (e.$doOnlyAdmin)
                    return;

                var page = e.currentTarget;
                if (page.localName != "page" || e.relatedNode != this || page.nodeType != 1)
                    return;

                _self.removeItem(page);
                _self.accessed.remove(page);
            });

            var cycleKey = apf.isMac ? 18 : 17, tabKey = 9;
            tabEditors.addEventListener("afterswitch", function(e) {
                var page = e.nextPage;

                if (!_self.cycleKeyPressed) {
                    _self.accessed.remove(page);
                    _self.accessed.push(page);
                }
            });

            tabEditors.addEventListener("close", function(e) {
                if (tabEditors.getPage() == e.page)
                    this.nextTabInLine = _self.accessed[_self.accessed.length - _self.$tabAccessCycle];
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
                        _self.$tabAccessCycle = 2;
                        
                        var page = tabEditors.getPage();
                        if (_self.accessed[_self.accessed.length - 1] != page) {
                            _self.accessed.remove(page);
                            _self.accessed.push(page);
                        }
                        
                        _self.$dirtyNextTab = false;
                    }
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
        });
    },
    
    closetab: function() {
        var page = tabEditors.getPage();
        var pages = tabEditors.getPages();
        var isLast = pages[pages.length - 1] == page;
        
        tabEditors.remove(page);
        
        this.resizeTabs(isLast);
        
        return false;
    },
    
    resizeTabs : function(cancel){
        clearTimeout(this.closeTimer);
        
        if (cancel)
            return;
        
        this.closeTimer = setTimeout(function(){
            tabEditors.$waitForMouseOut = false;
            tabEditors.$scaleinit(null, "sync");
        }, 500);
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

        var _self = this;
        for (var i = 0, l = pages.length; i < l; i++) {
            page = pages[i];

            if (ignore && (page == ignore || ignore.hasOwnProperty(i))) {
                continue;
            }
            else {
                this.closepage(page, callback);
            }
        }
        
        this.resizeTabs();

        this.checkPageRender(callback);
    },

    closepage : function(page, callback) {
        var _self = this;
        if (page.$doc.getNode().getAttribute("changed") == "1") {
            page.noAnim = true; // turn off animation on closing tab
            this.changedPages.push(page);

            page.addEventListener("aftersavedialogclosed", function(e) {
                var curPage = _self.changedPages[0];
                if (_self.changedPages.length && curPage.caption != e.currentTarget.caption)
                    return;
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
    },
    
    checkPageRender : function(callback) {
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

        ignore.closeall = true;
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
        
        ignore.closeall = true;
        this.closeallbutme(ignore);
    },
    
    nexttab : function(){
        if (tabEditors.getPages().length === 1) {
            return;
        }

        var n = this.accessed.length - this.$tabAccessCycle++;
        if (n < 0) {
            n = this.accessed.length - 1;
            this.$tabAccessCycle = 2;
        }

        var next = this.accessed[n];
        if (next == tabEditors.getPage())
            return this.nexttab();

        tabEditors.set(next);
        
        this.$dirtyNextTab = true;
    },

    previoustab : function(){
        if (tabEditors.getPages().length === 1) {
            return;
        }
        
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

    gototabright: function(e) {
        // Right "Command" key on Mac calls this, don't know why, and don't
        // want it to! In the meantime, this blocks it
        if (e.keyCode === 93)
            return;
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

        // Tell other extensions to exit their fullscreen mode (for ex. Zen)
        // so this operation is visible
        ide.dispatchEvent("exitfullscreen");

        this.revealfile(page.$doc.getNode());
    },

    revealfile : function(docNode) {
        panels.activate(require("ext/tree/tree"));
        
        var path = docNode.getAttribute('path');
        var node = trFiles.queryNode('//file[@path="' + path + '"]');

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

if (!page.getAttribute("caption").trim()) debugger;

        var mnu = this.mnuTabs.appendChild(new apf.item({
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
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
