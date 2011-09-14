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
var settings = require("ext/settings/settings");
var save = require("ext/save/save");
var markup = require("text!ext/run/run.xml");

module.exports = ext.register("ext/run/run", {
    name    : "Run Toolbar",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    offline : false,
    markup  : markup,
    deps    : [noderunner],
    commands : {
        "resume"   : {hint: "resume the current paused process"},
        "stepinto" : {hint: "step into the function that is next on the execution stack"},
        "stepover" : {hint: "step over the current expression on the execution stack"},
        "stepout"  : {hint: "step out of the current function scope"}
    },

    nodes : [],

    init : function(amlNode){
        while(tbRun.childNodes.length) {
            var button = tbRun.firstChild;
            
            ide.barTools.appendChild(button);
            if (button.nodeType == 1) {
                this.nodes.push(button);
            }
        }
        
        var _self = this;
        mdlRunConfigurations.addEventListener("afterload", function(e) {
            _self.$updateMenu();
        });
        mdlRunConfigurations.addEventListener("update", function(e) {
            settings.save();
            if (e.action == "add" || e.action == "redo-remove" || e.action == "attribute")
                _self.$updateMenu();
        });

        ide.addEventListener("loadsettings", function(e){
            var runConfigs = e.model.queryNode("auto/configurations");
            if (!runConfigs)
                runConfigs = apf.createNodeFromXpath(e.model.data, "auto/configurations");

            mdlRunConfigurations.load(runConfigs);
        });

        winRunCfgNew.addEventListener("hide", function() {
            mdlRunConfigurations.data.setAttribute("debug", "0");
        });
    },

    duplicate : function() {
        var config = lstRunCfg.selected;
        if (!config)
            return;

        var duplicate = config.cloneNode(true);
        apf.b(config).after(duplicate);
        lstRunCfg.select(duplicate);
        winRunCfgNew.show();
    },

    addConfig : function() {
        var file = ide.getActivePageModel();
        var extension = "";

        if (!file || (file.getAttribute("contenttype") || "").indexOf("application/javascript") != 0 && (file.getAttribute("contenttype") || "").indexOf("text/x-script.python") != 0) {
            var path = "";
            var name = "server";
        }
        else {
            path  = file.getAttribute("path").slice(ide.davPrefix.length + 1);
            name  = file.getAttribute("name").replace(/\.(js|py)$/, function(full, ext){ extension = ext; return ""; });
        }

        var cfg = apf.n("<config />")
            .attr("path", path)
            .attr("name", name)
            .attr("extension", extension)
            .attr("args", "").node();

        mdlRunConfigurations.appendXml(cfg);
        lstRunCfg.select(cfg);
        winRunCfgNew.show();
    },

    showRunConfigs : function(debug) {
        mdlRunConfigurations.data.setAttribute("debug", debug ? "1": "0");
        winRunCfgNew.show();
    },

    run : function(debug) {
        var config = lstRunCfg.selected;
        mdlRunConfigurations.data.setAttribute("debug", debug ? "1": "0");
        if (!config) {
            this.addConfig();
        }
        else {
            this.runConfig(config, debug);
            ide.dispatchEvent("track_action", {type: debug ? "debug" : "run"});
        }
    },

    $updateMenu : function() {
        var menus = [mnuRunCfg, mnuDebugCfg];

        for (var j=0; j<menus.length; j++) {
            var menu = menus[j];

            var item = menu.firstChild;
            while(item && item.tagName !== "a:divider") {
                menu.removeChild(item);
                item = menu.firstChild;
            }
            var divider = item;

            var configs = mdlRunConfigurations.queryNodes("config");
            if (!configs.length)
                menu.insertBefore(new apf.item({disabled:true, caption: "no run history"}), divider);
            else {
                for (var i=0,l=configs.length; i<l; i++) {
                    var item = new apf.item({
                        caption: configs[i].getAttribute("name")
                    });
                    item.$config = configs[i];

                    var _self = this;
                    item.onclick = function(debug) {
                        _self.runConfig(this.$config, debug);
                        lstRunCfg.select(this.$config);
                    }.bind(item, menu == mnuDebugCfg);
                    menu.insertBefore(item, menu.firstChild);
                }
            }
        }
    },

    runConfig : function(config, debug) {
        var model = settings.model;
        var saveallbeforerun = model.queryValue("general/@saveallbeforerun");
        if(saveallbeforerun) save.saveall();
        
        if (debug === undefined)
            debug = config.parentNode.getAttribute("debug") == "1";

        config.parentNode.setAttribute("debug", "0");
        noderunner.run(config.getAttribute("path"), config.getAttribute("args").split(" "), debug);
    },

    stop : function() {
        noderunner.stop();
    },

    enable : function(){
        if (!this.disabled) return;
        
        this.nodes.each(function(item){
            item.setProperty("disabled", item.$lastDisabled !== undefined
                ? item.$lastDisabled
                : true);
            delete item.$lastDisabled;
        });
        this.disabled = false;
    },

    disable : function(){
        if (this.disabled) return;
        
        this.nodes.each(function(item){
            if (!item.$lastDisabled)
                item.$lastDisabled = item.disabled;
            item.disable();
        });
        this.disabled = true;
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});