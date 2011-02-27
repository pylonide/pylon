/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/extmgr/extmgr",
    ["core/ide", "core/ext", "core/util", "text!ext/extmgr/extmgr.xml"],
    function(ide, ext, util, markup) {
        
return ext.register("ext/extmgr/extmgr", {
    name   : "Extension Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    markup : markup,
    
    nodes : [],
    
    hook : function(){
        var _self = this;
        this.nodes.push(
            mnuPanels.insertBefore(new apf.divider(), mnuPanels.firstChild),
            
            mnuPanels.insertBefore(new apf.item({
                caption : "Extension Manager...",
                onclick : function(){
                    ext.initExtension(_self);
                    winExt.show();
                }
            }), mnuPanels.firstChild)
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