/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");

var Noderunner = require("ext/noderunner/noderunner");
var Panels = require("ext/panels/panels");
var Settings = require("ext/settings/settings");
var Menus = require("ext/menus/menus");
var Tooltip = require("ext/tooltip/tooltip");
var Dock = require("ext/dockpanel/dockpanel");
var Save = require("ext/save/save");
var Commands = require("ext/commands/commands");

var markup = require("text!ext/runpanel/runpanel.xml");
var skin = require("text!ext/runpanel/skin.xml");
var markupSettings = require("text!ext/runpanel/settings.xml");
var cssString = require("text!ext/runpanel/style.css");

/*global stProcessRunning, barTools, mnuContextTabs, btnRun, tabEditors, mnuCtxEditor,
mnuCtxEditorRevisions, lstRunCfg, tabDebug, tabDebugButtons, cbRunDbgDebugMode,
btnRunDbgRun, mnuRunCfg, txtCmdArgs, trFiles, ddRunnerSelector, hbxOtherRuntime*/

module.exports = ext.register("ext/runpanel/runpanel", {
    name    : "Run Panel",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    skin    : {
        id  : "runpanel",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/runpanel/style/images/"
    },
    offline : false,
    autodisable : ext.ONLINE | ext.LOCAL,
    markup  : markup,
    deps    : [Noderunner],

    defaultWidth : 270,

    excludedTypes : {"xml":1, "html":1, "css":1, "txt":1, "png": 1, "jpg": 1, "gif": 1},
    configProps: ["path", "name", "value", "args", "debug", "extension", "runner"],
    // see parseSubstitutions() to see what this does...
    substitutionErrors: {
        curfile: {
            title: "No active file opened yet!",
            body: "Please open a file first."
        }
    },

    nodes : [],
    model : new apf.model(),

    disableLut: {
        "terminal": true
    },

    hook: function(){
        if (ide.readonly)
            return;
        var _self = this;

        ext.initExtension(this);

        Commands.addCommand({
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

        Commands.addCommand({
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

        Commands.addCommand({
            name: "runthisfile",
            "hint": "run or debug this file (stops the app if running)",
            exec: function () {
                _self.runThisFile();
            }
        });

        Commands.addCommand({
            name: "runthistab",
            "hint": "run or debug current file (stops the app if running)",
            exec: function () {
                _self.runThisTab();
            }
        });

        Menus.$insertByIndex(barTools, new apf.splitbutton({
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

            Menus.addItemByPath("View/Tabs/Run This File", new apf.item({
                command : "runthistab",
                disabled : "{!!!tabEditors.activepage or !!stProcessRunning.active}"
            }), 400),
            Menus.addItemByPath("View/Tabs/~", new apf.divider(), 300)
        );

        ide.addEventListener("init.ext/tabbehaviors/tabbehaviors", function(){
            _self.nodes.push(
                Menus.addItemByPath("~", new apf.divider(), 800, mnuContextTabs),
                Menus.addItemByPath("Run This File", new apf.item({
                    command : "runthistab",
                    disabled : "{!!!tabEditors.activepage or !!stProcessRunning.active}"
                }), 850, mnuContextTabs)
            );
        });

        Tooltip.add(btnRun.$button1, {
            message : "Run &amp; Debug your <span>Node.js</span> applications, or run your <span>PHP</span>, <span>Python</span>, or <span>Ruby</span> code.\
            For more help, check out our guided tour in the Help menu.",
            width : "203px",
            timeout : 1000,
            hideonclick : true
        });

        Settings.addSettings("General", markupSettings);
        ide.addEventListener("settings.load", function(e){
            Settings.setDefaults("auto/node-version", [
                ["version", "auto"]
            ]);

            Settings.setDefaults("general", [
                ["saveallbeforerun", "false"]
            ]);

            Settings.setDefaults("auto/configurations", [
                ["debug", "true"],
                ["autohide", "true"],
                ["showruncfglist", "false"]
            ]);

            var changed = false;
            var runConfigs = e.model.queryNode("auto/configurations");
            var activeCfg = e.model.queryNode("auto/configurations/config[@active='true']");
            if (!activeCfg) {
                activeCfg = e.model.queryNode("auto/configurations/config");
                if (activeCfg) {
                    apf.xmldb.setAttribute(activeCfg, "active", "true");
                    changed = true;
                }
            }
            var lastCfg = e.model.queryNode("auto/configurations/config[@last='true']");
            if (!lastCfg) {
                lastCfg = activeCfg;
                if (lastCfg) {
                    apf.xmldb.setAttribute(lastCfg, "last", "true");
                    changed = true;
                }
            }

            if (changed)
                Settings.save();
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
            setTimeout(function() {
                var beforeNode = typeof mnuCtxEditorRevisions != "undefined"
                    ? mnuCtxEditorRevisions
                    : mnuCtxEditorCut;
                _self.nodes.push(
                    mnuCtxEditor.insertBefore(new apf.item({
                        id : "mnuCtxEditorRunThisFile",
                        caption : "Run This File",
                        command: "runthistab",
                        disabled : "{!!!tabEditors.activepage or !!stProcessRunning.active}"
                    }), beforeNode),
                    mnuCtxEditor.insertBefore(new apf.divider(), beforeNode)
                );
            });
        });

        var hasBreaked = false;
        stProcessRunning.addEventListener("deactivate", function(){
            if (!_self.autoHidePanel())
                return;

            var name = "ext/debugger/debugger";
            Dock.hideSection(name, false);
            hasBreaked = false;

            var bar = Dock.getBars("ext/debugger/debugger", "pgDebugNav")[0];
            if (!bar.extended)
                Dock.hideBar(bar);
        });
        stProcessRunning.addEventListener("activate", function(){
            var debug = lstRunCfg.selected && apf.isTrue(lstRunCfg.selected.getAttribute("debug"));
            if (!debug || !_self.autoHidePanel())
                return;

            var bar = Dock.getBars("ext/debugger/debugger", "pgDebugNav")[0];
            delete bar.cache;
            if (!bar.extended)
                Dock.showBar(bar);
        });
        ide.addEventListener("dbg.break", function(){
            var debug = lstRunCfg.selected && apf.isTrue(lstRunCfg.selected.getAttribute("debug"));
            if (!debug || !_self.autoHidePanel() || hasBreaked)
                return;

            hasBreaked = true;

            var name = "ext/debugger/debugger";
            Dock.showSection(name, false);

            var uId = Dock.getButtons(name, "pgDebugNav")[0].uniqueId;
            if (Dock.layout.isExpanded(uId) < 0)
                Dock.layout.showMenu(uId);

            //var bar = Dock.getBars("ext/debugger/debugger", "pgDebugNav")[0];
            //Dock.expandBar(bar);
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

    saveSelection: function() {
        if (lstRunCfg.selected) {
            if (lstRunCfg.selected.tagName == "config") {
                var node = this.model.data.selectSingleNode('config[@last="true"]');
                if (node)
                    node.removeAttribute("last");
                lstRunCfg.selected.setAttribute("last", "true");
                Settings.save();
            }
        }
        else
            lstRunCfg.select(lstRunCfg.$model.queryNode("//config"));
        /*
        var caption = apf.isTrue(lstRunCfg.selected.getAttribute("active")) ? (apf.isTrue(cbRunDbgDebugMode.value) ? 'Run in Debug Mode' : 'Run') : 'Run Once';
        btnRunDbgRun.setCaption(caption);
        */
    },

    init: function(amlNode){
        if (ide.readonly)
            return;
        var _self = this;

        apf.importCssString(cssString);

        lstRunCfg.addEventListener("click", function(e){
            var xmlNode;
            if (e.htmlEvent.target.className == "radiobutton") {
                // radio button clicked, set configuration as 'active'
                var active = _self.model.queryNode("config[@active='true']");
                xmlNode = apf.xmldb.findXmlNode(e.htmlEvent.target.parentNode);
                if (active && active !== xmlNode)
                    apf.xmldb.removeAttribute(active, "active");
                apf.xmldb.setAttribute(xmlNode, "active", "true");
            }

            if (e.htmlEvent.target.className == "btnDelete") {
                xmlNode = apf.xmldb.findXmlNode(e.htmlEvent.target.parentNode);
                this.remove(xmlNode);

                // set new active config if active config was deleted
                xmlNode = lstRunCfg.$model.queryNode("config");
                if (xmlNode) {
                    apf.xmldb.setAttribute(xmlNode, "active", "true");
                    setTimeout(function() {
                        lstRunCfg.select(xmlNode);
                    });
                }

                lstRunCfg.stopRename();
            }
        });

        lstRunCfg.addEventListener("afterselect", function(e) {
            // IMPORTANT: there might no node selected (yet), so assume that `xmlNode`
            // may be empty.
            var xmlNode = e.selected;
            // here goes what needs to happen when a run config is selected
            var caption = apf.isTrue(cbRunDbgDebugMode.value) ? "Run in Debug Mode" : "Run";
            btnRunDbgRun.setCaption(caption);

            var value = xmlNode && xmlNode.getAttribute("runtime") || "auto";
            if (value != "auto" && Noderunner.runners.indexOf(value.split(" ")[0]) === -1)
                value = "other";
            if (ddRunnerSelector.value != value)
                ddRunnerSelector.choose(value);

            lstRunCfg.stopRename();
        });

        mnuRunCfg.addEventListener("prop.visible", function(e) {
            // onShow:
            if (e.value) {
                _self.removeTempConfig();
                var lastCfg = _self.model.queryNode("config[@last='true']");
                if (lastCfg) {
                    lstRunCfg.select(lastCfg);
                }
                else {
                    var page = tabEditors.getPage();
                    if (!page)
                        return;
                    _self.addConfig(true);
                }
            }
        });

        ddRunnerSelector.addEventListener("beforeselect", function(e) {
            var node = e.selected;
            if (this.selected && this.selected === node)
                return;
            var runner = node.value || "auto";
            var activeRuntime = lstRunCfg.selected && lstRunCfg.selected.getAttribute("runtime");
            if (runner == "other") {
                apf.setStyleClass(mnuRunCfg.$ext, "withOther", []);
                hbxOtherRuntime.show();

                if (activeRuntime && this.selected && Noderunner.runners.indexOf(runner.split(" ")[0]) > -1)
                    apf.xmldb.removeAttribute(lstRunCfg.selected, "runtime");
            }
            else {
                hbxOtherRuntime.hide();
                apf.setStyleClass(mnuRunCfg.$ext, null, ["withOther"]);
                if (activeRuntime && this.selected)
                    apf.xmldb.setAttribute(lstRunCfg.selected, "runtime", node.value);
            }
        });

        setTimeout(function() {
            if (lstRunCfg.$model)
                lstRunCfg.select(lstRunCfg.$model.queryNode("config[@last='true']"));
        });
    },

    duplicate: function() {
        var config = lstRunCfg.selected;
        if (!config)
            return;

        var duplicate = config.cloneNode(true);
        apf.b(config).after(duplicate);
        lstRunCfg.select(duplicate);
        mnuRunCfg.show();
    },

    addConfig: function(temp, runfile) {
        var props = {};
        var file = runfile || ide.getActivePageModel();

        var tempNode = Settings.model.queryNode("auto/configurations/tempconfig[@last='true']");
        if (tempNode && !runfile) {
            this.configProps.forEach(function(prop) {
                props[prop] = tempNode.getAttribute(prop);
            });
            apf.xmldb.removeNode(tempNode);
        }
        else if (file) {
            props.path = file.getAttribute("path").slice(ide.davPrefix.length + 1); //@todo inconsistent
            props.name = file.getAttribute("name");
        }
        else {
            props.name = "Untitled";
            props.extension = props.path = "";
        }

        var hasConfigs = require("ext/runpanel/runpanel").model.queryNodes("config").length;
        if (hasConfigs) {
            // check if name already exists
            var idx = 1, newname;
            if (this.model.queryNode("config[@name='" + props.name + "']")) {
                newname = props.name + " " + idx;
                while (this.model.queryNode("config[@name='" + newname + "']")) {
                    idx++;
                    newname = props.name + " " + idx;
                }

                props.name = newname;
            }
        }

        var tagName = !temp ? "config" : "tempconfig";
        var cfg = apf.n("<" + tagName + " />");
        this.configProps.forEach(function(prop) {
            cfg.attr(prop, props[prop] || "");
        });

        var node = this.model.appendXml(cfg.node());

        // if this is the only config, make it active
        if (tagName == "config" && !hasConfigs)
            apf.xmldb.setAttribute(node, "active", "true");

        lstRunCfg.select(node);

        if (!temp)
            lstRunCfg.startRename(node);

        return node;
    },

    removeTempConfig: function() {
        var tempNodes = Settings.model.queryNodes("auto/configurations/tempconfig");
        if (tempNodes) {
            for (var i = tempNodes.length - 1; i >= 0; --i)
                apf.xmldb.removeNode(tempNodes[i]);
        }

        var lastNode = Settings.model.queryNode("auto/configurations/config[@last='true']");
        if (lastNode)
            lstRunCfg.select(lastNode);
    },

    autoHidePanel: function(){
        return apf.isTrue(Settings.model.queryValue("auto/configurations/@autohide"));
    },

    shouldRunInDebugMode: function(){
        return apf.isTrue(Settings.model.queryValue('auto/configurations/@debug'));
    },

    run: function(debug) {
        var node;

        if (window.mnuRunCfg && mnuRunCfg.visible) {
            if (lstRunCfg.selected)
                node = lstRunCfg.selected;
            else
                node = this.addConfig(true);
        }
        else {
            node = this.model.queryNode("config[@active='true']");
        }

        if (!node) {
            // display Run button as pressed instead of splitbutton
            apf.setStyleClass(btnRun.$button1.$ext, "c9-runbtnDown");
            apf.setStyleClass(mnuRunCfg.$ext, "fromRunBtn");

            btnRun.$button2.dispatchEvent("mousedown");
            apf.setStyleClass(btnRun.$button2.$ext, "", ["c9-runbtnDown"]);

            var onHide;
            mnuRunCfg.addEventListener("hide", onHide = function() {
                apf.setStyleClass(mnuRunCfg.$ext, null, ["fromRunBtn"]);
                mnuRunCfg.removeEventListener("hide", onHide);
            });
            this.addConfig(true);
            return;
        }
        else if (node.tagName == "tempconfig")
            node = this.addConfig();

        this.runConfig(node);

        ide.dispatchEvent("track_action", {type: node.getAttribute("debug") ? "debug" : "run"});
    },

    runThisFile: function() {
        var file = trFiles.selected;
        var node = this.addConfig(true, file);

        this.runConfig(node);

        ide.dispatchEvent("track_action", {type: node.getAttribute("debug") ? "debug" : "run"});
    },

    runThisTab: function() {
        var file = ide.getActivePageModel();
        var node = this.addConfig(true, file);

        this.runConfig(node);

        ide.dispatchEvent("track_action", {type: node.getAttribute("debug") ? "debug" : "run"});
    },

    runConfig: function(config) {
        //ext.initExtension(this);
        var model = Settings.model;
        var saveallbeforerun = apf.isTrue(model.queryValue("general/@saveallbeforerun"));
        if (saveallbeforerun)
            Save.saveall();

        var debug = apf.isTrue(config.getAttribute("debug"));

        if (mnuRunCfg.visible)
            mnuRunCfg.hide();

        if (config.tagName == "tempconfig")
            this.removeTempConfig();

        self["txtCmdArgs"] && txtCmdArgs.blur(); // fix the args cache issue #2763
        // dispatch here instead of in the implementation because the implementations
        // will vary over time
        ide.dispatchEvent("beforeRunning");

        var prevRunNode = this.model.data.selectSingleNode('node()[@running="true"]');
        if (prevRunNode)
            prevRunNode.removeAttribute("running");
        config.setAttribute("running", "true");
        Settings.save();

        var _self = this;
        var args = (config.getAttribute("args") || "").split(" ").map(function(arg) {
            return _self.parseSubstitutions(arg);
        }).filter(function(arg) {
            return !!arg;
        });
        var path = this.parseSubstitutions(config.getAttribute("path"));
        if (!path)
            return;

        Noderunner.run(
            path,
            args,
            debug,
            config.getAttribute("value"),
            (config.getAttribute("runtime") || "").split(" ")[0]
        );
    },

    parseSubstitutions: function(str, runfile) {
        var file = runfile || ide.getActivePageModel();
        var subs = {};

        // construct supported substitutions;
        subs.curfile = file ? file.getAttribute("path") : "";

        // replace subs:
        var _self = this;
        return str.replace(/\{([\w]*)\}/g, function(m, sub) {
            var errObj = _self.substitutionErrors[sub];
            if (subs[sub])
                return subs[sub];
            else if (errObj)
                util.alert("Error", errObj.title, errObj.body);
            return "";
        });
    },

    stop: function() {
        Noderunner.stop();
    },

    onHelpClick: function() {
        var page = "running_and_debugging_code";
        if (ide.infraEnv)
            require("ext/docum" + "entation/documentation").show(page);
        else
            window.open("https://docs.c9.io/" + page + ".html");
    },

    enable: function(){
        var page = tabEditors.getPage();
        var contentType = (page && page.getModel().data.getAttribute("contenttype")) || "";
        if (this.disableLut[contentType])
            return this.disable();
        this.$enable();
    },

    destroy: function(){
        Commands.removeCommandsByName(["run", "stop"]);
        Panels.unregister(this);
        this.$destroy();
    }
});

});
