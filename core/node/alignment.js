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
     * @attribute  align
     * @attribute  splitter
     * @attribute  edge
     * @attribute  minwidth
     * @attribute  minheight
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
                    vbox.loadJML(jpf.XMLDatabase.getXml("<vbox margin='"
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
        
        if (purge) 
            this.purgeAlignment();
    }
    
    /**
     * Calculate the rules for this component and activates them.
     *
     */
    this.purgeAlignment = function(){
        jpf.layoutServer.queue(this.pHtmlNode, true);
    }
    
    if (this.__addJmlLoader) {
        this.__addJmlLoader(function(x){
            this.dock = !jpf.isFalse(x.getAttribute("dock"));
        });
    }
}
// #endif
