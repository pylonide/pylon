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

module.exports = ext.register("ext/undo/undo", {
    dev    : "Ajax.org",
    name   : "Undo",
    alone  : true,
    type   : ext.GENERAL,
    commands: {
        "undo": {hint: "undo one edit step in the active document"},
        "redo": {hint: "redo one edit step in the active document"}
    },

    nodes : [],

    init : function(amlNode){
        var mnuItemUndo = menus.addItemByPath("Edit/Undo", new apf.item({
            onclick : this.undo
        }), 100);
        var mnuItemRedo = menus.addItemByPath("Edit/Redo", new apf.item({
            onclick : this.redo
        }), 200);

        this.hotitems = {
            "undo" : [mnuItemUndo],
            "redo" : [mnuItemRedo]
        };
    },

    undo: function() {
        alert(apf.activeElement);
        var _tabPage;
        if(_tabPage = tabEditors.getPage())
            _tabPage.$at.undo();
    },

    redo: function() {
        var _tabPage;
        if(_tabPage = tabEditors.getPage())
            _tabPage.$at.redo();
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
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});