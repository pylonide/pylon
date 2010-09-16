/**
 * Console for the Ajax.org Cloud IDE
 */
require.def("ext/console/console",
    ["core/ide", "core/ext", "text!ext/console/console.xml"], function(ide, ext, markup) {

return ext.register("ext/console/console", {
    name   : "Console",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    markup : markup,

    init : function(amlNode){
        //Append the console window at the bottom below the tab
        ide.vbMain.selectSingleNode("a:hbox/a:vbox[2]").appendChild(winDbgConsole);
    },

    enable : function(){
        winDbgConsole.show();
    },

    disable : function(){
        winDbgConsole.hide();
    },

    destroy : function(){
        winDbgConsole.destroy(true, true);
    }
});

});