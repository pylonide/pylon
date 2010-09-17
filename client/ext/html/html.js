/**
 * HTML Editor for the Ajax.org Cloud IDE
 */
require.def("ext/html/html",
    ["core/ide", "core/ext", "ext/code/code", "ext/tree/treeutil", "text!ext/html/html.xml"],
    function(ide, ext, code, treeutil, markup) {

//Add a menu item to the list of editors
ide.mnuEditors.appendChild(new apf.item({
    caption : "Code Editor",
    value   : "ext/code/code"
}));

return ext.register("ext/html/html", {
    name    : "HTML Editor",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    deps    : [code],
    contenttypes : [
        "text/html",
        "application/xhtml+xml"
    ],
    markup  : markup,
    nodes : [],

    init : function(amlPage) {
        this.page = amlPage;

        //Append the button bar to the main toolbar
        var nodes = barHtmlMode.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            this.nodes.push(ide.barTools.appendChild(nodes[0]));
        }
        ext.initExtension(code, amlPage);
        code.enable();

        btnHtmlOpen.onclick = this.onOpenPage.bind(this);
    },

    onOpenPage : function() {
        var file = this.page.model.data;
        window.open(location.protocol + "//" + location.host + "/workspace/" + treeutil.getPath(file), "_blank");
    },

    enable : function() {
        this.nodes.each(function(item){
            item.show();
        });
        code.enable();
    },

    disable : function(){
        this.nodes.each(function(item){
            item.hide();
        });
        code.disable();
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});