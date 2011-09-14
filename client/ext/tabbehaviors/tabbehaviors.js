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
    sep        : null,
    more       : null,
    menuOffset : 5,
    commands   : {
        "closetab": {hint: "close the tab that is currently active"},
        "closealltabs": {hint: "close all opened tabs"},
        "closeallbutme": {hint: "close all opened tabs, but the tab that is currently active"},
        "gototabright": {hint: "navigate to the next tab, right to the tab that is currently active"},
        "gototableft": {hint: "navigate to the next tab, left to the tab that is currently active"},
        "tab1": {hint: "navigate to the first tab"},
        "tab2": {hint: "navigate to the second tab"},
        "tab3": {hint: "navigate to the third tab"},
        "tab4": {hint: "navigate to the fourth tab"},
        "tab5": {hint: "navigate to the fifth tab"},
        "tab6": {hint: "navigate to the sixth tab"},
        "tab7": {hint: "navigate to the seventh tab"},
        "tab8": {hint: "navigate to the eighth tab"},
        "tab9": {hint: "navigate to the ninth tab"},
        "tab0": {hint: "navigate to the tenth tab"}
    },
    hotitems   : {},

    nodes      : [],

    init : function(amlNode){
        var _self = this;
        
        this.nodes.push(
            mnuTabs.appendChild(new apf.item({
                caption : "Close Tab",
                onclick : function(){
                    _self.closetab();
                }
            })),
            mnuTabs.appendChild(new apf.item({
                caption : "Close All Tabs",
                onclick : this.closealltabs.bind(this)
            })),
            mnuTabs.appendChild(new apf.item({
                caption : "Close All But Current Tab",
                onclick : function(){
                    _self.closeallbutme();
                }
            })),
            //mnuTabs.appendChild(new apf.divider()),
            apf.document.body.appendChild(new apf.menu({
                id : "mnuContextTabs",
                childNodes : [
                    new apf.item({
                        caption : "Close Tab",
                        onclick : function(){
                            _self.closetab(tabEditors.contextPage);
                        }
                    }),
                    new apf.item({
                        caption : "Close All Tabs",
                        onclick : this.closealltabs.bind(this)
                    }),
                    new apf.item({
                        caption : "Close Other Tabs",
                        onclick : function(){
                            _self.closeallbutme(tabEditors.contextPage);
                        }
                    })
                ]
            }))
        );
        this.hotitems["closetab"]      = [this.nodes[0]];
        this.hotitems["closealltabs"]  = [this.nodes[1]];
        this.hotitems["closeallbutme"] = [this.nodes[2]];

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
            var page;
            if ((page = e.currentTarget) && page.parentNode == this && page.localName == "page" && page.fake) {
                _self.addItem(page);
                
//                var count = 0;
//                
//                apf.addListener(page.$button, "mousedown", function(e) {
//                    if (++count < 2)
//                        return setTimeout(function () { count = 0; }, 500);
//                    require("ext/panels/panels").toggleAll();
//                    count = 0;
//                });
            }
        })
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

    addItem: function(page) {
        if (this.more)
            return; // no more items allowed...
        var no = this.nodes.push(
            mnuTabs.appendChild(new apf.item({
                caption : page.getAttribute("caption"),
                model   : page.$model,
                relPage : page.id,
                onclick : function() {
                    tabEditors.set(this.relPage);
                }
            }))
        ) - 1;
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
                if (typeof this.commands[keyId]["hotkey"] != "undefined")
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
                this.sep = mnuTabs.insertBefore(new apf.divider(), this.nodes[2].nextSibling);
            else
                this.sep = mnuTabs.appendChild(new apf.divider());
        }

        if (len < (force ? 9 : 10)) { // we already have 4 other menu items
            if (this.more) {
                this.more.destroy(true, true);
                this.more = null;
            }
        }
        else if (!this.more) {
            this.more = mnuTabs.appendChild(new apf.item({
                caption : "More...",
                onclick : function() {
                    alert("To be implemented!")
                }
            }));
        }

        // update hotkeys and hotitems:
        var keyId,
            aItems = this.nodes.slice(this.menuOffset),
            i      = 0,
            l      = aItems.length;
        for (; i < l; ++i) {
            keyId = "tab" + (i + 1 == 10 ? 0 : i + 1);
            this.hotitems[keyId] = [aItems[i]];
            if (typeof this.commands[keyId]["hotkey"] != "undefined")
                aItems[i].setProperty("hotkey", this.commands[keyId].hotkey);
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
