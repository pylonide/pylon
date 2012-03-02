/**
 * Format JSON extension for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var markup = require("text!ext/formatjson/formatjson.xml");
        
module.exports = ext.register("ext/formatjson/formatjson", {
    name     : "JSON Formatter",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    commands  : {
        "format": {hint: "reformat the current JSON document"}
    },
    hotitems : {},
    
    nodes : [],
    
    format : function(indent){
        var editor = editors.currentEditor;

        var sel   = editor.getSelection();
        var doc   = editor.getDocument();
        var range = sel.getRange();
        var value = doc.getTextRange(range);
        try {
            value = JSON.stringify(JSON.parse(value), null, indent);
        }
        catch (e) {
            util.alert(
                "Invalid JSON", 
                "The selection contains an invalid or incomplete JSON string",
                "Please correct the JSON and try again");
            return;
        }
        
        var end = doc.replace(range, value);
        sel.setSelectionRange(Range.fromPoints(range.start, end));
    },
    
    hook : function(){
        var _self = this;
        this.nodes.push(
            ide.mnuEdit.appendChild(new apf.item({
                caption : "Format JSON",
                onclick : function(){
                    ext.initExtension(_self);
                    _self.winFormat.show();
                }
            }))
        );
        
        this.hotitems["format"] = [this.nodes[0]];
    },
    
    init : function(amlNode){
        this.winFormat = winFormat;
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
        this.winFormat.destroy(true, true);
    }
});

    }
);