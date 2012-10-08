/**
 * UI Manager for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var util = require("core/util");
var markup = require("text!ext/uimgr/uimgr.xml");
var panels = require("ext/panels/panels");
var settings = require("ext/settings/settings");
var css  = require("text!ext/uimgr/style/style.css");

/*global dgExt dgExtUser tbModuleName tabuimgr btnUserExtEnable
  btnDefaultExtEnable winExt btnAdd*/

var LOAD_TIMEOUT_REMOTE = 30 * 1000;
var LOAD_TIMEOUT_LOCAL = 5 * 1000;

module.exports = ext.register("ext/uimgr/uimgr", {
    name   : "UI Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    markup : markup,
    css    : css,
    desp   : [panels],
    requireFailed : false,

    nodes : [],

    hook : function(){
        var _self = this;
    },

    init : function(amlNode){
        // Save the manually-loaded extensions
        var _self = this;
        apf.importCssString(this.css || "");
    },

    show : function(){
        ext.initExtension(this);

        winUIExt.show()
    },
    hide : function(){
        ext.initExtension(this);
        winUIExt.hide()
    },

    enable : function(){
        if (!this.disabled) return;

        this.nodes.each(function(item){
            item.enable();
        });
        this.disabled = false;
    },

    disable : function(){
        if (this.disabled) return;

        this.nodes.each(function(item){
            item.disable();
        });
        this.disabled = true;
    },

    destroy : function(){
        menus.remove("Tools/~", 1000000);
        menus.remove("Tools/Extension Manager...");

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
