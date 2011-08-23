/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {
    
var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/browser/browser.xml");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/browser/browser", {
    name    : "Browser View",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    contentTypes : [
        "text/html",
        "application/xhtml+xml"
    ],
    markup  : markup,
    deps    : [editors],

    nodes : [],

    init : function(amlPage){
	var dav_url = location.href.replace(location.hash, '');
        this.brView = amlPage.appendChild(new apf.vbox({
            anchors    : "0 0 0 0",
            childNodes : [new apf.browser({
                src  : "{dav_url + 'workspace/' + [@path]}",
                flex : 1
            })]
        }));

        //Append the button bar to the main toolbar
        var nodes = barBrowserTb.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            this.nodes.push(ide.barTools.appendChild(nodes[0]));
        }
    },

    enable : function() {
        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function() {
        this.nodes.each(function(item){
            item.hide();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });

        if (this.brView)
            this.brView.destroy(true, true);
        barBrowserTb.destroy(true, true);

        this.nodes = [];
    }
});

});