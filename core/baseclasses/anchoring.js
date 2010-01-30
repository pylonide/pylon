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
 * @author      Ruben Daniels (ruben AT javeline DOT com)
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
            
            if (!value)
                this.$ext.style[prop] = "";

            //@note Removed apf.isParsing here to activate general queuing
            if (!this.$updateQueue)
                l.queue(this.$pHtmlNode, this);
            this.$updateQueue = this.$updateQueue | HORIZONTAL;
        },

        "bottom" : function(value, prop){
            if (!this.$anchoringEnabled && !this.$setLayout("anchoring"))
                return;

            if (!value)
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

        if (this.right)
            this.$ext.style.left = this.$ext.offsetLeft;

        if (this.bottom)
            this.$ext.style.top = this.$ext.offsetTop;

        this.removeEventListener("prop.visible", visibleHandler);

        this.$inited   = false;
        this.$anchoringEnabled = false; //isn't this redundant?
    };

    /**
     * Enables anchoring based on attributes set in the AML of this element
     *
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
        if (e && (e.$doOnlyAdmin || e.currentTarget == this))
            return;

        if (l.queue && this.$pHtmlNode) {
            l.removeRule(this.$pHtmlNode, this.$uniqueId + "_anchors");
            l.queue(this.$pHtmlNode)
        }
    }

    function reparent(e){
        if (!this.$amlLoaded || e.currentTarget != this)
            return;

        if (!e.$moveWithinParent && this.$parsed) //@todo hmm weird state check
            this.$moveAnchoringRules(e.$oldParentHtmlNode);
    }

    this.$moveAnchoringRules = function(oldParent, updateNow){
        var rules = oldParent && l.removeRule(oldParent, this.$uniqueId + "_anchors");
        if (rules)
            l.queue(oldParent);

        if (!this.$rule_v && !this.$rule_h)
            return;

        this.$rule_header = getRuleHeader.call(this);
        rules = this.$rule_header + "\n" + this.$rule_v + "\n" + this.$rule_h;

        this.$ext.style.display = "none";

        l.setRules(this.$pHtmlNode, this.$uniqueId + "_anchors", rules);
        l.queue(this.$pHtmlNode, this);
    };

    this.$hasAnchorRules = function(){
        return this.$rule_v || this.$rule_h ? true : false;
    };

    function getRuleHeader(){
        return "try{\
            var oHtml = " + (apf.hasHtmlIdsInJs
                ? this.$ext.getAttribute("id")
                : "document.getElementById('"
                    + this.$ext.getAttribute("id") + "')") + ";\
            \
            var pWidth = " + (this.$pHtmlNode == this.$pHtmlDoc.body
                ? "apf.getWindowWidth()" //@todo only needed for debug?
                : "oHtml.parentNode.offsetWidth") + ";\
            \
            var pHeight = " + (this.$pHtmlNode == this.$pHtmlDoc.body
                ? "apf.getWindowHeight()" //@todo only needed for debug?
                : "oHtml.parentNode.offsetHeight") + ";\
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
        var diff     = apf.getDiff(this.$ext);
        this.$hordiff = diff[0];
        this.$verdiff = diff[1];
        
        this.$updateQueue = this.$updateQueue | HORIZONTAL | VERTICAL;
        this.$updateLayout();
        l.queue(this.$pHtmlNode, this);
        
        if (!queueDelay)
            l.processQueue();
    };
    //#endif

    this.$updateLayout = function(){
        //@todo review if this can be improved
        //#ifdef __WITH_PROPERTY_WATCH
        if (!this.$ext.offsetHeight && !this.$ext.offsetWidth) {
            var _self      = this;
            var propChange = function (name, old, value){
                if (_self.$updateQueue && apf.isTrue(value) && (_self.$ext.offsetWidth || _self.$ext.offsetHeight)) {
                    _self.$updateLayout();
                    apf.layout.activateRules(_self.$ext.parentNode);
                    
                    var p = _self;
                    while (p) {
                        p.unwatch("visible", propChange);
                        p = p.parentNode;
                    }
                    
                    _self.$isWaitingOnDisplay = false;
                }
            }

            this.$isWaitingOnDisplay = true;
            this.watch("visible", propChange);
            
            var p = this.parentNode;
            while(p) {
                p.watch("visible", propChange);
                p = p.parentNode;
            }
            
            return;
        }
        //#endif
        
        if (!this.$parsed) {
            if (!this.$ext.getAttribute("id"))
                apf.setUniqueHtmlId(this.$ext);

            var diff    = apf.getDiff(this.$ext);
            this.$hordiff     = diff[0];
            this.$verdiff     = diff[1];
            if (this.$getOption) {
                this.$minheight    = Math.max(parseInt(this.$getOption("main", "minheight")) || 0, parseInt(this.getAttribute("minheight")) || 0) || 0;
                this.$maxheight    = Math.min(parseInt(this.$getOption("main", "maxheight")) || 0, parseInt(this.getAttribute("maxheight")) || 100000) || 100000;
                this.$minwidth     = Math.max(parseInt(this.$getOption("main", "minwidth")) || 0, parseInt(this.getAttribute("minwidth")) || 0) || 0;
                this.$maxwidth     = Math.min(parseInt(this.$getOption("main", "maxwidth")) || 0, parseInt(this.getAttribute("maxwidth")) || 100000) || 100000;
            }
            else {
                this.$minheight    = 0;
                this.$maxheight    = 100000;
                this.$minwidth     = 0;
                this.$maxwidth     = 100000;
            }
            this.$rule_header = getRuleHeader.call(this);
            this.$parsed      = true;
        }

        if (!this.$updateQueue) {
            if (this.visible)
                this.$ext.style.display = "";
            return;
        }

        if (this.draggable == "relative") {
            if ("absolute|fixed|relative".indexOf(apf.getStyle(this.$ext, "position")) == -1) //@todo apf3.1 the IDE doesn't like this
                this.$ext.style.position = "absolute";
        }
        else if (this.left || this.top || this.right || this.bottom || this.$anchors.length) {
            if ("absolute|fixed".indexOf(apf.getStyle(this.$ext, "position")) == -1)
                this.$ext.style.position = "absolute";
        }

        var rules;
        if (this.$updateQueue & HORIZONTAL) {
            rules = [];

            var left  = this.left  || this.$anchors[3],
                right = this.right || this.$anchors[1],
                width = this.width;

            if (right && typeof right == "string")
                right = setPercentage(right, "pWidth");

            if (left) {
                if (parseInt(left) != left) {
                    left = setPercentage(left,  "pWidth");
                    rules.push("oHtml.style.left = (" + left + ") + 'px'");
                }
                else
                    this.$ext.style.left = left + "px";
            }
            if (!left && right) {
                if (parseInt(right) != right) {
                    right = setPercentage(right, "pWidth");
                    rules.push("oHtml.style.right = (" + right + ") + 'px'");
                }
                else
                    this.$ext.style.right = right + "px";
            }
            if (width) {
                if (parseInt(width) != width) {
                    width = setPercentage(width, "pWidth");
                    rules.push("oHtml.style.width = Math.max(" + this.$minwidth 
                        + ", Math.min(" + this.$maxwidth + ", "
                        + width + " - " + this.$hordiff + ")) + 'px'");
                }
                else {
                    this.$ext.style.width = (width > this.$hordiff + this.$minwidth
                        ? (width < this.$hordiff + this.$maxwidth
                            ? width - this.$hordiff
                            : this.$maxwidth)
                        : this.$minwidth) + "px";
                }
            }

            if (right != null && left != null) {
                rules.push("oHtml.style.width = (pWidth - (" + right
                    + ") - (" + left + ") - " + this.$hordiff + ") + 'px'");
            }

            this.$rule_h = (rules.length
                ? "try{" + rules.join(";}catch(e){};try{") + ";}catch(e){};"
                : "");
        }

        if (this.$updateQueue & VERTICAL) {
            rules = [];

            var top    = this.top    || this.$anchors[0],
                bottom = this.bottom || this.$anchors[2],
                height = this.height;

            if (bottom && typeof bottom == "string")
                bottom = setPercentage(bottom, "pHeight");

            if (top) {
                if (parseInt(top) != top) {
                    top = setPercentage(top, "pHeight");
                    rules.push("oHtml.style.top = (" + top + ") + 'px'");
                }
                else
                    this.$ext.style.top = top + "px";
            }
            if (!top && bottom) {
                if (parseInt(bottom) != bottom) {
                    rules.push("oHtml.style.bottom = (" + bottom + ") + 'px'");
                }
                else
                    this.$ext.style.bottom = bottom + "px";
            }
            if (height) {
                if (parseInt(height) != height) {
                    height = setPercentage(height, "pHeight");
                    rules.push("oHtml.style.height = Math.max(" + this.$minheight 
                        + ", Math.min(" + this.$maxheight + ", "
                        + height + " - " + this.$verdiff + ")) + 'px'");
                }
                else {
                    this.$ext.style.height = (height > this.$verdiff + this.$minheight
                        ? (height < this.$verdiff + this.$maxheight
                            ? height - this.$verdiff
                            : this.$maxheight)
                        : this.$minheight) + "px";
                }
            }

            if (bottom != null && top != null) {
                rules.push("oHtml.style.height = (pHeight - (" + bottom +
                    ") - (" + top + ") - " + this.$verdiff + ") + 'px'");
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
