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

// #ifdef __JPROGRESSBAR || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component graphically representing a percentage value which time based 
 * increases automatically. This component is ofter used to show the progress 
 * of a process. The progress can be either indicative or exact.
 *
 * @classDescription		This class creates a new progressbar
 * @return {Progressbar} Returns a new pages progressbar
 * @type {Progressbar}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:progressbar
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.progressbar = function(pHtmlNode){
    jpf.register(this, "progressbar", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;

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
    this.focussable = true; // This object can get the focus

    /* ***************
        API
    ****************/
    this.value = 0;
    this.min   = 0;
    this.max   = 1;
    
    this.setCaption = function(value){
        this.oCaption.nodeValue = value;
    }
    
    this.getValue = function(){
        return this.value;
    }
    
    this.setValue = function(value){
        this.value               = parseInt(value) || 0;
        this.oSlider.style.width = Math.max(0, 
            Math.round((this.oExt.offsetWidth - 5) 
            * (this.value / (this.max - this.min)))) + "px";
        
        this.setCaption(Math.round((this.value / (this.max - this.min)) * 100) + "%");
    }
    
    this.clear = function(restart, restart_time){
        this.dispatchEvent("onclear");
        
        clearInterval(this.timer);
        this.setValue(this.min);
        this.oSlider.style.display = "none";
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Running"]);
        
        if(restart) this.timer = setInterval("jpf.lookup(" + this.uniqueId 
            + ").start(" + restart_time + ")");
    }
    
    this.start = function(time){
        clearInterval(this.timer);
        this.oSlider.style.display = "block";
        this.timer = setInterval("jpf.lookup(" + this.uniqueId + ").__step()", 
            time || 1000);
        this.__setStyleClass(this.oExt, this.baseCSSname + "Running");
    }
    
    this.__step = function(){
        if(this.value == this.max) return;
        this.setValue(this.value + 1);
    }
    
    this.pause = function(){
        clearInterval(this.timer);
    }
    
    this.stop = function(restart, time, restart_time){
        clearInterval(this.timer);
        this.setValue(this.max);
        this.timer = setTimeout("jpf.lookup(" + this.uniqueId + ").clear(" 
            + restart + ", " + (restart_time || 0) + ")", time || 500);
    }
    
    this.__supportedProperties = ["value"];
    this.__propHandlers = {
        "value": function(value){
            this.setValue(value);
        }
    }
    
    /* *********
        INIT
    **********/
    
    /* ***************
        Init
    ****************/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.draw = function(clear, parentNode, Node, transform){
        //Build Main Skin
        this.oExt     = this.__getExternal();
        this.oSlider  = this.__getLayoutNode("Main", "progress", this.oExt);
        this.oCaption = this.__getLayoutNode("Main", "caption", this.oExt);
    }
    
    this.__loadJML = function(x){
        //this.setCaption(x.firstChild ? x.firstChild.nodeValue : "");
        this.min = x.getAttribute("min") || 0;
        this.max = x.getAttribute("max") || 100;
        
        if(x.getAttribute("autostart")) this.start();
    }
}

// #endif