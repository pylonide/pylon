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

apf.__ALIGNMENT__ = 1 << 12;

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
 * An Outlook-like layout in AML
 * <code>
 *  <a:toolbar   align = "top-1"          height = "40" />
 *  <a:tree      align = "left-splitter"  width  = "20%" />
 *  <a:datagrid  align = "right-splitter" height = "50%" />
 *  <a:text      align = "right" />
 *  <a:statusbar align = "bottom-2"       height = "20" />
 * </code>
 * Remarks:
 * This is one of three positioning methods.
 * See {@link element.grid}
 * See {@link baseclass.anchoring}
 *
 * @attribute {Boolean} dock whether this element can function as a dockable section of the layout.
 * @attrinfo  layout/align  dropdown
 * @default   false
 * @attribute {Boolean} dockable whether this element can be dragged to dock somewhere else
 * @attrinfo  layout/align  dropdown
 * @default   false

 * @attribute  {String} align       the edge of the parent to which this
 *                                  element aligns. Possible values are
 *                                  a combination of: "left", "middle",
 *                                  "right", "top", "bottom" and "slider"
 *                                  and optionally a size.
 * Example:
 * <code>
 *  <a:tree align="left-splitter-3" width="200" height="200">
 *      <a:item caption="root" icon="icoUsers.gif">
 *          <a:item icon="icoUsers.gif" caption="test">
 *              <a:item icon="icoUsers.gif" caption="test" />
 *              <a:item icon="icoUsers.gif" caption="test" />
 *              <a:item icon="icoUsers.gif" caption="test" />
 *          </a:item>
 *      </a:item>
 *  </a:tree>
 * </code>
 * @attrinfo  layout  textbox
 * @attribute  {String} lean        the position of element when it is ambiguous.
 *   Possible values:
 *   left   the element leans towards the left
 *   right  the element leans towards the right
 *   top    the element leans towards the top
 *   bottom the element leans towards the bottom
 * @attrinfo  layout/align  dropdown
 * @default   left
 * @attribute  {Number} edge        the size of the edge of the space between
 *                                  this and the neighbouring element to the
 *                                  right or top. If the value of this attribute
 *                                  is smaller than that of the splitter,
 *                                  the edge will be the size of the splitter.
 * @attrinfo  layout/align  slider
 * @default   4
 * @attribute  {Number} weight      the factor (between 0 and 1) this element
 *                                  takes when no width is specified. The factor
 *                                  is calculated by doing (weight/totalweight)
 *                                  * space available in parent. Based on
 *                                  the parent being a vbox or hbox this
 *                                  attribute calculates either the element's
 *                                  width or height.
 * @attrinfo  layout/align  slider
 * @default   1
 * @attribute  {Number} splitter    the size of splitter that is placed between
 *                                  this and the neighbouring element to the
 *                                  right or top. When not specified, the
 *                                  splitter is not displayed.
 * @attrinfo  layout/align  slider
 * @default   0
 * @attribute  {Number} minwidth    the minimum horizontal size of this element.
 * @attrinfo  layout  slider
 * @default   0
 * @attribute  {Number} minheight   the minimum vertical size of this element.
 * @attrinfo  layout  slider
 * @default   0

 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @default_private
 */
