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

var __ANCHORING__ = 1 << 13;

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
 *  <j:bar width="80%" height="80%" top="10%" left="10%">
 *      <j:frame title="Example"
 *          left    = "50%+10"
 *          top     = "100"
 *          right   = "10%"
 *          bottom  = "Math.round(0.232*100)" />
 *  </j:bar>
 * </code>
 * Remarks:
 * This is one of three positioning methods.
 * See {@link baseclass.alignment}
 * See {@link element.grid}
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.3
 */
jpf.Anchoring = function(){
    this.$regbase = this.$regbase | __ANCHORING__;
    this.$anchors = [];

    var VERTICAL   = 1;
    var HORIZONTAL = 2;

    var l = jpf.layout, inited = false, updateQueue = 0,
        hordiff, verdiff, rule_v = "", rule_h = "", rule_header,
        id, inited, parsed, disabled;

    /**
     * Turns anchoring off.
     *
     */
    this.disableAnchoring = function(activate){
        if (!parsed || !inited || disabled)
            return;

        l.removeRule(this.pHtmlNode, this.uniqueId + "_anchors");
        if (l.queue)
            l.queue(this.pHtmlNode);

        this.$propHandlers["anchors"] =
        this.$propHandlers["left"]   =
        this.$propHandlers["width"]  =
        this.$propHandlers["right"]  =
        this.$propHandlers["top"]    =
        this.$propHandlers["height"] =
        this.$propHandlers["bottom"] = null;

        this.$domHandlers["remove"].remove(remove);
        this.$domHandlers["reparent"].remove(reparent);

        if (this.right)
            this.oExt.style.left = this.oExt.offsetLeft;

        if (this.bottom)
            this.oExt.style.top = this.oExt.offsetTop;

        this.$hide = null;
        this.$show = null;

        inited   = false;
        disabled = true; //isn't this redundant?
    };

    /**
     * Enables anchoring based on attributes set in the JML of this element
     *
     * @attribute {Number, String} [left]   a way to determine the amount of pixels from the left border of this element to the left edge of it's parent's border. This attribute can also contain percentages, arithmetic and even full expressions.
     * Example:
     * <j:bar left="(20% + 10) * SOME_JS_VAR" />
     * @attribute {Number, String} [right]  a way to determine the amount of pixels from the right border of this element to the right edge of it's parent's border.This attribute can also contain percentages, arithmetic and even full expressions.
     * Example:
     * <j:bar right="(20% + 10) * SOME_JS_VAR" />
     * @attribute {Number, String} [width]  a way to determine the amount of pixels from the left border to the right border of this element.This attribute can also contain percentages, arithmetic and even full expressions.
     * Example:
     * <j:bar width="(20% + 10) * SOME_JS_VAR" />
     * @attribute {Number, String} [top]    a way to determine the amount of pixels from the top border of this element to the top edge of it's parent's border.This attribute can also contain percentages, arithmetic and even full expressions.
     * Example:
     * <j:bar top="(20% + 10) * SOME_JS_VAR" />
     * @attribute {Number, String} [bottom] a way to determine the amount of pixels from the bottom border of this element to the bottom edge of it's parent's border.This attribute can also contain percentages, arithmetic and even full expressions.
     * Example:
     * <j:bar bottom="(20% + 10) * SOME_JS_VAR" />
     * @attribute {Number, String} [height] a way to determine the amount of pixels from the top border to the bottom border of this element.This attribute can also contain percentages, arithmetic and even full expressions.
     * Example:
     * <j:bar height="(20% + 10) * SOME_JS_VAR" />
     */
    this.enableAnchoring = function(){
        if (inited) //@todo add code to reenable anchoring rules (when showing)
            return;

        /**** Properties and Attributes ****/

        this.$supportedProperties.push("right", "bottom", "width",
            "left", "top", "height", "anchors");

        this.$propHandlers["anchors"]  = function(value){
            this.$anchors = value.splitSafe("(?:, *| )");

            if (!updateQueue && jpf.loaded)
                l.queue(this.pHtmlNode, this);
            updateQueue = updateQueue | HORIZONTAL | VERTICAL;
        };

        this.$propHandlers["left"]  =
        this.$propHandlers["width"] =
        this.$propHandlers["right"] = function(value){
            if (!updateQueue && (!jpf.isParsing || jpf.parsingFinalPass))
                l.queue(this.pHtmlNode, this);
            updateQueue = updateQueue | HORIZONTAL;
        };

        this.$propHandlers["top"]    =
        this.$propHandlers["height"] =
        this.$propHandlers["bottom"] = function(value){
            if (!updateQueue && (!jpf.isParsing || jpf.parsingFinalPass))
                l.queue(this.pHtmlNode, this);
            updateQueue = updateQueue | VERTICAL;
        };

        /**** DOM Hooks ****/

        this.$domHandlers["remove"].push(remove);
        this.$domHandlers["reparent"].push(reparent);

        this.$hide = function(){
            if (!(rule_header || rule_v || rule_h))
                return;

            l.removeRule(this.pHtmlNode, this.uniqueId + "_anchors");
            l.queue(this.pHtmlNode)
        };

        this.$show = function(){
            if (!(rule_header || rule_v || rule_h))
                return;
            
            //@todo
            if (rule_v || rule_h) {
                rules = rule_header + "\n" + rule_v + "\n" + rule_h;
                l.setRules(this.pHtmlNode, this.uniqueId + "_anchors", rules);
                this.oExt.style.display = "none";
                l.queue(this.pHtmlNode, this);
            }
            
            l.processQueue();
        };

        inited   = true;
    };

    function remove(doOnlyAdmin){
        if (doOnlyAdmin)
            return;

        if (l.queue) {
            l.removeRule(this.pHtmlNode, this.uniqueId + "_anchors");
            l.queue(this.pHtmlNode)
        }
    }

    function reparent(beforeNode, pNode, withinParent, oldParent){
        if (!this.$jmlLoaded)
            return;

        if (!withinParent && !disabled && parsed) //@todo hmm weird state check
            this.$moveAnchoringRules(oldParent);
    }

    this.$moveAnchoringRules = function(oldParent, updateNow){
        var rules = l.removeRule(oldParent, this.uniqueId + "_anchors");
        if (rules)
            l.queue(oldParent);

        if (!rule_v && !rule_h)
            return;

        rule_header = getRuleHeader.call(this);
        rules = rule_header + "\n" + rule_v + "\n" + rule_h;

        this.oExt.style.display = "none";

        l.setRules(this.pHtmlNode, this.uniqueId + "_anchors", rules);
        l.queue(this.pHtmlNode, this);
    };

    this.$hasAnchorRules = function(){
        return rule_v || rule_h ? true : false;
    };

    this.$setAnchoringEnabled = function(){
        disabled = false;
    };

    function getRuleHeader(){
        return "try{\
            var oHtml = " + (jpf.hasHtmlIdsInJs
                ? this.oExt.getAttribute("id")
                : "document.getElementById('"
                    + this.oExt.getAttribute("id") + "')") + ";\
            \
            var pWidth = " + (this.pHtmlNode == this.pHtmlDoc.body
                ? (jpf.isIE
                    ? "document.documentElement.offsetWidth"
                    : "window.innerWidth")
                : "oHtml.parentNode.offsetWidth") + ";\
            \
            var pHeight = " + (this.pHtmlNode == this.pHtmlDoc.body
                ? (jpf.isIE
                    ? "document.documentElement.offsetHeight"
                    : "window.innerHeight")
                : "oHtml.parentNode.offsetHeight") + ";\
            }catch(e){\
            }";
    }

    /**
     * @macro
     */
    function setPercentage(expr, value){
        return String(expr).replace(jpf.percentageMatch, "((" + value + " * $1)/100)");
    }

    this.$updateLayout = function(){
        if (!parsed) {
            if (!this.oExt.getAttribute("id"))
                jpf.setUniqueHtmlId(this.oExt);

            var diff    = jpf.getDiff(this.oExt);
            hordiff     = diff[0];
            verdiff     = diff[1];
            rule_header = getRuleHeader.call(this);
            parsed      = true;
        }

        if (!updateQueue) {
            if (this.visible)
                this.oExt.style.display = "block";
            return;
        }

        if (this.left || this.top || this.right || this.bottom || this.$anchors.length) {
            //if ("absolute|fixed".indexOf(jpf.getStyle(this.oExt, "position")) == -1)
                this.oExt.style.position = "absolute";
        }

        var rules;

        if (updateQueue & HORIZONTAL) {
            rules = [];

            var left  = this.left || this.$anchors[3];
            var right = this.right || this.$anchors[1];
            var width = this.width;

            if (right && typeof right == "string")
                right = setPercentage(right, "pWidth");

            if (left) {
                if (parseInt(left) != left) {
                    left = setPercentage(left,  "pWidth");
                    rules.push("oHtml.style.left = (" + left + ") + 'px'");
                }
                else
                    this.oExt.style.left = left + "px";
            }
            if (!left && right) {
                if (parseInt(right) != right) {
                    right = setPercentage(right, "pWidth");
                    rules.push("oHtml.style.right = (" + right + ") + 'px'");
                }
                else
                    this.oExt.style.right = right + "px";
            }
            if (width) {
                if (parseInt(width) != width) {
                    width = setPercentage(width, "pWidth");
                    rules.push("oHtml.style.width = ("
                        + width + " - " + hordiff + ") + 'px'");
                }
                else
                    this.oExt.style.width = (width - hordiff) + "px";
            }

            if (right != null && left != null) {
                rules.push("oHtml.style.width = (pWidth - (" + right
                    + ") - (" + left + ") - " + hordiff + ") + 'px'");
            }

            rule_h = (rules.length
                ? "try{" + rules.join(";}catch(e){};try{") + ";}catch(e){};"
                : "");
        }

        if (updateQueue & VERTICAL) {
            rules = [];

            var top    = this.top || this.$anchors[0];
            var bottom = this.bottom || this.$anchors[2];
            var height = this.height;

            if (bottom && typeof bottom == "string")
                bottom = setPercentage(bottom, "pHeight");

            if (top) {
                if (parseInt(top) != top) {
                    top = setPercentage(top, "pHeight");
                    rules.push("oHtml.style.top = (" + top + ") + 'px'");
                }
                else
                    this.oExt.style.top = top + "px";
            }
            if (!top && bottom) {
                if (parseInt(bottom) != bottom) {
                    rules.push("oHtml.style.bottom = (" + bottom + ") + 'px'");
                }
                else
                    this.oExt.style.bottom = bottom + "px";
            }
            if (height) {
                if (parseInt(height) != height) {
                    height = setPercentage(height, "pHeight");
                    rules.push("oHtml.style.height = (" + height + " - " + verdiff + ") + 'px'");
                }
                else
                    this.oExt.style.height = (height - verdiff) + "px";
            }

            if (bottom != null && top != null) {
                rules.push("oHtml.style.height = (pHeight - (" + bottom +
                    ") - (" + top + ") - " + verdiff + ") + 'px'");
            }

            rule_v = (rules.length
                ? "try{" + rules.join(";}catch(e){};try{") + ";}catch(e){};"
                : "");
        }

        if (rule_v || rule_h) {
            l.setRules(this.pHtmlNode, this.uniqueId + "_anchors",
                rule_header + "\n" + rule_v + "\n" + rule_h, true);
        }
        else {
            l.removeRule(this.pHtmlNode, this.uniqueId + "_anchors");
        }

        updateQueue = 0;
        disabled = false;
    };

    this.$addJmlLoader(function(){
        if (updateQueue)
            this.$updateLayout();
    });

    this.$jmlDestroyers.push(function(){
        this.disableAnchoring();
    });
};

// #endif
