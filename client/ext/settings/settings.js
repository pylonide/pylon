/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/settings/settings.xml");
var panels = require("ext/panels/panels");
var skin = require("text!ext/settings/skin.xml");
var settings = require("core/settings");

module.exports = ext.register("ext/settings/settings", {
    name    : "Preferences",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    skin    : skin,
    commands : {
        "showsettings": {hint: "open the settings window"}
    },
    hotitems: {},

    nodes : [],

    //Backwards compatible
    save : function() {
        settings.save();
    },

    saveSettingsPanel: function() {
        var pages   = self.pgSettings ? pgSettings.getPages() : [],
            i       = 0,
            l       = pages.length,
            changed = false;
        for (; i < l; ++i) {
            if (!pages[i].$at) continue;
            if (pages[i].$at.undolength > 0) {
                pages[i].$commit(pages[i]);
                changed = true;
            }
        }
        if (ide.dispatchEvent("savesettings", {
            model : this.model
        }) !== false || changed)
            this.saveToFile();
    },

    addSection : function(tagName, name, xpath, cbCommit){
        var node = this.model.queryNode(xpath + "/" + tagName);
        if (!node)
            this.model.appendXml('<' + tagName + ' name="' + name +'" />', xpath);
    },

    hook : function(){
        panels.register(this);
        
        var btn = this.button = navbar.insertBefore(new apf.button({
            skin    : "mnubtn",
            state   : true,
            "class" : "preferences",
            caption : "Preferences"
        }), navbar.lastChild.previousSibling);

        btn.addEventListener("mousedown", function(e){
            var value = this.value;
            if (navbar.current && (navbar.current != _self || value)) {
                navbar.current.disable(navbar.current == _self);
                if (value)
                    return;
            }

            panels.initPanel(_self);
            _self.enable(true);
        });
        
        //Backwards compatible
        this.model = settings.model;
    },

    init : function(amlNode){
        this.panel = winSettings;

        colLeft.appendChild(winSettings);
    },

    showsettings: function(e){
        panels.initPanel(this);
        this.enable();
        return false;
    },

    saveSettings: function() {
        winSettings.hide();
        this.saveSettingsPanel();
    },

    applySettings: function() {
        this.saveSettingsPanel();
    },

    cancelSettings: function() {
        winSettings.hide();
        var pages = pgSettings.getPages(),
            i     = 0,
            l     = pages.length;
        for (; i < l; ++i) {
            if (!pages[i].$at) continue;
            pages[i].$at.undo(-1);
        }
    },

    enable : function(noButton){
        winSettings.show();
        winSettings.parentNode.setWidth(this.$lastWidth || 250);
        
        colLeft.show();
        if (!noButton) {
            this.button.setValue(true);
            if(navbar.current && (navbar.current != this))
                navbar.current.disable(false);
        }
        splitterPanelLeft.show();
        navbar.current = this;
    },

    disable : function(noButton){
        if (self.winSettings) {
            this.$lastWidth = winFilesViewer.parentNode.width;
            winSettings.hide();
        }
        if (!noButton)
            this.button.setValue(false);

        splitterPanelLeft.hide();
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
