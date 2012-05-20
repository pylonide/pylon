/**
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var settings = require("core/settings");
var panels = require("ext/panels/panels");
var editors = require("ext/editors/editors");
var anims = require("ext/anims/anims");

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
            else
                navbar.childNodes[1].dispatchEvent("mousedown")
        }

        this.nodes.push(
            hboxTabBar.insertBefore(new apf.hbox({
                id: "navbar",
                "class": "black-menu-bar",
                "minwidth": "45",
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
    
        var timer;
        navbar.$ext.addEventListener("mouseover", function(e){
            clearTimeout(timer);
            
            if (!_self.animating 
              && navbar.getWidth() >= navbar.$int.scrollWidth)
              //&& apf.isChildOf(navbar.$ext, e.fromElement, true))
                return;
            
            if (navbar.$int.scrollWidth != navbar.$int.offsetWidth) {
                timer = setTimeout(function(){
                    _self.animateToFullWidth();
                }, 150);
            }
        });
        
        navbar.$ext.addEventListener("mouseout", function(e){
            if (!_self.animating
              && apf.isChildOf(navbar.$ext, e.toElement, true))
                return;
            
            clearTimeout(timer);
            if (colLeft.getWidth() != navbar.getWidth()) {
                timer = setTimeout(function(){
                    _self.animateToDefaultWidth();
                }, 300);
            }
        });
        
        ide.addEventListener("panels.animate", function(e){
            if (e.noanim) {
                _self.animateToDefaultWidth(true);
                if (e.activate)
                    apf.setStyleClass(navbar.$ext, "", ["closed"]);
                else 
                    apf.setStyleClass(navbar.$ext, "closed");
                
                return;
            }
            
            //Stop and prevent any animation to happen
            clearTimeout(timer);
            _self.animating = true;
//            if (_self.animateControl)
//                _self.animateControl.stop();
            
//            var lastTween = e.tweens[e.tweens.length - 1];
//            var tween = {
//                oHtml : navbar.$ext, 
//                type  : "width", 
//                from  : navbar.getWidth(),
//                to    : lastTween.to
//            };
            
//            e.tweens.push(tween);

            anims.animateSplitBoxNode(navbar, {
                width: parseInt(e.toWidth) + "px", 
                timingFunction: "cubic-bezier(.10, .10, .25, .90)", 
                duration: 0.3 
            }, function(){
                if (e.toWidth == 0)
                    apf.setStyleClass(navbar.$ext, "closed");
                else 
                    apf.setStyleClass(navbar.$ext, "", ["closed"]);
                
                panels.lastPanel.button.$setState("Out", {});
                
                _self.animating = false;
            });
        });

        splitterPanelLeft.addEventListener("dragmove", function(e){
            navbar.setWidth(colLeft.getWidth());
        });
        splitterPanelLeft.addEventListener("dragdrop", function(e){
            navbar.setWidth(colLeft.getWidth());
        });
        
        ide.addEventListener("settings.load", function(e){
            var activePanel = e.model.queryValue("auto/panels/@active");
            if (activePanel == "none") {
                navbar.setWidth(0);
                apf.setStyleClass(navbar.$ext, "closed");
            } else {
                ide.addEventListener("init." + activePanel, function(e){
                    if (colLeft.visible)
                        navbar.setWidth(colLeft.getWidth());
                    else {
                        colLeft.addEventListener("prop.visible", function(){
                            navbar.setWidth(colLeft.getWidth());
                            colLeft.removeEventListener("prop.visible", arguments.callee);
                        });
                    }
                });
            }
            
            var showTabs = e.model.queryValue("auto/tabs/@show");
            navbar.setAttribute("minwidth", apf.isTrue(showTabs) ? 45 : 0);
        });
        
        ide.addEventListener("tabs.visible", function(e){
            navbar.setAttribute("minwidth", 
                !e.value ? 0 : 45);

            if (e.value) {
                apf.setStyleClass(navbar.$ext, "", ["minimized"]);
            } else {
                apf.setStyleClass(navbar.$ext, "minimized");
            }
        })
    },
    
    animateToFullWidth : function(){
        editors.pauseTabResize();
        
        var toWidth = navbar.$int.scrollWidth + (editors.showTabs? 6 : 9);
        anims.animateSplitBoxNode(navbar, {
            width: toWidth + "px", 
            timingFunction: "cubic-bezier(.10, .10, .25, .90)", 
            duration: 0.3 
        }, function(){
            apf.layout.forceResize();
        });
    },
    
    animateToDefaultWidth : function(immediate){
        var toWidth = colLeft.getWidth();
        anims.animateSplitBoxNode(navbar, {
            width: toWidth + "px", 
            timingFunction: "cubic-bezier(.10, .10, .25, .90)", 
            duration: 0.3,
            immediate: immediate
        }, function(){
            apf.setStyleClass(navbar.$ext, "closed");
            apf.layout.forceResize();
            editors.continueTabResize();
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

        panelExt.button.addEventListener("mouseover", function(e){
            if (panels.currentPanel)
                panels.currentPanel.panel.setTitle(this.caption);
        });
        
        panelExt.button.addEventListener("mouseout", function(e){
            if (panels.currentPanel)
                panels.currentPanel.panel.setTitle(
                    panels.currentPanel.button.caption);
        });

        panelExt.button.addEventListener("mousedown", function(e){
            var value = this.value;
            if (panels.currentPanel && (panels.currentPanel != panelExt || value) && value) {
                //panels.currentPanel == panelExt
                panels.deactivate(false, true);
                
                if (value) {
                    if (!apf.isTrue(settings.model.queryValue('general/@animateui')))
                        colLeft.hide();
                    return;
                }
            }
            
            if (panels.currentPanel) {
                setTimeout(function(){
                    panels.currentPanel.panel.setTitle(
                        panels.currentPanel.button.caption);
                });
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