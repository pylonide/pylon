/**
 * Refactor Module for the Ajax.org Cloud IDE
 */
require.def("ext/refactor/refactor",
    ["core/ide", "core/ext"],
    function(ide, ext) {
        return {
            type   : ext.GENERAL, 
            markup : "refactor.xml",
            
            nodes : [],
            
            init : function(amlNode){
                var openUi = function(){
                    //Get current selection
                    //var sel = ext.currentEditor.selection.getValue();
                    
                    //Set selection as search keyword
                    //txtSearchWords.setValue(sel);
                    
                    //Open search window
                    winSearchReplace.show();
                };
                
                this.nodes.push(
                    ide.barTools.appendChild(new apf.button({
                        icon    : "replace.png",
                        onclick : openUi
                    })),
                    
                    ide.mnuCtxEditor.appendChild(new apf.item({
                        caption : "Search & Replace",
                        onclick : openUi
                    }))
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
        }
    }
);