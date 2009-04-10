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
 * Element graphically representing a percentage value which increases
 * automatically with time. This element is most often used to show the progress
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
 * @addnode elements:progressbar
 *
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the progress position based on data loaded into this component.
 * <code>
 *  <j:progressbar>
 *      <j:bindings>
 *          <j:value select="@progress" />
 *      </j:bindings>
 *  </j:progressbar>
 * </code>
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <j:progressbar ref="@progress" />
 * </code>
 */
jpf.progressbar = jpf.component(jpf.NODE_VISIBLE, function(){
    this.$focussable = false; // This object can get the focus

    /**** Properties and Attributes ****/

    this.value = 0;
    this.min   = 0;
    this.max   = 100;

    this.$booleanProperties["autostart"] = true;
    this.$booleanProperties["autohide"] = true;

    this.$supportedProperties.push("value", "min", "max", "autostart", "autohide");
    
    /**
     * @attribute {String} value the position of the progressbar stated between 
     * the min and max value.
     */
    this.$propHandlers["value"] = function(value){
        this.value = parseInt(value) || this.min;

        if (this.value >= this.max)
            jpf.setStyleClass(this.oExt, this.baseCSSname + "Complete", [this.baseCSSname + "Running"]);
        else
            jpf.setStyleClass(this.oExt, "", [this.baseCSSname + "Complete"]);

        this.oSlider.style.width = (this.value * 100 / (this.max - this.min)) + "%"
        
        /*Math.max(0,
            Math.round((this.oExt.offsetWidth - 5)
            * (this.value / (this.max - this.min)))) + "px";*/

        this.oCaption.nodeValue =
            Math.round((this.value / (this.max - this.min)) * 100) + "%";
    };

    /**
     * @attribute {Number} min the minimum value the progressbar may have. This is
     * the value that the progressbar has when it's at its start position.
     */
    this.$propHandlers["min"] = function(value){
        this.min = parseFloat(value);
    }

    /**
     * @attribute {Number} max the maximum value the progressbar may have. This is
     * the value that the progressbar has when it's at its end position.
     */
    this.$propHandlers["max"] = function(value){
        this.max = parseFloat(value);
    }

    /**** Public Methods ****/

    /**
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
     */
    this.setValue = function(value){
        this.setProperty("value", value);
    };

    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(){
        return this.value;
    };

    /**
     * Resets the progress indicator.
     * @param {Boolean} restart whether a timer should start with a new indicative progress indicator.
     */
    this.clear = function(restart, restart_time){
        clearInterval(this.timer);
        this.setValue(this.min);
        //this.oSlider.style.display = "none";
        jpf.setStyleClass(this.oExt, "", [this.baseCSSname + "Running", this.baseCSSname + "Complete"]);

        if(restart)
            this.timer = setInterval("jpf.lookup(" + this.uniqueId
                + ").start(" + restart_time + ")");
        if (this.autohide)
            this.hide();
    };

    /**
     * Starts the progress indicator.
     * @param {Number} start the time between each step in milliseconds.
     */
    this.start = function(time){
        if (this.autohide)
            this.show();

        clearInterval(this.timer);
        
        //if (this.value == this.max)
            //this.setValue(this.min + (this.max - this.min) * 0.5);
        
        //this.oSlider.style.display = "block";
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
     * Stops the progress indicator from moving.
     * @param {Boolean} restart whether a timer should start with a new indicative progress indicator.
     */
    this.stop = function(restart, time, restart_time){
        clearInterval(this.timer);
        this.setValue(this.max);
        this.timer = setTimeout("jpf.lookup(" + this.uniqueId + ").clear("
            + restart + ", " + (restart_time || 0) + ")", time || 500);
    };

    /**** Private methods ****/

    this.$step = function(){
        if (this.value == this.max) 
            return;
        
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

        if (this.autohide)
            this.hide();
    };
}).implement(
    // #ifdef __WITH_DATABINDING
    jpf.DataBinding,
    // #endif
    jpf.Presentation
);

// #endif
