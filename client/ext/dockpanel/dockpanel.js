/**
 * Dock Panel for the Cloud9 IDE client
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
        
return ext.register("ext/dockpanel/dockpanel", {
    name           : "Dock Panel",
    dev            : "Ajax.org",
    alone          : true,
    type           : ext.GENERAL,

    numDockButtons : 0,

    nodes          : [],
    dockObjects    : [],

    /**
     * Standard Extension functionality
     */
    init : function(amlNode){
        this.expandCol = colRight;
        this.expandCol.$ext.className = "dockcol unselectable"
        this.splitter = splitterPanelRight;
        this.splitter.hide();
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
    },
    
    /**
     *           ***** DOCK PANEL METHODS *****
     */
     
    expand : function(){
        this.expanded = true;
        
        if (this.$currentMenu)
            this.$currentMenu.hide();
        
        var tab, items = this.sections;
        for (var prop in items) {
            tab = (item = items[prop]).tab;
            
            if (item.lastChild.$initPage)
                item.lastChild.$initPage();
                
            if (!tab.flex)
                tab.setAttribute("flex", 1);
            
            this.expandCol.appendChild(tab);
        }
        this.expandCol.show();
        this.splitter.show();
        dockPanelRight.hide();
        
        //Hack for button
        colRight.firstChild.$ext.onmousemove({});
        
        //Quick Fix
//        if (apf.isGecko)
//            apf.layout.forceResize(ide.vbMain.$ext);
    },
    
    collapse : function(){
        this.expanded = false;
        
        var tab, items = this.sections;
        for (var prop in items) {
            if (!(item = items[prop]).tab)
                continue;
                
            item.menu.appendChild(item.tab);
        }
        this.expandCol.hide();
        this.splitter.hide();
        dockPanelRight.show();
        
        //Hack for button
        dockPanelRight.firstChild.$ext.onmousemove({});
    },

    sections : {},
    getSection : function(ident, options){
        if (this.sections[ident])
            return this.sections[ident];
        
        var _self   = this;
        var section = this.sections[ident] = dockPanelRight.appendChild(new apf.vbox({
            padding : 0,
            edge : "0 0 3 0",
            "class" : "docksection",
            childNodes : [
                new apf.divider({
                    skin : "divider-debugpanel",
                    margin : "3 5 2 5",
                })
            ]
        }));

        section.menu = apf.document.body.appendChild(new apf.menu({
            id         : "menu" + section.$uniqueId,
            //htmlNode   : document.body,
            width      : options && options.width || 260,
            height     : options && options.height || 350,
            ref        : section,
            pinned     : true,
            animate    : false,
            resizable  : true,
            skin       : "dockwindowbasic",
            "onprop.visible" : function(e){
                if (e.value) {
                    if (_self.$currentMenu && _self.$currentMenu != this)
                        _self.$currentMenu.hide();
                    _self.$currentMenu = this;
                    
                    //Quick Hack!
                    var menu = this;
                    setTimeout(function(){
                        menu.$ext.style.right = "42px";
                        //menu.$ext.style.minHeight = "350px";
                        menu.$ext.style.left = "";
                        menu.$ext.style.zIndex = "9999";
                    });
                }
            },
            childNodes : [
                new apf.tab({
                    skin    : "docktab",
                    anchors : "0 0 0 0",
                    buttons : "scale"
                })
            ]
        }));

        section.menu.addEventListener("afterresize", function() {
            var menu = this;
            setTimeout(function() {
                menu.$ext.style.right = "42px";
                menu.$ext.style.left  = "";
            });
        });

        section.menu.$ext.style.display = "none";
        section.tab = section.menu.firstChild;
        return section;
    },
    
    registerPage : function(section, amlPage, fetchCallback, properties){
        if (!section)
            throw new Error("Missing section when registering page in dockpanel");        
        
        var winIdent = -1;
        if(typeof properties.ident !== "undefined") {
            if(this.pageExists(properties.ident))
                return false;
            winIdent = properties.ident;
        }

        var _self = this;
        
        _self.numDockButtons++;
        
        var btnLock, dockButtonID = "dockButton" + _self.numDockButtons;
        var btnTemp = section.appendChild(new apf.button({
            "class" : dockButtonID,
            skin    : "dockButton",
            submenu : section.menu.id,
            page    : amlPage,
            onmousedown  : function(){
                btnLock = true;
                section.tab.set(this.page);
                btnLock = false;
            }
        }));
        
        //@todo this should be changed
        if (properties && properties.primary) {
            var tmpAML = '<a:application xmlns:a="http://ajax.org/2005/aml">\
                <a:style><![CDATA[ .' + dockButtonID + ' .dii_primary { background: transparent \
                    url("' + properties.primary.backgroundImage + '") '
                        + properties.primary.defaultState.x + 'px '
                        + properties.primary.defaultState.y + 'px no-repeat;\
                    } .' + dockButtonID + '.dockButtonDown .dii_primary { \
                        background-position: ' + properties.primary.activeState.x 
                          + 'px ' + properties.primary.activeState.y + 'px; }';
            
            if(properties.secondary) {
                tmpAML += ' .' + dockButtonID + ' .dii_secondary { background: '
                    + ' url("' + properties.secondary.backgroundImage + '") '
                    + properties.secondary.defaultState.x + 'px '
                    + properties.secondary.defaultState.y + 'px no-repeat;\
                    } .' + dockButtonID + '.dockButtonDown .dii_secondary { \
                    background-position: ' + properties.secondary.activeState.x 
                      + 'px ' + properties.secondary.activeState.y + 'px; }';
            }
            
            if(properties.tertiary) {
                 tmpAML += ' .' + dockButtonID + ' .dii_tertiary { background: '
                        + properties.tertiary.backgroundColor + ' url("'
                        + properties.tertiary.backgroundImage + '") '
                        + properties.tertiary.defaultState.x + 'px '
                        + properties.tertiary.defaultState.y + 'px no-repeat; \
                        border: 1px solid #c7c7c7; }';
            }
            
            tmpAML += ' ]]> </a:style></a:application>';
            dockPanelRight.insertMarkup(tmpAML);
        }
        
        function cont(){
            section.tab.appendChild(amlPage);
            
            // When the page is shown, we can reset the notification count
            amlPage.addEventListener("prop.visible", function(e) {
                _self.resetNotificationCount(winIdent);
                if (!btnLock & !_self.expanded)
                    this.button.showMenu();
                    
                if(e.value == true && properties && properties.cbOnPageShow)
                    properties.cbOnPageShow();
                    
                else if(e.value == false && properties && properties.cbOnPageHide)
                    properties.cbOnPageHide();
            });
            
            amlPage.button = btnTemp;
            
            _self.dockObjects.push({ 
                win       : amlPage, 
                btn       : btnTemp,
                ident     : winIdent,
                section   : section,
                objhidden : false,
                notCount  : 0   // Notification count
            });
        }
        
        if (!amlPage) {
            btnTemp.$initPage = function(e, norecur){
                if (!norecur) {
                    var nodes = this.parentNode.childNodes;
                    for (var i = 0; i < nodes.length; i++) {
                        if (nodes[i].$initPage)
                            nodes[i].$initPage(null, true);
                    }
                }
                else {
                    this.page = amlPage = fetchCallback();
                    cont();
                    this.removeEventListener("mousedown", arguments.callee);
                }
            }
            btnTemp.addEventListener("mousedown", btnTemp.$initPage);
        }
        else {
            cont();
        }

        if (properties && properties.forceShow)
            section.tab.set(amlPage);
    },
    
    unregisterPage : function(section, ident){
        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if(this.dockObjects[doi].ident == ident) {
                this.dockObjects[doi].btn.destroy(true, true);
                this.dockObjects.splice(doi, 1);
                return true;
            }
        }
        
        return false;
    },
    
    pageExists : function(ident, forceShow){
        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if(this.dockObjects[doi].ident == ident) {
                if(typeof forceShow !== "undefined" && forceShow) {
                    // TODO Select tab
                    this.dockObjects[doi].section.tab.set(
                        this.dockObjects[doi].win
                    );
                }
                return true;
            }
        }
        
        return false;
    },
    
    /**
     * Increases the notification number count by one
     * 
     * @windowIdent identifier of the dock object
     */
    increaseNotificationCount: function(windowIdent){
        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if(this.dockObjects[doi].ident == windowIdent) {
                // Only increase notification count if window is hidden
                if(this.dockObjects[doi].btn.value == false) {
                    if(this.dockObjects[doi].notCount >= 99)
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
        
        return false;
    },
    
    /**
     * Resets the notification count to 0
     */
    resetNotificationCount: function(windowIdent){
        if(windowIdent == -1) return;

        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if(this.dockObjects[doi].ident == windowIdent) {
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
        if(count == 0) {
            var countInner = "";
        }
        
        else {
            var countInner = count;
        }

        if(apf.isGecko) {
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