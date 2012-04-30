/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var settings = require("ext/settings/settings");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/themes/themes", {
    name    : "Themes",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    nodes   : [],
    
    defaultTheme : "ace/theme/textmate", //Default Theme
    currTheme : "", 
    saved   : false,

    register : function(themes){
        var _self = this;
        
        for (var name in themes) {
            menus.addItemByPath("View/Themes/" + name, new apf.item({
                type    : "radio",
                value   : themes[name],
                //group   : this.group
                
                onmouseover: function(e) {
                    //_self.currTheme = settings.model.queryValue("editors/code/@theme");
                    //settings.model.setQueryValue("editors/code/@theme", this.value);
                    _self.set(this.value);
                    _self.saved = false;
                },
                
                onmouseout: function(e) {
                    if (!_self.saved) {
                        settings.model.setQueryValue("editors/code/@theme", _self.currTheme);
                        _self.saved = false;
                    }
                }
            }));
        }
        
        this.themes = themes;
    },

    set : function(path){
        settings.model.setQueryValue("editors/code/@theme", path);
        this.setThemedGUI(path);
        
        ide.dispatchEvent("theme_change", {theme: path});
        
        this.saved = true;
        ide.dispatchEvent("track_action", {type: "theme change", theme: path});
    },
    
    setThemedGUI : function(path){
        var _self = this;

        require(["require", path], function (require, theme) {
            if (theme.isDark)
                apf.setStyleClass(document.body, "dark");
            else
                apf.setStyleClass(document.body, "", ["dark"]);
            
            var cssClass = theme.cssClass;
            
            var bg = apf.getStyleRule("." + cssClass + " .ace_gutter", "background-color");
            var fg = apf.getStyleRule("." + cssClass + " .ace_gutter", "color");
            
            if (_self.stylesheet) {
                //_self.stylesheet.disabled = true;
                _self.stylesheet.ownerNode.parentNode.removeChild(
                    _self.stylesheet.ownerNode);
            }
            
            _self.stylesheet = apf.createStylesheet();
        
            apf.importStylesheet([
                ["body > .vbox, .editor_tab .curbtn .tab_middle, .codeditorHolder, .session_page, .ace_gutter", 
                 "color:" + fg + " !important; background-color: " + bg + " !important"],
                [".ace_corner", 
                 "border-color:" + bg + " !important; box-shadow: 4px 4px 0px " 
                 + bg + " inset !important;"],
                [".editor_bg", "display: none"]
            ], self, _self.stylesheet);
            
//            apf.setStyleRule(
//                "body > .vbox, .editor_tab .curbtn .tab_middle, .codeditorHolder, .session_page, .ace_gutter", 
//                "color", fg + " !important", _self.stylesheet, self);
//            apf.setStyleRule(
//                "body > .vbox, .editor_tab .curbtn .tab_middle, .codeditorHolder, .session_page, .ace_gutter", 
//                "background-color", bg + " !important", _self.stylesheet, self);
//            
//            apf.setStyleRule(
//                ".ace_corner", 
//                "border-color", bg + " !important", _self.stylesheet, self);
//            apf.setStyleRule(
//                ".ace_corner", 
//                "box-shadow", "4px 4px 0px " + bg + " inset !important;", _self.stylesheet, self);
//            
//            apf.setStyleRule(
//                ".editor_bg", 
//                "display", "none", _self.stylesheet, self);
        });
    },

    init : function(){
        var _self = this;
        
        this.nodes.push(
            this.group = new apf.group()
        );
        
        var mnuThemes = menus.addItemByPath("View/Themes/", new apf.menu({
            "onprop.visible" : function(e){
                if (e.value) {
                    mnuThemes.select(null, 
                      settings.model.queryValue("editors/code/@theme") 
                        || _self.defaultTheme);
                }
            },
            "onitemclick" : function(e){
                _self.set(e.relatedNode.value);
            }
        }), 350000);

        ide.addEventListener("init.ext/code/code", function() {
            if (ceEditor && ceEditor.$editor)
                mnuThemes.select(null, _self.defaultTheme);
        });
        
        ide.addEventListener("settings.load", function(e){
            var theme = e.model.queryValue("editors/code/@theme")
                || _self.defaultTheme;
            
            _self.setThemedGUI(theme);
        });
    },
    
    enable : function(){
        menus.enableItem("View/Themes");
    },

    disable : function(){
        menus.disableItem("View/Themes");
    },

    destroy : function(){
        menus.remove("View/Themes");
    }
});

});
