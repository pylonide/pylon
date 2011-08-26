/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
 define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var markup = require("text!ext/extmgr/extmgr.xml");
var panels = require("ext/panels/panels");

module.exports = ext.register("ext/extmgr/extmgr", {
    name   : "Extension Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    markup : markup,
    desp   : [panels],
    
    nodes : [],
    
    hook : function(){
        var _self = this;
        this.nodes.push(
            mnuWindows.insertBefore(new apf.divider(), mnuWindows.firstChild),
            
            mnuWindows.insertBefore(new apf.item({
                caption : "Extension Manager...",
                onclick : function(){
                    ext.initExtension(_self);
                    winExt.show();
                }
            }), mnuWindows.firstChild)
        );
    },
    
    init : function(amlNode){
        
    },
    
    enable : function(){
        if (!this.disabled) return;
        
        this.nodes.each(function(item){
            item.enable();
        });
        this.disabled = false;
    },
    
    disable : function(){
        if (this.disabled) return;
        
        this.nodes.each(function(item){
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

    }
);