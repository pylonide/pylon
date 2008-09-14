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

__ALIGNMENT__ = 1 << 12;

// #ifdef __WITH_ALIGNBASECLASS

/**
 * Baseclass adding Alignment features to this Component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.Alignment = function(){
    this.__regbase = this.__regbase | __ALIGNMENT__;
    
    var l = jpf.layoutServer;
    
    /**
     * Sets properties used by the Alignment engine to position this component in its plane.
     *
     * @param  {String}  prop   required  String specifying the property to change. Possible values are: align, align-lean, align-position, align-span, align-margin, align-edge, align-splitter, width, height, min-width, min-height.
     * @param  {String}  value   required  String specifying the value of the property.
     * @param  {Boolean}  purge  optional  true  alignment is recalculated right after setting the property.
     *                                    false  no recalculation is performed
     */
    this.setAlignProperty = function(prop, value, purge){
        this.aData[prop] = value;
        if (purge) 
            this.purgeAlignment();
    }
    
    /**
     * Turns the alignment features off.
     * @param  {Boolean}  purge  optional  true  alignment is recalculated right after setting the property.
     *                                    false  no recalculation is performed
     */
    var lastPosition, jmlNode = this;
    this.disableAlignment = function(purge){
        if (!this.aData) return;
        
        if (this.aData.parent.children.length == 1)
            this.parentNode.vbox = null;
        
        this.aData.prehide();
        if (purge) 
            this.purgeAlignment();
    }
    
    /**
     * Turns the alignment features on.
     *
     */
    this.aData = null;
    this.enableAlignment = function(purge){
        var x = this.jml;

        if (!this.aData) {
            //template support - assuming there are no vbox/hboxes for this parent
            var pNode;
            if (x.getAttribute("align")) {
                if (!this.parentNode.vbox) {
                    var vbox = this.parentNode.vbox = new jpf.vbox(this.pHtmlNode, "vbox");
                    vbox.parentNode = this.parentNode;
                    vbox.loadJML(jpf.xmldb.getXml("<vbox margin='"
                        + (this.pHtmlNode.getAttribute("margin") || "0,0,0,0")
                        + "' />"), this.parentNode);
                }
            }
            
            var l = jpf.layoutServer.get(this.pHtmlNode); // , (x.parentNode.getAttribute("margin") || "").split(/,\s*/)might be optimized by splitting only once
            this.aData = jpf.layoutServer.parseXml(x, l, this);
            
            if (x.getAttribute("align")) 
                this.parentNode.vbox.addAlignNode(this)
            else {
                this.aData.stackId = this.parentNode.aData.children.push(this.aData) - 1;
                this.aData.parent = this.parentNode.aData;
            }
        }
        else {
            this.aData.preshow();
        }
        
        if (jpf.loaded) 
            this.purgeAlignment();
    }
    
    /**
     * Calculate the rules for this component and activates them.
     *
     */
    this.purgeAlignment = function(){
        l.queue(this.pHtmlNode, null, true);
    }
    
    /**
     * @attribute  docking
     * @attribute  align
     * @attribute  splitter
     * @attribute  edge
     * @attribute  minwidth
     * @attribute  minheight
     */
    
    this.dock = true;
    this.__supportedProperties.push("dock");
    
    //@todo do all these properties need to be exposed?
    this.__addJmlLoader(function(){
        this.__supportedProperties.push("align", "lean", "edge", "weight", 
            "splitter", "width", "height", "minwidth", "minheight", "lastheight",
            "lastsplitter", "hidden", "state", "stack", "position", "size");

        this.__propHandlers["align"] = function(value){
            this.aData.template = value;
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["lean"] = function(value){
            this.aData.isBottom = (value || "").indexOf("bottom") > -1;
            this.aData.isRight = (value || "").indexOf("right") > -1;
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["edge"] = function(value){
            this.aData.edgeMargin = Math.max(this.aData.splitter || 0, value != "splitter" ? value : 0);
            this.aData.splitter   = value == "splitter" ? 5 : false;
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["weight"] = function(value){
            this.aData.weight = parseFloat(value);
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["splitter"] = function(value){
            this.aData.splitter = value ? 5 : false;
            this.aData.edgeMargin = Math.max(this.aData.splitter || 0, this.aData.edgeMargin || 0);
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["width"] = function(value){
            this.aData.fwidth = value;
            
            if (this.aData.fwidth && this.aData.fwidth.indexOf("/") > -1) {
                this.aData.fwidth = eval(this.aData.fwidth);
                if (this.aData.fwidth <= 1)
                    this.aData.fwidth = (this.aData.fwidth * 100) + "%";
            }
            
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["height"] = function(value){
            this.aData.fheight = value;
            
            if (this.aData.fheight && this.aData.fheight.indexOf("/") > -1) {
                this.aData.fheight = eval(this.aData.fheight);
                if (this.aData.fheight <= 1)
                    this.aData.fheight = (this.aData.fheight * 100) + "%";
            }
            
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["minwidth"] = function(value){
            this.aData.minwidth = value;
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["minheight"] = function(value){
            this.aData.minheight = value;
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["lastheight"] = function(value){
           this.aData.lastfheight = value;
           l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["lastsplitter"] = function(value){
            this.aData.lastsplitter = value;
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["hidden"] = function(value){
            this.aData.hidden = value == 3
                ? value
                : jpf.isTrue(value);
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["state"] = function(value){
            this.aData.state = value;
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["stack"] = function(value){
            this.aData.stackId = parseInt(value);
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["position"] = function(value){
            this.aData.position = value.split(",");
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["size"] = function(value){
            this.aData.size = value.split(",");
            l.queue(this.pHtmlNode, null, true);
        }
    });
}
// #endif
