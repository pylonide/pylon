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
        });
    },
    
    update : function(oExt) {
        var j, l, command, items, item, val;
        var name     = oExt.path.split("/").pop().toLowerCase();
        var bindings = this.current[name];
        
        if (!bindings || !oExt.commands) 
            return;
        for (command in oExt.commands) {
            if (!bindings[command])
                continue;
            if (typeof (val = oExt.commands[command])["hotkey"] !== "undefined")
                apf.hotkeys.remove(val.hotkey);
            oExt.commands[command].hotkey = bindings[command];
            if (ext.commandsLut[command])
                ext.commandsLut[command].hotkey = bindings[command];
            if ((items = (oExt.hotitems && oExt.hotitems[command]))) {
                for (j = 0, l = items.length; j < l; ++j) {
                    item = items[j];
                    if (!item.setAttribute) continue;
                    item.setAttribute("hotkey", bindings[command]);
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
    },

    onLoad: function(def) {
        var _self = this;
        
        // update keybindings for extensions
        def = def.ext;
        
        // parse keybindings definition
        this.current = def;
        
        var i, oExt;
        for (i in ext.extLut) {
            //name     = i.substr(i.lastIndexOf("/") + 1).toLowerCase();
            //bindings = def[name];
            oExt     = ext.extLut[i];
            this.update(oExt);
        }
        
        if (!this.eventsInited) {
            ide.dispatchEvent("keybindingschange", { keybindings: def });
            ide.addEventListener("$event.keybindingschange", function(callback) {
                if (_self.current)
                    callback({keybindings: _self.current});
            });
            
            ide.addEventListener("ext.register", function(e){
                _self.update(e.ext);
            });
            
            this.eventsInited = true;
        }
        
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
