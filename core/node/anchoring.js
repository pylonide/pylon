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

__ANCHORING__ = 1 << 13;

// #ifdef __WITH_ANCHORING

/**
 * Baseclass adding Anchoring features to this Component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.3
 */
jpf.Anchoring = function(){
    this.__regbase = this.__regbase | __ANCHORING__;
    
    var VERTICAL   = 1;
    var HORIZONTAL = 2;

    var l = jpf.layoutServer, inited = false, updateQueue = 0,
        hordiff, verdiff, pWidth, pHeight, id, inited, parsed, disabled;
    
    /**
     * Turns anchoring off.
     *
     */
    this.disableAnchoring = function(activate){
        if (!parsed || !inited || disabled) 
            return;
        
        jpf.layoutServer.removeRule(this.pHtmlNode, this.uniqueId + "h");
        jpf.layoutServer.removeRule(this.pHtmlNode, this.uniqueId + "v");
        
        l.queue(this.pHtmlNode);
        
        disabled = true;
    }
    
    /**
     * Enables anchoring based on attributes set in the JML of this component
     *
     * @param  {Boolean}  activate  optional  true  the anchoring rules are activated.
     *                                      false  default  the anchoring rules remain unactivated.
     *
     * @attribute  {Integer}  left   optional  Integer specifying the amount of pixels from the left border of this component to the left edge of it's parent's border.
     * @attribute  {Integer}  right  optional  Integer specifying the amount of pixels from the right border of this component to the right edge of it's parent's border.
     * @attribute  {Integer}  width  optional  Integer specifying the amount of pixels from the left border to the right border of this component.
     * @attribute  {Integer}  top    optional  Integer specifying the amount of pixels from the top border of this component to the top edge of it's parent's border.
     * @attribute  {Integer}  bottom optional  Integer specifying the amount of pixels from the bottom border of this component to the bottom edge of it's parent's border.
     * @attribute  {Integer}  height optional  Integer specifying the amount of pixels from the top border to the bottom border of this component.
     */
    this.enableAnchoring = function(){
        if (inited) //@todo add code to reenable anchoring rules (when showing)
            return;
            
        this.__supportedProperties.push("right", "bottom", "width", 
            "left", "top", "height");
        
        this.__propHandlers["left"]  = 
        this.__propHandlers["width"] = 
        this.__propHandlers["right"] = function(value){
            if (!updateQueue && jpf.loaded)
                l.queue(this.pHtmlNode, this);
            updateQueue = updateQueue | HORIZONTAL;
        };
        
        this.__propHandlers["top"]    = 
        this.__propHandlers["height"] = 
        this.__propHandlers["bottom"] = function(value){
            if (!updateQueue && jpf.loaded)
                l.queue(this.pHtmlNode, this);
            updateQueue = updateQueue | VERTICAL;
        };
        
        //Reset previous rules here??
        
        inited   = true;
    }
    
    /**
     * @private
     */
    this.moveAnchoringRules = function(newParent, updateNow){
        var rules = [jpf.layoutServer.getRules(this.pHtmlNode,
            this.uniqueId + "h"), jpf.layoutServer.getRules(this.pHtmlNode,
            this.uniqueId + "v")];
        
        this.disableAnchoring();
        if (updateNow) 
            jpf.layoutServer.activateRules(this.pHtmlNode);
        
        jpf.layoutServer.setRules(newParent, this.uniqueId + "h", rules[0]);
        jpf.layoutServer.setRules(newParent, this.uniqueId + "v", rules[1]);
        
        //if (updateNow) 
            //jpf.layoutServer.activateRules(newParent);
        l.queue(newParent);
        
        pWidth = (newParent == this.pHtmlDoc.body
            ? (jpf.isIE ? "document.documentElement.offsetWidth" : "window.innerWidth")
            : id + ".parentNode.offsetWidth");
        
        pHeight = (newParent == this.pHtmlDoc.body
            ? (jpf.isIE ? "document.documentElement.offsetHeight" : "window.innerHeight")
            : id + ".parentNode.offsetHeight");
    }
    
    /**
     * @macro
     */
    function setPercentage(expr, value){
        return expr.replace(jpf.percentageMatch, "((" + value + " * $1)/100)");
    }
    
    this.__updateLayout = function(){
        if (!parsed) {
            if (!this.oExt.getAttribute("id")) 
                jpf.setUniqueHtmlId(this.oExt);
            
            var diff = jpf.getDiff(this.oExt);
            hordiff  = diff[0];
            verdiff  = diff[1];
            id       = jpf.hasHtmlIdsInJs 
                ? this.oExt.getAttribute("id")
                : "document.getElementById('" + this.oExt.getAttribute("id") + "')";
            pWidth   = this.oExt.parentNode == this.pHtmlDoc.body
                ? (jpf.isIE ? "document.documentElement.offsetWidth" : "window.innerWidth")
                : id + ".parentNode.offsetWidth";
            pHeight = (this.oExt.parentNode == this.pHtmlDoc.body
                ? (jpf.isIE ? "document.documentElement.offsetHeight" : "window.innerHeight")
                : id + ".parentNode.offsetHeight");
            
            parsed = true;
        }
        
        this.oExt.style.position = this.left || this.top || this.right || this.bottom 
            ? "absolute" 
            : "relative";
        
        var rules;
        
        if (updateQueue & HORIZONTAL) {
            rules = [];
            
            var left  = this.left;
            var right = this.right;
            var width = this.width;
            
            if (right && typeof right == "string")
                right = setPercentage(right, pHeight);
            
            if (left) {
                if (parseInt(left) != left) {
                    left = setPercentage(left,  pWidth);
                    rules.push(id + ".style.left = (" 
                        + left + ") + 'px'");
                }
                else 
                    this.oExt.style.left = left + "px";
            }
            if (!left && right) {
                if (parseInt(right) != right) {
                    right = setPercentage(right, pWidth);
                    rules.push(id + ".style.right = (" + right + ") + 'px'");
                }
                else 
                    this.oExt.style.right = right + "px";
            }
            if (width) {
                if (parseInt(width) != width) {
                    width = setPercentage(width, pWidth);
                    rules.push(id + ".style.width = (" 
                        + width + " - " + hordiff + ") + 'px'");
                }
                else 
                    this.oExt.style.width = (width - hordiff) + "px";
            }
            
            if (right != null && left != null) 
                rules.push(id + ".style.width = (" + pWidth + " - (" + right 
                    + ") - (" + left + ") - " + hordiff + "), 'px'");
            /*selse if (right == null && left == null) 
                rules.push(id + ".style.left = ((" + pWidth + " - " +
                    (width || id + ".offsetWidth") + ")/2) + 'px'");*/
            else if (right != null) 
                rules.push(id + ".style.left = (" + pWidth + " - " + right +
                    " - " + (width || id + ".offsetWidth") + ") + 'px'");

            jpf.layoutServer.setRules(this.pHtmlNode, this.uniqueId + "h", 
                (rules.length 
                    ? "try{" + rules.join(";}catch(e){};try{") + ";}catch(e){};" 
                    : ""), 
                true);
        }
        
        if (updateQueue & VERTICAL) {
            rules = [];
            
            var top    = this.top;
            var bottom = this.bottom;
            var height = this.height;
            
            if (bottom && typeof bottom == "string")
                bottom = setPercentage(bottom, pHeight);
            
            if (top) {
                if (parseInt(top) != top) {
                    top = setPercentage(top, pHeight);
                    rules.push(id + ".style.top = (" + top + ") + 'px'");
                }
                else 
                    this.oExt.style.top = top + "px";
            }
            if (!top && bottom) {
                if (parseInt(bottom) != bottom) {
                    rules.push(id + ".style.bottom = (" + bottom + ") + 'px'");
                }
                else 
                    this.oExt.style.bottom = bottom + "px";
            }
            if (height) {
                if (parseInt(height) != height) {
                    height = setPercentage(height, pHeight);
                    rules.push(id + ".style.height = (" + height + " - " + verdiff + ") + 'px'");
                }
                else 
                    this.oExt.style.height = (height - verdiff) + "px";
            }
            
            if (bottom != null && top != null) 
                rules.push(id + ".style.height = (" + pHeight + " - (" + bottom +
                    ") - (" + top + ") - " + verdiff + ") + 'px'");
            /*else if (bottom == null && top == null) 
                rules.push(id + ".style.top = ((" + pHeight + " - " +
                    (height || id + ".offsetHeight") + ")/2) + 'px'");*/
            else if (bottom != null) 
                rules.push(id + ".style.top = (" + pHeight + " - " + bottom + " - " +
                    (height || id + ".offsetHeight") + "), 'px'");
            
            jpf.layoutServer.setRules(this.pHtmlNode, this.uniqueId + "v", 
                (rules.length 
                    ? "try{" + rules.join(";}catch(e){};try{") + ";}catch(e){};" 
                    : ""), 
                true);
        }
        
        updateQueue = 0;
        disabled = false;
    }
    
    this.__addJmlLoader(function(){
        if (updateQueue)
            this.__updateLayout();
    });
}

// #endif
