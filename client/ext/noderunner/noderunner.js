/**
 * Node Runner Module for the Ajax.org Cloud IDE
 */
require.def("ext/noderunner/noderunner",
    ["core/ide", "core/ext", "text!ext/noderunner/noderunner.xml"],
    function(ide, ext, markup) {
        return {
            dev    : "Ajax.org",
            type   : ext.GENERAL,
            markup : markup,

            nodes : [],

            init : function(amlNode){
                ide.tbMain.appendChild(tbNoderunner);
            },

            enable : function(){
            },

            disable : function(){
            },

            destroy : function(){
            }
        };
    }
);