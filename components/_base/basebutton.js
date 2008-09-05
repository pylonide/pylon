/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

// #ifdef __JBASEBUTTON || __INC_ALL

/**
 * Baseclass of a Button component
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.BaseButton = function(pHtmlNode){
        
    /* ***************
        Init
    ****************/

    this.refKeyDown   = 0;     // Number of keys pressed. 
    this.refMouseDown = 0;     // Mouse button down?
    this.mouseOver    = false; // Mouse hovering over the button?
    this.mouseLeft    = false; // Has the mouse left the control since pressing the button.
    
    /* ***********************
        Keyboard Support
    ************************/
    
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey, evnt){
        switch (key) {
            case 32:
            case 13:
                if (!evnt.repeat) { // Only when first pressed, not on autorepeat.
                    this.refKeyDown++;
                    return this.__updateState(evnt);
                } else
                    return false;
        }
    }

    this.keyUpHandler = function(key, ctrlKey, shiftKey, altKey, evnt){
        switch (key) {
            case 32:
            case 13:
                this.refKeyDown--;
                if (this.refKeyDown + this.refMouseDown == 0 && !this.disabled) {
                    //if(this.oExt.onclick) this.oExt.onclick(evnt, true);
                    //else if(this.oExt.onmouseup) 
                    this.oExt.onmouseup(evnt, true);
                }
                return this.__updateState(evnt);
        }
    }

    this.states = {
        "Out":  1,
        "Over": 2,
        "Down" :3
    };
    
    this.__updateState = function(e, strEvent) {
        if (this.disabled) {
            this.refKeyDown   = 0;
            this.refMouseDown = 0;
            this.mouseOver    = false;
            return false;
        } else {
            if (this.refKeyDown > 0 || (this.refMouseDown > 0 && this.mouseOver)
              || (this.isBoolean && this.value))
                this.__setState ("Down", e, strEvent);
            else if (this.mouseOver)
                this.__setState ("Over", e, strEvent);
            else
                this.__setState ("Out", e, strEvent);
        }
    }	
    
    this.__setupEvents = function() {
        this.oExt.onmousedown = function(e) {
            this.host.refMouseDown = 1;
            this.host.mouseLeft    = false;
            this.host.__updateState(e || event, "onmousedown");
        };
        this.oExt.onmouseup = function(e, force) {
            if (!e) e = event;
            if (e)  e.cancelBubble = true;
            
            if (!force && (!this.host.mouseOver || !this.host.refMouseDown))
                return;

            this.host.refMouseDown = 0;
            this.host.__updateState (e, "onmouseup"); 

            // If this is coming from a mouse click, we shouldn't have left the button.
            if (this.host.disabled || (e && e.type == "click" && this.host.mouseLeft == true))
                return false;
                
            // If there are still buttons down, this is not a real click.
            if (this.host.refMouseDown + this.host.refKeyDown)
                return false;	
    
            if (this.host.__clickHandler && this.host.__clickHandler())
                this.host.__updateState (e || event, "onclick");
            else
                this.host.dispatchEvent("onclick", {htmlEvent : e});
            
            return false;
        };

        this.oExt.onmousemove = function(e) {
            this.host.mouseOver = true;
            this.host.__updateState (e || event, "onmouseover");
        };

        this.oExt.onmouseout = function(e) { 
            if(!e) e = event;
            
            //Check if the mouse out is meant for us
            var tEl = e.explicitOriginalTarget || e.toElement;
            if(this == tEl || jpf.xmldb.isChildOf(this, tEl))
                return;
                
            this.host.mouseOver    = false;
            this.host.refMouseDown = 0;
            this.host.mouseLeft    = true;
            this.host.__updateState (e || event, "onmouseout"); 
        };

        if (jpf.hasClickFastBug)
            this.oExt.ondblclick = this.oExt.onmouseup;
    }
    
    this.__destroy = function(){
        this.oExt.onmousedown = this.oExt.onmouseup = this.oExt.onmouseover = 
        this.oExt.onmouseout = this.oExt.onclick = this.oExt.ondblclick = null;
    }
    
    this.__focus = function(){
        if (!this.oExt) return;

        this.__setStyleClass(this.oExt, this.baseCSSname + "Focus");
    }

    this.__blur = function(e){
        if (!this.oExt) return; //FIREFOX BUG!
        if (!e)
            e = event;
        
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Focus"]);
        this.refKeyDown   = 0;
        this.refMouseDown = 0;
        this.mouseLeft    =true;
        
        if (e)
            this.__updateState(e, "onblur");
    }	
}

// #endif
