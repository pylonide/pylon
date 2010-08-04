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

// #ifdef __AMLLOADINDICATOR || __INC_ALL

/**
 * Element shows a nice animated loader
 * where you can use any time of image
 * Example:
 * This example shows a spinner
 * 
 * <code>
 *  <a:loadindicator
 *    id="spinner"
 *    framewidth="40"
 *    frameheight="40"
 *    src="images/loading.png"
 *    spinnerspeed="66"
 *    framelength="12" />
 *
 *    spinner.start()
 *  </code>
 *
 * @constructor
 * @allowchild {smartbinding}
 * @addnode elements:loadindicator
 *
 *
 * @author      Giannis Panagiotou (bone.jp AT gmail DOT com)
 * @version     %I%, %G%
 * @since       2.0
 *
 */
apf.loadindicator = function(struct, tagName){
    this.$init(tagName || "loadindicator", apf.NODE_VISIBLE, struct);
};

(function() {
    this.spinnerspeed  = 66;
    this.$running      = false;
    this.$loadingFrame = 1;
    this.framelength   = 12;
    this.frameheight   = 40;
    this.framewidth    = 40;
    this.$timer;

    this.$supportedProperties.push("framewidth", "frameheight", "src", "framelength", "spinnerspeed");

    this.$propHandlers["framewidth"] = function(value) {
        this.framewidth             = value;
        this.oSpinner.style.width   = value + 'px';
        this.oContainer.style.width = value + 'px';
    };
    
    this.$propHandlers["frameheight"] = function(value) {
        this.frameheight             = value;
        this.oContainer.style.height = value + 'px';
    };
    
    this.$propHandlers["framelength"] = function(value) {
        this.framelength           = value;
        this.oSpinner.style.height = value * this.frameheight + 'px';
    };
    
    this.$propHandlers["spinnerspeed"] = function(value) {
        this.spinnerspeed = value;
    };
    
    /**
     * @attribute {String} value the url location of the image displayed.
     */
    this.$propHandlers["src"] = function(value){
        this.oSpinner.style.backgroundImage = "url(" + value + ")";
    };

    /**
     * Starts the spinner indicator.
     * @param {Number} start the time between each step in milliseconds.
     */
    this.start = function(){
        if(this.$running)
            return;

        this.$running = true;
        var _self     = this;
        this.oContainer.style.display = 'block';
        this.$timer = setInterval(function(){
            _self.oSpinner.style.top = (_self.$loadingFrame * - _self.frameheight) + 'px';

            _self.$loadingFrame = (_self.$loadingFrame + 1) % _self.framelength;
        }, this.spinnerspeed);
    };

    /**
     * Stops the spinner indicator from moving.
     * @param {Boolean} restart whether the spinner should start from the first frame.
     */
    this.stop = function(restart){
        clearInterval(this.$timer);

        this.oContainer.style.display = 'none';
        
        if (restart) {
            this.$loadingFrame      = 1;
            this.oSpinner.style.top = 0;
        }

        this.$running = false;
    };

    /**** Init ****/

    this.$draw = function() {
        //Build Main Skin
        this.$ext       = this.$getExternal();
        this.oContainer = this.$getLayoutNode("main", "container", this.$ext);
        this.oSpinner   = this.$getLayoutNode("main", "spinner", this.$ext);

        var framewidth, frameheight, framelength, spinnerspeed;
        
        if(framewidth = this.getAttribute("framewidth")) {
            this.framewidth             = framewidth;
            this.oSpinner.style.width   = framewidth + 'px';
            this.oContainer.style.width = framewidth + 'px';
        }

        if(frameheight = this.getAttribute("frameheight")) {
            this.frameheight             = frameheight;
            this.oContainer.style.height = frameheight + 'px';
        }

        if(framelength = this.getAttribute("framelength")) {
            this.framelength           = framelength;
            this.oSpinner.style.height = framelength * this.frameheight + 'px';
        }

        if(spinnerspeed = this.getAttribute("spinnerspeed")) {
            this.spinnerspeed = spinnerspeed;
        }
    };
}).call(apf.loadindicator.prototype = new apf.Presentation());

apf.aml.setElement("loadindicator", apf.loadindicator);
// #endif
