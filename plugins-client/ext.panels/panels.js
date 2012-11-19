/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var settings = require("core/settings");
var menus = require("ext/menus/menus");
var anims = require("ext/anims/anims");

module.exports = ext.register("ext/panels/panels", {
    name   : "Panel Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    nodes  : [],
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
            panelExt.panel.setAttribute("anchors", "0 0 0 0");
        });

        ide.addEventListener("settings.load", function(){
            if (!settings.model.queryNode("auto/panels/panel[@path="
                + util.escapeXpathString(panelExt.path) + "]")) {
                settings.model.appendXml(apf.n("<panel/>")
                    .attr("path", panelExt.path)
                    .attr("width", panelExt.defaultWidth)
                    .node(), "auto/panels");
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
        var _self = this;

        this.animating = true;

        if (self.navbar)
            navbar.$ext.style.zIndex = 10000;

        colLeft.setAttribute("minwidth", 0);

        var onfinish = function(){
            if (toWin) {
                toWinExt.style.zIndex = zIndex2;
                toWinExt.style.left = 0;
                toWinExt.style.minWidth = "";
                colLeft.setAttribute("minwidth", toWin.minwidth);
            }
            else {
                colLeft.hide();
            }
            if (win) {
                winExt.style.zIndex = zIndex;
                win.$ext.style.left = 0;
                win.$ext.style.minWidth = "";
                win.hide();
            }

            _self.animating = false;
        }

        ide.dispatchEvent("panels.animate", {
            win : win,
            toWin : toWin,
            toWidth : toWidth,
            onfinish : onfinish
        });

        if (toWin) {
            var toWinExt = toWin.$altExt || toWin.$ext;

            //Hack because of bug in hbox.js - apparently only run dialog has .$altExt
            toWin.show();
            toWin.hide();
        }

        if (toWin) {
            var zIndex2 = toWinExt.style.zIndex;
            toWinExt.style.zIndex = 2000;
            toWin.show();
        }

        if (win) {
            var winExt = win.$altExt || win.$ext;
            var zIndex = winExt.style.zIndex;

            winExt.style.zIndex = 1000;

            if (toWin) {
                var options = {
                    timingFunction: "cubic-bezier(.10, .10, .25, .90)",
                    duration: 0.15
                };

                if (!self["req"+"uire"]("ext/themes/themes").isDark) {
                    apf.setOpacity(toWin.$ext, 0);
                    anims.animate(toWin, apf.extend({ opacity: 1 }, options));
                }
                else {
                    win.hide();
                }
                anims.animateSplitBoxNode(colLeft,
                    apf.extend({ width: toWidth + "px" }, options), onfinish);
            }
            else {
                winExt.style.minWidth = (winExt.offsetWidth - apf.getWidthDiff(winExt)) + "px";
                winExt.style.left = "";
                anims.animateSplitBoxNode(colLeft, {
                    width : 0,
                    duration : 0.15,
                    timingFunction: "cubic-bezier(.10, .10, .25, .90)" //@todo
                }, onfinish);
            }
        }
        else {
            toWin.show();
            colLeft.show();

            toWinExt.style.minWidth = (toWidth - apf.getWidthDiff(toWinExt)) + "px";
            toWinExt.style.left = "";
            anims.animateSplitBoxNode(colLeft, {
                width : toWidth + "px",
                duration : 0.15,
                timingFunction: "cubic-bezier(.10, .10, .25, .90)" //@todo
            }, onfinish);
        }
    },

    activate : function(panelExt, noButton, noAnim){
        if (this.currentPanel == panelExt)
            return;

        ext.initExtension(panelExt);

        lastPanel = this.currentPanel;

        if (this.currentPanel && (this.currentPanel != this))
            this.deactivate();

        var width = settings.model.queryValue("auto/panels/panel[@path="
            + util.escapeXpathString(panelExt.path) + "]/@width") || panelExt.defaultWidth;

        colLeft.show();

        if (noAnim || !apf.isTrue(settings.model.queryValue('general/@animateui'))) {
            panelExt.panel.show();
            colLeft.show();
            colLeft.setAttribute("minwidth", panelExt.panel.minwidth);
            colLeft.setWidth(width);

            ide.dispatchEvent("panels.animate", {noanim : true, toWidth: width});

            apf.layout.forceResize();
        }
        else if (!noAnim) {
            var _self = this;
            setTimeout(function(){
                _self.animate(lastPanel && lastPanel.panel, panelExt.panel, width);
            }, 10);
        }

        if (!noButton && panelExt.button)
            panelExt.button.setValue(true);

        this.currentPanel = panelExt;
        this.lastPanel    = panelExt;

        settings.model.setQueryValue("auto/panels/@active", panelExt.path);

        ide.dispatchEvent("showpanel." + panelExt.path);

        this.mnuPanelsNone.setAttribute("selected", false);
        panelExt.mnuItem.select(); //Will set setting too
        
        panelExt.panel.setTitle(panelExt.button && panelExt.button.caption || "Workspace Files");
    },

    deactivate : function(noButton, anim){
        if (!this.currentPanel)
            return;

        if (anim === false || !apf.isTrue(settings.model.queryValue('general/@animateui'))) {
            this.currentPanel.panel.hide();
            colLeft.hide();
            ide.dispatchEvent("panels.animate", {noanim : true});

            apf.layout.forceResize();
        }
        else if (anim)
            this.animate(this.currentPanel.panel);

        if (!noButton && this.currentPanel.button)
            this.currentPanel.button.setValue(false);

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

        splitterPanelLeft.addEventListener("dragdrop", function(e){
            if (!_self.currentPanel)
                return;

            var query = "auto/panels/panel[@path="
                + util.escapeXpathString(_self.currentPanel.path) + "]/@width";

            if (settings.model.queryValue(query) != colLeft.getWidth())
                settings.model.setQueryValue(query, colLeft.getWidth());
        });

        /**** Support for state preservation ****/

        var _self = this;
        ide.addEventListener("settings.load", function(e){
            settings.setDefaults("general", [["animateui", true]]);
        });
    },

    destroy : function(){
        menus.remove("View/~", 200);
        this.$destroy();
    }
});

});
