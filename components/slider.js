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
// #ifdef __JSLIDER || __INC_ALL

/**
 * Component allowing the user to select a value from a range of
 * values between a minimum and a maximum value.
 *
 * @classDescription		This class creates a new slider
 * @return {Slider} Returns a new slider
 * @type {Slider}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:slider, components:range
 * @alias range
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.range = 
jpf.slider = function(pHtmlNode, tagName){
    jpf.register(this, tagName || "slider", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ***********************
     Inheritance
     ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    // #ifdef __WITH_DATABINDING
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    // #endif
    
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    //Options
    this.__focussable      = true; // This object can get the focus
    this.nonSizingHeight = true;
    this.disabled        = false; // Object is enabled
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    //#endif
    this.value = 0;
    
    this.__supportedProperties.push("value");
    this.__propHandlers["value"] = function(value){
        this.value = Math.max(this.min, Math.min(this.max, value)) || 0;
        var multiplier = (this.value - this.min) / (this.max - this.min);
        
        if (this.direction == "horizontal") {
            var max = (this.oContainer.offsetWidth 
                - jpf.getWidthDiff(this.oContainer)) 
                - this.oSlider.offsetWidth;
            var min = parseInt(jpf.getBox(
                jpf.getStyle(this.oContainer, "padding"))[3]);
            this.oSlider.style.left = (((max - min) * multiplier) + min) + "px";
        }
        else {
            var max = (this.oContainer.offsetHeight 
                - jpf.getHeightDiff(this.oContainer)) 
                - this.oSlider.offsetHeight;
            var min = parseInt(jpf.getBox(
                jpf.getStyle(this.oContainer, "padding"))[0]);
            this.oSlider.style.top = (((max - min) * (1 - multiplier)) + min) + "px";
        }
        
        if (this.oLabel) {
            //Percentage
            if (this.mask == "%") {
                this.oLabel.nodeValue = Math.round(multiplier * 100) + "%";
            }
            //Number
            else 
                if (this.mask == "#") {
                    status = this.value;
                    this.oLabel.nodeValue = this.slideStep 
                        ? (Math.round(this.value / this.slideStep) * this.slideStep) 
                        : this.value;
                }
                //Lookup
                else {
                    this.oLabel.nodeValue = this.mask[Math.round(this.value - this.min) 
                        / (this.slideStep || 1)]; //optional floor ??	
                }
            
        }
    }
    
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.setValue = function(value, onlySetXml){
        this.__onlySetXml = onlySetXml;//blrgh..
        this.setProperty("value", value);
        this.__onlySetXml = false;
    }
    
    this.getValue = function(){
        return this.slideStep 
            ? Math.round(parseInt(this.value) / this.slideStep) * this.slideStep 
            : this.value;
        
        //DEAD CODE?
        if (this.direction == "horizontal") {
            var max = (this.oContainer.offsetWidth 
                - jpf.getWidthDiff(this.oContainer)) 
                - this.oSlider.offsetWidth;
            var min = parseInt(jpf.getBox(
                jpf.getStyle(this.oContainer, "padding"))[3]);
            var value = (this.oSlider.style.left - min) / (max - min);
        }
        else {
            var max = (this.oContainer.offsetHeight 
                - jpf.getHeightDiff(this.oContainer)) 
                - this.oSlider.offsetHeight;
            var min = parseInt(jpf.getBox(
                jpf.getStyle(this.oContainer, "padding"))[0]);
            var value = (this.oSlider.style.top - min) / (max - min);
        }
        
        return value;
    }
    
    /* ***********************
     Keyboard Support
     ************************/
    // #ifdef __WITH_KBSUPPORT
    
    //Handler for a plane list
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        switch (key) {
            case 37:
                //LEFT
                if (this.direction != "horizontal") 
                    return;
                this.setValue(this.value - (ctrlKey ? 0.01 : 0.1));
                break;
            case 38:
                //UP
                if (this.direction != "vertical") 
                    return;
                this.setValue(this.value + (ctrlKey ? 0.01 : 0.1));
                break;
            case 39:
                //RIGHT
                if (this.direction != "horizontal") 
                    return;
                this.setValue(this.value + (ctrlKey ? 0.01 : 0.1));
                break;
            case 40:
                //DOWN
                if (this.direction != "vertical") 
                    return;
                this.setValue(this.value - (ctrlKey ? 0.01 : 0.1));
                break;
            default:
                return;        }
        
        return false;
    }
    // #endif
    
    /* ***********************
     INIT
     ************************/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    this.draw = function(){
        //Build Main Skin
        this.oExt         = this.__getExternal();
        this.oLabel       = this.__getLayoutNode("Main", "status", this.oExt);
        this.oMarkers     = this.__getLayoutNode("Main", "markers", this.oExt);
        this.oSlider      = this.__getLayoutNode("Main", "slider", this.oExt);
        this.oInt         = this.oContainer = this.__getLayoutNode("Main",
            "container", this.oExt);
        this.oSlider.host = this;
        
        this.oSlider.style.left = (parseInt(jpf.getBox(
            jpf.getStyle(this.oExt, "padding"))[3])) + "px";
        
        this.oSlider.onmousedown = function(e){
            if (this.host.disabled) 
                return false;
            
            //@todo use start action here
            
            if (!e) 
                e = event;
            document.dragNode = this;
            
            this.x   = (e.clientX || e.x);
            this.y   = (e.clientY || e.y);
            this.stX = this.offsetLeft;
            this.siX = this.offsetWidth
            this.stY = this.offsetTop;
            this.siY = this.offsetheight
            this.startValue = this.host.value;
            
            if (this.host.direction == "horizontal") {
                this.max = parseInt(jpf.getStyle(this.host.oContainer, "width")) 
                    - this.offsetWidth;
                this.min = parseInt(jpf.getBox(
                    jpf.getStyle(this.host.oContainer, "padding"))[3]);
            }
            else {
                this.max = parseInt(jpf.getStyle(this.host.oContainer, "height")) 
                    - this.offsetHeight;
                this.min = parseInt(jpf.getBox(
                    jpf.getStyle(this.host.oContainer, "padding"))[0]);
            }
            
            this.host.__setStyleClass(this, "btndown", ["btnover"]);
            
            jpf.dragmode.mode = true;
            
            function getValue(o, e, slideDiscreet){
                var to = (o.host.direction == "horizontal") 
                    ? (e.clientX || e.x) - o.x + o.stX 
                    : (e.clientY || e.y) - o.y + o.stY;
                to = (to > o.max ? o.max : (to < o.min ? o.min : to));
                var value = (((to - o.min) * 100 / (o.max - o.min) / 100) 
                    * (o.host.max - o.host.min)) + o.host.min;
                
                value = slideDiscreet 
                    ? (Math.round(value / slideDiscreet) * slideDiscreet) 
                    : value;
                value = (o.host.direction == "horizontal") ? value : 1 - value;
                
                return value;
            }
            
            document.onmousemove = function(e){
                var o = this.dragNode;
                
                if (!o || !o.host) {
                    document.onmousemove = 
                    document.onmouseup   = 
                    jpf.dragmode.mode    = null;
                }
                
                this.value = -1; //reset value
                o.host.setValue(getValue(o, e || event, o.host.slideDiscreet));
                //o.host.__handlePropSet("value", getValue(o, e || event, o.host.slideDiscreet));
            }
            
            document.onmouseup = function(e){
                var o = this.dragNode;
                this.dragNode = null;
                o.onmouseout();
                
                this.value = -1; //reset value
                o.host.setValue(o.startValue, true);
                o.host.change(getValue(o, e || event, o.host.slideDiscreet || o.host.slideSnap));
                
                document.onmousemove = 
                document.onmouseup   = 
                jpf.dragmode.mode    = null;
            }
            
            //event.cancelBubble = true;
            return false;
        }
        
        this.oSlider.onmouseup = this.oSlider.onmouseover = function(){
            if (document.dragNode != this) 
                this.host.__setStyleClass(this, "btnover", ["btndown"]);
        }
        
        this.oSlider.onmouseout = function(){
            if (document.dragNode != this) 
                this.host.__setStyleClass(this, "", ["btndown", "btnover"]);
        }
    }
    
    this.__loadJML = function(x){
        this.direction = x.getAttribute("direction") || "horizontal";
        this.slideStep = parseInt(x.getAttribute("step")) || 0;
        this.mask      = x.getAttribute("mask") || "%";
        if (!this.mask.match(/^(%|#)$/)) 
            this.mask = x.getAttribute("mask").split(";");
        this.min           = parseInt(x.getAttribute("min")) || 0;
        this.max           = parseInt(x.getAttribute("max")) || 6;
        this.slideDiscreet = x.getAttribute("slide") == "discreet";
        this.slideSnap     = x.getAttribute("slide") == "snap";
        
        this.__propHandlers["value"].call(this, this.min);
        
        //Set step 
        if (this.slideStep) {
            var count = (this.max - this.min) / this.slideStep;
            for (var o, nodes = [], i = 0; i < count + 1; i++) {
                this.__getNewContext("Marker");
                o = this.__getLayoutNode("Marker");
                var leftPos = Math.max(0, (i * (1 / count) * 100) - 1);
                o.setAttribute("style", "left:" + leftPos + "%");
                nodes.push(o);
            }
            
            jpf.xmldb.htmlImport(nodes, this.oMarkers);
        }
        
        jpf.JmlParser.parseChildren(this.jml, null, this);
    }
    
    this.__destroy = function(){
        this.oSlider.host        = 
        this.oSlider.onmousedown =
        this.oSlider.onmouseup   =
        this.oSlider.onmouseover =
        this.oSlider.onmouseout  = null;
    }
}

// #endif
