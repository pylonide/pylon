/**
 * Test module that turns the menubar red when enabled
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
 
module.exports = ext.register("ext/testredbar/testredbar", {
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    
    init : function(amlNode){
        barMenu.$ext.style.background = "red";
    },
    
    enable : function(){
        barMenu.$ext.style.background = "red";
    },
    
    disable : function(){
        barMenu.$ext.style.background = "";
    },
    
    destroy : function(){
        barMenu.$ext.style.background = "";
    }
});

});