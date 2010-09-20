/**
 * Keybindings Manager for the Ajax.org Cloud IDE
 */
require.def("ext/keybindings/keybindings",
    ["core/ide", "core/ext", "core/util"],
    function(ide, ext, util) {

return ext.register("ext/keybindings/keybindings", {
    name   : "Keybindings Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    current: null,

    nodes : [],

    init : function(amlNode){
        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Keybindings",
                onclick : function(){
                    winKeybindings.show();
                }
            }), ide.mnuFile.childNodes[1])
        );

        // fetch the default keybindings:
        // @todo fetch latest config from localStorage
        var _self = this;
        apf.ajax("conf/keybindings/default_" + (apf.isMac ? "mac" : "win") + ".js", {
            callback: function(data) {
                if (data && data.indexOf("require.def(") > -1)
                    eval(data);

                ide.addEventListener("$event.keybindingschange", function(callback){
                    callback(_self.current);
                });
            }
        })
    },

    onLoad : function(def) {
        // parse keybindings definition
        this.current = def;
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