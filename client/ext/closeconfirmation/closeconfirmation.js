/**
 * This plugin gives a 'close confirmation' when closing the IDE
 *
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/closeconfirmation/closeconfirmation", {
    name    : "Confirm closing",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : null,
    
    deps    : [ settings ],
    
    nodes : [],
    
    hook : function () {
        // when unloading the window
        window.onbeforeunload = this.onBeforeUnloadHandler;

        var _self = this;
        ide.addEventListener("init.ext/settings/settings", function (e) {
            // this is the checkbox
            var warnBeforeExiting = new apf.checkbox({
                "class" : "underlined",
                skin  : "checkbox_grey",
                value : "[general/@confirmexit]",
                label : "Warn before exiting"
            });
            
            // find the 'General' section in the settings plugin
            var heading = settings.getHeading("General");
            heading.appendChild(warnBeforeExiting);
    
            // add the checkbox to the node list of the plugin
            _self.nodes.push(warnBeforeExiting);
        });

        // init extension
        ext.initExtension(this);
    },
    
    init : function () {
    },
    
    onBeforeUnloadHandler : function () {
        // see what's in the settings
        var settingsNode = settings.model.queryNode("general/@confirmexit");
        if (settingsNode && apf.isTrue(settingsNode.value)) {
            return "Are you sure you want to leave Cloud9?";
        }        
    },

    enable : function() {
        this.nodes.each(function(item){
            item.enable();
        });
    },
    
    disable : function() {
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function() {
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
        
        // clean out the event handler
        if (window.onbeforeunload === this.onBeforeUnloadHandler) {
            window.onbeforeunload = null;
        }
    }
});

});