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

        this.nodes.push(
            this.model = new apf.model().load("<configurations />"),

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
                submenu         : "mnuRunCfg"/*,
                "onsubmenu.init" : "require('core/ext').initExtension(require('ext/runpanel/runpanel'))"*/
            }), 100)
        );

        tooltip.add(btnRun.$button1, {
            message : "Run &amp; Debug your <span>Node.js</span> applications, or run your <span>PHP</span>, <span>Python</span>, or <span>Ruby</span> code.\
            For more help, check out our guided tour in the Help menu.\
            Want your language supported? Tweet us \
            <a href='http://twitter.com/Cloud9IDE' target='_blank'>@Cloud9IDE</a>!",
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
                ["debug", "false"],
                ["autohide", "true"],
                ["showruncfglist", "false"]
            ]);

            var runConfigs = e.model.queryNode("auto/configurations");
            if (!e.model.queryNode("auto/configurations/config[@last='true']")) {
                var config = e.model.queryNode("auto/configurations/config")
                if (config)
                    apf.xmldb.setAttribute(config, "last", "true");
            }
            
            _self.model.load(runConfigs);
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
        var node = this.model.data.selectSingleNode('config[@last="true"]');
        if (node)
            node.removeAttribute("last");
        if (lstRunCfg.selected) {
            lstRunCfg.selected.setAttribute("last", "true");
            settings.save();
        }
        else
            lstRunCfg.select(lstRunCfg.$model.queryNode("//config"));
    },

    init : function(amlNode){
        if (ide.readonly)
            return;
        var _self = this;

        apf.importCssString(cssString);

        lstRunCfg.addEventListener("click", function(e){
            if (e.htmlEvent.target.className == "btnDelete") {
                var xmlNode = apf.xmldb.findXmlNode(e.htmlEvent.target.parentNode);
                this.remove(xmlNode);
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

    addConfig : function(temp) {
        var path, name, value, args, debug, file = ide.getActivePageModel();
        var extension = "";

        var tempNode = settings.model.queryNode("auto/configurations/tempconfig");
        if (tempNode) {
            path = tempNode.getAttribute("path");
            name = tempNode.getAttribute("name");
            value = tempNode.getAttribute("value");
            args = tempNode.getAttribute("args");
            debug = tempNode.getAttribute("debug");
            apf.xmldb.removeNode(tempNode);
        }
        else if (file) {
            path  = file.getAttribute("path").slice(ide.davPrefix.length + 1); //@todo inconsistent
            name  = file.getAttribute("name").replace(/\.(js|py)$/,
                function(full, ext){ extension = ext; return ""; });
        }
        else {
            extension = name = path = "";
        }
        
        var tagName = !temp ? "config" : "tempconfig";
        var cfg = apf.n("<" + tagName + " />")
            .attr("path", path)
            .attr("name", name)
            .attr("value", value || "")
            .attr("extension", extension)
            .attr("args", args || "")
            .attr("debug", debug || "false").node();

        var node = this.model.appendXml(cfg);

        lstRunCfg.select(node);
        
        return node;
    },

    autoHidePanel : function(){
        return apf.isTrue(settings.model.queryValue("auto/configurations/@autohide"));
    },

    shouldRunInDebugMode : function(){
        return apf.isTrue(settings.model.queryValue('auto/configurations/@debug'));
    },

    run : function(debug) {
        var node;

        if (window.mnuRunCfg && mnuRunCfg.visible)
            node = lstRunCfg.selected;
        else {
            node = this.model.queryNode("node()[@last='true']");
        }
        
        if (!node) {
            btnRun.$button2.dispatchEvent("mousedown");
            return this.addConfig(true);
        }
        else if (node.tagName == "tempconfig")
            node = this.addConfig();
            
        this.runConfig(node, this.shouldRunInDebugMode());

        ide.dispatchEvent("track_action", {type: debug ? "debug" : "run"});
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
        mnuRunCfg.hide();
        
        self["txtCmdArgs"] && txtCmdArgs.blur(); // fix the args cache issue #2763
        // dispatch here instead of in the implementation because the implementations
        // will vary over time
        ide.dispatchEvent("beforeRunning");
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
