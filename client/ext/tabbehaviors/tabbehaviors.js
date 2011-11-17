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
var save = require("ext/save/save");
var panels = require("ext/panels/panels");

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
    menuOffset : 5,
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
        "tab0": {hint: "navigate to the tenth tab", msg: "Switching to tab 10."},
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
                    _self.revealtab();
                }
            })),
            mnuTabs.appendChild(new apf.item({
                caption : "Close Tab",
                onclick : function() {
                    _self.closetab();
                }
            })),
            mnuTabs.appendChild(new apf.item({
                caption : "Close All Tabs",
                onclick : this.closealltabs.bind(this)
            })),
            mnuTabs.appendChild(new apf.item({
                caption : "Close All But Current Tab",
                onclick : function() {
                    _self.closeallbutme();
                }
            })),
            //mnuTabs.appendChild(new apf.divider()),
            apf.document.body.appendChild(new apf.menu({
                id : "mnuContextTabs",
                childNodes : [
                    new apf.item({
                        caption : "Reveal in File Tree",
                        onclick : function() {
                            _self.revealtab(tabEditors.contextPage);
                        }
                    }),
                    new apf.item({
                        caption : "Close Tab",
                        onclick : function() {
                            _self.closetab(tabEditors.contextPage);
                        }
                    }),
                    new apf.item({
                        caption : "Close All Tabs",
                        onclick : this.closealltabs.bind(this)
                    }),
                    new apf.item({
                        caption : "Close Other Tabs",
                        onclick : function() {
                            _self.closeallbutme(tabEditors.contextPage);
                        }
                    })
                ]
            }))
        );
        this.hotitems["revealtab"]     = [this.nodes[0]];
        this.hotitems["closetab"]      = [this.nodes[1]];
        this.hotitems["closealltabs"]  = [this.nodes[2]];
        this.hotitems["closeallbutme"] = [this.nodes[3]];

        tabEditors.setAttribute("contextmenu", "mnuContextTabs");

        tabEditors.addEventListener("close", function(e) {
            _self.removeItem(e.page);
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
                    page.$tabMenu.parentNode.insertBefore(page.$tabMenu,
                        page.nextSibling ? page.nextSibling.$tabMenu : null);
                    
                    _self.updateState();
                }
            }
            else if (page.fake)
                _self.addItem(page);
        });
        
        tabEditors.addEventListener("DOMNodeRemoved", function(e) {
            var page = e.currentTarget;
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
    },

    closetab: function(page) {
        if (!page)
            page = tabEditors.getPage();

        if (page)
            tabEditors.remove(page);
        return false;
    },

    closealltabs: function() {
        var tabs  = tabEditors,
            pages = tabs.getPages(),
            i     = pages.length - 1,
            _self = this;
        
        save.saveAllInteractive(pages, function(all){
            if (all == -100) //Cancel
                return;
            
            pages.each(function(page){
                //page.$at.undo(-1);
                _self.removeItem(page);
                tabs.remove(page, true);
            });
        });
    },

    closeallbutme: function(page) {
        page = page || tabEditors.getPage();
        var tabs  = tabEditors,
            pages = tabs.getPages(),
            i     = pages.length - 1,
            set   = [],
            _self = this;
        for (; i >= 0; --i) {
            if (pages[i] == page) continue;
            set.push(pages[i]);
        }

        save.saveAllInteractive(set, function(all){
            if (all == -100) //Cancel
                return;
            
            set.each(function(page){
                //page.$at.undo(-1);
                _self.removeItem(page);
                tabs.remove(page, true);
            });
        });
        
        return false;
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
        if (n ==  this.accessed.length) {
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
    tab0: function() {return this.showTab(10);},

    showTab: function(nr) {
        var item = this.nodes[(nr - 1) + this.menuOffset];
        if (item && item.relPage) {
            tabEditors.set(item.relPage);
            return false;
        }
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

        var node = trFiles.queryNode('//file[@path="' + page.name + '"]');

        if (node) {
            trFiles.expandAndSelect(node);
            trFiles.focus();
            scrollToFile();
        }
        else {
            var parts = page.name.substr(ide.davPrefix.length).replace(/^\//, "").split("/");
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

        var parts = page.name.substr(ide.davPrefix.length).replace(/^\//, "").split("/");
        var file = parts.pop();
        var pathList = ["folder[1]"];
        var str = "";
        
        parts.forEach(function(part) {
            str += '/folder[@name="' + part + '"]';
            pathList.push("folder[1]" + str);
        });
        
        var xpath = pathList[pathList.length - 1];
        var docNode = page.$doc.getNode();
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
            var htmlNode = apf.xmldb.getHtmlNode(trFiles.selected, trFiles);
            var itemPos = apf.getAbsolutePosition(htmlNode, trFiles.$container);
            var top = trFiles.$container.scrollTop;
            var bottom = top + trFiles.$container.offsetHeight;
            
            // No scrolling needed when item is between visible boundaries.
            if (itemPos[1] > top && itemPos[1] < bottom)
                return;
            
            var totalHeight = trFiles.$container.scrollHeight;
            var center = trFiles.getHeight() / 2;
            var offset = (itemPos[1] / totalHeight) > 0.5 ? ~center : center;
            var y = itemPos[1] / (totalHeight + offset);

            sbTrFiles.setPosition(y);
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
        var item, idx, keyId,
            i = this.menuOffset,
            l = this.nodes.length;
        for (; i < l; ++i) {
            if ((item = this.nodes[i]).relPage == page.id) {
                item.destroy(true, true);
                this.nodes.splice(i, 1);
                idx   = i - this.menuOffset + 1;
                keyId = "tab" + (idx == 10 ? 0 : idx);
                if (this.commands[keyId] && typeof this.commands[keyId].hotkey != "undefined")
                    apf.hotkeys.remove(this.commands[keyId].hotkey);
                return this.updateState();
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
            if (len)
                this.sep = mnuTabs.insertBefore(new apf.divider(), this.nodes[3].nextSibling);
            else
                this.sep = mnuTabs.appendChild(new apf.divider());
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
                    require("ext/openfiles/openfiles").show();
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
