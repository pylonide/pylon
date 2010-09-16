/**
 * Node Runner Module for the Ajax.org Cloud IDE
 */
require.def("ext/noderunner/noderunner",
    ["core/ide", "core/ext", "text!ext/noderunner/noderunner.xml"],
    function(ide, ext, markup) {
        return {
            type   : ext.GENERAL,
            markup : markup,

            nodes : [],

            init : function(amlNode){
                while(tbNoderunner.childNodes.length) {
                    var button = tbNoderunner.firstChild;
                    ide.barTools.appendChild(button);
                    this.nodes.push(button);
                }
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
        };
    }
);