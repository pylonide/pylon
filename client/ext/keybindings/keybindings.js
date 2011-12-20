/**
 * Keybindings Manager for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

module.exports = ext.register("ext/keybindings/keybindings", {
    name: "Keybindings Manager",
    dev: "Ajax.org",
    alone: true,
    type: ext.GENERAL,
    current: null,
    nodes: [],

    init : function(amlNode) {
        // Fetch the default keybindings:
        var _self = this;
        ide.addEventListener("loadsettings", function(e) {
            var value = e.model.queryValue("general/keybindings/@preset") 
                || "default_" + (apf.isMac ? "mac" : "win");
                
            require(["ext/keybindings_default/" + value]);
            ide.addEventListener("$event.keybindingschange", function(callback) {
                if (_self.current)
                    callback({keybindings: _self.current});
            });
        });
    },

    onLoad: function(def) {
        // update keybindings for extensions
        def = def.ext;
        
        // parse keybindings definition
        this.current = def;
        
        for (var i in ext.extLut) {
            var name = i.substr(i.lastIndexOf("/") + 1).toLowerCase();
            var bindings = def[name];
            var oExt = ext.extLut[i];
            
            if (!bindings || !oExt.commands) 
                continue;
            
            for (var command in oExt.commands) {
                if (!bindings[command])
                    continue;
                    
                var val = oExt.commands[command].hotkey;
                if (typeof val !== "undefined")
                    apf.hotkeys.remove(val.hotkey);
                    
                oExt.commands[command].hotkey = bindings[command];
                if (ext.commandsLut[command])
                    ext.commandsLut[command].hotkey = bindings[command];
                    
                var items = oExt.hotitems && oExt.hotitems[command];
                if (items) {
                    for (var j = 0, l = items.length; j < l; ++j) {
                        if (!items[j].setAttribute) 
                            continue;
                            
                        items[j].setAttribute("hotkey", bindings[command]);
                    }
                }
                else if (typeof oExt[command] == "function") {
                    apf.hotkeys.register(bindings[command], oExt[command].bind(oExt));
                }
                else {
                    apf.console.error("Please implement the '" + command
                        + "' function on plugin '" + oExt.name + "' for the keybindings to work");
                }
            }
        }
        ide.dispatchEvent("keybindingschange", { keybindings: def });
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

});
