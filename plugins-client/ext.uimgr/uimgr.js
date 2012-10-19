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
        this.loadSkins();
    },

    init : function(amlNode){
        // Save the manually-loaded extensions
        var _self = this;
        apf.importCssString(this.css || "");
        
    },

    show : function(){
        document.getElementsByTagName("body")[0].innerHTML = "";
        ext.initExtension(this);

        var skins = {
            defaultSkinset: {
                name: "",
                skinset: "",
                elements: {
                    bar: {
                        content: "",
                        localName: "",
                        onDark: false,
                        type: "",
                        wrapper: ""
                    }
                }
            }
        };
        
        for (var skinset in skins) {
            for (var skin in skins[skinset].elements) {
                switch (skin) {
                    case "bar":
                        
                        break;
                }
                console.log( skin, skins[skinset].elements[skin] );
            }
        }
        
        
        winUIExt.show()
    },
    hide : function(){
        ext.initExtension(this);
        winUIExt.hide()
    },
    
    loadSkins: function() {
        var includeSkins = ["searchinfiles", "statusbar", "zen", "quicksearch"];
        
        for(var i = 0; i < includeSkins.length; i++) {
            var includeSkin = includeSkins[i];
            
            var skinData = require("text!ext/" + includeSkin + "/skin.xml");
            var skinNode = new apf.skin(apf.extend({}, {id: includeSkin, data: skinData, "media-path": ide.staticPrefix + "/ext/" + includeSkin + "/images/"}, {data: null}));
            skinNode.setProperty("src", skinData);
            apf.document.documentElement.appendChild(skinNode);
        }
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
