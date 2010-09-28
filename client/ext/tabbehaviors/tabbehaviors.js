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
    name   : "Tab Behaviors",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    menus  : [],
    sep    : null,
    more   : null,

    nodes  : [],

    init : function(amlNode){
        //Settings Support
        ide.addEventListener("init.ext/settings/settings", function(e){
            var page = e.ext.addSection("Tab Behaviors", "section[@name='General']");
            page.insertMarkup(settings);
        });

        var _self = this;

        tabEditors.addEventListener("close", function(e) {
            _self.removeItem(e.page);
            if (!e || !e.htmlEvent)
                return;
            var page = e.page;
            e = e.htmlEvent;
            if (e.shiftKey || e.altKey) {
                // Shift = close all
                // Alt/ Option = close all but this
                var pages = this.getPages(),
                    i     = pages.length - 1;
                for (; i >= 0; --i) {
                    if (e.altKey && pages[i] == page) continue;
                    this.remove(pages[i], true);
                }
                return false;
            }
        });

        tabEditors.addEventListener("DOMNodeInserted", function(e) {
            var page;
            if ((page = e.currentTarget) && page.parentNode == this && page.localName == "page" && page.fake) {
                _self.addItem(page);
            }
        })
    },

    addItem: function(page) {
        this.setDivider(true);
        if (this.nodes.length >= 10)
            return this.setMoreItem();
        this.nodes.push(
            mnuPanels.appendChild(new apf.item({
                caption : page.caption,
                relPage : page.id,
                onclick : function() {
                    tabEditors.set(this.relPage);
                }
            }))
        );
    },

    removeItem: function(page) {
        var item,
            i = 0,
            l = this.nodes.length;
        for (; i < l; ++i) {
            if ((item = this.nodes[i]).relPage == page.id) {
                item.destroy(true, true);
                this.nodes.splice(i, 1);
                this.setMoreItem();
                return this.setDivider();
            }
        }
    },

    setDivider: function(force) {
        if (this.sep && !this.nodes.length) {
            this.sep.destroy(true, true);
            this.sep = null;
        }
        else if (!this.sep && (this.nodes.length || force)) {
            if (this.nodes.length)
                this.sep = mnuPanels.insertBefore(new apf.divider(), this.nodes[0]);
            else
                this.sep = mnuPanels.appendChild(new apf.divider());
        }
    },

    setMoreItem: function() {
        if (this.nodes.length < 10) {
            if (this.more) {
                this.more.destroy(true, true);
                this.more = null;
            }
            return;
        }
        if (!this.more) {
            this.more = mnuPanels.appendChild(new apf.item({
                caption : "More...",
                onclick : function() {
                    alert("To be implemented!")
                }
            }));
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