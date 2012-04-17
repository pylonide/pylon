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
var panelSettings =  require("text!ext/panels/settings.xml");

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
        "show": {hint: "show the settings panel"}
    },
    hotitems : {},

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
        
        this.hotitems.show = [this.mnuItem];
        
        //Backwards compatible
        this.model = settings.model;
        this.setDefaults = settings.setDefaults;
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
        
        this.nodes.push(winSettings);
        
        // this has to be done out here for some reason
        this.addSettings("General",  panelSettings );
    },

    addSettings : function(group, markup) {
        var _self = this;
        ide.addEventListener("init.ext/settings/settings", function(e) {
            var heading = e.ext.getHeading(group);
            var last    = heading.lastChild;
            
            heading.insertMarkup(markup);
            
            if (!heading.$map)
                heading.$map = {};
            
            var nodes = [];
            
            if (!last) {
                last = heading.firstChild
                nodes.push(last);
            }
            while (!last) {
                nodes.push(last = last.nextSibling);
            }
            
            if (nodes.length == 0) {
                nodes = heading.childNodes;
            }

            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType == 1 && nodes[i].position) {
                    heading.$map[nodes[i].position] = nodes[i];
                    nextSibling = findNextSibling(nodes[i], heading);
                    if (nextSibling !== undefined && nodes[i].nextSibling != nextSibling) 
                        heading.insertBefore(nodes[i], nextSibling);
                }
            }
            
            function findNextSibling(node, heading){
                var map = heading.$map, beforeNode, diff = 1000000;
                for (var pos in map) {
                    var d = pos - node.position;
                    if (d > 0 && d < diff) {
                        beforeNode = heading.$map[pos];
                        diff = d;
                    }
                }
                return beforeNode;
            }
        });
        
        /*ide.addEventListener("init.ext/settings/settings", function(e) {
            var heading = e.ext.getHeading(group);
            var newGroup = (_self.headings[group].childNodes.length == 0);
            heading.insertMarkup(content || content.markup, {
                callback : function(inserted) {
                    if (!newGroup) {
                        _self.headings[group].childNodes.sort(function compare(a,b) {
                            if (typeof a.getAttribute === 'function' && typeof b.getAttribute === 'function') { // commented XML code doesn't have function, comes back as [#comment Node]
                                if (a.getAttribute("position") < b.getAttribute("position")) {
                                    return -1;
                                }
                                else if (a.getAttribute("position") > b.getAttribute("position")) {
                                    return 1;
                                }
                                else {
                                    return 0;
                                }
                            }
                        });
                    }
                }
            });
        });*/
    },
        
    show : function(e) {
        if (!this.panel || !this.panel.visible) {
            panels.activate(this);
            this.enable();
        }
        else {
            panels.deactivate(null, true);
        }
        
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
