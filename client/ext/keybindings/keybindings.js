/**
 * Keybindings Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/keybindings/keybindings",
    ["core/ide", "core/ext", "core/util", "text!ext/keybindings/settings.xml"],
    function(ide, ext, util, settings) {

return ext.register("ext/keybindings/keybindings", {
    name   : "Keybindings Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    current: null,

    nodes : [],

    init : function(amlNode){
        //Settings Support
        ide.addEventListener("init.ext/settings/settings", function(e){
            var page = e.ext.addSection("keybindings", "Keybindings", "general");
            page.insertMarkup(settings);
        });

        // fetch the default keybindings:
        // @todo fetch latest config from localStorage
        var _self = this;
        require(["ext/keybindings_default/default_" + (apf.isMac ? "mac" : "win")]);
        ide.addEventListener("$event.keybindingschange", function(callback){
            if (_self.current)
                callback({keybindings: _self.current});
        });
    },

    onLoad : function(def) {
        // parse keybindings definition
        this.current = def;

        // update keybindings for extensions:
        def = def.ext;
        var i, j, l, name, oExt, command, bindings, items, item, val;
        for (i in ext.extLut) {
            name     = i.substr(i.lastIndexOf("/") + 1).toLowerCase();
            bindings = def[name];
            oExt     = ext.extLut[i];
            if (!bindings || !oExt.commands) continue;
            for (command in oExt.commands) {
                if (typeof (val = oExt.commands[command])["hotkey"] !== "undefined")
                    apf.hotkeys.remove(val.hotkey);
                oExt.commands[command].hotkey = bindings[command];
                if ((items = oExt.hotitems[command])) {
                    for (j = 0, l = items.length; j < l; ++j) {
                        item = items[j];
                        if (!item.setAttribute) continue;
                        item.setAttribute("hotkey", bindings[command]);
                    }
                }
                if (typeof oExt[command] != "function" && !oExt.hotitems) {
                    apf.console.error("Please implement the '" + command
                        + "' function on plugin '" + oExt.name + "' for the keybindings to work");
                }
                else {
                    apf.hotkeys.register(bindings[command], oExt[command].bind(oExt));
                }
            }
        }

        ide.dispatchEvent("keybindingschange", {keybindings: def});
        return def;
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