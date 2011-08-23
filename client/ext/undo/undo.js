/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
 
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
        this.nodes.push(
            mnuEdit.appendChild(new apf.item({
                caption : "Undo",
                onclick : this.undo
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Redo",
                onclick : this.redo
            }))
        );

        this.hotitems = {
            "undo" : [this.nodes[0]],
            "redo" : [this.nodes[1]]
        };
    },

    undo: function() {
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
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});