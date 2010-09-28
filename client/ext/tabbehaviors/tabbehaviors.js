/**
 * Tab Behaviors for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/tabbehaviors/tabbehaviors",
    ["core/ide", "core/ext", "core/util", "text!ext/tabbehaviors/settings.xml"],
    function(ide, ext, util, settings) {

return ext.register("ext/tabbehaviors/tabbehaviors", {
    name    : "Tab Behaviors",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    menus   : [],
    sep     : null,
    more    : null,
    hotkeys : {"closetab":1,"closealltabs":1,"closeallbutme":1,"gototabright":1,
        "gototableft":1,"tab1":1,"tab2":1,"tab3":1,"tab4":1,"tab5":1,"tab6":1,
        "tab7":1,"tab8":1,"tab9":1,"tab0":1},
    hotitems: {},

    nodes   : [],

    init : function(amlNode){
        //Settings Support
        ide.addEventListener("init.ext/settings/settings", function(e){
            var page = e.ext.addSection("Tab Behaviors", "section[@name='General']");
            page.insertMarkup(settings);
        });

        this.nodes.push(
            mnuPanels.appendChild(new apf.divider()),
            mnuPanels.appendChild(new apf.item({
                caption : "Close Tab",
                onclick : this.closetab.bind(this)
            })),
            mnuPanels.appendChild(new apf.item({
                caption : "Close All Tabs",
                onclick : this.closealltabs.bind(this)
            })),
            mnuPanels.appendChild(new apf.item({
                caption : "Close All But Current Tab",
                onclick : this.closeallbutme.bind(this)
            }))
        );

        this.hotitems["closetab"] = [this.nodes[1]];
        this.hotitems["closealltabs"] = [this.nodes[2]];
        this.hotitems["closeallbutme"] = [this.nodes[3]];

        var _self = this;

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
            }
        })
    },

    closetab: function() {
        var page = tabEditors.getPage();
        if (page)
            tabEditors.remove(page);
        return false;
    },

    closealltabs: function() {
        var tabs  = tabEditors,
            pages = tabs.getPages(),
            i     = pages.length - 1;
        for (; i >= 0; --i) {
            this.removeItem(pages[i]);
            tabs.remove(pages[i], true);
        }
        return false;
    },

    closeallbutme: function(page) {
        page = page || tabEditors.getPage();
        var tabs  = tabEditors,
            pages = tabs.getPages(),
            i     = pages.length - 1;
        for (; i >= 0; --i) {
            if (pages[i] == page) continue;
            this.removeItem(pages[i]);
            tabs.remove(pages[i], true);
        }
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
        var item = this.nodes[nr + 3];
        if (item && item.relPage) {
            tabEditors.set(item.relPage);
            return false;
        }
    },

    addItem: function(page) {
        this.updateState(true);
        if (this.more)
            return; // no more items allowed...
        var no = this.nodes.push(
            mnuPanels.appendChild(new apf.item({
                caption : page.caption,
                relPage : page.id,
                onclick : function() {
                    tabEditors.set(this.relPage);
                }
            }))
        ) - 1;

        var keyId = "tab" + (no - 3 == 10 ? 0 : no - 3);
        this.hotitems[keyId] = [this.nodes[no]];
        if (this.hotkeys[keyId] !== 1) {
            apf.hotkeys.register(this.hotkeys[keyId], this[keyId].bind(this));
            this.nodes[no].setAttribute("hotkey", this.hotkeys[keyId]);
        }
    },

    removeItem: function(page) {
        var item, keyId,
            i = 0,
            l = this.nodes.length;
        for (; i < l; ++i) {
            if ((item = this.nodes[i]).relPage == page.id) {
                item.destroy(true, true);
                this.nodes.splice(i, 1);
                keyId = "tab" + (i - 3 == 10 ? 0 : i - 3);
                if (this.hotkeys[keyId] !== 1)
                    apf.hotkeys.remove(this.hotkeys[keyId]);
                return this.updateState();
            }
        }
    },

    updateState: function(force) {
        var len = this.nodes.length - 4;
        if (this.sep && !len) {
            this.sep.destroy(true, true);
            this.sep = null;
        }
        else if (!this.sep && (len || force)) {
            if (len)
                this.sep = mnuPanels.insertBefore(new apf.divider(), this.nodes[0]);
            else
                this.sep = mnuPanels.appendChild(new apf.divider());
        }

        if (len < (force ? 9 : 10)) { // we already have 4 other menu items
            if (this.more) {
                this.more.destroy(true, true);
                this.more = null;
            }
        }
        else if (!this.more) {
            this.more = mnuPanels.appendChild(new apf.item({
                caption : "More...",
                onclick : function() {
                    alert("To be implemented!")
                }
            }));
        }

        // update hotkeys and hotitems:
        var keyId,
            aItems = this.nodes.slice(4),
            i      = 0,
            l      = aItems.length;
        for (; i < l; ++i) {
            keyId = "tab" + (i + 1 == 10 ? 0 : i + 1);
            this.hotitems[keyId] = [aItems[i]];
            if (this.hotkeys[keyId] !== 1)
                aItems[i].setProperty("hotkey", this.hotkeys[keyId]);
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

    }
);