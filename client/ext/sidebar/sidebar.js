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

    init : function(){
        var _self = this;

        function btnClick(){
            if (panels.currentPanel)
                panels.deactivate(null, true);
            else if (panels.lastPanel)
                panels.activate(panels.lastPanel);
        }

        this.nodes.push(
            hboxTabBar.insertBefore(new apf.hbox({
                id: "navbar",
                "class": "black-menu-bar",
                childNodes : [
                    new apf.button({
                        skin    : "mnubtn",
                        "class" : "c9-logo",
                        onclick : btnClick
                    }),
                    this.btnArrow = new apf.button({
                        skin    : "mnubtn",
                        "class" : "toggle-black-menu-bar",
                        onclick : btnClick
                    })
                ]
            }), hboxTabBar.firstChild)
        );
        
        navbar.$ext.addEventListener("mouseover", function(e){
            if (apf.isChildOf(navbar.$ext, e.fromElement, true))
                return;
            
            if (navbar.$int.scrollWidth != navbar.$int.offsetWidth) {
                _self.animateToFullWidth();
            }
        });
        
        navbar.$ext.addEventListener("mouseout", function(e){
            if (apf.isChildOf(navbar.$ext, e.toElement, true))
                return;
            
            if (colLeft.getWidth() != navbar.getWidth()) {
                _self.animateToDefaultWidth();
            }
        });
        
        ide.addEventListener("panels.animate", function(e){
            var lastTween = e.tweens[e.tweens.length - 1];
            var tween = {oHtml: navbar.$ext, type: "width", from: navbar.getWidth(), to: lastTween.to};
            e.tweens.push(tween);
            
            var finish = e.options.onfinish;
            e.options.onfinish = function(){
                if (lastTween.to == 0)
                    apf.setStyleClass(navbar.$ext, "closed");
                else
                    apf.setStyleClass(navbar.$ext, "", ["closed"]);
                
                finish.apply(this, arguments);
            }
        });

        splitterPanelLeft.addEventListener("dragmove", function(e){
            navbar.setWidth(colLeft.getWidth());
        });
        splitterPanelLeft.addEventListener("dragdrop", function(e){
            navbar.setWidth(colLeft.getWidth());
        });
        
        ide.addEventListener("loadsettings", function(e){
            var activePanel = e.model.queryValue("auto/panels/@active");
            if (activePanel == "none") {
                navbar.setWidth(0);
            } else {
                ide.addEventListener("init." + activePanel, function(e){
                    navbar.setWidth(colLeft.getWidth());
                });
            }
        });
    },
    
    animateToFullWidth : function(){
        if (this.animateControl)
            this.animateControl.stop();
        
        apf.tween.single(navbar.$ext, {
            type: "width",
            from: navbar.getWidth(),
            to: navbar.$int.scrollWidth + 6,
            steps : 6,
            interval : apf.isChrome ? 0 : 5,
            control : this.animateControl = {},
            anim : apf.tween.easeOutCubic,
            onfinish : function(){
                //apf.setStyleClass(navbar.$ext, "", ["closed"]);
            }
        });
    },
    
    animateToDefaultWidth : function(){
        if (this.animateControl)
            this.animateControl.stop();
        
        apf.tween.single(navbar.$ext, {
            type: "width",
            from: navbar.getWidth(),
            to: colLeft.getWidth(),
            steps : 6,
            interval : apf.isChrome ? 0 : 5,
            control : this.animateControl = {},
            anim : apf.tween.easeOutCubic,
            onfinish : function(){
                if (colLeft.getWidth() == 0)
                    apf.setStyleClass(navbar.$ext, "closed");
            }
        });
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
            "class" : options["class"],
            caption : options.caption
        }), beforePanel && beforePanel.button || this.btnArrow);

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
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});