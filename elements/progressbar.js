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
 * Example:
 * This example shows a progress bar that is only visible when an application is
 * synchronizing it's offline changes. When in this process it shows the exact
 * progress of the sync process.
 * <code>
 *  <j:progressbar 
 *     value="{jpf.offline.progress}" 
 *     visible="{jpf.offline.syncing}" />
 * </code>
 *
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:progressbar
 *
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */

jpf.progressbar = jpf.component(jpf.NODE_VISIBLE, function(){
    this.$focussable = true; // This object can get the focus
    
    /**** Properties and Attributes ****/
    
    this.value = 0;
    this.min   = 0;
    this.max   = 100;

    this.$booleanProperties["autostart"] = true;
    this.$supportedProperties.push("value", "min", "max", "autostart");
    this.$propHandlers["value"] = function(value){
        this.value = parseInt(value) || 0;
        
        this.oSlider.style.width = Math.max(0, 
            Math.round((this.oExt.offsetWidth - 5) 
            * (this.value / (this.max - this.min)))) + "px";
        
        this.oCaption.nodeValue = 
            Math.round((this.value / (this.max - this.min)) * 100) + "%";
    };
    
    this.$propHandlers["min"] = function(value){
        this.min = parseFloat(value);
    }
    
    this.$propHandlers["max"] = function(value){
        this.max = parseFloat(value);
    }
    
    /**** Public Methods ****/
    
    /**
     * @copy Widget#setValue
     */
    this.setValue = function(value){
        this.setProperty("value", value);
    };
    
    /**
     * @copy Widget#getValue
     */
    this.getValue = function(){
        return this.value;
    };
    
    /**
     * Resets the progress indicator.
     * @param {Boolean} restart wether a timer should start with a new indicative progress indicator.
     */
    this.clear = function(restart, restart_time){
        this.dispatchEvent("clear");
        
        clearInterval(this.timer);
        this.setValue(this.min);
        this.oSlider.style.display = "none";
        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Running"]);
        
        if(restart) this.timer = setInterval("jpf.lookup(" + this.uniqueId 
            + ").start(" + restart_time + ")");
    };
    
    /**
     * Starts the progress indicator.
     * @param {Number} start the time between each step in milliseconds.
     */
    this.start = function(time){
        clearInterval(this.timer);
        this.oSlider.style.display = "block";
        this.timer = setInterval("jpf.lookup(" + this.uniqueId + ").$step()", 
            time || 1000);
        this.$setStyleClass(this.oExt, this.baseCSSname + "Running");
    };
    
    /**
     * Pauses the progress indicator.
     */
    this.pause = function(){
        clearInterval(this.timer);
    };
    
    /**
     * Stops the progress indicator.
     * @param {Boolean} restart wether a timer should start with a new indicative progress indicator.
     */
    this.stop = function(restart, time, restart_time){
        clearInterval(this.timer);
        this.setValue(this.max);
        this.timer = setTimeout("jpf.lookup(" + this.uniqueId + ").clear(" 
            + restart + ", " + (restart_time || 0) + ")", time || 500);
    };
    
    /**** Private methods ****/
    
    this.$step = function(){
        if (this.value == this.max) return;
        this.setValue(this.value + 1);
    };
    
    /**** Init ****/
    
    this.$draw = function(clear, parentNode, Node, transform){
        //Build Main Skin
        this.oExt     = this.$getExternal();
        this.oSlider  = this.$getLayoutNode("main", "progress", this.oExt);
        this.oCaption = this.$getLayoutNode("main", "caption", this.oExt);
    };
    
    this.$loadJml = function(x){
        if (this.autostart)
           this.start();
    };
}).implement(
    // #ifdef __WITH_DATABINDING
    jpf.DataBinding,
    // #endif
    jpf.Presentation
);

// #endif