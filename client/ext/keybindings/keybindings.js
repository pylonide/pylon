/**
 * Keybindings Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var settings = require("text!ext/keybindings/settings.xml");

//var HashHandler = require("ace/keyboard/hash_handler").HashHandler;
//var default_mac = require("ace/keyboard/keybinding/default_mac").bindings;
//editor.setKeyboardHandler(new HashHandler(default_mac));

module.exports = ext.register("ext/keybindings/keybindings", {
    name   : "Keybindings Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    current: null,

    nodes : [],

    init : function(amlNode){
        //Settings Support
        /*ide.addEventListener("init.ext/settings/settings", function(e){
            e.ext.addSection("code", "", "general", function(){});
            barSettings.insertMarkup(settings);
            ddKeyBind.setValue("default_" + (apf.isMac ? "mac" : "win"));
            ddKeyBind.addEventListener("afterchange", function(e){
                require(["ext/keybindings_default/" + this.value]);
                ide.addEventListener("$event.keybindingschange", function(callback){
                    if (_self.current)
                        callback({keybindings: _self.current});
                });
            });
        });*/

        // fetch the default keybindings:
        var _self = this;
        ide.addEventListener("loadsettings", function(e){
            var value = e.model.queryValue("general/keybindings/@preset") 
                || "default_" + (apf.isMac ? "mac" : "win");
                
            require(["ext/keybindings_default/" + value]);
            ide.addEventListener("$event.keybindingschange", function(callback){
                if (_self.current)
                    callback({keybindings: _self.current});
            });
        });
    },

    onLoad : function(def) {
        // update keybindings for extensions:
        def = def.ext;
        
        // parse keybindings definition
        this.current = def;
        
        var i, j, l, name, oExt, command, bindings, items, item, val;
        for (i in ext.extLut) {
            name     = i.substr(i.lastIndexOf("/") + 1).toLowerCase();
            bindings = def[name];
            oExt     = ext.extLut[i];
            if (!bindings || !oExt.commands) continue;
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