/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var noderunner = require("ext/noderunner/noderunner");
var panels = require("ext/panels/panels");
var settings = require("ext/settings/settings");
var dock = require("ext/dockpanel/dockpanel");
var save = require("ext/save/save");
var markup = require("text!ext/runpanel/runpanel.xml");
var buttonsMarkup = require("text!ext/runpanel/runbuttons.xml");
var markupSettings = require("text!ext/runpanel/settings.xml");

module.exports = ext.register("ext/runpanel/runpanel", {
    name    : "Run Panel",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    //offline : false,
    markup  : markup,
    deps    : [noderunner],

    defaultWidth : 270,

    commands : {
        "run": {
            "hint": "run and debug a node program on the server",
            "commands": {
                "[PATH]": {"hint": "path pointing to an executable. Autocomplete with [TAB]"}
            }
        },
        "stop": {
            "hint": "stop a running node program on the server",
            "commands": {
                "[PATH]": {"hint": "path pointing to an executable. Autocomplete with [TAB]"}
            }
        }
    },

    hotitems: {},

    nodes : [],

    hook : function(){
        var _self = this;

        panels.register(this, {
            position : 3000,
            caption: "Run",
            "class": "rundebug"
        });

        apf.document.body.insertMarkup(buttonsMarkup);

        this.nodes.push(
            mnuRunCfg
        );

        while (tbRun.childNodes.length) {
            var button = tbRun.firstChild;

            ide.barTools.appendChild(button);
            if (button.nodeType == 1) {
                this.nodes.push(button);
            }
        }

        mdlRunConfigurations.addEventListener("afterload", function(e) {
            _self.$populateMenu();
        });

        //Settings Support
        ide.addEventListener("init.ext/settings/settings", function(e) {
            var heading = e.ext.getHeading("General");
            heading.insertMarkup(markupSettings);
        });

        ide.addEventListener("loadsettings", function(e){
            var runConfigs = e.model.queryNode("auto/configurations");
            if (!runConfigs) {
                runConfigs = apf.createNodeFromXpath(e.model.data, "auto/configurations");
                apf.xmldb.setAttribute(runConfigs, "debug", "true");

                e.model.setQueryValue("general/@saveallbeforerun", false);
            }
            if (!e.model.queryNode("auto/configurations/@debug"))
                e.model.setQueryValue("auto/configurations/@debug", true);
            if (!e.model.queryNode("auto/configurations/@autohide"))
                e.model.setQueryValue("auto/configurations/@autohide", true);

            if (!runConfigs.selectSingleNode("config[@curfile]")) {
                var setLast = false;
                if (!e.model.queryNode("auto/configurations/config[@last='true']")) {
                    var config = e.model.queryNode("auto/configurations/config")
                    if (config)
                        apf.xmldb.setAttribute(config, "last", "true");
                    else
                        setLast = true;
                }

                var cfg = apf.n("<config />")
                    .attr("name", " (active file)")
                    .attr("curfile", "1");
                if (setLast)
                    cfg.attr("last", "true");
                runConfigs.insertBefore(cfg.node(), runConfigs.firstChild);
            }

            mdlRunConfigurations.load(runConfigs);
        });

        var page = tabEditors.getPage();
        if (page && page.$model) {
            var path = page.$model.queryValue("@path").replace(ide.davPrefix, "");
            mdlRunConfigurations.setQueryValue("config[@curfile]/@path", path);
            mdlRunConfigurations.setQueryValue("config[@curfile]/@name",
                path.split("/").pop() + " (active file)");
        }

        tabEditors.addEventListener("afterswitch", function(e){
            var page = e.nextPage;
            var path = page.$model.queryValue("@path").replace(ide.davPrefix, "");
            mdlRunConfigurations.setQueryValue("config[@curfile]/@path", path);
            mdlRunConfigurations.setQueryValue("config[@curfile]/@name",
                path.split("/").pop() + " (active file)");
        });

        ide.addEventListener("afterfilesave", function(e){
            var page = tabEditors.getPage();
            if (page) {
                var path = page.$model.queryValue("@path").replace(ide.davPrefix, "");
                mdlRunConfigurations.setQueryValue("config[@curfile]/@path", path);
                mdlRunConfigurations.setQueryValue("config[@curfile]/@name",
                    path.split("/").pop() + " (active file)");
            }
        });

        var hasBreaked = false;
        stProcessRunning.addEventListener("deactivate", function(){
            if (!_self.autoHidePanel())
                return;

            var name = "ext/debugger/debugger";
            dock.hideSection(name, false);
            hasBreaked = false;

            /*var bar = dock.getBars("ext/debugger/debugger", "pgDebugNav")[0];
            if (!bar.extended)
                dock.hideBar(bar);*/
        });
        /*stProcessRunning.addEventListener("activate", function(){
            if (!_self.shouldRunInDebugMode() || !_self.autoHidePanel())
                return;

            var bar = dock.getBars("ext/debugger/debugger", "pgDebugNav")[0];
            if (!bar.extended)
                dock.showBar(bar);
        });*/
        ide.addEventListener("break", function(){
            if (!_self.shouldRunInDebugMode() || !_self.autoHidePanel() || hasBreaked)
                return;

            hasBreaked = true;

            var name = "ext/debugger/debugger";
            dock.showSection(name, false);

            var uId = dock.getButtons(name, "pgDebugNav")[0].uniqueId;
            if (dock.layout.isExpanded(uId) < 0)
                dock.layout.showMenu(uId);

            //var bar = dock.getBars("ext/debugger/debugger", "pgDebugNav")[0];
            //dock.expandBar(bar);
        });
//        ide.addEventListener("dockpanel.load.settings", function(e){
//            var state = e.state;
//
//            if (_self.autoHidePanel() && !stProcessRunning.active) {
//                var bar = dock.getBars("ext/debugger/debugger", "pgDebugNav", state)[0];
//                bar.sections.each(function(section){
//                    section.buttons.each(function(button){
//                        if (!button.hidden || button.hidden == -1)
//                            button.hidden = 1;
//                    });
//                });
//            }
//        });

        // When we are not in debug mode and we close a page it goes back to be
        // automatically opened when the debug process starts
        ide.addEventListener("init.ext/debugger/debugger", function(){
            tabDebug.getPages().concat(tabDebugButtons.getPages()).each(function(page){
                page.addEventListener("afterclose", function(e){
                    if (_self.autoHidePanel() && !stProcessRunning.active) {
                        this.$dockbutton.$dockData.hidden = 1;
                    }
                });
            });
        });

        this.hotitems["run"]  = [btnRun];
        this.hotitems["stop"] = [btnStop];
    },

    checkAutoHide : function(){
        /*var value = settings.model.queryValue("auto/configurations/@autohide");
        var bar = dock.getBars("ext/debugger/debugger", "pgDebugNav")[0];

        if (value && bar.cache && bar.cache.visible)
            dock.hideSection("ext/debugger/debugger");
        else if (!value && bar.cache && !bar.cache.visible)
            dock.showSection("ext/debugger/debugger");*/
    },

    init : function(amlNode){
        this.panel = winRunPanel;

        colLeft.appendChild(winRunPanel);
        this.nodes.push(winRunPanel);

        lstRunCfg.addEventListener("afterremove", function(e){
            mnuRunCfg.childNodes.each(function(item){
                if (item.node == e.args[0].xmlNode)
                    item.destroy(true, true);
            });
        });
    },

    duplicate : function() {
        var config = lstRunCfg.selected;
        if (!config)
            return;

        var duplicate = config.cloneNode(true);
        apf.b(config).after(duplicate);
        lstRunCfg.select(duplicate);
        winRunPanel.show();
    },

    addConfig : function() {
        var path, name, file = ide.getActivePageModel();
        var extension = "";
        
        if(!file)
            return;
            
        path  = file.getAttribute("path").slice(ide.davPrefix.length + 1); //@todo inconsistent
        name  = file.getAttribute("name").replace(/\.(js|py)$/,
            function(full, ext){ extension = ext; return ""; });

        var cfg = apf.n("<config />")
            .attr("path", path)
            .attr("name", name)
            .attr("extension", extension)
            .attr("args", "").node();

        var node = mdlRunConfigurations.appendXml(cfg);
        this.$addMenuItem(node);
        lstRunCfg.select(cfg);
    },

    showRunConfigs : function() {
        panels.activate(this);
    },

    autoHidePanel : function(){
        return apf.isTrue(settings.model.queryValue("auto/configurations/@autohide"));
    },

    shouldRunInDebugMode : function(){
        return apf.isTrue(settings.model.queryValue('auto/configurations/@debug'));
    },

    run : function(debug) {
        this.runConfig(window.winRunPanel && winRunPanel.visible
            ? lstRunCfg.selected
            : (mdlRunConfigurations.queryNode("node()[@last='true']")
                || mdlRunConfigurations.queryNode("config[@curfile]")),
            this.shouldRunInDebugMode());
        ide.dispatchEvent("track_action", {type: debug ? "debug" : "run"});
    },

    $populateMenu : function() {
        var menu = mnuRunCfg;

        var item = menu.firstChild;
        while (item && item.tagName !== "a:divider") {
            menu.removeChild(item);
            item = menu.firstChild;
        }
        var divider = item;

        var configs = mdlRunConfigurations.queryNodes("config");
        if (!configs.length)
            menu.insertBefore(new apf.item({disabled:true, caption: "No run history"}), divider);
        else {
            for (var i =  0, l = configs.length; i < l; i++) {
                this.$addMenuItem(configs[i], divider);
            }
        }
    },

    $addMenuItem : function(cfg, divider){
        var _self = this;

        if (!divider)
            divider = mnuRunCfg.getElementsByTagNameNS(apf.ns.aml, "divider")[0];

        mnuRunCfg.insertBefore(new apf.item({
            caption  : "[{this.node}::@name]",
            node     : cfg,
            type     : "radio",
            selected : "[{this.node}::@last]",
            onclick  : function() {
                _self.runConfig(this.node, _self.shouldRunInDebugMode());
                if (self.lstRunCfg)
                    lstRunCfg.select(this.node);
            }
        }), divider)
    },

    runConfig : function(config, debug) {
        ext.initExtension(this);
        var model = settings.model;
        var saveallbeforerun = apf.isTrue(model.queryValue("general/@saveallbeforerun"));
        if (saveallbeforerun)
            save.saveall();

        if (debug === undefined)
            debug = config.parentNode.getAttribute("debug") == "1";

        var lastNode = apf.queryNode(config, "../node()[@last]");
        if (lastNode)
            apf.xmldb.removeAttribute(lastNode, "last");
        apf.xmldb.setAttribute(config, "last", "true");

        // dispatch here instead of in the implementation because the implementations
        // will vary over time
        ide.dispatchEvent("beforeRunning");

        noderunner.run(
            config.getAttribute("path"),
            (config.getAttribute("args") || "").split(" "),
            debug,
            ddRunnerSelector.value
        );
    },

    stop : function() {
        noderunner.stop();

        //dock.hideSection(["ext/run/run", "ext/debugger/debugger"]);
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

        panels.unregister(this);
    }
});

});
