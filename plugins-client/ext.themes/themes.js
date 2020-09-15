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

require("ext/editors/editors");

module.exports = ext.register("ext/themes/themes", {
    name    : "Themes",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    nodes   : [],
    
    defaultTheme : "ace/theme/textmate", //Default Theme
    currTheme    : "",
    activeTheme  : null,
    saved        : false,

    register : function(themes){
        var _self = this;
        
        var timer;
        
        function themeMenuCreator(name, path) {
            menus.addItemByPath("View/Themes/" + name, new ppc.item({
                type    : "radio",
                value   : path || themes[name],
                
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
                },

                onclick : function(e) {
                    var path = e.currentTarget.value;
                    _self.set(path);
                    ide.dispatchEvent("track_action", {type: "theme change", theme: path});
                }
            }));
        }
        
        for (var name in themes) {
            if (themes[name] instanceof Array) {
                menus.addItemByPath("View/Themes/" + name, new ppc.item());
                themes[name].forEach(function (n) {
                    var themeprop = Object.keys(n)[0];
                    themeMenuCreator(name + "/" + themeprop, n[themeprop]);
                });
            }
            else {
                themeMenuCreator(name);
            }
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
        var theme;
        
        try{
            theme = require(path);
        }
        catch(e){
            return setTimeout(function(){
                _self.setThemedGUI(path);
            }, 10);
        }
        
        // fixes a problem with Ace architect loading /lib/ace, 
        // creating a conflict with themes
        if (theme.isDark === undefined) {
            return setTimeout(function(){
                _self.setThemedGUI(path);
            }, 10);
        }

        this.activeTheme = theme;
        
        this.isDark = theme.isDark;
        
        
        var editorDiv = hboxMain.$ext;
        var editorHolder = tabEditors.parentNode.$ext;
        var tabsDiv = tabEditors.$buttons.parentNode.parentNode;
        
        editorDiv.setAttribute("id", "editorDiv");
        tabsDiv.setAttribute("id", "tabsDiv");
        
        if (theme.isDark) {
            ppc.setStyleClass(editorDiv, "dark");
            ppc.setStyleClass(editorHolder, "dark");
            if (!ppc.isGecko) 
                ppc.setStyleClass(tabsDiv, "dark");
        }
        else {
            ppc.setStyleClass(editorDiv, "", ["dark"]);
            ppc.setStyleClass(editorHolder, "", ["dark"]);
            ppc.setStyleClass(tabsDiv, "", ["dark"]);
        }
        
        // !important puting ace into more divs with theme.cssClass makes it slower
        var aceClass = theme.cssClass;
        var cssClass = aceClass.replace(/^ace/, "c9");
        
        if (_self.lastTheme) {
            ppc.setStyleClass(editorDiv, "", [_self.lastTheme]);
            ppc.setStyleClass(editorHolder, "", [_self.lastTheme]);
            ppc.setStyleClass(tabsDiv, "", [_self.lastTheme]);
        }
        
        _self.lastTheme = cssClass;
        
        ppc.setStyleClass(editorDiv, cssClass);
        ppc.setStyleClass(editorHolder, cssClass);
        ppc.setStyleClass(tabsDiv, cssClass);
        
        if (!theme.bg) {
            theme.bg = ppc.getStyleRule("." + aceClass + " .ace_gutter", "backgroundColor");
            theme.fg = ppc.getStyleRule("." + aceClass + " .ace_gutter", "color");
            theme.textBg = ppc.getStyleRule("." + aceClass, "backgroundColor") ||
                ppc.getStyleRule("." + aceClass + ", ." + aceClass + " .ace_scroller", "backgroundColor");
        }
        
        ide.dispatchEvent("theme.change", {theme: theme, path: path});
        
        if (_self.loaded[path])
            return;
            
        _self.loaded[path] = true;
        
        if (theme.textBg == "rgb(255, 255, 255)")
            theme.textBg = "#fbfbfb";
                
        ppc.importStylesheet([
            (ppc.isGecko ? [] : 
                ["#tabsDiv." + cssClass + " .curbtn .tab_middle",
                 (theme.isDark  ? "color:rgba(255, 255, 255, 0.8)" : "") 
                 + ";background-color: " + theme.bg + " !important"]),
            ["#editorDiv." + cssClass + " > .basic, "
             + "#editorDiv." + cssClass + " > .vsplitbox, "
             + "#tabsDiv." + cssClass + ", " // > .editor_tab
             + "." + cssClass + " .c9terminal, "
             + "." + cssClass + " .codeditorHolder, "
             + "." + cssClass + " .winGoToFile, "
             + "." + cssClass + " .revisionsBar .topbar, "
             + "." + cssClass + " .revisionsBar .revisionsHolder, "
             + "." + cssClass + " .code_complete_text_holder, "
             + "." + cssClass + " .session_page," 
             + "." + aceClass,
             "color:" + theme.fg + " !important; background-color: " + theme.bg + " !important"],
            ["." + cssClass + " .searchresults > div > span, "
             + "." + cssClass + ".dark .revisions-list .revision, "
             + "." + cssClass + ".dark .cc_complete_option, "
             + "." + cssClass + " .searchresults > div",
             (theme.isDark  ? "color:rgba(255, 255, 255, 0.8)" : "color:" + theme.fg + ";")],
            // TODO find a better way to handle editor corner
            ["." + aceClass + " .ace_scroller",
             "color:" + theme.fg + " !important; background-color: " + theme.textBg + " !important"]
             
        ], self, _self.stylesheet);

        ide.dispatchEvent("theme.init", {theme: theme, path: path});
    },

    init : function(){
        var _self = this;
        
        this.stylesheet = ppc.createStylesheet();
        
        this.nodes.push(
            this.group = new ppc.group()
        );
        
        var mnuThemes = menus.addItemByPath("View/Themes/", new ppc.menu({
            "onprop.visible" : function(e){
                if (e.value) {
                    mnuThemes.select(null, 
                      settings.model.queryValue("editors/code/@theme") 
                        || _self.defaultTheme);
                }
            }
        }), 350000);

        ide.addEventListener("init.ext/code/code", function(e) {
            if (e.ext.amlEditor && e.ext.amlEditor.$editor)
                mnuThemes.select(null, _self.defaultTheme);
        });
        
        ide.addEventListener("settings.load", function(e){
            var theme = _self.currTheme = e.model.queryValue("editors/code/@theme")
                || _self.defaultTheme;
            
            _self.setThemedGUI(theme);
        });
    },

    getActiveTheme : function() {
        return this.activeTheme;
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
