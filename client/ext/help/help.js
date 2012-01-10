/**
 * Help menu for the Cloud 9 IDE
 * 
 * @author Garen J. Torikian
 * 
 * @copyright 2011, Cloud9 IDE, Inc
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/help/help.xml");
var css = require("text!ext/help/style.css");
var skin = require("text!ext/help/skin.xml");

module.exports = ext.register("ext/help/help", {
    name   : "Help Menu",
    dev    : "Cloud9 IDE, Inc.",
    alone  : true,
    type   : ext.GENERAL, 
    nodes : [],
    markup : markup,
    css    : css,
    panels : {},
    skin    : {
        id   : "help-skin",
        data : skin,
        "media-path" : "/static/ext/help/images/"
    },
    showingAll : true,
    
    initPanel : function(panelExt){
        if (panelExt.panel) {
            return;
        }
        
        ext.initExtension(panelExt);
        this.$setEvents(panelExt);
        
        var set = this.$settings && this.$settings[panelExt.path];
        if (set)
            this.setPanelSettings(panelExt, set);
        
        panelExt.panel.setAttribute("draggable", "false");
    },
    
    register : function(panelExt){
        var _self = this;
        if (!panelExt.alwayson) {
            panelExt.mnuItem = mnuPanels.appendChild(new apf.item({
                caption : panelExt.name,
                type    : "check",
                //checked : panelExt.visible || false,
                checked : "{panelExt.visible}",
                onclick : function(){
                    _self.initPanel(panelExt);
                    this.checked ? panelExt.enable() : panelExt.disable();
                }
            }));
        }
        
        if (false && this.$settings && this.$settings[panelExt.path]) {
            this.setPanelSettings(panelExt, _self.$settings[panelExt.path]);
        }
        else if (panelExt.visible) {
            if (panelExt.skin) {
                setTimeout(function(){
                    this.initPanel(panelExt);
                });
            }
            else {
                this.initPanel(panelExt);
            }
        }
        
        this.panels[panelExt.path] = panelExt;
    },

    
    unregister : function(panelExt){
        panelExt.mnuItem.destroy(true, true);
        delete this.panels[panelExt.path];
    },
    
    init : function(amlNode) {
        apf.importCssString((this.css || ""));
        
        this.nodes.push(
            barMenu.appendChild(new apf.button({
                submenu : "mnuHelp",
                caption : "Help",
                skin    : "c9-menu-btn",
                margin  : "1 0 0 0"
            })),
            mnuWindows
        );
    },
    
    showAbout : function() {
        aboutDialog.show();
        document.getElementById("c9Version").innerHTML = "Version " + window.cloud9config.version;
    },
    
    launchTwitter : function() {
        alert("Let's go to Twitter!");
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
