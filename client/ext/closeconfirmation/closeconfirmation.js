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
var markupSettings =  require("text!ext/closeconfirmation/settings.xml");

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
 
        require("ext/settings/settings").addSettings("General", markupSettings );
     
        // init extension
        ext.initExtension(this);
    },
    
    init : function () {
    },
    
    onBeforeUnloadHandler : function () {
        var changed = false;
        tabEditors.getPages().forEach(function(page){
            var at = page.$at;
            if (!at.undo_ptr)
                at.undo_ptr = at.$undostack[0];
            var node = page.$doc.getNode();
            if (node && at.undo_ptr && at.$undostack[at.$undostack.length-1] !== at.undo_ptr
              || !at.undo_ptr && node.getAttribute("changed") == 1
              && page.$doc.getValue()) {
                  changed = true;
            }
        });
        
        if(changed)
            return "You have unsaved changes. Your changes will be lost if you don't save them";
            
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