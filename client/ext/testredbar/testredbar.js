/**
 * Test module that turns the menubar red when enabled
 */
require.def("ext/testredbar/testredbar",
    ["core/ide", "core/ext"],
    function(ide, ext) {
        return {
            dev    : "Ajax.org",
            type   : ext.GENERAL, 
            
            init : function(amlNode){
                barMenu.$ext.style.background = "red";
            },
            
            enable : function(){
                barMenu.$ext.style.background = "red";
            },
            
            disable : function(){
                barMenu.$ext.style.background = "";
            },
            
            destroy : function(){
                barMenu.$ext.style.background = "";
            }
        }
    }
);