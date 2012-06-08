/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");
var menus = require("ext/menus/menus");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/panels/panels", {
    name   : "Panel Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    nodes : [],
    panels : {},
    
    currentPanel : null,

    register : function(panelExt, options){
        var _self = this;
        
        panelExt.mnuItem = menus.addItemByPath(
          "View/Side Bar/" + panelExt.name, 
            new apf.item({
                type    : "radio",
                value   : panelExt.path,
                group   : this.group,
                hotkey  : "{ide.commandManager." + options.command + "}",
                onclick : function(){
                    if (panelExt.show)
                        panelExt.show();
                },
                "onprop.selected" : function(e){
                    if (e.value && !panelExt.show)
                        _self.activate(panelExt);
                }
            }), options.position);
        
        ide.addEventListener("init.ext/sidebar/sidebar", function(e){
            e.ext.add(panelExt, options);
        });
        
        this.panels[panelExt.path] = panelExt;
        panelExt.$panelPosition = options.position;
        
        ide.addEventListener("init." + panelExt.path, function(e){
            panelExt.panel.setAttribute("draggable", "false");
            panelExt.panel.$ext.style.zIndex = 100;
            panelExt.panel.$ext.style.minWidth = ""; //Needed for the anims
        });
        
        ide.addEventListener("settings.load", function(){
            if (apf.isGecko)
                settings.model.setQueryValue("general/@animateui", false);
                
            if (!settings.model.queryNode("auto/panels/panel[@path='" 
                + panelExt.path + "']")) {
                settings.model.appendXml("<panel path='" 
                    + panelExt.path + "' width='" 
                    + panelExt.defaultWidth + "' />", "auto/panels");
            }
        });
        
        // for local version
        if (ide.dispatchEvent("panels.activateDefault") !== false) {
            var active = settings.model.queryValue("auto/panels/@active");
            if ((panelExt["default"] && !active || active == panelExt.path))
                _self.activate(panelExt, null, true);
        }
    },
    
    animate : function(win, toWin, toWidth){
        var tweens = [], _self = this;
        
        if (this.animateControl)
            this.animateControl.stop();
        
        this.animating = true;
        
        if (self.navbar)
            navbar.$ext.style.zIndex = 10000;
        
        colLeft.setAttribute("minwidth", 0);
        
        if (toWin) {
            var toWinExt = toWin.$altExt || toWin.$ext;
            
            //Hack because of bug in hbox.js - apparently only run dialog has .$altExt
            toWin.show();
            toWin.hide();
        }
        
        if (win) {
            var left = win.getLeft();
            var top  = win.getTop();
            var width = win.getWidth();
            var height = win.getHeight();
            
            var winExt = win.$altExt || win.$ext;
            var diff  = apf.getDiff(winExt);
            var zIndex = winExt.style.zIndex;
            if (width < win.minwidth)
                width = win.minwidth;
            
            winExt.style.position = "absolute";
            winExt.style.zIndex = 1000;
            winExt.style.left = left + "px";
            winExt.style.top = top + "px";
            winExt.style.width = (width - diff[0]) + "px";
            winExt.style.height = (height - diff[1]) + "px";
            
            if (toWin) {
                tweens.push(
                    {oHtml: toWinExt, type: "fade", from: 0, to: 1},
                    {oHtml: toWinExt, type: "width", from: width, to: toWidth},
                    {oHtml: winExt, type: "width", from: width, to: toWidth},
                    {oHtml: colLeft.$ext, type: "width", from: width, to: toWidth}
                );
            }
            else {
                tweens.push(
                    {oHtml: winExt, type: "left", from: left, to: left - width},
                    {oHtml: colLeft.$ext, type: "width", from: width, to: 0}
                );
            }
        }
        else {
            toWin.show();
            colLeft.show();

            var left = toWin.getLeft();
            var top  = toWin.getTop();
            var height = toWin.getHeight();
            var width = 0;
            
            tweens.push(
                {oHtml: toWinExt, type: "left", from: left - toWidth, to: left},
                {oHtml: colLeft.$ext, type: "width", from: width, to: toWidth}
            );
        }
        
        if (toWin) {
            var diff2  = apf.getDiff(toWinExt);
            var zIndex2 = toWinExt.style.zIndex;
            toWinExt.style.position = "absolute";
            toWinExt.style.zIndex = 2000;
            toWinExt.style.left = left + "px";
            toWinExt.style.top = top + "px";
            toWinExt.style.width = (toWidth - diff2[0]) + "px";
            toWinExt.style.height = (height - diff2[1]) + "px";
            toWin.show();
        }
        
        editors.pauseTabResize();
        
        colLeft.$ext.style.width = width + "px";
        //apf.setOpacity(toWinExt, 0);
        
        var options = {
            steps : win && toWin ? 6 : 6,
            interval : apf.isChrome ? 0 : 5,
            control : this.animateControl = {},
            anim : win && toWin ? apf.tween.easeOutCubic : apf.tween.easeOutCubic,
            tweens : tweens,
            oneach: function(){
                apf.layout.forceResize()
            },
            onfinish : function(){
                if (toWin) {
                    toWinExt.style.zIndex = zIndex2;
                    toWinExt.style.position = 
                    toWinExt.style.left = 
                    toWinExt.style.top = 
                    toWinExt.style.height =
                    toWinExt.style.width = "";
                    apf.setOpacity(toWinExt, 1);
                    
                    colLeft.setAttribute("minwidth", toWin.minwidth);
                }
                if (win) {
                    winExt.style.zIndex = zIndex;
                    winExt.style.position = 
                    winExt.style.left = 
                    winExt.style.top = 
                    winExt.style.height =
                    winExt.style.width = "";
                    apf.setOpacity(winExt, 1);
                    win.hide();
                    
                    if (!toWin)
                        colLeft.hide();
                }
                
                editors.continueTabResize();
                
                _self.animating = false;
            }
        };
        options.onstop = options.onfinish;
        
        ide.dispatchEvent("panels.animate", { 
            options : options,
            tweens : tweens, 
            win : win,
            toWin : toWin
        });
        
        apf.tween.multi(document.body, options);
    },
    
    activate : function(panelExt, noButton, noAnim){
        if (this.currentPanel == panelExt)
            return;
        
        ext.initExtension(panelExt);
        
        lastPanel = this.currentPanel;
        
        if (this.currentPanel && (this.currentPanel != this))
            this.deactivate();
        
        var width = settings.model.queryValue("auto/panels/panel[@path='" 
            + panelExt.path + "']/@width") || panelExt.defaultWidth;
        
        if (noAnim || !apf.isTrue(settings.model.queryValue('general/@animateui'))) {
            panelExt.panel.show();
            colLeft.show();
            colLeft.setAttribute("minwidth", panelExt.panel.minwidth);
            colLeft.setWidth(width);
            
            ide.dispatchEvent("panels.animate", {noanim : true, activate: true});
            
            apf.layout.forceResize();
        }
        else if (!noAnim)
            this.animate(lastPanel && lastPanel.panel, panelExt.panel, width);

        colLeft.show();
        
        if (!noButton && panelExt.button)
            panelExt.button.setValue(true);

        splitterPanelLeft.show();
        this.currentPanel = panelExt;
        this.lastPanel    = panelExt;
        
        settings.model.setQueryValue("auto/panels/@active", panelExt.path);
        
        ide.dispatchEvent("showpanel." + panelExt.path);
        
        this.mnuPanelsNone.setAttribute("selected", false);
        panelExt.mnuItem.select(); //Will set setting too
    },
    
    deactivate : function(noButton, anim){
        if (!this.currentPanel)
            return;

        if (anim === false || !apf.isTrue(settings.model.queryValue('general/@animateui'))) {
            this.currentPanel.panel.hide();
            colLeft.hide();
            ide.dispatchEvent("panels.animate", {noanim : true, activate: false});
            
            apf.layout.forceResize();
        }
        else if (anim)
            this.animate(this.currentPanel.panel);
        
        if (!noButton && this.currentPanel.button)
            this.currentPanel.button.setValue(false);

        splitterPanelLeft.hide();
        
        //Quick Fix
        if (apf.isGecko)
            apf.layout.forceResize(vbMain.$ext);
        
        ide.dispatchEvent("hidepanel." + this.currentPanel.path);
        
        this.currentPanel = null;
        
        if (anim != undefined) {
            settings.model.setQueryValue("auto/panels/@active", "none");
            this.mnuPanelsNone.select();
        }
    },
    
    unregister : function(panelExt){
        menus.remove("View/Side Bar/" + panelExt.name);
          
        delete this.panels[panelExt.path];
    },

    init : function(amlNode){
        var _self = this;
        
        this.nodes.push(
            this.group = apf.document.documentElement.appendChild(new apf.group({
                value : "[{req" + "uire('core/settings').model}::auto/panels/@active]"
            })),
            
            menus.addItemByPath("View/Side Bar/", null, 100),
            menus.addItemByPath("View/~", new apf.divider(), 200),
            
            this.mnuPanelsNone = 
              menus.addItemByPath("View/Side Bar/None", new apf.item({
                type: "radio",
                selected : "true",
                group: this.group,
                "onclick": function(e){
                    _self.deactivate(null, true);
                }
              }), 100),
            menus.addItemByPath("View/Side Bar/~", new apf.divider(), 200)
        );
        
        var timer;
        colLeft.addEventListener("resize", function(){
            if (!_self.currentPanel || _self.animating)
                return;
            
            clearTimeout(timer);
            timer = setTimeout(function(){
                if (!_self.currentPanel)
                    return;
                
                var query = "auto/panels/panel[@path='" 
                    + _self.currentPanel.path + "']/@width";
                    
                if (settings.model.queryValue(query) != colLeft.getWidth())
                    settings.model.setQueryValue(query, colLeft.getWidth());
            }, 500);
        });
        
        /**** Support for state preservation ****/
        
        var _self = this;
        ide.addEventListener("settings.load", function(e){
            settings.setDefaults("general", [["animateui", apf.isGecko ? false : true]]);
        });
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
        menus.remove("View/~", 200);
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});