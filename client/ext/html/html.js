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
var markup = require("text!ext/html/html.xml");

var previewExtensions = [
    "htm", "html", "xhtml",
    "conf", "log", "text", "txt",
    "xml", "xsl"
];

module.exports = ext.register("ext/html/html", {
    name  : "HTML Editor",
    dev   : "Ajax.org",
    type  : ext.GENERAL,
    alone : true,
    deps  : [code],
    markup: markup,
    nodes : [],

    hook : function(){
        var _self = this;
        tabEditors.addEventListener("afterswitch", function(e){
            _self.afterSwitchOrOpen(e.nextPage);
        });
        ide.addEventListener("afteropenfile", function(e){
            // Only listen for event from editors.js
            if (e.editor && e.node.$model)
                _self.afterSwitchOrOpen(e.node);
        });
        ide.addEventListener("updatefile", function(e) {
            var page = tabEditors.getPage(e.newPath);
            if (!page || !page.$active)
                return;
            _self.afterSwitchOrOpen(page);
        });
    },

    afterSwitchOrOpen : function(node) {
        var name = node.$model.data.getAttribute("name");
        var fileExtension = name.split(".").pop();

        if (previewExtensions.indexOf(fileExtension) > -1) {
            ext.initExtension(this);
            this.page = node;
            this.enable();
        }
        else {
            this.disable();
        }
    },

    init : function() {
        //Append the button bar to the main toolbar
        var nodes = barHtmlMode.childNodes;
        var node;
        for (var i = nodes.length - 1; i >= 0; i--) {
            node = barTools.appendChild(nodes[0]);
            if (node.nodeType != 1) {
                continue;
            }
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
