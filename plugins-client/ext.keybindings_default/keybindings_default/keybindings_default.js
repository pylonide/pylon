/**
 * Default Keybindings Help Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/keybindings_default/keybindings_default.xml");
var css = require("text!ext/keybindings_default/keybindings_default.css");

var mac = require("text!ext/keybindings_default/default_mac.js");
var win = require("text!ext/keybindings_default/default_win.js");

function parseKeyBindings(txt) {
    var json;
    txt.replace(/keys\.onLoad\(([\w\W\n\r]*)\);\n/gm, function(m, s){
        json = s.replace(/\);[\n\r\s]*\}$/, "");
    });
    return JSON.parse(json);
}

var extCache = {};

function uCaseFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function generatePanelHtml(def, isMac) {
    var html = [];
    var div, extName, oExt, cmdName, command, parts;
    var count = 0;
    for (extName in def.ext) {
        ++count;
        oExt = extCache[extName];
        if (!extCache[extName]) {
            try {
                oExt = extCache[extName] = require("ext/" + extName + "/" + extName);
            }
            catch(ex) {
                continue;
            }
        }
        
        div = count % 3;
        html.push('<div class="keybindings_default_block',
            (div === 1 || div === 2 ? "_border" : ""),
            '"><h3>', oExt.name.toUpperCase(), "</h3>");
        for (cmdName in def.ext[extName]) {
            command = def.ext[extName][cmdName];
            html.push('<div class="keybindings_default_command">',
                '<span class="keybindings_default_cmdname">',
                    (oExt.commands && oExt.commands[cmdName].short 
                        ? oExt.commands[cmdName].short
                        : uCaseFirst(cmdName)
                    ),
                '</span><br/>');
            command = command.split("|")[0];
            if (isMac)
                parts = apf.hotkeys.toMacNotation(command).split(" ");
            else
                parts = command.split("-");
            html.push('<span class="keybindings_default_cmdkey">', 
                parts.join('</span><span class="keybindings_default_cmdop">+</span><span class="keybindings_default_cmdkey">'),
                '</span></div>');
        }
        html.push("</div>");
    }
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
        apf.importCssString(css || "");
        
        this.hotitems.keybindings = [this.nodes[0]];
    },

    init : function(amlNode){
        apf.document.body.insertMarkup(markup);
        
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
        panelWin.$ext.innerHTML = generatePanelHtml(parseKeyBindings(win));
        
        // build mac panel:
        var panelMac = barKeyBindingsMac;
        panelMac.$ext.innerHTML = generatePanelHtml(parseKeyBindings(mac), true);
    },
    
    keybindings: function() {
        ext.initExtension(this);
        winKeyBindings.show();
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