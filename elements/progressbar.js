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

// #ifdef __AMLPROGRESSBAR || __INC_ALL

/**
 * Element graphically representing a percentage value which increases
 * automatically with time. This element is most often used to show the progress
 * of a process. The progress can be either indicative or exact.
 * Example:
 * This example shows a progress bar that is only visible when an application is
 * synchronizing it's offline changes. When in this process it shows the exact
 * progress of the sync process.
 * <code>
 *  <a:progressbar
 *    value   = "{apf.offline.progress}"
 *    visible = "{apf.offline.syncing}" />
 *  </code>
 *
 * @constructor
 * @allowchild {smartbinding}
 * @addnode elements:progressbar
 *
 * @inherits apf.StandardBinding
 * @inherits apf.DataAction
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.9
 *
 * @binding value  Determines the way the value for the element is retrieved 
 * from the bound data.
 * Example:
 * Sets the progress position based on data loaded into this component.
 * <code>
 *  <a:model>
 *      <data progress="50"></data>
 *  </a:model>
 *  <a:progressbar min="0" max="100" value="[@progress]" />
 * </code>
 * Example:
 * A shorter way to write this is:
 * <code>
 *  <a:model id="mdlProgress">
 *      <data progress="50"></data>
 *  </a:model>
 *  <a:progressbar value="[mdlProgress::@progress]" />
 * </code>
 */
apf.progress    = function(struct, tagName){
    this.$init(tagName || "progress", apf.NODE_VISIBLE, struct);
};
apf.progressbar = function(struct, tagName){
    this.$init(tagName || "progressbar", apf.NODE_VISIBLE, struct);
};

(function(){
    //#ifdef __WITH_DATAACTION
    this.implement(apf.DataAction);
    //#endif

    this.$focussable = false; // This object can get the focus

    /**** Properties and Attributes ****/

    this.value = 0;
    this.min   = 0;
    this.max   = 100;
    
    this.$running = false;
    this.$timer;

    /**
     * @attribute {Boolean} autostart whether the progressbar starts automatically.
     * @attribute {Boolean} autohide  whether the progressbar hides when the progress is at 100%. Setting this to true will hide the progressbar at start when autostart is not set to true.
     */
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
            apf.setStyleClass(this.$ext, this.$baseCSSname + "Complete", [this.$baseCSSname + "Running", this.$baseCSSname + "Half"]);
        else
            apf.setStyleClass(this.$ext, this.$baseCSSname + "Running", [this.$baseCSSname + "Complete"]);
            
        if (this.value >= this.max / 2)
            apf.setStyleClass(this.$ext, this.$baseCSSname + "Half", []);

        this.oSlider.style.width = (this.value * 100 / (this.max - this.min)) + "%"
        
        /*Math.max(0,
            Math.round((this.$ext.offsetWidth - 5)
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

    //#ifdef __WITH_CONVENIENCE_API

    /**
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
     */
    this.setValue = function(value){
        this.setProperty("value", value, false, true);
    };

    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(){
        return this.value;
    };
    
    //#endif

    /**
     * Resets the progress indicator.
     * @param {Boolean} restart whether a this.$timer should start with a new indicative progress indicator.
     */
    this.clear = function(){
        this.$clear();
    }

    this.$clear = function(restart, restart_time){
        clearInterval(this.$timer);
        this.setValue(this.min);
        //this.oSlider.style.display = "none";
        apf.setStyleClass(this.$ext, "", [this.$baseCSSname + "Running", this.$baseCSSname + "Complete"]);

        if (restart) {
            var _self = this;
            this.$timer = setInterval(function(){
                _self.start(restart_time);
            });
        }
        
        if (this.autohide)
            this.hide();
        
        this.$running = false;
    };

    /**
     * Starts the progress indicator.
     * @param {Number} start the time between each step in milliseconds.
     */
    this.start = function(time){
        if (this.autohide)
            this.show();

        clearInterval(this.$timer);
        
        //if (this.value == this.max)
            //this.setValue(this.min + (this.max - this.min) * 0.5);
        
        //this.oSlider.style.display = "block";
        var _self = this;
        this.$timer = setInterval(function(){
            if (_self.$amlDestroyed)
                clearInterval(_self.$timer);
            else
                _self.$step();
        }, time || 1000);
        this.$setStyleClass(this.$ext, this.$baseCSSname + "Running");
    };

    /**
     * Pauses the progress indicator.
     */
    this.pause = function(){
        clearInterval(this.$timer);
    };

    /**
     * Stops the progress indicator from moving.
     * @param {Boolean} restart whether a this.$timer should start with a new indicative progress indicator.
     */
    this.stop = function(restart, time, restart_time){
        clearInterval(this.$timer);
        this.setValue(this.max);
        
        var _self = this;
        this.$timer = setInterval(function(){
            _self.$clear(restart, (restart_time || 0));
        }, time || 500);
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
        this.$ext     = this.$getExternal();
        this.oSlider  = this.$getLayoutNode("main", "progress", this.$ext);
        this.oCaption = this.$getLayoutNode("main", "caption", this.$ext);
    };

    this.$loadAml = function(x){
        if (this.autostart)
           this.start();

        if (this.autohide)
            this.hide();
    };
// #ifdef __WITH_DATABINDING
}).call(apf.progressbar.prototype = new apf.StandardBinding());
/* #else
}).call(apf.progressbar.prototype = new apf.Presentation());
#endif */

apf.progress.prototype = apf.progressbar.prototype;

apf.aml.setElement("progress",    apf.progress);
apf.aml.setElement("progressbar", apf.progressbar);
// #endif
