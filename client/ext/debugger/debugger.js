/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var dock   = require("ext/dockpanel/dockpanel");
var fs = require("ext/filesystem/filesystem");
var noderunner = require("ext/noderunner/noderunner");
var markup = require("text!ext/debugger/debugger.xml");
var inspector = require("ext/debugger/inspector");

module.exports = ext.register("ext/debugger/debugger", {
    name    : "Debug",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    //offline : false,
    markup  : markup,
    buttonClassName : "debug1",
    deps    : [fs, noderunner],
    commands: {
        "debug": {
            "hint": "run and debug a node program on the server",
            "commands": {
                "[PATH]": {"hint": "path pointing to an executable. Autocomplete with [TAB]"}
            }
        }
    },

    nodes : [],
    hotitems: {},

    hook : function(){
        var _self = this;
        
        ide.addEventListener("consolecommand.debug", function(e) {
            ide.socket.send(JSON.stringify({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "debugger"
            }));
            return false;
        });
        
        stDebugProcessRunning.addEventListener("activate", function() {
            _self.enable();
        });
        stProcessRunning.addEventListener("deactivate", function() {
            _self.disable();
        });
        
        ide.addEventListener("afteropenfile", function(e) {
            var doc = e.doc;
            var node = e.node;
            if (!node)
                return;
            var path = node.getAttribute("path");
            
            node.setAttribute("scriptname", ide.workspaceDir + path.slice(ide.davPrefix.length));
        });
        
        mdlDbgStack.addEventListener("update", function() {
            // select the first stack entry, if none is selected yet
            var frames = mdlDbgStack.data.selectNodes("frame");
            if (frames.length) {
                // check if none of the debug panels is visible yet...
                var vis = [dbgCallStack, dbInteractive, dbgVariable, dbgBreakpoints].filter(function(el) {
                    return el.$ext && apf.getStyle(el.$ext, "display") != "none";
                });
                if (vis.length)
                    return;
                // no elements visible yet...
                dock.layout.show(dbgCallStack);
            }
        });
        
        var name = "ext/debugger/debugger"; //this.name
        
        dock.addDockable({
            hidden  : false,
            buttons : [
                { caption: "Call Stack", ext : [name, "dbgCallStack"] }
            ]
        });
        dock.addDockable({
            hidden  : false,
            buttons : [
                { caption: "Interactive", ext : [name, "dbInteractive"] },
                { caption: "Variables", ext : [name, "dbgVariable"] },
                { caption: "Breakpoints", ext : [name, "dbgBreakpoints"] }
            ]
        });

        dock.register(name, "dbgCallStack", {
            menu : "Debugger/Call Stack",
            primary : {
                backgroundImage: "/static/style/images/debugicons.png",
                defaultState: { x: -6, y: -217 },
                activeState: { x: -6, y: -217 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return dbgCallStack;
        });
        
        dock.register(name, "dbInteractive", {
            menu : "Debugger/Interactive",
            primary : {
                backgroundImage: "/static/style/images/debugicons.png",
                defaultState: { x: -7, y: -310 },
                activeState: { x: -7, y: -310 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return dbInteractive;
        });
        
        dock.register(name, "dbgVariable", {
            menu : "Debugger/Variables",
            primary : {
                backgroundImage: "/static/style/images/debugicons.png",
                defaultState: { x: -6, y: -261 },
                activeState: { x: -6, y: -261 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return dbgVariable;
        });
        
        dock.register(name, "dbgBreakpoints", {
            menu : "Debugger/Breakpoints",
            primary : {
                backgroundImage: "/static/style/images/debugicons.png",
                defaultState: { x: -6, y: -360 },
                activeState: { x: -6, y: -360 }
            }
        }, function(type) {
            ext.initExtension(_self);
            return dbgBreakpoints;
        });
    },

    init : function(amlNode){
        var _self = this;

        while (tbDebug.childNodes.length) {
            var button = tbDebug.firstChild;

            if (button.nodeType == 1 && button.getAttribute("id") == "btnDebug")
                ide.barTools.insertBefore(button, btnRun);
            else
                ide.barTools.appendChild(button);
        }

        this.hotitems["resume"]   = [btnResume];
        this.hotitems["stepinto"] = [btnStepInto];
        this.hotitems["stepover"] = [btnStepOver];
        this.hotitems["stepout"]  = [btnStepOut];

        this.paths = {};

        mdlDbgSources.addEventListener("afterload", function() {
            _self.$syncTree();
        });
        mdlDbgSources.addEventListener("update", function(e) {
            if (e.action != "add")
                return;
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
        
        dbgBreakpoints.addEventListener("afterrender", function(){
            lstBreakpoints.addEventListener("afterselect", function(e) {
                if (e.selected && e.selected.getAttribute("scriptid"))
                    _self.showDebugFile(e.selected.getAttribute("scriptid"), 
                        parseInt(e.selected.getAttribute("line")) + 1);
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
    },

    showDebugFile : function(scriptId, row, column, text) {
        var file = fs.model.queryNode("//file[@scriptid='" + scriptId + "']");

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

    enable : function(){
        ext.initExtension(this);
        
        this.nodes.each(function(item){
            if (item.show)
                item.show();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            if (item.hide)
                item.hide();
        });
        //log.disable(true);
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
