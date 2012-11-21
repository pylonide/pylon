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
var menus = require("ext/menus/menus");
var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var markup = require("text!ext/formatjson/formatjson.xml");
var commands = require("ext/commands/commands");

module.exports = ext.register("ext/formatjson/formatjson", {
    name     : "JSON Formatter",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    
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
        
        commands.addCommand({
            name : "formatjson",
            bindKey : {mac: "Shift-Command-J", win: "Ctrl-Shift-J"},
            hint: "reformat the current JSON document",
            isAvailable : function(editor){
                if (editor && editor.amlEditor && editor.amlEditor.$editor.path == "ext/code/code") {
                    var range = editor.amlEditor.$editor.getSelectionRange();
                    return range.start.row == range.end.row 
                      && range.start.column == range.end.column
                }
                return false;
            },
            exec : function(){
                ext.initExtension(_self);
                _self.winFormat.show();
            }
        });
        
        this.nodes.push(
            menus.addItemByPath("Tools/Format JSON", new apf.item({
                command : "formatjson"
            }), 500)
        );
    },
    
    init : function(amlNode){
        this.winFormat = winFormat;
    },
    
    destroy : function(){
        commands.removeCommandByName("formatjson");
        this.winFormat.destroy(true, true);
        this.$destroy();
    }
});

    }
);