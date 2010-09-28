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

apf.__ANCHORING__ = 1 << 13;

// #ifdef __WITH_ANCHORING

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have anchoring features. Each side of the
 * element can be attached at a certain distance to it's parent's rectangle.
 * When the parent is resized the anchored side of the element stays
 * at the specified distance at all times. If both sides are anchored the
 * element size is changed to make sure the specified distance is maintained.
 * Example:
 * This example shows a bar that has 10% as a margin around it and contains a
 * frame that is displayed using different calculations and settings.
 * <code>
 *  <a:bar width="80%" height="80%" top="10%" left="10%">
 *      <a:frame 
 *        caption = "Example" 
 *        left    = "50%+10"
 *        top     = "100"
 *        right   = "10%"
 *        bottom  = "Math.round(0.232*100)" />
 *  </a:bar>
 * </code>
 * Remarks:
 * This is one of three positioning methods.
 * See {@link baseclass.alignment}
 * See {@link element.grid}
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.3
 */
apf.Anchoring = function(){
    this.$regbase = this.$regbase | apf.__ANCHORING__;
    this.$anchors = [];

    var VERTICAL   = 1;
    var HORIZONTAL = 2;

    this.$updateQueue = 0;
    this.$inited      =
    this.$parsed      =
    this.$anchoringEnabled = false;
    this.$hordiff     = 
    this.$verdiff     = 0;
    this.$rule_v      =
    this.$rule_h      =
    this.$rule_header = "";

    var l = apf.layout;
    
    this.$supportedProperties.push("anchors");
    
    var propHandlers = {
        "right" : function(value, prop){
            if (!this.$anchoringEnabled && !this.$setLayout("anchoring"))
                return;
            
            if (!value && value !== 0)
                this.$ext.style[prop] = "";

            //@note Removed apf.isParsing here to activate general queuing
            if (!this.$updateQueue)
                l.queue(this.$pHtmlNode, this);
            this.$updateQueue = this.$updateQueue | HORIZONTAL;
        },

        "bottom" : function(value, prop){
            if (!this.$anchoringEnabled && !this.$setLayout("anchoring"))
                return;

            if (!value && value !== 0)
                this.$ext.style[prop] = "";

            //@note Removed apf.isParsing here to activate general queuing            
            if (!this.$updateQueue)
                l.queue(this.$pHtmlNode, this);
            this.$updateQueue = this.$updateQueue | VERTICAL;
        }
    };
    propHandlers.left = propHandlers.width = propHandlers.right;
    propHandlers.top = propHandlers.height = propHandlers.bottom;
    
    this.$propHandlers["anchors"] = function(value){
        this.$anchors = value ? value.splitSafe("(?:, *| )") : [];

        if (!this.$anchoringEnabled && !this.$setLayout("anchoring"))
            return;

        if (!this.$updateQueue && apf.loaded)
            l.queue(this.$pHtmlNode, this);
        this.$updateQueue = this.$updateQueue | HORIZONTAL | VERTICAL;
    };

    /**
     * Turns anchoring off.
     *
     */
    this.$disableAnchoring = function(activate){
        //!this.$parsed || 
        if (!this.$inited || !this.$anchoringEnabled || !this.$pHtmlNode)
            return;

        l.removeRule(this.$pHtmlNode, this.$uniqueId + "_anchors");
        if (l.queue)
            l.queue(this.$pHtmlNode);

        for (var prop in propHandlers) {
            delete this.$propHandlers[prop];
        }

        this.removeEventListener("DOMNodeRemoved", remove); 
        this.removeEventListener("DOMNodeInserted", reparent); 

        if (this.$ext) {
            this.$ext.style.left   = 
            this.$ext.style.right  = 
            this.$ext.style.top    = 
            this.$ext.style.bottom = 
            this.$ext.style.width  = 
            this.$ext.style.height = 
            this.$ext.style.position = "";
        }
        
        /*if (this.right)
            this.$ext.style.left = apf.getHtmlLeft(this.$ext) + "px";

        if (this.bottom)
            this.$ext.style.top = apf.getHtmlTop(this.$ext) + "px";*/

        this.removeEventListener("prop.visible", visibleHandler);

        this.$inited   = false;
        this.$anchoringEnabled = false; //isn't this redundant?
    };

    /**
     * Enables anchoring based on attributes set in the AML of this element
     */
    /*
     * @attribute {Number, String} [left]   a way to determine the amount of pixels from the left border of this element to the left edge of it's parent's border. This attribute can also contain percentages, arithmetic and even full expressions.
     * Example:
     * <a:bar left="(20% + 10) * SOME_JS_VAR" />
     * @attribute {Number, String} [right]  a way to determine the amount of pixels from the right border of this element to the right edge of it's parent's border.This attribute can also contain percentages, arithmetic and even full expressions.
     * Example:
     * <a:bar right="(20% + 10) * SOME_JS_VAR" />
     * @attribute {Number, String} [width]  a way to determine the amount of pixels from the left border to the right border of this element.This attribute can also contain percentages, arithmetic and even full expressions.
     * Example:
     * <a:bar width="(20% + 10) * SOME_JS_VAR" />
     * @attribute {Number, String} [top]    a way to determine the amount of pixels from the top border of this element to the top edge of it's parent's border.This attribute can also contain percentages, arithmetic and even full expressions.
     * Example:
     * <a:bar top="(20% + 10) * SOME_JS_VAR" />
     * @attribute {Number, String} [bottom] a way to determine the amount of pixels from the bottom border of this element to the bottom edge of it's parent's border.This attribute can also contain percentages, arithmetic and even full expressions.
     * Example:
     * <a:bar bottom="(20% + 10) * SOME_JS_VAR" />
     * @attribute {Number, String} [height] a way to determine the amount of pixels from the top border to the bottom border of this element.This attribute can also contain percentages, arithmetic and even full expressions.
     * Example:
     * <a:bar height="(20% + 10) * SOME_JS_VAR" />
     */
    this.$enableAnchoring = function(){
        if (this.$inited) //@todo add code to reenable anchoring rules (when showing)
            return;

        /**** Properties and Attributes ****/
        apf.extend(this.$propHandlers, propHandlers);

        /**** Event handlers ****/
        this.addEventListener("DOMNodeRemoved", remove); 
        this.addEventListener("DOMNodeInserted", reparent); 
        this.addEventListener("prop.visible", visibleHandler);

        this.$updateQueue = 0 
            | ((this.left || this.width || this.right || this.anchors) && HORIZONTAL) 
            | ((this.top || this.height || this.bottom || this.anchors) && VERTICAL) ;

        if (this.$updateQueue)
            l.queue(this.$pHtmlNode, this);

        this.$inited   = true;
        this.$anchoringEnabled = true;
    };
    
    function visibleHandler(e){
        if (!(this.$rule_header || this.$rule_v || this.$rule_h))
            return;

        if (e.value) {
            if (this.$rule_v || this.$rule_h) {
                var rules = this.$rule_header + "\n" + this.$rule_v + "\n" + this.$rule_h;
                l.setRules(this.$pHtmlNode, this.$uniqueId + "_anchors", rules);
                //this.$ext.style.display = "none";
                l.queue(this.$pHtmlNode, this);
            }
            l.processQueue();
        }
        else {
            l.removeRule(this.$pHtmlNode, this.$uniqueId + "_anchors");
            l.queue(this.$pHtmlNode)
        }
    }
    
    function remove(e){
        if (e && (e.$doOnlyAdmin || e.currentTarget != this))
            return;

        if (l.queue && this.$pHtmlNode) {
            l.removeRule(this.$pHtmlNode, this.$uniqueId + "_anchors");
            l.queue(this.$pHtmlNode)
        }
    }

    function reparent(e){
        if (!this.$amlLoaded || e.currentTarget != this)
            return;

        if (!e.$isMoveWithinParent && this.$parsed) //@todo hmm weird state check
            this.$moveAnchoringRules(e.$oldParentHtmlNode);
        //else if (e.relatedNode == this) //@todo test this
            //e.currentTarget.$setLayout("anchoring");
    }

    this.$moveAnchoringRules = function(oldParent, updateNow){
        var rules = oldParent && l.removeRule(oldParent, this.$uniqueId + "_anchors");
        if (rules)
            l.queue(oldParent);

        if (!this.$rule_v && !this.$rule_h && !this.$rule_header)
            return;

        this.$rule_header = getRuleHeader.call(this);
        rules = this.$rule_header + "\n" + this.$rule_v + "\n" + this.$rule_h;

        //@todo sometimes the content is not displayed anymore (when reparenting by xinclude)
        //this.$ext.style.display = "none";

        l.setRules(this.$pHtmlNode, this.$uniqueId + "_anchors", rules);
        l.queue(this.$pHtmlNode, this);
    };

    this.$hasAnchorRules = function(){
        return this.$rule_v || this.$rule_h ? true : false;
    };

    function getRuleHeader(){
        if (!this.$pHtmlDoc) return "";
        return "try{\
            var oHtml = " + (apf.hasHtmlIdsInJs
                ? this.$ext.getAttribute("id")
                : "document.getElementById('"
                    + this.$ext.getAttribute("id") + "')") + ";\
            \
            var pWidth = " + (this.$pHtmlNode == this.$pHtmlDoc.body
                ? "apf.getWindowWidth()" //@todo only needed for debug?
                : "apf.getHtmlInnerWidth(oHtml.parentNode)") + ";\
            \
            var pHeight = " + (this.$pHtmlNode == this.$pHtmlDoc.body
                ? "apf.getWindowHeight()" //@todo only needed for debug?
                : "apf.getHtmlInnerHeight(oHtml.parentNode)") + ";\
            }catch(e){\
            }";
    }

    /**
     * @macro
     */
    function setPercentage(expr, value){
        return String(expr).replace(apf.percentageMatch, "((" + value + " * $1)/100)");
    }

     //#ifdef __WITH_SKIN_CHANGE
    this.$recalcAnchoring = function(queueDelay){
        this.$updateQueue = this.$updateQueue | HORIZONTAL | VERTICAL;
        this.$updateLayout();
        l.queue(this.$pHtmlNode, this);
        
        if (!queueDelay)
            l.processQueue();
    };
    //#endif

    function visCheck(){
        if (this.$updateQueue) {
            this.$updateLayout();
            apf.layout.activateRules(this.$ext.parentNode);
        }
    }

    this.$updateLayout = function(){
        if (!this.$anchoringEnabled)
            return;

        if (!apf.window.vManager.check(this, "anchoring", visCheck))
            return;

        if (!this.$parsed) {
            if (!this.$ext.getAttribute("id"))
                apf.setUniqueHtmlId(this.$ext);

            this.$rule_header = getRuleHeader.call(this);
            this.$parsed      = true;
        }

        if (!this.$updateQueue) {
            if (this.visible && this.$ext.style.display == "none")
                this.$ext.style.display = "";
            return;
        }

        if (this.draggable == "relative") {
            if ("absolute|fixed|relative".indexOf(apf.getStyle(this.$ext, "position")) == -1) //@todo apf3.1 the IDE doesn't like this
                this.$ext.style.position = "absolute";
        }
        else if (this.left || this.left ===  0 || this.top || this.top === 0 
          || this.right || this.right === 0 || this.bottom || this.bottom === 0 
          || this.$anchors.length) {
            if ("absolute|fixed".indexOf(apf.getStyle(this.$ext, "position")) == -1)
                this.$ext.style.position = "absolute";
        }
        else if (!this.center) {
            if ("absolute|fixed|relative".indexOf(apf.getStyle(this.$ext, "position")) == -1)
                this.$ext.style.position = "relative";
            if (!this.width)
                this.$ext.style.width    = "";
            if (!this.height)
                this.$ext.style.height   = "";
        }

        var rules;
        if (this.$updateQueue & HORIZONTAL) {
            rules = [];
            
            this.$hordiff = apf.getWidthDiff(this.$ext);

            var left  = this.$anchors[3] || this.left,
                right = this.$anchors[1] || this.right,
                width = this.width, hasLeft = left || left === 0,
                hasRight = right || right === 0, 
                hasWidth = width || width === 0;

            if (right && typeof right == "string")
                right = setPercentage(right, "pWidth");

            if (hasLeft) {
                if (parseInt(left) != left) {
                    left = setPercentage(left,  "pWidth");
                    rules.push("oHtml.style.left = (" + left + ") + 'px'");
                }
                else
                    this.$ext.style.left = left + "px";
            }
            if ((apf.hasStyleAnchors || !hasLeft) && hasRight) {
                if (parseInt(right) != right) {
                    right = setPercentage(right, "pWidth");
                    rules.push("oHtml.style.right = (" + right + ") + 'px'");
                }
                else
                    this.$ext.style.right = right + "px";
            }

            if (hasLeft && hasRight) { //right != null && left != null) {
                if (!apf.hasStyleAnchors)
                    rules.push("oHtml.style.width = (pWidth - (" + right
                        + ") - (" + left + ") - " + this.$hordiff + ") + 'px'");
                else
                    this.$ext.style.width = "";
            }
            else if (hasWidth && typeof this.maxwidth == "number" && typeof this.minwidth == "number") {
                if (parseInt(width) != width) {
                    width = setPercentage(width, "pWidth");
                    rules.push("oHtml.style.width = Math.max(" 
                        + (this.minwidth - this.$hordiff)
                        + ", Math.min(" + (this.maxwidth - this.$hordiff) + ", "
                        + width + " - " + this.$hordiff + ")) + 'px'");
                }
                else {
                    this.$ext.style.width = ((width > this.minwidth
                        ? (width < this.maxwidth
                            ? width
                            : this.maxwidth)
                        : this.minwidth) - this.$hordiff) + "px";
                }
            }

            this.$rule_h = (rules.length
                ? "try{" + rules.join(";}catch(e){};try{") + ";}catch(e){};"
                : "");
        }

        if (this.$updateQueue & VERTICAL) {
            rules = [];

            this.$verdiff = apf.getHeightDiff(this.$ext);

            var top    = this.$anchors[0] || this.top,
                bottom = this.$anchors[2] || this.bottom,
                height = this.height, hasTop = top || top === 0,
                hasBottom = bottom || bottom === 0, 
                hasHeight = height || height === 0;

            if (bottom && typeof bottom == "string")
                bottom = setPercentage(bottom, "pHeight");

            if (hasTop) {
                if (parseInt(top) != top) {
                    top = setPercentage(top, "pHeight");
                    rules.push("oHtml.style.top = (" + top + ") + 'px'");
                }
                else
                    this.$ext.style.top = top + "px";
            }
            if ((apf.hasStyleAnchors || !hasTop) && hasBottom) {
                if (parseInt(bottom) != bottom) {
                    rules.push("oHtml.style.bottom = (" + bottom + ") + 'px'");
                }
                else
                    this.$ext.style.bottom = bottom + "px";
            }
            if (hasTop && hasBottom) { //bottom != null && top != null) {
                if (!apf.hasStyleAnchors)
                    rules.push("oHtml.style.height = (pHeight - (" + bottom +
                        ") - (" + top + ") - " + this.$verdiff + ") + 'px'");
                else
                    this.$ext.style.height = "";
            }
            else if (hasHeight && typeof this.minheight == "number") {
                if (parseInt(height) != height) {
                    height = setPercentage(height, "pHeight");
                    rules.push("oHtml.style.height = Math.max(" 
                        + (this.minheight - this.$verdiff)
                        + ", Math.min(" + (this.maxheight - this.$verdiff) + ", "
                        + height + " - " + this.$verdiff + ")) + 'px'");
                }
                else {
                    this.$ext.style.height = Math.max(0, (height > this.minheight
                        ? (height < this.maxheight
                            ? height
                            : this.maxheight)
                        : this.minheight) - this.$verdiff) + "px";
                }
            }

            this.$rule_v = (rules.length
                ? "try{" + rules.join(";}catch(e){};try{") + ";}catch(e){};"
                : "");
        }

        if (this.$rule_v || this.$rule_h) {
            l.setRules(this.$pHtmlNode, this.$uniqueId + "_anchors",
                this.$rule_header + "\n" + this.$rule_v + "\n" + this.$rule_h, true);
        }
        else {
            l.removeRule(this.$pHtmlNode, this.$uniqueId + "_anchors");
        }

        this.$updateQueue = 0;
        
        if (this.$box && !apf.hasFlexibleBox) //temporary fix
            apf.layout.forceResize(this.$ext);
    };

    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        //if (this.$updateQueue)
            //this.$updateLayout();
    });

    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        this.$disableAnchoring();
    });
};

// #endif
