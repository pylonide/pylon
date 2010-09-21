/**
 * Code Editor for the Ajax.org Cloud IDE
 */
require.def("ext/debugger/debugger",
    ["core/ide", "core/ext", "ext/console/console", "text!ext/debugger/debugger.xml"],
    function(ide, ext, log, markup) {

return ext.register("ext/debugger/debugger", {
    name   : "Debug",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    deps   : [log],

    nodes : [],

    hook : function(){
        this.$layoutItem = ddModes.appendChild(new apf.item({
            value   : "ext/debugger/debugger",
            caption : this.name
        }));
    },

    init : function(amlNode){
        this.nodes.push(
            //Append the debug toolbar to the main toolbar
            ide.tbMain.appendChild(tbDebug),

            //Append the stack window at the right
            ide.vbMain.selectSingleNode("a:hbox/a:vbox[3]").appendChild(winDbgStack),

            //Append the watch window on the left below the file tree
            ide.vbMain.selectSingleNode("a:hbox/a:vbox[3]").appendChild(winDbgWatch)
        );

        log.enable();
    },

    enable : function(){
        this.nodes.each(function(item){
            if (item.show)
                item.show();
        });
        log.enable(true);
    },

    disable : function(){
        this.nodes.each(function(item){
            if (item.hide)
                item.hide();
        });
        log.disable(true);
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        winV8.destroy(true, true);
        this.$layoutItem.destroy(true, true);

        this.nodes = [];
    }
});

});