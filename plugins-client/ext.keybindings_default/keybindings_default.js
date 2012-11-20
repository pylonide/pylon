/**
 * Default Keybindings Help Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var util = require("core/util");
var markup = require("text!ext/keybindings_default/keybindings_default.xml");
var css = require("text!ext/keybindings_default/keybindings_default.css");
var commands = require("ext/commands/commands");

function generatePanelHtml(commands, platform) {
    var html = [];
    var div, oExt, parts;
    var count = 0;
    
    Object.keys(commands).forEach(function(name){
        ++count;
        
        var command = commands[name];
        var key = (command.bindKey && command.bindKey[platform] || "").split("|")[0];
        
        if (!key)
            return;
        
        if (platform == "mac")
            key = apf.hotkeys.toMacNotation(key);
            
        div = count % 3;
        html.push('<div class="keybindings_default_block',
            (div === 1 || div === 2 ? "_border" : ""),
            '">');

        html.push('<div class="keybindings_default_command">',
            '<span class="keybindings_default_cmdname">',
                (command.short 
                    ? command.short
                    : command.name.uCaseFirst()
                ),
            '</span><br/>');
        
        parts = key.split(/[\- ]/);
        html.push('<span class="keybindings_default_cmdkey">', 
            parts.join('</span><span class="keybindings_default_cmdop">+</span><span class="keybindings_default_cmdkey">'),
            '</span></div>');

        html.push("</div>");
    });
    
    return html.join("");
}

module.exports = ext.register("ext/keybindings_default/keybindings_default", {
    name    : "Default Keybindings",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    
    commands : {
        "keybindings": {hint: "show a window that lists all available key shortcuts within the IDE"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        css = util.replaceStaticPrefix(css);
        apf.importCssString(css || "");
        
        this.hotitems.keybindings = [this.nodes[0]];
    },

    init : function(amlNode){
        apf.document.documentElement.insertMarkup(markup);
        
        var as = Array.prototype.slice.call(winKeyBindings.$ext.getElementsByTagName("a"));
        var _self = this;
        as.forEach(function(a) {
            var which = a.innerHTML.indexOf("Mac") > -1 ? "mac" : "win";
            apf.addListener(a, "mousedown", function(e) {
                _self.togglePanels(which);
            });
        });
        
        this.buildPanels();
    },
    
    togglePanels: function(which) {
        if (which == "mac") {
            //barKeyBindingsWin.hide();
            //barKeyBindingsMac.show();
            barKeyBindingsWin.setAttribute("visible", "false");
            barKeyBindingsMac.setAttribute("visible", "true");
        }
        else {
            barKeyBindingsMac.setAttribute("visible", "false");
            barKeyBindingsWin.setAttribute("visible", "true");
            //barKeyBindingsMac.hide();
            //barKeyBindingsWin.show();
        }
    },
    
    buildPanels: function() {
        // build windows panel:
        var panelWin = barKeyBindingsWin;
        panelWin.$ext.innerHTML = generatePanelHtml(commands.commands, "win");
        
        // build mac panel:
        var panelMac = barKeyBindingsMac;
        panelMac.$ext.innerHTML = generatePanelHtml(commands.commands, "mac");
    },
    
    keybindings: function() {
        ext.initExtension(this);
        winKeyBindings.show();
    },

    // used by cloud9 ide documentation
    generatePanelJson: function() {
        var json = { mac: {}, win: {}};
        var count = 0;
        
        Object.keys(commands.commands).forEach(function(name){
            ++count;
            
            var command = commands.commands[name];
            var key = (command.bindKey && command.bindKey["win"] || "").split("|")[0];
            var mackey = (command.bindKey && command.bindKey["mac"] || "").split("|")[0];
            
            if (!key || !mackey)
                return;
            
            mackey = apf.hotkeys.toMacNotation(mackey);
            
            var cmd = command.short ? command.short : command.name.uCaseFirst();
            
            json.mac[cmd] = mackey.replace(/\s+/g, "-");
            json.win[cmd] = key.replace(/\s+/g, "-");
        });
        
        return json;
    }
});

});
