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

    init : function(amlNode){
        menus.addItemByPath("Edit/Undo", new ppc.item({
            command : "undo",
        }), 100);
        menus.addItemByPath("Edit/Redo", new ppc.item({
            command : "redo"
        }), 200);
    },

    undo: function() {
        if (document.activeElement && ta[document.activeElement.tagName])
            return false;

        if (ppc.isChildOf(tabEditors, ppc.activeElement, true)) {
            var _tabPage;
            if(_tabPage = ide.getActivePage())
                _tabPage.$at.undo();
        }
        else if (ppc.activeElement == self.trFiles) {
            //@todo the way undo is implemented doesn't work right now
            //trFiles.getActionTracker().undo();
        }
    },

    redo: function() {
        if (document.activeElement && ta[document.activeElement.tagName])
            return false;

        if (ppc.isChildOf(tabEditors, ppc.activeElement, true)) {
            var _tabPage;
            if(_tabPage = ide.getActivePage())
                _tabPage.$at.redo();
        }
        else if (ppc.activeElement == self.trFiles) {
            //@todo the way undo is implemented doesn't work right now
            //trFiles.getActionTracker().redo();
        }
    },

    destroy : function(){
        menus.remove("Edit/Undo");
        menus.remove("Edit/Redo");
        this.$destroy();
    }
});

});
