/**
 * richtext Editor for the Ajax.org Cloud IDE
 */
require.def("ext/richtext/richtext",
    ["core/ide", "core/ext"],
    function(ide, ext) {

//Add a menu item to the list of editors
ide.mnuEditors.appendChild(new apf.item({
    caption : "Rich Text Editor",
    value   : "ext/richtext/richtext"
}));

return ext.register("ext/richtext/richtext", {
    name    : "Rich Text Editor",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    contenttypes : ["application/rtf"],
    //markup  : "richtext.xml",

    nodes : [],

    init : function(amlPage){
        this.rteEditor = amlPage.appendChild(new apf.editor({
            value   : "[data]",
            anchors : "0 0 0 0"
        }));

        this.nodes.push(
            //Add a panel to the statusbar showing whether the insert button is pressed
            sbMain.appendChild(new apf.section({
                caption : "{rteEditor.insert}"
            })),

            //Add a panel to the statusbar showing the length of the document
            sbMain.appendChild(new apf.section({
                caption : "Length: {rteEditor.value.length}"
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

        if (this.rteEditor)
            this.rteEditor.destroy(true, true);

        this.nodes = [];
    }
});

    }
);