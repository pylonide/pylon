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
    },

    clear : function() {
        txtConsole.clear();
    },

    logNodeStream : function(data, stream) {
        var colors = {
            30: "black",
            31: "red",
            32: "green",
            33: "yellow",
            34: "blue",
            35: "magenta",
            36: "cyan",
            37: "white"
        };

        var lines = data.split("\n");
        var color = "black";
        var log = [];

        for (var i=0; i<lines.length; i++) {
            log.push("<div><span style='color:" + color + "'>" + lines[i].replace(/\033\[(\d+)m/g, function(m, c) {
                color = colors[c] || "black";
                return "</span><span style='color:" + color + "'>"
            }) + "</span></div>");
        }
        console.log(log);
        txtConsole.addValue(log.join(""));
    }
});

});