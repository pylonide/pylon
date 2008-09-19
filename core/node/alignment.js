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
    this.enableAlignment = function(purge){
        var x = this.jml;

        if (!this.aData) {
            //template support - assuming there are no vbox/hboxes for this parent
            var pNode;
            if (x.getAttribute("align")) {
                if (!this.parentNode.vbox) {
                    var vbox = this.parentNode.vbox = new jpf.vbox(this.pHtmlNode, "vbox");
                    vbox.parentNode = this.parentNode;
                    vbox.loadJml(jpf.xmldb.getXml("<vbox margin='"
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
     * @attribute  weight
     * @attribute  minwidth
     * @attribute  minheight
     */
    
    this.dock = true;
    this.__booleanProperties["dock"] = true;
    this.__supportedProperties.push("dock");
    
    //@todo problem with determining when aData.parent | also with weight and minwidth
    this.__addJmlLoader(function(){
        this.__supportedProperties.push("align", "lean", "edge", "weight", 
            "splitter", "width", "height", "minwidth", "minheight");

        this.__propHandlers["align"] = function(value){
            this.aData.template = value;
            
            throw new Error("Not implemented");
            
            /*if (!value)
                this.disableAlignment();
            else
                this.enableAlignment();*/
            
            //l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["lean"] = function(value){
            this.aData.isBottom = (value || "").indexOf("bottom") > -1;
            this.aData.isRight = (value || "").indexOf("right") > -1;
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["edge"] = function(value){
            this.aData.edgeMargin = Math.max(this.aData.splitter || 0, value != "splitter" ? value : 0);
            this.aData.splitter   = value == "splitter" ? 5 : false;
            
            if (this.aData.parent.children.length == 1) {
                this.aData.parent.splitter = this.aData.splitter;
                this.aData.parent.edgeMargin = this.aData.edgeMargin;
            }
            
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["weight"] = function(value){
            this.aData.weight = parseFloat(value);
            
            if (this.aData.parent.children.length == 1)
                this.aData.parent.weight = this.aData.weight;
            
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["splitter"] = function(value){
            this.aData.splitter = value ? 5 : false;
            this.aData.edgeMargin = Math.max(this.aData.splitter || 0, this.aData.edgeMargin || 0);
            
            if (this.aData.parent.children.length == 1) {
                this.aData.parent.splitter = this.aData.splitter;
                this.aData.parent.edgeMargin = this.aData.edgeMargin;
            }
            
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["width"] = function(value){
            this.aData.fwidth = String(value);
            
            if (this.aData.fwidth.indexOf("/") > -1) {
                this.aData.fwidth = eval(this.aData.fwidth);
                if (this.aData.fwidth <= 1)
                    this.aData.fwidth = (this.aData.fwidth * 100) + "%";
            }
            
            if (this.aData.parent.children.length == 1)
                this.aData.parent.fwidth = this.aData.fwidth;
            
            l.queue(this.pHtmlNode, null, true);
        }
        this.__propHandlers["height"] = function(value){
            this.aData.fheight = String(value);
            
            if (this.aData.fheight.indexOf("/") > -1) {
                this.aData.fheight = eval(this.aData.fheight);
                if (this.aData.fheight <= 1)
                    this.aData.fheight = (this.aData.fheight * 100) + "%";
            }
            
            if (this.aData.parent.children.length == 1)
                this.aData.parent.fheight = this.aData.fheight;
            
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
    });
}
// #endif
