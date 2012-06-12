/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var fs = require("ext/filesystem/filesystem");
var css = require("text!ext/dashboard/dashboard.css");
var menus = require("ext/menus/menus");
var markup = require("text!ext/dashboard/dashboard.xml");
var commands = require("ext/commands/commands");

module.exports = ext.register("ext/dashboard/dashboard", {
    dev         : "Ajax.org",
    name        : "Dashboard",
    alone       : true,
    type        : ext.GENERAL,
    markup      : markup,
    css         : css,
    deps        : [fs],
    offline     : true,

    nodes       : [],
    saveBuffer  : {},
/*
    hook : function(){
        
    },
*/
    init : function(amlNode){
        apf.importCssString(this.css || "");

        dashboard.show();
    },

    enable : function(){
  
    },

    disable : function(){
  
    },

    destroy : function(){
        
    }
});

});
