/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var editors = require("ext/editors/editors");
var settings = require("ext/settings/settings");
var markup = require("text!ext/themes/settings.xml");

module.exports = ext.register("ext/themes/themes", {
    name    : "Themes",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    nodes   : [],
    //markup  : markup,

    register : function(themes){
        this.themeXml = "<data>";
        for (var name in themes)
            this.themeXml += '<item value="' + themes[name] + '" caption="' + name + '"></item>';

        this.themeXml += "</data>";
    },
    
    selectTheme : function() {
        this.set(lstThemes.selected.getAttribute("value"));
    },
    
    winThemesHide : function() {
        this.winThemesTimer = setTimeout(function() {
            winThemesList.hide();
            lblThemes.setAttribute("class", "lblSyntaxHl");
        }, 100);
    },

    winThemesToggle : function(el) {
        if(winThemesList.visible) {
            this.winThemesHide();
        }
        else {
            if (this.winThemesTimer)
                clearTimeout(this.winThemesTimer);
            var pos = apf.getAbsolutePosition(lblThemes.$ext);
            winThemesList.setAttribute("top", pos[1] - (winThemesList.getAttribute("height") / 2));
            winThemesList.setAttribute("left", pos[0] + lblSyntaxHl.getWidth());
            winThemesList.show();
            el.setAttribute("class", "lblSyntaxHl hover");
        }
    },

    set : function(path){
        //Save theme settings
        settings.model.setQueryValue("editors/code/@theme", path);
        settings.save();
    },
    
    hook : function() {
        var _self = this;
        ide.addEventListener("init.ext/code/code", function() {
            apf.document.body.insertMarkup(markup);
            mdlThemes.load(apf.getXml(_self.themeXml.replace(/&/g, "&amp;")));
            
            winThemesList.$ext.addEventListener("mouseover", function(e) {
                if (_self.winThemesTimer)
                    clearTimeout(_self.winThemesTimer);
            });
            
            winThemesList.$ext.addEventListener("mouseout", function(e) {
                _self.winThemesHide();
            });

            var paren = lblSyntaxHl.parentNode;
            paren.insertBefore(new apf.label({
                id : "lblThemes",
                "class" : "lblSyntaxHl",
                margin : "0 0 4 0",
                onmouseover : function() {
                    _self.winThemesToggle(this);
                },
                onmouseout : function() {
                    _self.winThemesToggle(this);
                },
                caption : "Themes"
            }), paren.childNodes[1]);
        });
        ext.initExtension(this);
    },

    init : function(){
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});