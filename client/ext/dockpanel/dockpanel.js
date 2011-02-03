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
     * Dock Panel functionality
     */
     
    /**
     * Creates a new button for the dock and associates it with a window
     * 
     * The dockPosition property of buttonProperties designates whether
     * the button is position above or below the divider element
     * 
     * @buttonProperties = {
     *  dockPosition : "top" || "bottom",
     *  backgroundImage : spritePngURL,
     *  defaultState : { x: pos_x, y: pos_y },
     *  activeState  : { x: pos_x, y: pos_y }
     * }
     * 
     * @forceShow immediately shows the window being registered
     */
    registerWindow : function(windowObj, buttonProperties, forceShow){
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
        }
        
        else {
            var appendedDockBtn = dockPanelRight.appendChild(btnTemp);
        }
        
        btnTemp.show();
        
        // Set the position of the windowObj to the top of the new button
        windowObj.setTop(apf.getAbsolutePosition(appendedDockBtn.$ext)[1]);
        
        this.nodes.push(appendedDockBtn);
        this.dockObjects.push({ win : windowObj, btn : appendedDockBtn });

        if(typeof forceShow !== "undefined" && forceShow == true) {
            /*this.hideActiveWindow();
            appendedDockBtn.setValue(true);
            windowObj.show();*/
            this.toggleWindow(appendedDockBtn);
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