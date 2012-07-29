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
      
        breakpoints.hook();
        sources.hook();        
       
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
        
        


        ide.addEventListener("dbg.attached", function(dbgImpl) {
            if (!_self.inited)
                ext.initExtension(_self);
            _self.$debugger = dbgImpl;
        })
        ide.addEventListener("afterCompile", this.$onAfterCompile.bind(this)); 
    },

    init : function(amlNode){
        var _self = this;
        sources.init();
        breakpoints.init();

        this.$mdlSources = mdlDbgSources;
        this.$mdlBreakpoints = mdlDbgBreakpoints;
        this.$mdlStack = mdlDbgStack;
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
    
    $onAfterCompile : function(e) {       
        var id = e.script.getAttribute("id");
        var oldNode = mdlDbgSources.queryNode("//file[@id='" + id + "']");
        if (oldNode)
            mdlDbgSources.removeXml(oldNode);
        mdlDbgSources.appendXml(e.script);
    },

    setFrame : function(frame) {
        this.$debugger.setFrame(frame);
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

