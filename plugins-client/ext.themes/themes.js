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
        
        var timer;
        
        for (var name in themes) {
            menus.addItemByPath("View/Themes/" + name, new apf.item({
                type    : "radio",
                value   : themes[name],
                
                onmouseover: function(e) {
                    var value = this.value;
                    
                    clearTimeout(timer);
                    timer = setTimeout(function(){
                        _self.set(value, true);
                    }, 200);
                },
                
                onmouseout: function(e) {
                    clearTimeout(timer);
                    
                    if (!_self.saved) {
                        timer = setTimeout(function(){
                            _self.set(_self.currTheme);
                        }, 200);
                    }
                }
            }));
        }
        
        this.themes = themes;
    },

    set : function(path, preview){
        settings.model.setQueryValue("editors/code/@theme", path);
        
        this.setThemedGUI(path);
        
        this.saved = !preview;
        if (!preview)
            this.currTheme = path;
    },
    
    loaded : {},
    setThemedGUI : function(path){
        var _self = this;
        
        try{
            var theme = require(path);
        }
        catch(e){
            return setTimeout(function(){
                _self.setThemedGUI(path);
            }, 10);
        }
        
        ide.dispatchEvent("theme.change", {theme: theme, path: path});
        
        var div = hboxMain.$ext;
        
        if (theme.isDark)
            apf.setStyleClass(div, "dark");
        else
            apf.setStyleClass(div, "", ["dark"]);
        
        var cssClass = theme.cssClass;
        
        if (_self.lastTheme)
            apf.setStyleClass(div, "", [_self.lastTheme]);
        
        apf.setStyleClass(div, _self.lastTheme = cssClass);
        
        if (_self.loaded[path])
            return;
            
        _self.loaded[path] = true;
        
        var bg = apf.getStyleRule("." + cssClass + " .ace_gutter", "background-color");
        var fg = apf.getStyleRule("." + cssClass + " .ace_gutter", "color");
        
        apf.importStylesheet([
            ["." + cssClass + " .ace_editor",
             "border: 0 !important;"],
            ["body." + cssClass + " > .vbox, "
             + "." + cssClass + " .editor_tab .curbtn .tab_middle, "
             + "." + cssClass + " .codeditorHolder, "
             + "." + cssClass + " .session_page", 
             "color:" + fg + " !important; background-color: " + bg + " !important"],
            ["." + cssClass + " .ace_corner", 
             "border-color:" + bg + " !important; box-shadow: 4px 4px 0px " 
             + bg + " inset !important;"]
        ], self, _self.stylesheet);
        
        ide.dispatchEvent("theme.init", {theme: theme, path: path});
    },

    init : function(){
        var _self = this;
        
        this.stylesheet = apf.createStylesheet();
        
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
                var path = e.relatedNode.value;
                _self.set(path);
                ide.dispatchEvent("track_action", {type: "theme change", theme: path});
            }
        }), 350000);

        ide.addEventListener("init.ext/code/code", function() {
            if (ceEditor && ceEditor.$editor)
                mnuThemes.select(null, _self.defaultTheme);
        });
        
        ide.addEventListener("settings.load", function(e){
            var theme = _self.currTheme = e.model.queryValue("editors/code/@theme")
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
