/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");

var ta = {"INPUT":1, "TEXTAREA":1, "SELECT":1, "EMBED":1, "OBJECT":1};

module.exports = ext.register("ext/undo/undo", {
    dev    : "Ajax.org",
    name   : "Undo",
    alone  : true,
    type   : ext.GENERAL,

    nodes : [],

    init : function(amlNode){
        var _self = this;
        
//        commands.addCommand({
//            name: "undo",
//            hint: "undo one edit step in the active document",
//            bindKey: {mac: "Command-Z", win: "Ctrl-Z"},
//            exec: function () {
//                return _self.undo();
//            }
//        });
//        
//        commands.addCommand({
//            name: "redo",
//            hint: "redo one edit step in the active document",
//            bindKey: {mac: "Shift-Command-Z", win: "Ctrl-Y"},
//            exec: function () {
//                return _self.redo();
//            }
//        });
        
        menus.addItemByPath("Edit/Undo", new apf.item({
            command : "undo",
        }), 100);
        menus.addItemByPath("Edit/Redo", new apf.item({
            command : "redo"
        }), 200);
    },

    undo: function() {
        if (document.activeElement && ta[document.activeElement.tagName])
            return false;
        
        if (apf.isChildOf(tabEditors, apf.activeElement, true)) {
            var _tabPage;
            if(_tabPage = tabEditors.getPage())
                _tabPage.$at.undo();
        }
        else if (apf.activeElement == self.trFiles) {
            //@todo the way undo is implemented doesn't work right now
            //trFiles.getActionTracker().undo();
        }
    },

    redo: function() {
        if (document.activeElement && ta[document.activeElement.tagName])
            return false;
        
        if (apf.isChildOf(tabEditors, apf.activeElement, true)) {
            var _tabPage;
            if(_tabPage = tabEditors.getPage())
                _tabPage.$at.redo();
        }
        else if (apf.activeElement == self.trFiles) {
            //@todo the way undo is implemented doesn't work right now
            //trFiles.getActionTracker().redo();
        }
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
        menus.remove("Edit/Undo");
        menus.remove("Edit/Redo");
        
        //commands.removeCommandsByName(["undo", "redo"]);
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
