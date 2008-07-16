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
    
    if (!this.oExt.getAttribute("id")) 
        jpf.setUniqueHtmlId(this.oExt);

    var oHtmlDiff;
    
    /**
     * Turns anchoring off.
     *
     */
    this.disableAnchoring = function(activate){
        jpf.layoutServer.removeRule(this.pHtmlNode, this.uniqueId + "h");
        jpf.layoutServer.removeRule(this.pHtmlNode, this.uniqueId + "v");
        
        if (activate) 
            this.purgeAnchoring();
    }
    
    /**
     * Enables anchoring based on attributes set in the JML of this component
     *
     * @param  {Boolean}  activate  optional  true  the anchoring rules are activated.
     *                                      false  default  the anchoring rules remain unactivated.
     */
    this.enableAnchoring = function(activate){
        this.getDiff();
        
        var x = this.jml;
        this.setHorizontal(x.getAttribute("left"), x.getAttribute("right"), x.getAttribute("width"));
        
        this.setVertical(x.getAttribute("top"), x.getAttribute("bottom"), x.getAttribute("height"));
        
        if (activate) 
            this.purgeAnchoring();
    }
    
    this.getDiff = function(){
        oHtmlDiff = jpf.compat.getDiff(this.oExt);
    }
    
    /**
     * @private
     */
    this.moveAnchoringRules = function(newPNode, updateNow){
        var rules = [jpf.layoutServer.getRules(this.pHtmlNode,
            this.uniqueId + "h"), jpf.layoutServer.getRules(this.pHtmlNode,
            this.uniqueId + "v")];
        
        this.disableAnchoring();
        if (updateNow) 
            jpf.layoutServer.activateRules(this.pHtmlNode);
        
        jpf.layoutServer.setRules(newPNode, this.uniqueId + "h", rules[0]);
        jpf.layoutServer.setRules(newPNode, this.uniqueId + "v", rules[1]);
        if (updateNow) 
            jpf.layoutServer.activateRules(newPNode);
    }
    
    function setPercentage(value, pValue){
        return (typeof value == "string" ? value.replace(/(\d+)\%/g,
            "((" + pValue + " * $1)/100)") : value);
    }
    
    /**
     * Sets the horizontal anchoring rules for this component
     *
     * @param  {Integer}  left  optional  Integer specifying the amount of pixels from the left border of this component to the left edge of it's parent's border.
     * @param  {Integer}  right  optional  Integer specifying the amount of pixels from the right border of this component to the right edge of it's parent's border.
     * @param  {Integer}  width  optional  Integer specifying the amount of pixels from the left border to the right border of this component.
     * @param  {Boolean}  apply  optional  true  new anchoring rules are activated
     *                                   false  new anchoring rules are not activated
     */
    this.setHorizontal = function(left, right, width, apply){
        var rules = [];
        
        var id = this.oExt.getAttribute("id");
        if (!jpf.hasHtmlIdsInJs) id = "document.getElementById('" + id + "')";
        
        var pWidth = (this.oExt.parentNode == this.pHtmlDoc.body
            ? (jpf.isIE ? "document.documentElement.offsetWidth" : "window.innerWidth")
            : id + ".parentNode.offsetWidth");
        var hordiff = oHtmlDiff[0];
        
        left = setPercentage(left, pWidth);
        right = setPercentage(right, pWidth);
        width = setPercentage(width, pWidth);
        
        if (left) {
            if (parseInt(left) != left) 
                rules.push(id + ".style.left = (" + left + ") + 'px'");
            else 
                this.oExt.style.left = left + "px";
        }
        if (!left && right) {
            if (parseInt(right) != right) 
                rules.push(id + ".style.right = (" + right + ") + 'px'");
            else 
                this.oExt.style.right = right + "px";
        }
        if (width) {
            if (parseInt(width) != width) 
                rules.push(id + ".style.width = (" + width + " - " + hordiff + ") + 'px'");
            else 
                this.oExt.style.width = (width - hordiff) + "px";
        }
        
        if (right != null && left != null) 
            rules.push(id + ".style.width = (" + pWidth + " - (" + right + ") - (" +
                left + ") - " + hordiff + "), 'px'");
        else 
            if (right == null && left == null) 
                rules.push(id + ".style.left = ((" + pWidth + " - ",
                    (width || id + ".offsetWidth") + ")/2) + 'px'");
            else if (right != null) 
                rules.push(id + ".style.left = (" + pWidth + " - " + right +
                    " - " + (width || id + ".offsetWidth") + ") + 'px'");
        
        this.oExt.style.position = "absolute";
        
        rules = rules.length ? 'try{' + rules.join(';}catch(e){};try{') + ';}catch(e){};' : '';
        jpf.layoutServer.setRules(this.pHtmlNode, this.uniqueId + "h", rules, true);

        if (apply) {
            eval(rules);
            jpf.layoutServer.activateRules(this.pHtmlNode, true);
        }
    }
    
    /**
     * Sets the vertical anchoring rules for this component
     *
     * @param  {Integer}  top  optional  Integer specifying the amount of pixels from the top border of this component to the top edge of it's parent's border.
     * @param  {Integer}  bottom  optional  Integer specifying the amount of pixels from the bottom border of this component to the bottom edge of it's parent's border.
     * @param  {Integer}  height  optional  Integer specifying the amount of pixels from the top border to the bottom border of this component.
     * @param  {Boolean}  apply  optional  true  new anchoring rules are activated
     *                                    false  new anchoring rules are not activated
     */
    this.setVertical = function(top, bottom, height, apply){
        var rules = [];
        
        var id = this.oExt.getAttribute("id");
        if (!jpf.hasHtmlIdsInJs) id = "document.getElementById('" + id + "')";
        
        var pHeight = (this.oExt.parentNode == this.pHtmlDoc.body
            ? (jpf.isIE ? "document.documentElement.offsetHeight" : "window.innerHeight")
            : id + ".parentNode.offsetHeight");
        var verdiff = oHtmlDiff[1];
        
        top = setPercentage(top, pHeight);
        bottom = setPercentage(bottom, pHeight);
        height = setPercentage(height, pHeight);
        
        if (top) {
            if (parseInt(top) != top) 
                rules.push(id + ".style.top = (" + top + ") + 'px'");
            else 
                this.oExt.style.top = top + "px";
        }
        if (!top && bottom) {
            if (parseInt(bottom) != bottom) 
                rules.push(id + ".style.bottom = (" + bottom + ") + 'px'");
            else 
                this.oExt.style.bottom = bottom + "px";
        }
        if (height) {
            if (parseInt(height) != height) 
                rules.push(id + ".style.height = (" + height + " - " + verdiff + ") + 'px'");
            else 
                this.oExt.style.height = (height - verdiff) + "px";
        }
        
        if (bottom != null && top != null) 
            rules.push(id + ".style.height = (" + pHeight + " - (" + bottom +
                ") - (" + top + ") - " + verdiff + ") + 'px'");
        else if (bottom == null && top == null) 
            rules.push(id + ".style.top = ((" + pHeight + " - " +
                (height || id + ".offsetHeight") + ")/2) + 'px'");
        else if (bottom != null) 
            rules.push(id + ".style.top = (" + pHeight + " - " + bottom + " - " +
                (height || id + ".offsetHeight") + "), 'px'");
        
        this.oExt.style.position = "absolute";

        var rules = rules.length ? 'try{' + rules.join(';}catch(e){};try{') + ';}catch(e){};' : '';
        jpf.layoutServer.setRules(this.pHtmlNode, this.uniqueId + "v", rules, true);
        
        if (apply) {
            eval(rules);
            jpf.layoutServer.activateRules(this.pHtmlNode, true);
        }
    }
    
    /**
     * Activate the anchoring rules for this component.
     *
     */
    this.purgeAnchoring = function(){
        jpf.layoutServer.queue(this.pHtmlNode);
    }
}

// #endif
