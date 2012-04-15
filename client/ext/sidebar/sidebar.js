/**
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var settings = require("core/settings");
var panels = require("ext/panels/panels");
var menus = require("ext/menus/menus");

module.exports = ext.register("ext/sidebar/sidebar", {
    name     : "Side Bar",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,

    nodes : [],

    hook : function(){
        var _self = this;
        
        this.nodes.push(
            menus.addItemByPath("View/Side Navigation", new apf.item({
                type: "check",
                checked : "[{require('ext/settings/settings').model}::auto/sidebar/@show]",
                "onprop.checked" : function(e) {
                    ext.initExtension(_self);
                    
                    if (apf.isTrue(e.value))
                        navbar.show();
                    else
                        navbar.hide();
                }
            }), 200)
        );
    },
    
    init : function(){
        this.nodes.push(
            hboxMain.insertBefore(new apf.vbox({
                id: "navbar",
                "class": "black-menu-bar unselectable"
            }), hboxMain.firstChild)
        );
    },
    
    add : function(panelExt, options) {
        var beforePanel, diff = 1000000;
        for (var path in panels.panels) {
            var d = panels.panels[path].$panelPosition - options.position;
            if (d > 0 && d < diff && panels.panels[path].button) {
                beforePanel = panels.panels[path];
                diff = d;
            }
        }
        
        panelExt.button = navbar.insertBefore(new apf.button({
            skin    : "mnubtn",
            state   : "true",
            //value   : "true",
            "class" : options["class"],
            caption : options.caption
        }), beforePanel && beforePanel.button); // || navbar.firstChild

        panelExt.button.addEventListener("mousedown", function(e){
            var value = this.value;
            if (panels.currentPanel && (panels.currentPanel != panelExt || value) && value) {
                panels.deactivate(panels.currentPanel == panelExt, true);
                
                if (value) {
                    if (!apf.isTrue(settings.model.queryValue('general/@animateui')))
                        colLeft.hide();
                    return;
                }
            }

            panels.activate(panelExt, true);
        });
        
        panelExt.nodes.push(panelExt.button, panelExt.mnuItem);
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
        menus.remove("View/Side Bar");
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});