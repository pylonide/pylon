/**
 * Print code extension for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */


// print line numbers
// selection
// create print theme
// color, b/w

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var printTheme = require("ace/theme/textmate");
var highlighter = require("ace/ext/static_highlight");
        
module.exports = ext.register("ext/formatjson/formatjson", {
    name     : "Print source code",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    commands  : {
        "print": {hint: "Print the current file"}
    },
    hotitems : {},
    
    nodes : [],
    
    print : function() {
        var editor = editors.currentEditor;
        
        // TODO print images
        if (!editor.ceEditor)
            return;

        var ace = editors.currentEditor.ceEditor.$editor;
        var session = ace.getSession();
        
        var highlighted = highlighter.render(session, null, printTheme);
        
        var win = window.open();
        win.document.documentElement.innerHTML = '<html><body>\n\
<style type="text/css" media="screen">\n\
    :css:\n\
</style>\n\
:html:\n\
</body></html>'.replace(":css:", highlighted.css).replace(":html:", highlighted.html);
        win.focus();
//        win.print();
//        win.close();
    },
    
    hook : function(){
        var _self = this;
        this.nodes.push(
            ide.mnuFile.appendChild(new apf.item({
                caption : "Print",
                onclick : function(){
                    ext.initExtension(_self);
                    _self.print();
                }
            }))
        );
        
        this.hotitems["print"] = [this.nodes[0]];
    },
    
    init : function(amlNode){
    },
    
    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },
    
    disable : function(){
        this.nodes.each(function(item){
            item.disable();
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