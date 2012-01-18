/**
 * HTML Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var code = require("ext/code/code");
var Editors = require("ext/editors/editors");
var markup = require("text!ext/html/html.xml");

var mimeTypes = [
    "text/html",
    "application/xhtml+xml",
    "text/javascript",
    "text/plain",
    "application/xml"
];

module.exports = ext.register("ext/html/html", {
    name    : "HTML Editor",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    deps    : [code],
    markup  : markup,
    nodes   : [],

    hook : function(){
        var _self = this;
        var tabs = tabEditors;

        tabs.addEventListener("afterswitch", function(e){
            if (e.nextPage) {
            /*var ext = e.nextPage.id.split(".").pop();

            if (ext == ".html" || ext == ".shtml"
              || ext == ".js" || ext == ".txt"
              || ext == ".xml") {*/
                ext.initExtension(_self);
                _self.enable();
            /*}
            else {
                _self.disable();
            }*/
            }
            else {
                _self.disable();
            }
        });

        tabs.addEventListener("DOMNodeRemoved", function(){
            // use a timeout to wait for the 'close tab' code flow to end,
            // the amount of pages will be correct by then.
            setTimeout(function() {
                if (!tabs.getPages().length)
                    _self.disable();
            });
        });
    },

    init : function() {
        //Append the button bar to the main toolbar
        var nodes = barHtmlMode.childNodes;
        var node;
        for (var i = nodes.length - 1; i >= 0; i--) {
            node = ide.barTools.appendChild(nodes[0]);
            if (node.nodeType != 1)
                continue;
            this.nodes.push(node);
        }

        btnHtmlOpen.onclick = this.onOpenPage.bind(this);
        this.enabled = true;
    },

    onOpenPage : function() {
        var editor = Editors.currentEditor && Editors.currentEditor.amlEditor
            ? Editors.currentEditor.amlEditor : null;
        if (!editor)
            return;
        var file = editor.$model.data;
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