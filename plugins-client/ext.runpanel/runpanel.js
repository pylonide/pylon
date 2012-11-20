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
var tooltip = require("ext/tooltip/tooltip");
var dock = require("ext/dockpanel/dockpanel");
var save = require("ext/save/save");
var markup = require("text!ext/runpanel/runpanel.xml");
var skin = require("text!ext/runpanel/skin.xml");
var markupSettings = require("text!ext/runpanel/settings.xml");
var cssString = require("text!ext/runpanel/style.css");
var commands = require("ext/commands/commands");

/*global stProcessRunning*/

module.exports = ext.register("ext/runpanel/runpanel", {
    name    : "Run Panel",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    offline : false,
    autodisable : ext.ONLINE | ext.LOCAL,
    markup  : markup,
    deps    : [noderunner],

    defaultWidth : 270,

    excludedTypes : {"xml":1, "html":1, "css":1, "txt":1, "png": 1, "jpg": 1, "gif": 1},

    nodes : [],
    model : new apf.model(),
    
    disableLut: {
        "terminal": true
    },

    hook : function(){
        if (ide.readonly)
            return;
        var _self = this;
        
        ext.initExtension(this);
        
        commands.addCommand({
            name: "run",
            "hint": "run or debug an application (stops the app if running)",
            "commands": {
                "[PATH]": {"hint": "path pointing to an executable. Autocomplete with [TAB]"}
            },
            bindKey: {mac: "F5", win: "F5"},
            exec: function () {
                if (stProcessRunning.active)
                    _self.stop();
                else
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

        commands.addCommand({
            name: "runthisfile",
            "hint": "run or debug this file (stops the app if running)",
            exec: function () {
                _self.runThisFile();
            }
        });

        commands.addCommand({
            name: "runthistab",
            "hint": "run or debug current file (stops the app if running)",
            exec: function () {
                _self.runThisTab();
            }
        });

        menus.$insertByIndex(barTools, new apf.splitbutton({
            id              : "btnRun",
            skin            : "run-splitbutton",
            checked         : "[{lstRunCfg.selected}::@debug]",
            icon            : "{stProcessRunning.active and 1 ? 'stop.png' : apf.isTrue(this.checked) ? 'bug.png' : 'run.png'}",
            caption         : "{stProcessRunning.active and 1 ? 'Stop' : 'Run'}",
            command         : "run",
            visible         : "true",
            disabled        : "{!!!ide.onLine}",
            "class"         : "{stProcessRunning.active and 1 ? 'running' : 'stopped'}",
            "disabled-split": "{stProcessRunning.active and 1}",
            submenu         : "mnuRunCfg"
        }), 100),

        this.nodes.push(
            this.model = new apf.model().load("<configurations />"),
            
            menus.addItemByPath("View/Tabs/Run This File", new apf.item({
                command : "runthistab",
                disabled : "{!!!tabEditors.activepage or !!stProcessRunning.active}"
            }), 400),
            menus.addItemByPath("View/Tabs/~", new apf.divider(), 300),
            menus.addItemByPath("~", new apf.divider(), 800, mnuContext),
            menus.addItemByPath("Run This File", new apf.item({
                command : "runthistab",
                disabled : "{!!!tabEditors.activepage or !!stProcessRunning.active}"
            }), 850, mnuContext)
        );

        tooltip.add(btnRun.$button1, {
            message : "Run &amp; Debug your <span>Node.js</span> applications, or run your <span>PHP</span>, <span>Python</span>, or <span>Ruby</span> code.\
            For more help, check out our guided tour in the Help menu.",
            width : "203px",
            timeout : 1000,
            hideonclick : true
        });

        settings.addSettings("General", markupSettings);
        ide.addEventListener("settings.load", function(e){
            settings.setDefaults("auto/node-version", [
                ["version", "auto"]
            ]);

            settings.setDefaults("general", [
                ["saveallbeforerun", "false"]
            ]);

            settings.setDefaults("auto/configurations", [
                ["debug", "true"],
                ["autohide", "true"],
                ["showruncfglist", "false"]
            ]);

            var changed = false;
            var runConfigs = e.model.queryNode("auto/configurations");
            var activeCfg = e.model.queryNode("auto/configurations/config[@active='true']");
            if (!activeCfg) {
                activeCfg = e.model.queryNode("auto/configurations/config")
                if (activeCfg) {
                    apf.xmldb.setAttribute(activeCfg, "active", "true");
                    changed = true;
                }
            }
            var lastCfg = e.model.queryNode("auto/configurations/config[@last='true']");
            if (!lastCfg) {
                var lastCfg = activeCfg;
                if (lastCfg) {
                    apf.xmldb.setAttribute(lastCfg, "last", "true");
                    changed = true;
                }
            }
            
            if (changed)
                settings.save();
            _self.model.load(runConfigs);
        });
        
        ide.addEventListener("init.ext/editors/editors", function(e) {
            ide.addEventListener("tab.afterswitch", function(e){
                _self.enable();
            });
            ide.addEventListener("closefile", function(e){
                if (tabEditors.getPages().length == 1)
                    _self.disable();
            });
        });
        
        ide.addEventListener("init.ext/code/code", function() {
            _self.nodes.push(
                mnuCtxEditor.insertBefore(new apf.item({
                    id : "mnuCtxEditorRunThisFile",
                    caption : "Run This File",
                    command: "runthistab",
                    disabled : "{!!!tabEditors.activepage or !!stProcessRunning.active}"
                }), mnuCtxEditorRevisions),
                mnuCtxEditor.insertBefore(new apf.divider(), mnuCtxEditorRevisions)
            )
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
        ide.addEventListener("dbg.break", function(){
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

    saveSelection : function() {
        if (lstRunCfg.selected) {
            if (lstRunCfg.selected.tagName == "config") {
                var node = this.model.data.selectSingleNode('config[@last="true"]');
                if (node)
                    node.removeAttribute("last");
                lstRunCfg.selected.setAttribute("last", "true");
                settings.save();
            }
        }
        else
            lstRunCfg.select(lstRunCfg.$model.queryNode("//config"));
        /*
        var caption = apf.isTrue(lstRunCfg.selected.getAttribute("active")) ? (apf.isTrue(cbRunDbgDebugMode.value) ? 'Run in Debug Mode' : 'Run') : 'Run Once';
        btnRunDbgRun.setCaption(caption);
        */
    },

    init : function(amlNode){
        if (ide.readonly)
            return;
        var _self = this;

        apf.importCssString(cssString);

        lstRunCfg.addEventListener("click", function(e){
            if (e.htmlEvent.target.className == "radiobutton") {
                var active = _self.model.queryNode("config[@active='true']");
                if (active)
                    apf.xmldb.removeAttribute(active, "active");
                
                var xmlNode = apf.xmldb.findXmlNode(e.htmlEvent.target.parentNode);
                apf.xmldb.setAttribute(xmlNode, "active", "true");
                
                var caption = apf.isTrue(cbRunDbgDebugMode.value) ? 'Run in Debug Mode' : 'Run';
                btnRunDbgRun.setCaption(caption);
            }
            
            if (e.htmlEvent.target.className == "btnDelete") {
                var xmlNode = apf.xmldb.findXmlNode(e.htmlEvent.target.parentNode);
                this.remove(xmlNode);
                
                // set new active config if active config was deleted
                xmlNode = lstRunCfg.$model.queryNode("config");
                if (xmlNode) {
                    apf.xmldb.setAttribute(xmlNode, "active", "true");
                    setTimeout(function() {
                        lstRunCfg.select(xmlNode);
                    });
                }
            }
        });

        setTimeout(function() {
            if (lstRunCfg.$model)
                lstRunCfg.select(lstRunCfg.$model.queryNode("config[@last='true']"));
        });
    },

    duplicate : function() {
        var config = lstRunCfg.selected;
        if (!config)
            return;

        var duplicate = config.cloneNode(true);
        apf.b(config).after(duplicate);
        lstRunCfg.select(duplicate);
        mnuRunCfg.show();
    },

    addConfig : function(temp, runfile) {
        var path, name, value, args, debug, file = runfile || ide.getActivePageModel();
        var extension = "";

        var tempNode = settings.model.queryNode("auto/configurations/tempconfig[@last='true']");
        if (tempNode && !runfile) {
            path = tempNode.getAttribute("path");
            name = tempNode.getAttribute("name");
            value = tempNode.getAttribute("value");
            args = tempNode.getAttribute("args");
            debug = tempNode.getAttribute("debug");
            apf.xmldb.removeNode(tempNode);
        }
        else if (file) {
            path  = file.getAttribute("path").slice(ide.davPrefix.length + 1); //@todo inconsistent
            name  = file.getAttribute("name");
        }
        else {
            name = "Untitled";
            extension = path = "";
        }
        
        var hasConfigs = require("ext/runpanel/runpanel").model.queryNodes("config").length;
        if (hasConfigs) {
            // check if name already exists
            var idx = 1, newname;
            if (this.model.queryNode("config[@name='" + name + "']")) {
                newname = name + " " + idx;
                while (this.model.queryNode("config[@name='" + newname + "']")) {
                    idx++;
                    newname = name + " " + idx;
                }
                
                name = newname;
            }
        }
        
        var tagName = !temp ? "config" : "tempconfig";
        var cfg = apf.n("<" + tagName + " />")
            .attr("path", path)
            .attr("name", name)
            .attr("value", value || "")
            .attr("extension", extension)
            .attr("args", args || "")
            .attr("debug", debug || "true").node();

        var node = this.model.appendXml(cfg);

        // if this is the only config, make it active
        if (tagName == "config" && !hasConfigs) {
            apf.xmldb.setAttribute(node, "active", "true");
            //apf.setStyleClass(apf.xmldb.findHtmlNode(node, lstRunCfg), "active");
        }
        
        lstRunCfg.select(node);
        
        if (!temp)
            lstRunCfg.startRename(node);
        
        return node;
    },

    onOpenMenuRunCfg : function() {
        this.removeTempConfig();
        var lastCfg = this.model.queryNode("config[@last='true']");
        if (lastCfg)
            lstRunCfg.select(lastCfg);
    },
        
    removeTempConfig : function() {
        var tempNode = settings.model.queryNode("auto/configurations/tempconfig[@last='true']");
        if (tempNode)
            apf.xmldb.removeNode(tempNode);
            
        var lastNode = settings.model.queryNode("auto/configurations/config[@last='true']");
        if (lastNode)
            lstRunCfg.select(lastNode);
    },
    
    autoHidePanel : function(){
        return apf.isTrue(settings.model.queryValue("auto/configurations/@autohide"));
    },

    shouldRunInDebugMode : function(){
        return apf.isTrue(settings.model.queryValue('auto/configurations/@debug'));
    },

    run : function(debug) {
        var node;

        if (window.mnuRunCfg && mnuRunCfg.visible) {
            if (lstRunCfg.selected)
                node = lstRunCfg.selected;
            else {
                node = this.addConfig(true);}
        }
        else {
            node = this.model.queryNode("config[@active='true']");
        }
        
        if (!node) {
            // display Run button as pressed instead of splitbutton
            apf.setStyleClass(btnRun.$button1.$ext, "c9-runbtnDown")
            apf.setStyleClass(mnuRunCfg.$ext, "fromRunBtn");
            
            btnRun.$button2.dispatchEvent("mousedown");
            apf.setStyleClass(btnRun.$button2.$ext, "", ["c9-runbtnDown"]);
            
            mnuRunCfg.addEventListener("hide", function() {
                apf.setStyleClass(mnuRunCfg.$ext, null, ["fromRunBtn"]);
                mnuRunCfg.removeEventListener("hide", arguments.callee);
            });
            return this.addConfig(true);
        }
        else if (node.tagName == "tempconfig")
            node = this.addConfig();
            
        this.runConfig(node);

        ide.dispatchEvent("track_action", {type: node.getAttribute("debug") ? "debug" : "run"});
    },
    
    runThisFile : function() {
        var file = trFiles.selected;
        var node = this.addConfig(true, file);
        
        this.runConfig(node);

        ide.dispatchEvent("track_action", {type: node.getAttribute("debug") ? "debug" : "run"});
    },
    
    runThisTab : function() {
        var file = ide.getActivePageModel();
        var node = this.addConfig(true, file);
        
        this.runConfig(node);

        ide.dispatchEvent("track_action", {type: node.getAttribute("debug") ? "debug" : "run"});
    },
    
    runConfig : function(config) {
        //ext.initExtension(this);
        var model = settings.model;
        var saveallbeforerun = apf.isTrue(model.queryValue("general/@saveallbeforerun"));
        if (saveallbeforerun)
            save.saveall();

        debug = config.getAttribute("debug") == "true";
/*
        if (config.tagName == "config") {
            var lastNode = apf.queryNode(config, "../node()[@last]");
            if (lastNode)
                apf.xmldb.removeAttribute(lastNode, "last");
            apf.xmldb.setAttribute(config, "last", "true");
        }
*/
        if (mnuRunCfg.visible)
            mnuRunCfg.hide();
            //mnuRunCfg.$ext.style.display = "none";
        
        if (config.tagName == "tempconfig") {
            this.removeTempConfig();
        }
        
        self["txtCmdArgs"] && txtCmdArgs.blur(); // fix the args cache issue #2763
        // dispatch here instead of in the implementation because the implementations
        // will vary over time
        ide.dispatchEvent("beforeRunning");
        
        var prevRunNode = this.model.data.selectSingleNode('node()[@running="true"]');
        if (prevRunNode)
            prevRunNode.removeAttribute("running");
        config.setAttribute("running", "true");
        settings.save();
        
        var args = config.getAttribute("args");
        noderunner.run(
            config.getAttribute("path"),
            args ? args.split(" ") : [],
            debug,
            config.getAttribute("value")
        );
    },

    stop : function() {
        noderunner.stop();

        //dock.hideSection(["ext/run/run", "ext/debugger/debugger"]);
    },

    enable : function(){
        var page = tabEditors.getPage();
        var contentType = (page && page.getModel().data.getAttribute("contenttype")) || "";
        if(this.disableLut[contentType])
            return this.disable();
        
        this.nodes.each(function(item){
            item.enable && item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable && item.disable();
        });
    },

    destroy : function(){
        commands.removeCommandsByName(["run", "stop"]);

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];

        panels.unregister(this);
    }
});

});
