/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

require("apf/elements/codeeditor");

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var dock   = require("ext/dockpanel/dockpanel");
var fs = require("ext/filesystem/filesystem");
var noderunner = require("ext/noderunner/noderunner");
var markup = require("text!ext/debugger/debugger.xml");
var inspector = require("ext/debugger/inspector");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/debugger/debugger", {
    name    : "Debug",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    offline : false,
    markup  : markup,
    buttonClassName : "debug1",
    deps    : [fs, noderunner],
    commands: {
        "resume"   : {hint: "resume the current paused process"},
        "stepinto" : {hint: "step into the function that is next on the execution stack"},
        "stepover" : {hint: "step over the current expression on the execution stack"},
        "stepout"  : {hint: "step out of the current function scope"}
    },

    nodesAll: [],
    nodes : [],
    hotitems: {},

    hook : function(){
        var _self = this;

        ide.addEventListener("consolecommand.debug", function(e) {
            ide.send({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "debugger"
            });
            return false;
        });

        ide.addEventListener("loadsettings", function (e) {
            // restore the breakpoints from the IDE settings
            var bpFromIde = e.model.data.selectSingleNode("//breakpoints");
            // not there yet, create element
            if (!bpFromIde) {
                bpFromIde = e.model.data.ownerDocument.createElement("breakpoints");
                e.model.data.appendChild(bpFromIde);
            }
            // bind it to the Breakpoint model
            mdlDbgBreakpoints.load(bpFromIde);
        });

        stDebugProcessRunning.addEventListener("activate", function() {
            _self.activate();
        });
        stProcessRunning.addEventListener("deactivate", function() {
            _self.deactivate();
        });

        ide.addEventListener("afteropenfile", function(e) {
            var doc = e.doc;
            var node = e.node;
            if (!node)
                return;
            var path = node.getAttribute("path");

            node.setAttribute("scriptname", ide.workspaceDir + path.slice(ide.davPrefix.length));
        });

        var name = "ext/debugger/debugger"; //this.name

        dock.addDockable({
            expanded : -1,
            width    : 300,
            sections : [
                {
                    height     : 30,
                    width      : 150,
                    noflex     : true,
                    draggable  : false,
                    resizable  : false,
                    skin       : "dockwin_runbtns",
                    noTab      : true,
                    position   : 1,

                    buttons : [{
                        id      : "btnRunCommands",
                        caption : "Run Commands",
                        "class" : "btn-runcommands",
                        ext     : [name, "pgDebugNav"],
                        draggable: false,
                        hidden  : true
                    }]
                },
                {
                    width : 250,
                    height : 300,
                    buttons : [
                        { caption: "Call Stack", ext : [name, "dbgCallStack"], hidden: true}
                    ]
                },
                {
                    width : 250,
                    height : 300,
                    buttons : [
                        { caption: "Interactive", ext : [name, "dbInteractive"], hidden: true},
                        { caption: "Variables", ext : [name, "dbgVariable"], hidden: true},
                        { caption: "Breakpoints", ext : [name, "dbgBreakpoints"], hidden: true}
                    ]
                }
            ]
        });

        dock.register(name, "pgDebugNav", {
            menu : "Run Commands",
            primary : {
                backgroundImage: ide.staticPrefix + "/style/images/debugicons.png",
                defaultState: { x: -6, y: -265 },
                activeState: { x: -6, y: -265 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return pgDebugNav;
        });

        dock.register(name, "dbgCallStack", {
            menu : "Debugger/Call Stack",
            primary : {
                backgroundImage: ide.staticPrefix + "/style/images/debugicons.png",
                defaultState: { x: -8, y: -47 },
                activeState: { x: -8, y: -47 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return dbgCallStack;
        });

        dock.register(name, "dbInteractive", {
            menu : "Debugger/Interactive",
            primary : {
                backgroundImage: ide.staticPrefix + "/style/images/debugicons.png",
                defaultState: { x: -8, y: -130 },
                activeState: { x: -8, y: -130 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return dbInteractive;
        });

        dock.register(name, "dbgVariable", {
            menu : "Debugger/Variables",
            primary : {
                backgroundImage: ide.staticPrefix + "/style/images/debugicons.png",
                defaultState: { x: -8, y: -174 },
                activeState: { x: -8, y: -174 }
            }
        }, function(type) {
            ext.initExtension(_self);

            // Why is this code here? This is super hacky and has lots of
            // unwanted side effects (Ruben)
            // when visible -> make sure to refresh the grid
            dbgVariable.addEventListener("prop.visible", function(e) {
                if (e.value && self.dgVars) {
                    dgVars.reload();
                }
            });

            return dbgVariable;
        });

        dock.register(name, "dbgBreakpoints", {
            menu : "Debugger/Breakpoints",
            primary : {
                backgroundImage: ide.staticPrefix + "/style/images/debugicons.png",
                defaultState: { x: -8, y: -88 },
                activeState: { x: -8, y: -88 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return dbgBreakpoints;
        });
    },

    init : function(amlNode){
        var _self = this;

        this.paths = {};

        mdlDbgSources.addEventListener("afterload", function() {
            _self.$syncTree();
        });
        mdlDbgSources.addEventListener("update", function(e) {
            if (e.action !== "add") return;

            // TODO: optimize this!
            _self.$syncTree();
        });
        fs.model.addEventListener("update", function(e) {
            if (e.action != "insert")
                return;
            // TODO: optimize this!
            _self.$syncTree();
        });

        //@todo move this to noderunner...
        dbg.addEventListener("changeframe", function(e) {
            e.data && _self.showDebugFile(e.data.getAttribute("scriptid"));
        });

        pgDebugNav.addEventListener("afterrender", function(){
            _self.hotitems["resume"]   = [btnResume];
            _self.hotitems["stepinto"] = [btnStepInto];
            _self.hotitems["stepover"] = [btnStepOver];
            _self.hotitems["stepout"]  = [btnStepOut];

            require("ext/keybindings/keybindings").update(_self);
        });

        dbgBreakpoints.addEventListener("afterrender", function(){
            lstBreakpoints.addEventListener("afterselect", function(e) {
                if (e.selected && e.selected.getAttribute("scriptid"))
                    _self.showDebugFile(e.selected.getAttribute("scriptid"),
                        parseInt(e.selected.getAttribute("line"), 10) + 1);
                // TODO sometimes we don't have a scriptID
            });
        });

        dbgBreakpoints.addEventListener("dbInteractive", function(){
            lstScripts.addEventListener("afterselect", function(e) {
                e.selected && require("ext/debugger/debugger")
                    .showDebugFile(e.selected.getAttribute("scriptid"));
            });
        });

        ide.addEventListener("afterfilesave", function(e) {
            var node = e.node;
            var doc = e.doc;

            var scriptId = node.getAttribute("scriptid");
            if (!scriptId)
                return;

            var value = e.value || doc.getValue();
            var NODE_PREFIX = "(function (exports, require, module, __filename, __dirname) { ";
            var NODE_POSTFIX = "\n});";
            dbg.changeLive(scriptId, NODE_PREFIX + value + NODE_POSTFIX, false, function(e) {
                //console.log("v8 updated", e);
            });
        });

        // we're subsribing to the 'running active' prop
        // this property indicates whether the debugger is actually running (when on a break this value is false)
        stRunning.addEventListener("prop.active", function (e) {
            // if we are really running (so not on a break or something)
            if (e.value) {
                // we clear out mdlDbgStack
                mdlDbgStack.load("<frames></frames>");
            }
        });
    },

    showDebugFile : function(scriptId, row, column, text) {
        var file = fs.model.queryNode("//file[@scriptid='" + scriptId + "']");

        // check prerequisites
        if (self.ceEditor && !ceEditor.$updateMarkerPrerequisite()) {
            return;
        }

        if (file) {
            editors.jump(file, row, column, text, null, true);
        }
        else {
            var script = mdlDbgSources.queryNode("//file[@scriptid='" + scriptId + "']");
            if (!script)
                return;

            var name = script.getAttribute("scriptname");
            var value = name.split("/").pop();

            if (name.indexOf(ide.workspaceDir) === 0) {
                var path = ide.davPrefix + name.slice(ide.workspaceDir.length);
                // TODO this has to be refactored to support multiple tabs
                var page = tabEditors.getPage(path);
                if (page)
                    var node = page.xmlRoot;
                else {
                    var node = apf.n("<file />")
                        .attr("name", value)
                        .attr("path", path)
                        .attr("contenttype", "application/javascript")
                        .attr("scriptid", script.getAttribute("scriptid"))
                        .attr("scriptname", script.getAttribute("scriptname"))
                        .attr("lineoffset", "0").node();
                }
                editors.jump(node, row, column, text, null, page ? true : false);
            }
            else {
                var page = tabEditors.getPage(value);
                if (page)
                    editors.jump(page.xmlRoot, row, column, text, null, true);
                else {
                    var node = apf.n("<file />")
                        .attr("name", value)
                        .attr("path", name)
                        .attr("contenttype", "application/javascript")
                        .attr("scriptid", script.getAttribute("scriptid"))
                        .attr("scriptname", script.getAttribute("scriptname"))
                        .attr("debug", "1")
                        .attr("lineoffset", "0").node();

                    dbg.loadScript(script, function(source) {
                        var doc = ide.createDocument(node, source);
                        editors.jump(node, row, column, text, doc);
                    });
                }
            }
        }
    },

    count : 0,
    $syncTree : function() {
        if (this.inSync) return;
        this.inSync = true;
        var dbgFiles = mdlDbgSources.data.childNodes;

        var workspaceDir = ide.workspaceDir;
        for (var i=0,l=dbgFiles.length; i<l; i++) {
            var dbgFile = dbgFiles[i];
            var name = dbgFile.getAttribute("scriptname");
            if (name.indexOf(workspaceDir) !== 0)
                continue;
            this.paths[name] = dbgFile;
        }
        var treeFiles = fs.model.data.getElementsByTagName("file");
        var tabFiles = ide.getAllPageModels();
        var files = tabFiles.concat(Array.prototype.slice.call(treeFiles, 0));

        var davPrefix = ide.davPrefix;
        for (var i=0,l=files.length; i<l; i++) {
            var file = files[i];
            var path = file.getAttribute("scriptname");

            var dbgFile = this.paths[path];
            if (dbgFile)
                apf.b(file).attr("scriptid", dbgFile.getAttribute("scriptid"));
        }
        this.inSync = false;
    },

    activate : function(){
        ext.initExtension(this);

        this.nodes.each(function(item){
            if (item.show)
                item.show();
        });
    },

    deactivate : function(){
        this.nodes.each(function(item){
            if (item.hide)
                item.hide();
        });
    },

    enable : function(){
        if (!this.disabled) return;

        this.nodesAll.each(function(item){
            item.setProperty("disabled", item.$lastDisabled !== undefined
                ? item.$lastDisabled
                : true);
            delete item.$lastDisabled;
        });
        this.disabled = false;
    },

    disable : function(){
        if (this.disabled) return;

        //stop debugging
        require('ext/runpanel/runpanel').stop();
        this.deactivate();

        //loop from each item of the plugin and disable it
        this.nodesAll.each(function(item){
            if (!item.$lastDisabled)
                item.$lastDisabled = item.disabled;
            item.disable();
        });

        this.disabled = true;
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
            dock.unregisterPage(item);
        });

        tabDebug.destroy(true, true);
        this.$layoutItem.destroy(true, true);

        this.nodes = [];
    }
});

});
