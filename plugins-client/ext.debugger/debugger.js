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
var markup = require("text!ext/debugger/debugger.xml");
var breakpoints = require("./breakpoints");
var sources = require("./sources");
var apfhook = require("./apfhook");

require("ext/debugger/inspector");
var v8debugclient = require("ext/dbg-node/dbg-node");

module.exports = ext.register("ext/debugger/debugger", {
    name    : "Debug",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    offline : false,
    autodisable : ext.ONLINE | ext.LOCAL,
    markup  : markup,
    buttonClassName : "debug1",
    deps    : [fs],

    nodesAll: [],
    nodes : [],

    hook : function(){
        var _self = this;
        this.sources = sources;
        this.breakpoints = breakpoints;
        apfhook.registerDebugger(this);

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
        
        
        breakpoints.hook();
        ide.addEventListener("dbg.attached", function(dbgImpl) {
            if (!_self.inited)
                ext.initExtension(_self);
            _self.$debugger = dbgImpl;
        })
    },

    init : function(amlNode){
        var _self = this;
        sources.init();
        breakpoints.init();

        var modelName = "mdlDbgStack";
        var model = apf.nameserver.register("model", modelName, new apf.model());
        apf.setReference(modelName, model);
        // we're subsribing to the 'running active' prop
        // this property indicates whether the debugger is actually running (when on a break this value is false)
        ide.addEventListener("dbg.changeState", function (e) {
            // if we are really running (so not on a break or something)
            if (e.state != "stopped") {
                // we clear out mdlDbgStack
                mdlDbgStack.load("<frames></frames>");
            }
        });

        this.$mdlSources = mdlDbgSources;
        this.$mdlBreakpoints = mdlDbgBreakpoints;
        this.$mdlStack = mdlDbgStack;



        ide.addEventListener("noderunner.startDebug", this.$onDebugProcessActivate.bind(this))
        ide.addEventListener("noderunner.stopDebug", this.$onDebugProcessActivate.bind(this))
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
        // require('ext/runpanel/runpanel').stop();
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
    
    /**
     * If you are auto attaching, please announce yourself here
     */
    registerAutoAttach : function () {
        this.autoAttachComingIn = true;
    },

    /**
     * Manual click on the run button?
     * Youll get special behavior!
     */
    registerManualAttach : function () {
        this.autoAttachComingIn = false;
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
            // if (_self.autoAttachComingIn) {
            //    existingProcess();
            //}
            //else {
            //    newProcess();
            //}
            
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
        if (!this.$debugger) {
            this.state = null;
        } else {
            this.state = this.$debugger.isRunning() ? "running" : "stopped";
        }
        
        ide.dispatchEvent("dbg.changeState", this)
    },
    
    $onAfterCompile : function(e) {       
        var id = e.script.getAttribute("id");
        var oldNode = mdlDbgSources.queryNode("//file[@id='" + id + "']");
        if (oldNode)
            mdlDbgSources.removeXml(oldNode);
        mdlDbgSources.appendXml(e.script);
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
        this.activeFrame = null;
    },

    setFrame : function(frame) {
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
        this.$debugger && this.$debugger.scripts(this.$mdlSources, callback);
    },

    loadScript : function(script, callback) {
        this.$debugger && this.$debugger.loadScript(script, callback);
    },

    loadObjects : function(item, callback) {
        this.$debugger && this.$debugger.loadObjects(item, callback);
    },

    loadFrame : function(frame, callback) {
        this.$debugger && this.$debugger.loadFrame(frame, callback);
    },

    continueScript : function(stepaction, stepcount, callback) {
        ide.dispatchEvent("beforecontinue");

        this.$debugger && this.$debugger.continueScript(stepaction, stepcount || 1, callback);
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

