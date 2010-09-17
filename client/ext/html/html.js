/**
 * HTML Editor for the Ajax.org Cloud IDE
 */
require.def("ext/html/html",
    ["core/ide", "core/ext", "ext/code/code", "ext/tree/treeutil", "text!ext/html/html.xml"],
    function(ide, ext, code, treeutil, markup) {

return ext.register("ext/html/html", {
    name    : "HTML Editor",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    deps    : [code],
    markup  : markup,
    nodes : [],

    hook : function(){
        var _self = this;
        ide.tabEditors.addEventListener("prop.activepage", function(e){
            var mime = e.page.contentType;
            if (mime == "text/html" || mime == "application/xhtml+xml") {
                ext.initExtension(_self);
                _self.enable();
            }
            else {
                _self.disable();
            }
        });
    },

    init : function(amlPage) {
        this.page = amlPage;

        //Append the button bar to the main toolbar
        var nodes = barHtmlMode.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            this.nodes.push(ide.barTools.appendChild(nodes[0]));
        }
        ext.initExtension(code, amlPage);

        btnHtmlOpen.onclick = this.onOpenPage.bind(this);
    },

    onOpenPage : function() {
        var file = this.page.model.data;
        window.open(location.protocol + "//" + location.host + "/workspace/" + treeutil.getPath(file), "_blank");
    },

    enable : function() {
        console.log("enable HTML")
        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function(){
        console.log("disable HTML")
        this.nodes.each(function(item){
            item.hide();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});