apf.Alignment = function(){
    this.$regbase = this.$regbase | apf.__ALIGNMENT__;

    var l = apf.layout;

    if (typeof this.dock == "undefined")
        this.dock = false;
    if (typeof this.dockable == "undefined")
        this.dockable = false;
    this.$booleanProperties["dock"] = true;
    this.$booleanProperties["dockable"] = true;
    this.$supportedProperties.push("dock", "dockable", "align", "lean", "edge",
        "weight", "splitter", "minwidth", "minheight");

    /**** DOM Hooks ****/

    /**
     * Turns the alignment features off.
     * @param  {Boolean} [purge] whether alignment is recalculated right after setting the property.
     */
    //var lastPosition, amlNode = this;
    this.$disableAlignment = function(purge){
        if (!this.aData || !this.$alignmentEnabled) 
            return;

        for (var prop in propHandlers)
            delete this.$propHandlers[prop];
        
        this.removeEventListener("DOMNodeRemoved", remove); 
        this.removeEventListener("DOMNodeInserted", reparent); 
        
        this.removeEventListener("prop.visible", visibleHandler);

        remove.call(this);
    };

    /**
     * Turns the alignment features on.
     *
     */
    this.$enableAlignment = function(purge){
        this.$alignmentEnabled = true;

        var buildParent = "vbox|hbox".indexOf(this.parentNode.tagName) == -1
            && !this.parentNode.pData;

        apf.extend(this.$propHandlers, propHandlers);

        this.addEventListener("DOMNodeRemoved", remove); 
        this.addEventListener("DOMNodeInserted", reparent); 
        this.addEventListener("prop.visible", visibleHandler);

        var layout = l.get(this.$pHtmlNode, buildParent
            ? apf.getBox(this.parentNode.margin || this.$pHtmlNode.getAttribute("margin") || "")
            : null);

        if (buildParent) {
            this.parentNode.pData = l.parseXml(
                this.parentNode || apf.getXml("<vbox />"),
                layout, "vbox", true);

            layout.root = this.parentNode.pData;
        }

        if (!this.aData)
            this.aData = l.parseXml(this, layout, this, true); //not recur?

        //#ifdef __WITH_ALIGN_TEMPLATES
        if (this.align) {
            l.addAlignNode(this, layout.root);

            if (this.aData.hidden || this.visible === false)
                this.aData.prehide(true);

            //@note Removed apf.isParsing here to activate general queuing
            this.$purgeAlignment();
        }
        else
        //#endif
        {
            var pData = this.parentNode.aData || this.parentNode.pData;
            this.aData.stackId = pData.children.push(this.aData) - 1;
            this.aData.parent  = pData;
        }
    };
    
    function visibleHandler(e){
        if (!this.aData) return;

        if (!this.aData.hidden == e.value) //useless changing to same state
            return;

        if (e.value) {
            if (this.aData.preshow() !== false)
                this.$ext.style.display = "none";
            this.$purgeAlignment();
        }
        else {
            this.$ext.style.display = "block";
            this.aData.prehide();
            this.$purgeAlignment();
        }
        
        apf.layout.processQueue(); //@todo apf3.0 might not be the best but fixes trunk/test/toc.html
    };

    /**
     * Calculates the rules for this element and activates them.
     * @private
     */
    this.$purgeAlignment = function(){
        var layout = l.get(this.$pHtmlNode);
        
        //@todo review if this can be improved
        //#ifdef __WITH_PROPERTY_WATCH
        if (this.$ext && this.$ext.style.display == "block" 
          && !this.$ext.offsetHeight && !this.$ext.offsetWidth) {
            var _self      = this;
            var propChange = function (name, old, value){
                if (_self.$ext.offsetWidth || _self.$ext.offsetHeight) {
                    l.queue(_self.$pHtmlNode, null, layout.root);
                    //apf.layout.activateRules(_self.$ext.parentNode);
                    
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
        
        l.queue(this.$pHtmlNode, null, layout.root);
    };

    function remove(e){
        if (e && (e.$doOnlyAdmin || e.currentTarget != this))
            return;

        if (this.aData) {
            this.aData.remove();
            this.$purgeAlignment();

            if (this.parentNode.pData && !this.parentNode.pData.children.length) {
                l.removeAll(this.parentNode.pData);
                this.parentNode.pData = null;
            }

            if (this.$ext)
                this.$ext.style.display = "none";
        }
    }

    //@todo support inserbefore for align templates
    function reparent(e){ //@todo domnodeinserted should be called before intodoc then use $amlLoaded to check
        if (!this.$amlLoaded || e.currentTarget != this)
            return;

        if (!e.$moveWithinParent && this.aData 
          && this.aData.pHtml != this.$pHtmlNode) {
            this.aData.pHtml = this.$pHtmlNode;
            //this.aData = null;
            this.$enableAlignment();
        }
    }

    //@todo problem with determining when aData.parent | also with weight and minwidth
    //@todo move the prophandlers to inside the constructor
    
    var propHandlers = {
        //#ifdef __WITH_ALIGN_TEMPLATES
        "align" : function(value){
            this.aData.remove();
            this.aData.template   = value;
            this.splitter         = undefined;
            this.aData.edgeMargin = this.edge || 0;
            this.$enableAlignment();
        },
        //#endif

        "lean" : function(value){
            this.aData.isBottom = (value || "").indexOf("bottom") > -1;
            this.aData.isRight = (value || "").indexOf("right") > -1;
            this.$purgeAlignment();
        },

        "edge" : function(value){
            this.aData.edgeMargin = Math.max(this.aData.splitter || 0, value != "splitter" ? value : 0);
            this.aData.splitter   = value == "splitter" ? 5 : false;
            this.$purgeAlignment();
        },

        "weight" : function(value){
            this.aData.weight = parseFloat(value);
            this.$purgeAlignment();
        },

        "splitter" : function(value){
            this.aData.splitter = value ? 5 : false;
            this.aData.edgeMargin = Math.max(this.aData.splitter || 0, this.edge || 0);

            if (!value && this.align && this.align.indexOf("-splitter"))
                this.align = this.aData.template = this.align.replace("-splitter", "");

            this.$purgeAlignment();
        },

        "width" : function(value){
            //resetting this property because else we can't reset, when we have
            //a fast JIT we'll do setProperty in onresize
            this.width = null;
            this.aData.fwidth = value || false;

            if (this.aData.fwidth && this.aData.fwidth.indexOf("/") > -1) {
                this.aData.fwidth = eval(this.aData.fwidth);
                if (this.aData.fwidth <= 1)
                    this.aData.fwidth = (this.aData.fwidth * 100) + "%";
            }

            this.$purgeAlignment();
        },

        "height" : function(value){
            //resetting this property because else we can't reset, when we have a
            //fast JIT we'll do setProperty in onresize
            this.height = null;
            this.aData.fheight = String(value) || false;

            if (this.aData.fheight && this.aData.fheight.indexOf("/") > -1) {
                this.aData.fheight = eval(this.aData.fheight);
                if (this.aData.fheight <= 1)
                    this.aData.fheight = (this.aData.fheight * 100) + "%";
            }

            this.$purgeAlignment();
        },

        "minwidth" : function(value){
            this.aData.minwidth = value;
            this.$purgeAlignment();
        },

        "minheight" : function(value){
            this.aData.minheight = value;
            this.$purgeAlignment();
        }
    };

    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        this.$disableAlignment();
        this.aData = null;
    });
};

// #endif
