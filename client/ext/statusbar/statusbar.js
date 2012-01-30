/**
 * The editor status bar for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var editors = require("ext/editors/editors");
var settings = require("ext/settings/settings");
var markup = require("text!ext/statusbar/statusbar.xml");
var skin = require("text!ext/statusbar/skin.xml");

module.exports = ext.register("ext/statusbar/statusbar", {
    name     : "Status bar",
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    markup   : markup,
    skin     : {
        id   : "statusbar",
        data : skin,
        "media-path" : ide.staticPrefix + "/style/images/",
        "icon-path"  : ide.staticPrefix + "/style/icons/"
    },
    expanded: false,
    nodes : [],

    hook : function(){
        var _self = this;
        ide.addEventListener("openfile", function() {
            setTimeout(function() {
                ext.initExtension(_self);
            }, 1000);
        });

        ide.addEventListener("loadsettings", function(e){
//            var strSettings = e.model.queryValue("auto/zen");
//            if (strSettings)
//                _self.initialWidth = strSettings;
        });

        ide.addEventListener("savesettings", function(e){
//            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/statusbar/text()");
//            xmlSettings.nodeValue = _self.initialWidth;
            return true;
        });
    },

    init : function(amlNode){
        var editor = editors.currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.parentNode.appendChild(barIdeStatus);
            
        // @TODO adjust position based on scrollbar width
        if (!(apf.isChrome && apf.versionChrome >= 14) && !(apf.isSafari && apf.versionSafari >= 5))
            barIdeStatus.setAttribute("right", "32");

        if (apf.isWin)
            barIdeStatus.setAttribute("right", "34");
            
        hboxStatusBarSettings.$ext.style.overflow = "hidden";
    },
    toggleStatusBar: function(){
        if(this.expanded) {
            this.expanded = false;
            apf.setStyleClass(barIdeStatus.$ext, '', ["expanded"]);
            apf.tween.single(hboxStatusBarSettings.$ext, {
                type  : "width",
                anim  : apf.tween.easeOutQuint,
                from  : 49,
                to    : 0,
                steps : 8,
                interval : 5,
                onfinish : function(){
                    hboxStatusBarSettings.hide();
                },
                oneach : function(){}
            });
        }
        else {
            this.expanded = true;
            apf.setStyleClass(barIdeStatus.$ext, "expanded");
            hboxStatusBarSettings.show();
            apf.tween.single(hboxStatusBarSettings.$ext, {
                type  : "width",
                anim  : apf.tween.easeOutQuint,
                from  : 0,
                to    : 49,
                steps : 8,
                interval : 5,
                onfinish : function(){
                    
                },
                oneach : function(){}
            });
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
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
