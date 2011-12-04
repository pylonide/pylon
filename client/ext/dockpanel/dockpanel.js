/**
 * Dock Panel for the Cloud9 IDE client
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var DockableLayout = require("ext/dockpanel/libdock");
var settings = require("ext/settings/settings");

module.exports = ext.register("ext/dockpanel/dockpanel", {
    name           : "Dock Panel",
    dev            : "Ajax.org",
    alone          : true,
    type           : ext.GENERAL,

    defaultState   : {
        bars : []
    },
    defaultSections : {},

    nodes          : [],
    dockpanels     : [],
    sections       : {},
    
    loaded : false,
    
    /**
     * Standard Extension functionality
     */
    init : function(amlNode){
        var _self = this;

        var vManager = new apf.visibilitymanager();
        this.layout = new DockableLayout(hboxDockPanel, 
            //Find Page
            function(arrExtension){
                if (!arrExtension || !_self.dockpanels[arrExtension[0]])
                    return false;

                var item = _self.dockpanels[arrExtension[0]][arrExtension[1]];
                if (item.page)
                    return item.page;

                var page = item.getPage();
                
                if (page)
                    page.$arrExtension = arrExtension;
                
                vManager.permanent(page, function(e){
                    item.mnuItem.check();
                }, function(){
                    item.mnuItem.uncheck();
                });

                return page;
            }, 
            //Store Page
            function(amlPage){
                var arrExtension = amlPage.$arrExtension;
                var item = _self.dockpanels[arrExtension[0]][arrExtension[1]];
                item.page = amlPage;
                
                var section = _self.sections[arrExtension[0]][arrExtension[1]];
                if (!section) { //could this ever happen?
                    _self.sections[arrExtension[0]][arrExtension[1]] = {
                        buttons : [
                            { ext : [arrExtension[0], arrExtension[1]] }
                        ]
                    };
                }
                else {
                    var buttons = section.buttons;
                    for (var i = 0; i < buttons.length; i++) {
                        if (buttons[i].ext[0] == arrExtension[0]
                          && buttons[i].ext[1] == arrExtension[1]) {
                            buttons[i].hidden = true;
                            break;
                        }
                    }
                }

                item.mnuItem.uncheck();

                _self.saveSettings();
            },
            //Find Button Options
            function(arrExtension){
                if (!arrExtension || !_self.dockpanels[arrExtension[0]])
                    return false;

                return _self.dockpanels[arrExtension[0]][arrExtension[1]].options;
            },
            //Change State Handler
            function(){
                _self.saveSettings();
            }
        );

        //@todo was loadsettings
        ide.addEventListener("extload", function(e){
            var model = settings.model;
            var strSettings = model.queryValue("auto/dockpanel/text()");

            var state = _self.defaultState;
            if (strSettings) {
                // JSON parse COULD fail
                try {
                    var objSettings = JSON.parse(strSettings);
                    state = objSettings.state;
                    
                    //@todo this is the wrong type (.hidden is array - should be hash)
                    apf.extend(_self.sections, objSettings.hidden);
                }
                catch (ex) {}
            }
            
            if (!state || !state.type || state.type != 'new_type')
                state = _self.defaultState;

            _self.layout.loadState(state);
            _self.loaded = true;
        });

        mnuToolbar.appendChild(new apf.item({
            caption : "Restore Default",
            onclick : function(){
                var defaultSettings = _self.defaultState,//settings.model.queryValue("auto/dockpanel_default/text()"),
                    state;
                    
                if (defaultSettings) {
                    // JSON parse COULD fail
                    try {
                        _self.loadDefault = true;
                        //var objSettings = JSON.parse(defaultSettings);
                        //apf.extend(_self.sections, objSettings.hidden);
                        _self.sections = JSON.parse(JSON.stringify(_self.defaultSections));
                        state = defaultSettings;//objSettings.state;
                    }
                    catch (ex) {}
                    _self.layout.clearState();
                    _self.layout.loadState(state, true);
                    _self.loadDefault = false;
                    
                    settings.model.setQueryValue("auto/dockpanel/text()", state)
                    
                    _self.saveSettings();
                    
                    if (stProcessRunning.active)
                        _self.showSection(["ext/run/run", "ext/debugger/debugger"], true); 
                }
            }
        }));
        
        mnuToolbar.appendChild(new apf.divider());
    },
    
    saveSettings : function(){
        clearTimeout(this.$timer);
        
        var _self = this;;
        this.$timer = setTimeout(function(){
            settings.model.setQueryValue(
                "auto/dockpanel/text()",
                JSON.stringify({
                    state  : _self.layout.getState(true),
                    hidden : _self.sections
                })
            );
        });
    },

    enable : function(){
        if (this.$lastState)
            this.layout.loadState(this.$lastState);
    },

    disable : function(){
        this.$lastState = this.layout.getState();
        this.layout.clearState();
    },

    destroy : function(){
        this.layout.clearState();
    },

    register : function(name, type, options, getPage){
        var panel = this.dockpanels[name] || (this.dockpanels[name] = {});
        panel[type] = {
            options : options,
            getPage : getPage
        };

        var layout = this.layout, _self = this;

        panel[type].mnuItem = mnuToolbar.appendChild(new apf.item({
            caption : options.menu.split("/").pop(),
            id      : "mnu" + type,
            type    : "check",
            onclick : function(){
                var page = getPage();
                
                var pNode = page && page.parentNode;

                //Problem state might not be removed from 
                if (!pNode || !pNode.dock) {
                    var section = _self.sections[name][type];
                    section.hidden = false;
                    for (var i = 0; i < section.buttons.length; i++) {
                        section.buttons[i].hidden = false;
                    }
                    
                    layout.addItem(section);
                    
                    if (page.parentNode.$ext.offsetWidth)
                        page.parentNode.set(page);
                    else
                        layout.show(page);

                    _self.saveSettings();
                }
                else if (pNode.parentNode && pNode.parentNode.tagName == 'vbox' && pNode.parentNode.expanded){
                    pNode.set(page)
                }
                else {
                    layout.show(page);
                }
            }
        }));        
    },

    addDockable : function(def){        
        /*if (this.loaded) {
            this.layout.addItem(def);
            return;
        }*/
        
        var _self = this,
            state = this.defaultState;
            
        function collectSections(buttons, section){
//            var buttons = def.buttons;
            for (var i = 0; i < buttons.length; i++) {
                var ext = buttons[i].ext;
                (_self.sections[ext[0]] || (_self.sections[ext[0]] = {}))[ext[1]] = section;
                (_self.defaultSections[ext[0]] || (_self.defaultSections[ext[0]] = {}))[ext[1]] 
                    = JSON.parse(JSON.stringify(section));
            }
        }
        
        if (!def.barNum)
            def.barNum = 0;
        
        if (def.sections) {
            if (def.barNum || def.barNum === 0) {
                if (state.bars[def.barNum])
                    state.bars[def.barNum].sections.merge(def.sections);
                else
                    state.bars[def.barNum] = def;
            }
            else
                state.bars.push(def);
            
            for(var i = 0, l = def.sections.length; i < l; i++)
                collectSections(def.sections[i].buttons, def.sections[i]);
                
            return;
        }
        
        
//        if (def.hidden) {
        if (def.buttons)
            collectSections(def.buttons, def);
//            var buttons = def.buttons;
//            for (var i = 0; i < buttons.length; i++) {
//                var ext = buttons[i].ext;
//                (this.sections[ext[0]] || (this.sections[ext[0]] = {}))[ext[1]] = def;
//            }
//            return;
//        }

        if (!state.bars[def.barNum || 0])
            state.bars[def.barNum || 0] = {expanded: false, width: 230, sections: []};

        var bar = state.bars[def.barNum || 0];
        
        if (def.buttons) {
            bar.sections.push(def);
        }
        else {
            bar.sections.push({
                flex    : 2,
                width   : 260,
                height  : 350,
                buttons : [def]
            });
        }
        
        return bar.sections.slice(-1);
    }, //properties.forceShow ??
    
    hideSection: function(section){
        this.layout.hideSection(section);
    },
    
    showSection: function(section, expand){
        this.layout.showSection(section, expand);
    },
    
    //@todo removal of pages
    
    /**
     * Increases the notification number count by one
     * 
     * @windowIdent identifier of the dock object
     */
    increaseNotificationCount: function(windowIdent){
        /*for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if (this.dockObjects[doi].ident == windowIdent) {
                // Only increase notification count if window is hidden
                if (this.dockObjects[doi].btn.value == false) {
                    if (this.dockObjects[doi].notCount >= 99)
                        return true;

                    this.dockObjects[doi].notCount++;
                    this.updateNotificationElement(
                            this.dockObjects[doi].btn
                            , this.dockObjects[doi].notCount
                    );
                }
                
                return true;
            }
        }
        
        return false;*/
    },

    /**
     * Resets the notification count to 0
     */
    resetNotificationCount: function(windowIdent){
        if (windowIdent == -1) return;

        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if (this.dockObjects[doi].ident == windowIdent) {
                this.dockObjects[doi].notCount = 0;
                this.updateNotificationElement(this.dockObjects[doi].btn, 0);
                return true;
            }
        }
        
        return false;
    },
    
    /**
     * Updates the notification element to visually reflect notCount
     */
    updateNotificationElement: function(btnObj, count){
        if (count == 0) {
            var countInner = "";
        }
        
        else {
            var countInner = count;
        }

        if (apf.isGecko) {
            btnObj.$ext.getElementsByClassName("dock_notification")[0].textContent = countInner;
        }
            
        else {
            btnObj.$ext.getElementsByClassName("dock_notification")[0].innerText = countInner;
        }
        
        return true;
    }
});

    }
);
