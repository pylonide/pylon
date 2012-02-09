/**
 * This plugin gives a 'close confirmation' when closing the IDE
 *
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

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
        window.onbeforeunload = function () {
            // see what's in the settings
            if (apf.isTrue(settings.model.queryNode("general/@confirmexit").value)) {
                return "Are you sure you want to leave Cloud9?";
            } 
        };
        
        // init extension, add html
        ext.initExtension(this);
    },
    
    init : function () {
        var _self = this;
        
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
        this.nodes.push(warnBeforeExiting);
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
    }
});

});