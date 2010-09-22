/**
 * Extension Manager for the Ajax.org Cloud IDE
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
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Extension Manager",
                onclick : function(){
                    ext.initExtension(_self);
                    winExt.show();
                }
            }), ide.mnuFile.childNodes[ide.mnuFile.childNodes.length - 2])
        );
    },
    
    init : function(amlNode){
        
    },
    
    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },
    
    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
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