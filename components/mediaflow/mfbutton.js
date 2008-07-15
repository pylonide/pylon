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
// #ifdef __JMFBUTTON || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * @constructor
 */
jpf.MFButton = function(pHtmlNode){
    jpf.register(this, "MFButton", MF_NODE);
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /**
     * @inherits jpf.DataBinding
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.DataBinding, jpf.JmlNode);

    //Options
    this.focussable = false; // This object can get the focus
    this.disabled   = false; // Object is enabled
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.__enable = function(){
        this.disabled      = false;
        this.oExt.disabled = false;
    }
    
    this.__disable = function(){
        this.disabled      = true;
        this.oExt.disabled = true;
    }
    
    this.lock = function(){
        this.locked      = false;
        this.oExt.locked = false;
    }
    
    this.unlock = function(){
        this.locked      = false;
        this.oExt.locked = false;
    }
    
    this.setBool = function(){
        //this.SetMode(3);
    }
    
    this.setNormal = function(){
        //this.SetMode(0);
    }
    
    /*
     this.setCaption = function(value){
     this.oCaption.nodeValue = value;
     }
     
     this.setIcon = function(url){
     if(this.oIcon.tagName == "img") this.oIcon.setAttribute("src", this.iconPath + url);
     else this.oIcon.style.backgroundImage = "url(" + this.iconPath + url + ")";
     }
     */
    /* ********************************************************************
     PRIVATE METHODS
     *********************************************************************/
    /* ***********************
     Focus
     ************************/
    this.__focus = function(){};
    
    this.__blur = function(){};
    
    /* ***********************
     Keyboard Support
     ************************/
    this.keyHandler = function(key, ctrlKey, shiftKey){};
    
    /* ***************
     Init
     ****************/
    this.draw = function(){
        if (!this.oExt) 
            this.oExt = jdwin.CreateWidget("button");
    }
    
    this.setCaption = function(caption){
        // state, fontname, size, weight, color, left, top, center
        
        this.oExt.caption = caption;
    }
    
    this.setColor = function(color){
        var clr = eval(color.replace(/#/, "0x"));
        this.oExt.SetFont(0, "Arial", 11, 1, clr, 0, 1, 1);
        this.oExt.SetFont(1, "Arial", 11, 1, clr, 0, 1, 1);
        this.oExt.SetFont(2, "Arial", 11, 1, clr, 0, 1, 1);
    }
    
    this.__loadJML = function(x){
        if (!this.oExt) 
            this.oExt = jdwin.CreateWidget("button");
        
        if (x.getAttribute("onclick")) {
            this.onclick = x.getAttribute("onclick");
            if (typeof this.onclick == "string") 
                this.onclick = new Function(this.onclick);
        }
        //jpf.isIE ?  : new Function(x.getAttribute("onclick"));
        
        this.bgswitch = x.getAttribute("bgswitch") ? true : false;
        if (this.bgswitch) {
            this.bgoptions = x.getAttribute("bgoptions") 
                ? x.getAttribute("bgoptions").split("\|") 
                : ["vertical", 2];
            
            this.oExt.InitButton(0, 0, 0, this.bgoptions[1],
                this.mediaPath.replace(/jav\:\//, "") + x.getAttribute("bgswitch"),
                this.parentNode.offsetHeight ? 1 : 0);
            this.setCaption(x.firstChild ? x.firstChild.nodeValue : "");
            if (x.getAttribute("color")) 
                this.setColor(x.getAttribute("color"));
        }
        
        this.disabled = x.getAttribute("disabled") || false;
        this.oExt.disabled = this.disabled;
        
        var jmlNode = this;
        this.oExt.onbuttonclick = function(){
            jmlNode.dispatchEvent("onclick");
        }
        
        this.__focus();
    }
    
    DeskRun.register(this);
}

//#endif
