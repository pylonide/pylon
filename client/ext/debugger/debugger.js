/**
 * Code Editor for the Ajax.org Cloud IDE
 */
require.def("ext/debugger/debugger",
    ["core/ide", "core/ext", "ext/console/console", "text!ext/debugger/debugger.xml"],
    function(ide, ext, log, markup) {

return ext.register("ext/debugger/debugger", {
    name   : "Debug",
    dev    : "Ajax.org",
    type   : ext.LAYOUT,
    markup : markup,
    deps   : [log],

    nodes : [],

    init : function(amlNode){
        this.nodes.push(
            /*dbg, dbgNode,*/

            //Append the debug toolbar to the main toolbar
            ide.tbMain.appendChild(tbDebug),

            //Append the watch window on the left below the file tree
            ide.vbMain.selectSingleNode("a:hbox/a:vbox[1]").appendChild(winDbgWatch),

            //Append the stack window at the right
            ide.vbMain.selectSingleNode("a:hbox/a:vbox[3]").appendChild(winDbgStack)
        );

        log.enable();
    },

    enable : function(){
        this.nodes.each(function(item){
            if (item.show)
                item.show();
        });
        log.enable();
    },

    disable : function(){
        this.nodes.each(function(item){
            if (item.hide)
                item.hide();
        });
        log.disable();
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        winV8.destroy(true, true);

        this.nodes = [];
    }
});

});