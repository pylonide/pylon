/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*global winBlockGotoFile tabEditors */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var markup = require("text!ext/gotofile/gotofile-generic.xml");

module.exports = ext.register("ext/gotofile/gotofile", (function () {
    var _self = this;
    
    this.name = "Go To File";
    this.dev = "Ajax.org";
    this.alone = true;
    this.offline = false;
    this.type = ext.GENERAL;
    this.markup = markup;
    this.autodisable = ext.ONLINE | ext.LOCAL;
    
    this.nodes = [];
    
    this.hook = function () {
        var mnuItem = new apf.item({
            command : "gotofile"
        });

        commands.addCommand({
            name: "gotofile",
            hint: "search for a filename and jump to it",
            bindKey: {mac: "Command-E", win: "Ctrl-E"},
            exec: function () {
                ext.initExtension(_self);
                winBlockGotoFile.show();
            }
        });

        this.nodes.push(
            menus.addItemByPath("File/Open...", mnuItem, 500),
            menus.addItemByPath("Goto/Goto File...", mnuItem.cloneNode(false), 100),
            winBlockGotoFile
        );

        ide.addEventListener("init.ext/editors/editors", function(){
            _self.markupInsertionPoint = tabEditors;
        });
    };
    
    this.init = function () {
    };

    this.enable = function(){
        this.nodes.each(function(item){
            if (item.enable)
                item.enable();
        });
    };

    this.disable = function(){
        this.nodes.each(function(item){
            if (item.disable)
                item.disable();
        });
    },

    this.destroy = function(){
        commands.removeCommandByName("gotofile");

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    };
}()));

});