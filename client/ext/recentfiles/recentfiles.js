/**
 * Adds a menu item with a submenu that lists all recently opened files
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

module.exports = ext.register("ext/recentfiles/recentfiles", {
    dev         : "Ajax.org",
    name        : "Recent Files",
    alone       : true,
    type        : ext.GENERAL,
    deps        : [],
    offline     : true,

    currentSettings : [],
    nodes       : [],

    init : function(){
        var _self = this;

        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Open Recent",
                submenu : "mnuRecent"
            }), ide.mnuFile.firstChild),

            apf.document.body.appendChild(this.menu = new apf.menu({
                id : "mnuRecent",
                childNodes : [
                    this.divider = new apf.divider(),
                    new apf.item({
                        caption : "Clear Menu",
                        onclick : function(){
                            _self.clearMenu();
                        }
                    })
                ]
            }))
        );

        ide.addEventListener("loadsettings", function(e){
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

        ide.addEventListener("savesettings", function(e){
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

            xmlSettings.nodeValue = apf.serialize(currentSettings);
            return true;
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

            _self.currentSettings.shift(obj);

            _self.$add(obj);
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
                if (nodes[i].value == def.value) {
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
            this.menu.insertBefore(new apf.item({
                caption : def.caption,
                value   : def.value,
                onclick : function(){
                    var node = apf.getXml("<file />");
                    node.setAttribute("name", def.caption);
                    node.setAttribute("path", def.value);

                    ide.dispatchEvent("openfile", {doc: ide.createDocument(node)});
                }
            }), this.menu.firstChild);
        }

        while (this.menu.childNodes.length > 12) {
            this.menu.removeChild(this.divider.previousSibling);
        }

        this.changed = true;
    },

    clearMenu : function(){
        var nodes = this.menu.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            if (nodes[0].localName == "item")
                this.menu.removeChild(nodes[0]);
            else break;
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
