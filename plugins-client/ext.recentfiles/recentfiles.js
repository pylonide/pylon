/**
 * Adds a menu item with a submenu that lists all recently opened files
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var settings = require("core/settings");
var menus = require("ext/menus/menus");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/recentfiles/recentfiles", {
    dev         : "Ajax.org",
    name        : "Recent Files",
    alone       : true,
    type        : ext.GENERAL,
    offline     : false,
    nodes       : [],

    init : function(){
        var _self = this;

        this.nodes.push(
            this.menu =
                menus.addItemByPath("File/Open Recent/", null, 600),

            this.divider =
              menus.addItemByPath("File/Open Recent/~", new apf.divider(), 1000000),

            menus.addItemByPath("File/Open Recent/Clear Menu", new apf.item({
                onclick : function(){
                    _self.clearMenu();
                }
            }), 2000000)
        );

        ide.addEventListener("settings.load", function(e){
            var model = e.model;
            var strSettings = model.queryValue("auto/recentfiles");
            if (strSettings) {
                var currentSettings;
                try {
                    currentSettings = JSON.parse(strSettings);
                }
                catch (ex) {
                    //fail! revert to default
                    currentSettings = [];
                }

                _self.clearMenu();

                for (var i = currentSettings.length - 1; i >= 0; i--) {
                    _self.$add(currentSettings[i]);
                }
            }
        });

        ide.addEventListener("settings.save", function(e){
            if (!_self.changed)
                return;

            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/recentfiles/text()");

            var currentSettings = [];
            var nodes = _self.menu.childNodes;
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].localName == "item") {
                    currentSettings.push({
                        caption : nodes[i].caption,
                        value   : nodes[i].value
                    });
                }
                else break;
            }

            xmlSettings.nodeValue = JSON.stringify(currentSettings);
        });

        function evHandler(e){
            var node = e.node || e.xmlNode;

            if (!node)
                return;

            if (e.name != "afterfilesave" && node.getAttribute("newfile") == 1)
                return;

            var obj = {
                caption : node.getAttribute("name"),
                value   : node.getAttribute("path"),
                node    : node
            };

            _self.$add(obj);

            settings.save();
        }

        ide.addEventListener("afteropenfile", evHandler);
        ide.addEventListener("afterfilesave", evHandler);
        ide.addEventListener("closefile", evHandler);
    },

    $add : function(def) {
        var found, nodes = this.menu.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;

            if (nodes[i].localName == "item") {
                if (nodes[i].getAttribute("value") == def.value) {
                    found = nodes[i];
                    break;
                }
            }
            else break;
        }

        if (found) {
            this.menu.insertBefore(found, this.menu.firstChild);
        }
        else {
            if (def.caption && def.value) {
                this.menu.insertBefore(new apf.item({
                    caption : def.caption,
                    value   : def.value,
                    onclick : function(){
                        var node = apf.n("<file/>")
                            .attr("name", def.caption)
                            .attr("path", def.value)
                            .node();

                        editors.gotoDocument({doc: ide.createDocument(node), origin: "recentfiles"});
                    }
                }), this.menu.firstChild);
            }
        }

        while (this.menu.childNodes.length > 12) {
            this.divider.previousSibling.destroy(true, true);
        }

        this.changed = true;
        var itemNodes = this.menu.selectNodes("item");
        if (itemNodes.length == 1)
            itemNodes[0].disable();
        else
            itemNodes[itemNodes.length - 1].enable();
    },

    clearMenu : function(){
        var nodes = this.menu.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            if (nodes[0].localName == "item")
                nodes[0].destroy(true, true);
            else break;
        }
        this.menu.selectNodes("item")[0].disable();
    },

    destroy : function(){
        menus.remove("File/Open Recent");
        this.$destroy();
    }
});

});
