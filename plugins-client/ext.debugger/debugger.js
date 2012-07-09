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
var commands = require("ext/commands/commands");
var fs = require("ext/filesystem/filesystem");
var noderunner = require("ext/noderunner/noderunner");
var markup = require("text!ext/debugger/debugger.xml");
var breakpoints = require("./breakpoints");
var sources = require("./sources");

require("ext/debugger/inspector");
var v8debugclient = require("./v8debugclient");

module.exports = ext.register("ext/debugger/debugger", {
    name    : "Debug",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    offline : false,
    autodisable : ext.ONLINE | ext.LOCAL,
    markup  : markup,
    buttonClassName : "debug1",
    deps    : [fs, noderunner],

    nodesAll: [],
    nodes : [],

    hook : function(){
        var _self = this;
        breakpoints.init();

        commands.addCommand({
            name: "resume",
            hint: "resume the current paused process",
            bindKey: {mac: "F8", win: "F8"},
            exec: function(){
                _self.continueScript();
            }
        });
        commands.addCommand({
            name: "stepinto",
            hint: "step into the function that is next on the execution stack",
            bindKey: {mac: "F11", win: "F11"},
            exec: function(){
                _self.continueScript("in");
            }
        });
        commands.addCommand({
            name: "stepover",
            hint: "step over the current expression on the execution stack",
            bindKey: {mac: "F10", win: "F10"},
            exec: function(){
                _self.continueScript("next");
            }
        });
        commands.addCommand({
            name: "stepout",
            hint: "step out of the current function scope",
            bindKey: {mac: "Shift-F11", win: "Shift-F11"},
            exec: function(){
                _self.continueScript("out");
            }
        });

        ide.addEventListener("consolecommand.debug", function(e) {
            ide.send({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "debugger"
            });
            return false;
        });

       

        var name = "ext/debugger/debugger"; //this.name

        dock.addDockable({
            expanded : -1,
            width    : 300,
            sections : [
                {
                    height     : 30,
                    width      : 150,
                    minHeight  : 30,
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
                    width : 410,
                    height : 230,
                    flex : 3,
                    buttons : [
                        { caption: "Call Stack", ext : [name, "dbgCallStack"], hidden: true}
                    ]
                },
                {
                    width : 380,
                    height : 300,
                    flex : 3,
                    buttons : [
                        { caption: "Interactive", ext : [name, "dbInteractive"], hidden: true},
                        { caption: "Variables", ext : [name, "dbgVariable"], hidden: true},
                    ]
                },
                {
                    width : 350,
                    height : 230,
                    flex : 2,
                    buttons : [
                        { caption: "Breakpoints", ext : [name, "dbgBreakpoints"], hidden: true}
                    ]
                }
            ]
        });

        dock.register(name, "pgDebugNav", {
            menu : "Run Commands",
            primary : {
                backgroundImage: ide.staticPrefix + "/ext/main/style/images/debugicons.png",
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
                backgroundImage: ide.staticPrefix + "/ext/main/style/images/debugicons.png",
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
                backgroundImage: ide.staticPrefix + "/ext/main/style/images/debugicons.png",
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
                backgroundImage: ide.staticPrefix + "/ext/main/style/images/debugicons.png",
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
                backgroundImage: ide.staticPrefix + "/ext/main/style/images/debugicons.png",
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
        sources.init();       
        
        var modelName = "mdlDbgStack";
        var model = apf.nameserver.register("model", modelName, new apf.model());
        apf.setReference(modelName, model);
        // we're subsribing to the 'running active' prop
        // this property indicates whether the debugger is actually running (when on a break this value is false)
        stRunning.addEventListener("prop.active", function (e) {
            // if we are really running (so not on a break or something)
            if (e.value) {
                // we clear out mdlDbgStack
                mdlDbgStack.load("<frames></frames>");
            }
        });

        this.$mdlSources = mdlDbgSources;
        this.$mdlBreakpoints = mdlDbgBreakpoints;
        this.$mdlStack = mdlDbgStack;

        //@todo move this to noderunner...
        /* dbg.addEventListener("changeframe", function(e) {
            e.data && _self.showDebugFile(e.data.getAttribute("scriptid"));
        }); */

        dbgBreakpoints.addEventListener("afterrender", function(){
            lstBreakpoints.addEventListener("afterselect", function(e) {
                if (e.selected && e.selected.getAttribute("scriptid"))
                    _self.showDebugFile(e.selected.getAttribute("scriptid"),
                        parseInt(e.selected.getAttribute("line"), 10) + 1);
                // TODO sometimes we don't have a scriptID
            });
            
            lstBreakpoints.addEventListener("aftercheck", function(e) {
                dbg.setBreakPointEnabled(e.xmlNode, 
                    apf.isTrue(e.xmlNode.getAttribute("enabled")));
            });
        });

        dbgBreakpoints.addEventListener("dbInteractive", function(){
            lstScripts.addEventListener("afterselect", function(e) {
                e.selected && require("ext/debugger/debugger")
                    .showDebugFile(e.selected.getAttribute("scriptid"));
            });
        });

        stDebugProcessRunning.addEventListener("activate", this.$onDebugProcessActivate.bind(this));
        stDebugProcessRunning.addEventListener("deactivate", this.$onDebugProcessDeactivate.bind(this));
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
        commands.removeCommandsByName(
            ["resume", "stepinto", "stepover", "stepout"]);

        this.nodes.each(function(item){
            item.destroy(true, true);
            dock.unregisterPage(item);
        });

        tabDebug.destroy(true, true);
        this.$layoutItem.destroy(true, true);

        this.nodes = [];
    },
    
    registerDebugClient : function(dbgImpl) {
        this.$debugger = dbgImpl
    },
    
    $onDebugProcessActivate : function() {
        this.attach();
    },
    
    $onDebugProcessDeactivate : function() {
        this.$debugger.detach()
    },
    
    attach : function(tab) {
        var _self = this;
        _self.$debugger = v8debugclient;

        _self.$debugger.attach(function(err, dbgImpl) {
            if (err) {
                return console.error("Attaching console failed", err);
            }
            
            
            // do some stuff after attaching and get the currently active frame
            var afterAttachStep = function (callback) {
                // load something?
                _self.$loadSources(function() {
                    // sync the breakpoints that we have in the IDE with the server
                    dbgImpl.setBreakpoints(_self.$mdlBreakpoints, function() {
                        // do a backtrace
                        var backtraceModel = new apf.model();
                        backtraceModel.load("<frames></frames>");
    
                        // and if we find something
                        _self.$debugger.backtrace(backtraceModel, function() {
                            var frame = backtraceModel.queryNode("frame[1]");
                        
                            // send some info about the current frame in the callback
                            callback(frame, backtraceModel);
                        });
                    });
                });
            };
            
            // register regular break and changeRunning events
            var registerEvents = function () {
                dbgImpl.addEventListener("break", _self.$onBreak.bind(_self));
                dbgImpl.addEventListener("changeRunning", _self.$onChangeRunning.bind(_self));
            };
            
            // function called when we're doing an attach to a new process we just started
            var newProcess = function () {
                // the node.js debugger works that we need to wait for the
                // first breakpoint to be hit, this probably works differently
                // for other sources, but we'll see about that
                var onFirstBreak = function (ev) {
                    afterAttachStep(function (frame, stackModel) {
                        var hasBreakpointOnThisFrame = _self.$allowAttaching(frame);
                        if (hasBreakpointOnThisFrame) {
                            // the line we broke on has an actual breakpoint
                            // so let's break on it then
                            _self.$onBreak(ev, stackModel);
                            // and call the changeRunning as well
                            _self.$onChangeRunning();
                        }
                        else {
                            // otherwise step to the next breakpoint
                            _self.continueScript();
                        }
                        
                        // remove this listener
                        dbgImpl.removeEventListener("break", onFirstBreak);
                        
                        // add the actual listeners for changeRunning & break
                        registerEvents();
                    });
                };
                
                dbgImpl.addEventListener("break", onFirstBreak);
            };
            
            // re-attach to an already running process
            var existingProcess = function () {
                afterAttachStep(function (frame, stackModel) {
                    // send out a break statement for this frame
                    if (frame) {
                        _self.$onBreak({
                            data: {
                                sourceColumn: Number(frame.getAttribute("column")),
                                sourceLine: Number(frame.getAttribute("line")),
                                script: {
                                    name: frame.getAttribute("script")
                                }
                            }
                        }, stackModel);
                        
                        // make sure we register break events and such
                        registerEvents();
                    }
                });
            };
            
            // depending on this flag we'll call either of these functions
            if (_self.autoAttachComingIn) {
                existingProcess();
            }
            else {
                newProcess();
            }
            
            // afterCompile and detach handlers are perfectly fine here
            dbgImpl.addEventListener("afterCompile", _self.$onAfterCompile.bind(_self));                            
            dbgImpl.addEventListener("detach", _self.$onDetach.bind(_self));
        });

    },

    $allowAttaching : function (frame) {
        var _self = this;

        if (this.autoAttachComingIn) return true;

        if (frame) {
            var scriptId = frame.getAttribute("scriptid");
            var scriptName = _self.$mdlSources.queryValue("file[@scriptid='" + scriptId + "']/@scriptname");

            if (scriptName) {
                var line = frame.getAttribute("line");
                var bp = _self.$mdlBreakpoints.queryNode("breakpoint[@script='" + scriptName + "' and @line='" + line + "']");
            }
            if (!scriptName || !bp) {
               return false;
            }

            return true;
        }

        return false;
    },

    $onChangeRunning : function() {
        var isRunning = this.$debugger && this.$debugger.isRunning();
        stRunning.setProperty("active", isRunning);
    },

    $onBreak : function(e, stackModel) {
        var _self = this;
        
        var script = e.data.script.name;
        if (e.currentTarget && e.currentTarget.stripPrefix) {
            script = script.indexOf(e.currentTarget.stripPrefix) === 0 ?
                script.substr(e.currentTarget.stripPrefix) :
                script;
        }
        
        var emit = function () {
            _self.activeframe = _self.$mdlStack.queryNode("frame[1]");
            // the active frame change will call the break itself
        };
        
        // if we've got the model passed in, it's fine
        if (stackModel) {
            _self.$mdlStack.load(stackModel.data.xml);
            emit();
        }
        // otherwise do a backtrace first
        else {
            _self.$debugger.backtrace(_self.$mdlStack, function () {
                emit();
            });
        }
    },

    $updateMarkerPrerequisite : function () {
        return this.activeframe;
    },
    
    $onAfterCompile : function(e) {       
        var id = e.script.getAttribute("id");
        var oldNode = this.$mdlSources.queryNode("//file[@id='" + id + "']");
        if (oldNode)
            this.$mdlSources.removeXml(oldNode);
        this.$mdlSources.appendXml(e.script);
    },

    $onDetach : function() {
        var _self = this;

        if (this.$debugger) {
            // destroy doesnt destroy the event listeners
            // so do that by hand
            Object.keys(_self.$debugger.$eventsStack).forEach(function (evname) {
                _self.$debugger.$eventsStack[evname].forEach(function (fn) {
                    _self.$debugger.removeEventListener(evname, fn);
                });
            });

            this.$debugger.destroy();
            this.$debugger = null;
        }

        this.$mdlSources.load("<sources />");
        this.$mdlStack.load("<frames />");
        this.activeframe = null;
    },

    $onChangeFrame : function() {
        if (!this.$ignoreFrameEvent) {
            this.activeframe = this.$debugger.getActiveFrame();
        }
    },

    changeFrame : function(frame) {
        this.$debugger.setFrame(frame);
    },

    detach : function(callback) {
        var _self = this;

        this.continueScript();
        if (this.$debugger) {
            this.$debugger.detach(function () {
                if (typeof callback === "function")
                    callback();
                // always detach, so we won't get into limbo state
                _self.$onDetach();
            });
        }
        else {
            this.$onDetach();
        }
    },

    $loadSources : function(callback) {
        this.$debugger.scripts(this.$mdlSources, callback);
    },

    loadScript : function(script, callback) {
        this.$debugger.loadScript(script, callback);
    },

    loadObjects : function(item, callback) {
        this.$debugger.loadObjects(item, callback);
    },

    loadFrame : function(frame, callback) {
        this.$debugger.loadFrame(frame, callback);
    },

    toggleBreakpoint : function(script, row, content) {
        var model = this.$mdlBreakpoints;
        if (this.$debugger) {
            this.$debugger.toggleBreakpoint(script, row, model, content);
        }
        else {
            var scriptName = script.getAttribute("scriptname");
            var bp = model.queryNode("breakpoint[@script='" + scriptName
                + "' and @line='" + row + "']");
            if (bp) {
                apf.xmldb.removeNode(bp);
            }
            else {
                // filename is something like blah/blah/workspace/realdir/file
                // we are only interested in the part after workspace for display purposes
                var tofind = "/workspace/";
                var path = script.getAttribute("path");
                var displayText = path;
                if (path.indexOf(tofind) > -1) {
                    displayText = path.substring(path.indexOf(tofind) + tofind.length);
                }

                var bp = apf.n("<breakpoint/>")
                    .attr("script", scriptName)
                    .attr("line", row)
                    .attr("text", displayText + ":" + (parseInt(row, 10) + 1))
                    .attr("lineoffset", 0)
                    .attr("content", content)
                    .attr("enabled", "true")
                    .node();
                model.appendXml(bp);
            }
        }
    },

    setBreakPointEnabled : function(node, value){
        if (this.$debugger) {
            this.$debugger.setBreakPointEnabled(node, value);
        }
        else {
            node.setAttribute("enabled", value ? true : false);
        }
    },

    continueScript : function(stepaction, stepcount, callback) {
        ide.dispatchEvent("beforecontinue");

        if (this.$debugger)
            this.$debugger.continueScript(stepaction, stepcount || 1, callback);
        else
            callback && callback();
    },

    suspend : function() {
        this.$debugger && this.$debugger.suspend();
    },

    evaluate : function(expression, frame, global, disableBreak, callback){
        this.$debugger && this.$debugger.evaluate(expression, frame, global, disableBreak, callback);
    },

    changeLive : function(scriptId, newSource, previewOnly, callback) {
        this.$debugger && this.$debugger.changeLive(scriptId, newSource, previewOnly, callback);
    },

});

});

