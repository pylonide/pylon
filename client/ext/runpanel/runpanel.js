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
var menus = require("ext/menus/menus");
var dock = require("ext/dockpanel/dockpanel");
var save = require("ext/save/save");
var markup = require("text!ext/runpanel/runpanel.xml");
var markupSettings = require("text!ext/runpanel/settings.xml");
var commands = require("ext/commands/commands");

module.exports = ext.register("ext/runpanel/runpanel", {
    name    : "Run Panel",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    //offline : false,
    markup  : markup,
    deps    : [noderunner],

    defaultWidth : 270,

    nodes : [],

    hook : function(){
        var _self = this;

        panels.register(this, {
            position : 3000,
            caption: "Run",
            "class": "rundebug"
        });
        
        commands.addCommand({
            name: "run",
            "hint": "run and debug a node program on the server",
            "commands": {
                "[PATH]": {"hint": "path pointing to an executable. Autocomplete with [TAB]"}
            },
            bindKey: {mac: "F5", win: "F5"},
            exec: function () {
                _self.run();
            }
        });
        
        commands.addCommand({
            name: "stop",
            "hint": "stop a running node program on the server",
            "commands": {
                "[PATH]": {"hint": "path pointing to an executable. Autocomplete with [TAB]"}
            },
            bindKey: {mac: "Shift-F5", win: "Shift-F5"},
            exec: function () {
                _self.stop();
            }
        });
        
        this.nodes.push(
            this.mnuRunCfg = new apf.menu({ id : "mnuRunCfg" }),
            
            menus.$insertByIndex(barTools, new apf.splitbutton({
                id       : "btnRun",
                checked  : "[{require('ext/settings/settings').model}::auto/configurations/@debug]",
                icon     : "{this.checked ? 'run.png' : 'run.png'}",
                caption  : "{this.checked ? 'debug' : 'run'}",
                command  : "run",
                visible  : "{!stProcessRunning.active and 1}",
                tooltip  : "{this.checked ? 'Debug' : 'Run'}",
                disabled : "{!ide.onLine}",
                submenu  : "mnuRunCfg"
            }), 100),
            
            menus.$insertByIndex(barTools, new apf.button({
                id       : "btnStop",
                icon     : "stop.png",
                caption  : "stop",
                width    : "52",
                tooltip  : "Stop",
                skin     : "c9-toolbarbutton",
                command  : "stop",
                visible  : "{stProcessRunning.active and 1}" ,
                disabled : "{!ide.onLine}"
            }), 200),
            
//            menus.$insertByIndex(barTools, new apf.divider({
//                skin : "c9-divider"
//            }), 300),
            
            this.mdlRunConfigurations = new apf.model().load("<configurations />")
        );
        
        var c = 0;
        menus.addItemToMenu(this.mnuRunCfg, new apf.item({ 
            caption  : "no run history",
            disabled : true,
        }), c += 100);
        menus.addItemToMenu(this.mnuRunCfg, new apf.divider(), c += 100);
        menus.addItemToMenu(this.mnuRunCfg, new apf.item({ 
            caption : "Configure....",
            onclick : function(){
                _self.showRunConfigs(false);
            }
        }), c += 100);
        menus.addItemToMenu(this.mnuRunCfg, new apf.divider(), c += 100);
        menus.addItemToMenu(this.mnuRunCfg, new apf.item({ 
            caption : "Run in debug mode",
            type    : "check",
            checked : "[{require('ext/settings/settings').model}::auto/configurations/@debug]"
        }), c += 100);
        menus.addItemToMenu(this.mnuRunCfg, new apf.item({ 
            caption : "Auto show & hide debug tools",
            type    : "check",
            onclick : function(){
                _self.checkAutoHide();
            },
            checked : "[{require('ext/settings/settings').model}::auto/configurations/@autohide]"
        }), c += 100);
        
        this.mdlRunConfigurations.addEventListener("afterload", function(e) {
            _self.$populateMenu();
        });

        //Settings Support
        /*ide.addEventListener("init.ext/settings/settings", function(e) {
            var heading = e.ext.getHeading("General");
            heading.insertMarkup(markupSettings);
        });*/

        require("ext/settings/settings").addSettings("General", markupSettings);
        
//        this.mnuRunCfg.addEventListener("prop.visible", function(){
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

            _self.mdlRunConfigurations.load(runConfigs);
        });

        ide.addEventListener("init.ext/editors/editors", function(e) {
            var page = tabEditors.getPage();
            if (page && page.$model) {
                var path = page.$model.queryValue("@path").replace(ide.davPrefix, "");
                _self.mdlRunConfigurations.setQueryValue("config[@curfile]/@path", path);
                _self.mdlRunConfigurations.setQueryValue("config[@curfile]/@name",
                    path.split("/").pop() + " (active file)");
            }

            tabEditors.addEventListener("afterswitch", function(e){
                var page = e.nextPage;
                var path = page.$model.queryValue("@path").replace(ide.davPrefix, "");
                _self.mdlRunConfigurations.setQueryValue("config[@curfile]/@path", path);
                _self.mdlRunConfigurations.setQueryValue("config[@curfile]/@name",
                    path.split("/").pop() + " (active file)");
            });

            ide.addEventListener("afterfilesave", function(e){
                var page = tabEditors.getPage();
                if (page) {
                    var path = page.$model.queryValue("@path").replace(ide.davPrefix, "");
                    _self.mdlRunConfigurations.setQueryValue("config[@curfile]/@path", path);
                    _self.mdlRunConfigurations.setQueryValue("config[@curfile]/@name",
                        path.split("/").pop() + " (active file)");
                }
            });
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

        var _self = this;
        lstRunCfg.addEventListener("afterremove", function(e){
            _self.mnuRunCfg.childNodes.each(function(item){
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

        var node = this.mdlRunConfigurations.appendXml(cfg);
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
            : (this.mdlRunConfigurations.queryNode("node()[@last='true']")
                || this.mdlRunConfigurations.queryNode("config[@curfile]")),
            this.shouldRunInDebugMode());
        ide.dispatchEvent("track_action", {type: debug ? "debug" : "run"});
    },

    $populateMenu : function() {
        var menu = this.mnuRunCfg;

        var item = menu.firstChild;
        while (item && item.localName !== "divider") {
            menu.removeChild(item);
            item = menu.firstChild;
        }
        var divider = item;

        var configs = this.mdlRunConfigurations.queryNodes("config");
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
            divider = this.mnuRunCfg.getElementsByTagNameNS(apf.ns.aml, "divider")[0];

        this.mnuRunCfg.insertBefore(new apf.item({
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
        //ext.initExtension(this);
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
            config.getAttribute("value")
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
