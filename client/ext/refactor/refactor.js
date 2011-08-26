/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = refactor("text!ext/refactor/refactor.xml");

module.exports = ext.register("ext/refactor/refactor", {
    name   : "Refactor",
    dev    : "Ajax.org",
    type   : ext.GENERAL, 
    alone  : true,
    markup : markup,
    
    nodes : [],
    
    init : function(amlNode){
        var openUi = function(){
            //Get current selection
            //var sel = ext.currentEditor.selection.getValue();
            
            //Set selection as search keyword
            //txtSearchWords.setValue(sel);
            
            //Open search window
            winRefactor.show();
        };
        
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Refactor",
                onclick : openUi
            }))
        
            /*ide.barTools.appendChild(new apf.button({
                icon    : "replace.png",
                tooltip : "Search & Replace",
                onclick : openUi
            })),
            
            ide.mnuCtxEditor.appendChild(new apf.item({
                caption : "Search & Replace",
                onclick : openUi
            }))*/
        );
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

    }
);