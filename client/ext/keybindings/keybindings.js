/**
 * Keybindings Manager for the Ajax.org Cloud IDE
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
            var page = e.ext.addSection("Keybindings", "section[@name='General']");
            page.insertMarkup(settings);
        });

        // fetch the default keybindings:
        // @todo fetch latest config from localStorage
        var _self = this;
        require(["ext/keybindings_default/default_" + (apf.isMac ? "mac" : "win")]);
        ide.addEventListener("$event.keybindingschange", function(callback){
            if (_self.current)
                callback(_self.current);
        });
    },

    onLoad : function(def) {
        // parse keybindings definition
        this.current = def;

        // update keybindings for extensions:
        def = def.ext;
        var i, j, l, name, oExt, hotkey, bindings, items, item, val;
        for (i in ext.extLut) {
            name     = i.substr(i.lastIndexOf("/") + 1).toLowerCase();
            bindings = def[name];
            oExt     = ext.extLut[i];
            if (!bindings || !oExt.hotkeys) continue;
            for (hotkey in oExt.hotkeys) {
                if ((val = oExt.hotkeys[hotkey]) !== 1)
                    apf.hotkeys.remove(val);
                oExt.hotkeys[hotkey] = bindings[hotkey];
                if ((items = oExt.hotitems[hotkey])) {
                    for (j = 0, l = items.length; j < l; ++j) {
                        item = items[j];
                        item.setAttribute("hotkey", bindings[hotkey]);
                    }
                }
                apf.hotkeys.register(bindings[hotkey], oExt[hotkey]);
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