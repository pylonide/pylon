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
    skin    : {
        id   : "prefs",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/settings/images/"
    },
    
    defaultWidth : 250,
    
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
            settings.save();
    },

    addSection : function(tagName, name, xpath, cbCommit){
        var node = this.model.queryNode(xpath + "/" + tagName);
        if (!node)
            this.model.appendXml('<' + tagName + ' name="' + name +'" />', xpath);
    },

    hook : function(){
        panels.register(this, {
            position : 100000,
            caption: "Preferences",
            "class": "preferences"
        });
        
        //Backwards compatible
        this.model = settings.model;
    },
    
    headings : {},
    getHeading : function(name){
        if (this.headings[name])
            return this.headings[name];
        
        var heading = barSettings.appendChild(new apf.bar({
            skin: "basic"
        }));
        heading.$int.innerHTML = '<div class="header"><span></span><div>' 
            + name + '</div></div>';
        
        this.headings[name] = heading;
        
        return heading;
    },

    init : function(amlNode){
        this.panel = winSettings;

        colLeft.appendChild(winSettings);
        
        this.getHeading("General");
        
        this.nodes.push(winSettings);
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
        
        panels.unregister(this);
    }
});

});
