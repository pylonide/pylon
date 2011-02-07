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
     
    /**
     * Creates a new button for the dock and associates it with a window
     * 
     * The dockPosition property of buttonProperties designates whether
     * the button is position above or below the divider element
     * 
     * @buttonProperties = {
     *  dockPosition : "top" || "bottom",
     *  backgroundImage : spriteURL,
     *  defaultState : { x: pos_x, y: pos_y },
     *  activeState  : { x: pos_x, y: pos_y }
     * }
     * 
     * @windowIdent Optional ident to associate with window. Extension must 
     *              formulate this as [@extensionName] + [@identifier] in order 
     *              for the identifiers to remain unique
     * 
     * @forceShow   Immediately shows the window being registered
     */
    registerWindow : function(windowObj, buttonProperties, windowIdent, forceShow){
        
        if(typeof windowIdent !== "undefined" && this.windowExists(windowIdent)) {
            return false;
        }
        
        var _self = this;
        this.numDockButtons++;
        
        btnTemp = new apf.button({
            skin    : "dockButton",
            'class' : "dockButton" + _self.numDockButtons,
            state   : "true",
            onclick : function() {
                _self.toggleWindow(windowObj, this);
            }
        });
        
        var dockButtonID = "dockButton" + _self.numDockButtons;
        var tmpAML = '<a:application xmlns:a="http://ajax.org/2005/aml">\
            <a:button id="' + dockButtonID + '" class="' + dockButtonID 
                + '" skin="dockButton" \
                state="true" visible="false" onclick="\
                require(\'ext/dockpanel/dockpanel\').toggleWindow(this)">\
            </a:button>\
            <a:style><![CDATA[ .' + dockButtonID + ' .icon { background: transparent \
                url("/static/style/images/collaboration_panel_sprite.png\
                    ") ' + buttonProperties.defaultState.x + 'px '
                    + buttonProperties.defaultState.y + 'px;\
                } .' + dockButtonID + '.dockButtonDown .icon { \
                    background-position: ' + buttonProperties.activeState.x 
                      + 'px ' + buttonProperties.activeState.y + 'px; }\
                ]]>\
            </a:style></a:application>';
        
        //apf.document.body.insertMarkup(tmpAML);
        dockPanelRight.insertMarkup(tmpAML);

        btnTemp = eval(dockButtonID);
        
        if(buttonProperties.dockPosition == "top") {
            var appendedDockBtn = 
                    dockPanelRight.insertBefore(btnTemp, dockRightDivider);
            this.repositionWindows();
        }
        
        else {
            var appendedDockBtn = dockPanelRight.appendChild(btnTemp);
        }
        
        btnTemp.show();
        
        // Set the position of the windowObj to the top of the new button
        windowObj.setTop(apf.getAbsolutePosition(appendedDockBtn.$ext)[1]);
        
        this.nodes.push(appendedDockBtn);
        this.dockObjects.push({ 
            win       : windowObj, 
            btn       : appendedDockBtn,
            ident     : -1,
            objhidden : false
        });
        
        if(typeof windowIdent !== "undefined") {
            this.dockObjects[this.dockObjects.length-1].ident = windowIdent;   
        }

        if(typeof forceShow !== "undefined" && forceShow == true) {
            this.toggleWindow(appendedDockBtn);
        }
    },
    
    /**
     * Unregisters a window and associated button
     * 
     * @windowIdent identifier passed during registerWindow() call
     */
    unregisterWindow: function(windowIdent){
        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if(this.dockObjects[doi].ident == windowIdent) {
                this.dockObjects[doi].win.destroy(true, true);
                this.dockObjects[doi].btn.destroy(true, true);
                this.dockObjects.splice(doi, 1);
                
                // Re-associated every button's window position to buttons
                // that may have shifted
                this.repositionWindows();
                return true;
            }
        }
        
        return false;
    },
    
    /**
     * Hides a dock button + associated window
     * 
     * You would do this if you wanted to "close" a window but keep its
     * contents intact
     * 
     * @windowIdent identifier passed during registerWindow() call
     */
    hideDockObject: function(windowIdent){
        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if(this.dockObjects[doi].ident == windowIdent) {
                this.dockObjects[doi].win.hide();
                this.dockObjects[doi].btn.setValue(false);
                this.dockObjects[doi].btn.hide();
                
                this.repositionWindows();
                
                this.dockObjects[doi].objhidden = true;
                return true;
            }
        }
        
        return false;
    },
    
    showDockObject: function(windowIdent, showWindow){
        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if(this.dockObjects[doi].ident == windowIdent) {
                this.dockObjects[doi].btn.show();
                
                if(typeof showWindow !== "undefined" && showWindow == true) {
                    this.dockObjects[doi].win.show();
                }
                
                this.repositionWindows();
                
                this.dockObjects[doi].objhidden = false;
                return true;
            }
        }
        
        return false;
    },
    
    /**
     * Re-positions windows associated with buttons
     * This happens for example when a window is unregistered, or when a
     * window is registered at the "top" of the dock (above divider)
     */
    repositionWindows: function(){
        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            this.dockObjects[doi].win.setTop(
                apf.getAbsolutePosition(this.dockObjects[doi].btn.$ext)[1]
            );
        }
    },

    /**
     * Toggles the visibility of a window and sets the state of the button
     * associated with the window
     *
     * Checks the state of other windows/buttons and hides them if visible
     */
    toggleWindow: function(btnObj){
        var savedObjPos = -1;
        
        // Any other buttons/windows visible?
        for(var doi = 0; doi < this.dockObjects.length; doi++) {
            if(this.dockObjects[doi].btn != btnObj) {
                if(this.dockObjects[doi].win.visible) {
                    this.dockObjects[doi].btn.setValue(false);
                    this.dockObjects[doi].win.hide();
                }
            }

            else {
                savedObjPos = doi;
            }
        }
        
        if(savedObjPos != -1) {
            if(this.dockObjects[savedObjPos].win.visible) {
                this.dockObjects[savedObjPos].win.hide();
                btnObj.setValue(false);
            }
            
            else {
                this.dockObjects[savedObjPos].win.show();
                btnObj.setValue(true);
            }
        }
    },
    
    /**
     * Checks to see if a window has already been registered with the 
     * supplied identifier
     * 
     * @windowIdent identifier passed during registerWindow() call
     * @showWindow if true, toggles the window's visibility
     */
    windowExists: function(windowIdent, showWindow){
       for(var doi = 0; doi < this.dockObjects.length; doi++) {
           if(this.dockObjects[doi].ident == windowIdent) {
               if(typeof showWindow !== "undefined" && showWindow == true) {
                   if(this.dockObjects[doi].objhidden == true) {
                       this.showDockObject(windowIdent, false);
                   }
                   
                   this.toggleWindow(this.dockObjects[doi].btn);
               }

               return true;
           }
       }
       
       return false;
    },
    
    /**
     * Hides all actively visible windows and de-selects associated button
     */
    hideActiveWindows: function(){
       for(var doi = 0; doi < this.dockObjects.length; doi++) {
           if(this.dockObjects[doi].win.visible) {
               this.dockObjects[doi].btn.setValue(false);
               this.dockObjects[doi].win.hide();
           }
       }
    }
});

    }
);