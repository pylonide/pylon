/**
 * Extension Manager for the Ajax.org Cloud IDE
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
    
    init : function(amlNode){
        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Extension Manager",
                onclick : function(){
                    winExt.show();
                }
            }), ide.mnuFile.childNodes[1])
        );
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