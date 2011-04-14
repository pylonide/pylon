/**
 * HTML Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/html/html",
    ["core/ide", "core/ext", "ext/code/code", "text!ext/html/html.xml"],
    function(ide, ext, code, markup) {

return ext.register("ext/html/html", {
    name    : "HTML Editor",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    deps    : [code],
    markup  : markup,
    nodes   : [],

    hook : function(){
        var _self = this;
        tabEditors.addEventListener("afterswitch", function(e){
            var mime = e.nextPage.contentType;
            if (mime == "text/html" || mime == "application/xhtml+xml"
              || mime == "text/javascript" || mime == "text/plain"
              || mime == "application/xml") {
                ext.initExtension(_self);
                _self.page = e.nextPage;
                _self.enable();
            }
            else {
                _self.disable();
            }
        });
    },

    init : function() {
        //Append the button bar to the main toolbar
        var nodes = barHtmlMode.childNodes;
        for (var node, i = nodes.length - 1; i >= 0; i--) {
            node = ide.barTools.appendChild(nodes[0]);
            if (node.nodeType != 1) continue;
            this.nodes.push(node);
        }

        btnHtmlOpen.onclick = this.onOpenPage.bind(this);
        this.enabled = true;
    },

    onOpenPage : function() {
        var file = this.page.$model.data;
        window.open(location.protocol + "//" + location.host + file.getAttribute("path"), "_blank");
    },

    enable : function() {
        if (this.enabled)
            return;
        this.enabled = true;

        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function(){
        if (!this.enabled)
            return;
        this.enabled = false;

        this.nodes.each(function(item){
            item.hide && item.hide();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy && item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});