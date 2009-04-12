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

var __ALIGNMENT__ = 1 << 12;

// #ifdef __WITH_ALIGNMENT

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have alignment features. 
 * An element can be aligned to any side of its parent's rectangle. Multiple elements can
 * be aligned to the same side; these are then stacked. Layouts created using
 * alignment, with or without vbox/hbox elements can be stored in xml format.
 * These can then be loaded and saved for later use. Using this technique it's
 * possible to offer a layout manager to your users from within your application.
 * This layout manager could then allow the user to choose between several
 * layouts and save new ones.
 * Example:
 * An Outlook-like layout in JML
 * <code>
 * <j:toolbar   align = "top-1"          height = "40" />
 * <j:tree      align = "left-splitter"  width  = "20%" />
 * <j:datagrid  align = "right-splitter" height = "50%" />
 * <j:text      align = "right" />
 * <j:statusbar align = "bottom-2"       height = "20" />
 * </code>
 * Remarks:
 * This is one of three positioning methods.
 * See {@link element.grid}
 * See {@link baseclass.anchoring}
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.Alignment = function(){
    this.$regbase = this.$regbase | __ALIGNMENT__;

    var l = jpf.layout;

    /**
     * @attribute {Boolean} docking whether this element can function as a dockable section of the layout.
     */
    this.dock = false;
    this.dockable = false;
    this.$booleanProperties["dock"] = true;
    this.$booleanProperties["dockable"] = true;
    this.$supportedProperties.push("dock", "dockable");

    this.$propHandlers["width"]  =
    this.$propHandlers["height"] = function(value){};

    /**** DOM Hooks ****/
    this.$domHandlers["remove"].push(remove);
    this.$domHandlers["reparent"].push(reparent);

    this.$hide = function(){
        this.oExt.style.display = "block";
        this.aData.prehide();
        this.purgeAlignment();
    };

    this.$show = function(){
        if (this.aData.preshow() !== false)
            this.oExt.style.display = "none";
        this.purgeAlignment();
    };

    /**
     * Turns the alignment features off.
     * @param  {Boolean} [purge] whether alignment is recalculated right after setting the property.
     */
    //var lastPosition, jmlNode = this;
    this.disableAlignment = function(purge){
        if (!this.aData) return;

        remove.call(this);
    };

    /**
     * Turns the alignment features on.
     *
     */
    this.enableAlignment = function(purge){
        var buildParent = "vbox|hbox".indexOf(this.parentNode.tagName) == -1
            && !this.parentNode.pData;

        var layout = l.get(this.pHtmlNode, buildParent
            ? jpf.getBox(this.parentNode.margin || this.pHtmlNode.getAttribute("margin") || "")
            : null);

        if (buildParent) {
            this.parentNode.pData = l.parseXml(
                this.parentNode.$jml || jpf.getXml("<vbox />"),
                layout, "vbox", true);

            layout.root = this.parentNode.pData;
        }

        if (!this.aData)
            this.aData = l.parseXml(this.$jml, layout, this, true); //not recur?

        //#ifdef __WITH_ALIGN_TEMPLATES
        if (this.align || this.$jml.getAttribute("align")) {
            l.addAlignNode(this, layout.root);

            if (this.aData.hidden || this.$jml.getAttribute("visible") == "false")
                this.aData.prehide(true);

            if (!jpf.isParsing || jpf.parsingFinalPass) //buildParent &&
                this.purgeAlignment();
        }
        else
        //#endif
        {
            var pData = this.parentNode.aData || this.parentNode.pData;
            this.aData.stackId = pData.children.push(this.aData) - 1;
            this.aData.parent = pData;
        }
    };

    /**
     * Calculates the rules for this element and activates them.
     * @private
     */
    this.purgeAlignment = function(){
        var layout = l.get(this.pHtmlNode);
        l.queue(this.pHtmlNode, null, layout.root);
    };

    function remove(doOnlyAdmin){
        if (doOnlyAdmin)
            return;

        if (this.aData) {
            this.aData.remove();
            this.purgeAlignment();

            if (this.parentNode.pData && !this.parentNode.pData.children.length) {
                l.removeAll(this.parentNode.pData);
                this.parentNode.pData = null;
            }

            this.oExt.style.display = "none";
        }
    }

    //@todo support inserbefore for align templates
    function reparent(beforeNode, pNode, withinParent, oldParent){
        if (!this.$jmlLoaded)
            return;

        if (!withinParent && this.aData) {
            this.aData.pHtml = this.pHtmlNode;
            //this.aData = null;
            this.enableAlignment();
        }
    }

    //@todo problem with determining when aData.parent | also with weight and minwidth
    this.$addJmlLoader(function(){
        /**
         * @attribute  {String} align       the edge of the parent to which this element aligns. Possible values are a combination of: "left", "middle", "right", "top", "bottom" and "slider" and optionally a size.
         * Example:
         * <code>
         *  <j:tree align="left-splitter-3" />
         * </code>
         * @attribute  {String} lean        the position of element when it is ambiguous.
         *   Possible values:
         *   right  the element leans towards the right
         *   bottom the element leans towards the bottom
         * @attribute  {Number} edge        the size of the edge of the space between this and the neighbouring element to the right or top. If the value of this attribute is smaller than that of the splitter, the edge will be the size of the splitter.
         * @attribute  {Number} weight      the factor (between 0 and 1) this element takes when no width is specified. The factor is calculated by doing (weight/totalweight) * space available in parent. Based on the parent being a vbox or hbox this attribute calculates either the element's width or height.
         * @attribute  {Number} splitter    the size of splitter that is placed between this and the neighbouring element to the right or top. When not specified, the splitter is not displayed.
         * @attribute  {Number} minwidth    the minimum horizontal size of this element.
         * @attribute  {Number} minheight   the minimum vertical size of this element.
         */
        this.$supportedProperties.push("align", "lean", "edge", "weight",
            "splitter", "width", "height", "minwidth", "minheight");

        //#ifdef __WITH_ALIGN_TEMPLATES
        this.$propHandlers["align"] = function(value){
            this.aData.remove();
            this.aData.template   = value;
            this.splitter         = undefined;
            this.aData.edgeMargin = this.edge || 0;
            this.enableAlignment();
        };
        //#endif

        this.$propHandlers["lean"] = function(value){
            this.aData.isBottom = (value || "").indexOf("bottom") > -1;
            this.aData.isRight = (value || "").indexOf("right") > -1;
            this.purgeAlignment();
        };

        this.$propHandlers["edge"] = function(value){
            this.aData.edgeMargin = Math.max(this.aData.splitter || 0, value != "splitter" ? value : 0);
            this.aData.splitter   = value == "splitter" ? 5 : false;
            this.purgeAlignment();
        };

        this.$propHandlers["weight"] = function(value){
            this.aData.weight = parseFloat(value);
            this.purgeAlignment();
        };

        this.$propHandlers["splitter"] = function(value){
            this.aData.splitter = value ? 5 : false;
            this.aData.edgeMargin = Math.max(this.aData.splitter || 0, this.edge || 0);

            if (!value && this.align && this.align.indexOf("-splitter"))
                this.align = this.aData.template = this.align.replace("-splitter", "");

            this.purgeAlignment();
        };

        this.$propHandlers["width"] = function(value){
            this.width = null; //resetting this property because else we can't reset, when we have a fast JIT we'll do setProperty in onresize
            this.aData.fwidth = value || false;

            if (this.aData.fwidth && this.aData.fwidth.indexOf("/") > -1) {
                this.aData.fwidth = eval(this.aData.fwidth);
                if (this.aData.fwidth <= 1)
                    this.aData.fwidth = (this.aData.fwidth * 100) + "%";
            }

            this.purgeAlignment();
        };

        this.$propHandlers["height"] = function(value){
            this.height = null; //resetting this property because else we can't reset, when we have a fast JIT we'll do setProperty in onresize
            this.aData.fheight = String(value) || false;

            if (this.aData.fheight && this.aData.fheight.indexOf("/") > -1) {
                this.aData.fheight = eval(this.aData.fheight);
                if (this.aData.fheight <= 1)
                    this.aData.fheight = (this.aData.fheight * 100) + "%";
            }

            this.purgeAlignment();
        };

        this.$propHandlers["minwidth"] = function(value){
            this.aData.minwidth = value;
            this.purgeAlignment();
        };

        this.$propHandlers["minheight"] = function(value){
            this.aData.minheight = value;
            this.purgeAlignment();
        };
    });

    this.$jmlDestroyers.push(function(){
        this.disableAlignment();
    });
};
// #endif
