/**
 * Code Editor for the Ajax.org Cloud IDE
 */
require.def("ext/code/code",
    ["core/ide", "core/ext", "text!ext/code/code.xml"],
    function(ide, ext, markup) {
        
//Add a menu item to the list of editors
ide.mnuEditors.appendChild(new apf.item({
    caption : "Code Editor",
    value   : "ext/code/code"
}));

return ext.register("ext/code/code", {
    name    : "Code Editor",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    fileext : ["js", "html", "xml", "css", "xhtml", "aml", "txt", "php"],
    markup  : markup,

    nodes : [],

    init : function(amlPage){
        amlPage.appendChild(barEditor);

        //Append the button bar to the main toolbar
        var nodes = barCodeTb.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            this.nodes.push(ide.barTools.appendChild(nodes[0]));
        }

        this.nodes.push(
            //Add a panel to the statusbar showing whether the insert button is pressed
            sbMain.appendChild(new apf.section({
                caption : "{ceEditor.insert}"
            })),

            //Add a panel to the statusbar showing the length of the document
            sbMain.appendChild(new apf.section({
                caption : "Length: {ceEditor.value.length}"
            }))
        );
    },

    enable : function(){
        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.hide();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        barEditor.destroy(true, true);

        this.nodes = [];
    }
});

    }
);