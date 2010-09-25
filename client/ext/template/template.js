/**
 * Template extension for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/template/template",
    ["core/ide", 
     "core/ext", 
     "core/util", 
     "ext/editors/editors", 
     "text!ext/template/template.xml"],
    function(ide, ext, util, editors, markup) {
        
return ext.register("ext/template/template", {
    name   : "Template",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    markup : markup,
    
    nodes : [],
    
    hook : function(){
        var _self = this;
        this.nodes.push(
            ide.mnuEdit.appendChild(new apf.item({
                caption : "Template",
                onclick : function(){
                    ext.initExtension(_self);
                    _self.winTemplate.show();
                }
            }))
        );
    },
    
    init : function(amlNode){
        this.winTemplate = winTemplate;
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
        this.winTemplate.destroy(true, true);
    }
});

    }
);