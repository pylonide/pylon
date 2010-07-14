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
// #ifdef __AMLHBOX || __AMLVBOX || __INC_ALL

/**
 * @define vbox Container that stacks it's children vertically.
 * @see element.hbox
 * @define hbox Container that stacks it's children horizontally.
 * Example:
 * <code>
 *  <a:hbox height="500" width="600">
 *      <a:vbox height="500" width="500">
 *          <a:bar height="250" caption="Top bar" />
 *          <a:hbox width="500" height="250">
 *              <a:bar width="150" caption="Bottom left bar"/>
 *              <a:bar width="350" caption="Bottom Right bar"/>
 *          </a:hbox>
 *      </a:vbox>
 *      <a:bar width="100" caption="Right bar"/>
 *  </a:hbox>
 * </code>
 * Remarks:
 * The layouting engine of Ajax.org Platform lets you store layouts and set them
 * dynamically. It's very easy to make a layout manager this way. For more 
 * information see {@link object.layout}
 * @addnode elements
 * @constructor
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.9
 */
apf.hbox = function(struct, tagName){
    this.$init(tagName || "hbox", apf.NODE_VISIBLE, struct);
};
apf.vbox = function(struct, tagName){
    this.$init(tagName || "vbox", apf.NODE_VISIBLE, struct);
};

(function(){
     var l = apf.layout;

    /**** Properties and Attributes ****/

    this.$focussable = false;
    this.$update     = false;
    this.$useLateDom = true; 

    var CSSFLOAT    = apf.isIE ? "styleFloat" : "cssFloat";
    var CSSPREFIX   = apf.isGecko ? "Moz" : (apf.isWebkit ? "webkit" : "");
    var CSSPREFIX2  = apf.isGecko ? "-moz" : (apf.isWebkit ? "-webkit" : "");
    var INLINE      = apf.isIE && apf.isIE < 8 ? "inline" : "inline-block";

    /**
     * @attribute {String}  padding      the space between each element. Defaults to 2.
     * @attribute {Boolean} reverse      whether the sequence of the elements is in reverse order.
     * @attribute {String}  edge         the space between the container and the elements, space seperated in pixels for each side. Similar to css in the sequence top right bottom left. Defaults to "5 5 5 5".
     * Example:
     * <code>
     *  <a:vbox edge="10 10 40 10" />
     * </code>
     * @attribute {String} pack     
     *   Possible values:
     *   start
     *   center
     *   end
     * @attribute {Boolean} align
     *   Possible values:
     *   start
     *   center
     *   end
     *   stretch
     */
    this.$supportedProperties.push("padding", "reverse", "edge", "pack", "align");
    
    this.$propHandlers["padding"] = function(value){
        var nodes = this.childNodes, elms = [];
        for (var i = 0, l = nodes.length; i < l; i++) {
            if ((node = nodes[i]).nodeFunc == apf.NODE_VISIBLE && node.$amlLoaded)
                elms.push(node);
        }

        for (var i = 0, l = elms.length - 1; i < l; i++) {
            var b = (el = elms[i]).margin && apf.getBox(el.margin) || [0,0,0,0];
            b[this.$vbox ? 2 : 1] += this.padding;
            el.$ext.style.margin = b.join("px ") + "px";
        }
        
        if (!apf.hasFlexibleBox)
            this.$resize();
    }
    
    this.$propHandlers["reverse"]  = function(value){
        if (apf.hasFlexibleBox)
            this.$int.style[CSSPREFIX + "BoxDirection"] = value ? "reverse" : "normal";
        else {
            //@todo
        }
    };
    
    this.$propHandlers["edge"]  = function(value){
        var el = !apf.hasFlexibleBox && this.$vbox ? this.$ext : this.$int;
        el.style.padding = (this.$edge = apf.getBox(value)).join("px ") + "px";
        
        if (!apf.hasFlexibleBox)
            this.$resize();
    };
    
    this.$propHandlers["pack"]  = function(value){
        if (apf.hasFlexibleBox)
            this.$int.style[CSSPREFIX + "BoxPack"] = value || "start";
        else if (this.$amlLoaded) {
            if (this.$vbox) {
                /*var nodes = this.childNodes;
                for (var i = 0, l = nodes.length; i < l; i++) {
                    if ((node = nodes[i]).nodeFunc != apf.NODE_VISIBLE || !node.$amlLoaded) //|| node.visible === false 
                        continue;
                        
                    node.$ext.style.verticalAlign = value == "center" ? "middle" : (value == "end" ? "bottom" : "top");
                }*/
                this.$int.style.verticalAlign = value == "center" ? "middle" : (value == "end" ? "bottom" : "top");
            }    
            else {
                this.$int.style.textAlign = "";
                
                var nodes = this.childNodes;
                for (var i = 0, l = nodes.length; i < l; i++) {
                    if ((node = nodes[i]).nodeFunc != apf.NODE_VISIBLE || !node.$amlLoaded) //|| node.visible === false 
                        continue;

                    node.$ext.style.textAlign = apf.getStyle(node.$ext, "textAlign") || "left";
                }
                
                this.$int.style.textAlign = value == "center" ? "center" : (value == "end" ? "right" : "left");
            }
        }
    };
    
    this.$propHandlers["align"] = function(value){
        if (apf.hasFlexibleBox) {
            this.$int.style[CSSPREFIX + "BoxAlign"] = value || "stretch";
            
            //@todo loop through nodes and reset width/height
        }
        else if (this.$amlLoaded) {
            if (!this.$vbox) {
                var nodes = this.childNodes;
                for (var i = 0, l = nodes.length; i < l; i++) {
                    if ((node = nodes[i]).nodeFunc != apf.NODE_VISIBLE || !node.$amlLoaded) //|| node.visible === false 
                        continue;
                        
                    node.$ext.style.verticalAlign = value == "center" ? "middle" : (value == "end" ? "bottom" : "top");
                }
            }
            else {
                var el = !apf.hasFlexibleBox && this.$vbox ? this.$ext : this.$int;
                el.style.textAlign = "";
                
                var nodes = this.childNodes;
                for (var i = 0, l = nodes.length; i < l; i++) {
                    if ((node = nodes[i]).nodeFunc != apf.NODE_VISIBLE || !node.$amlLoaded) //|| node.visible === false 
                        continue;

                    node.$ext.style.display   = value == "stretch" ? "block" : INLINE;
                    node.$br.style.display    = value == "stretch" ? "none" : "";
                    node.$ext.style.textAlign = apf.getStyle(node.$ext, "textAlign") || "left";
                }
                
                el.style.textAlign = value == "center" ? "center" : (value == "end" ? "right" : "left");
            }
        }
    };
    
    function visibleHandler(e){
        if (e.value) {
            this.$ext.style.display    = this.parentNode.align == "stretch" ? "block" : INLINE;
            if (this.$br)
                this.$br.style.display = this.parentNode.align == "stretch" ? "none" : "";
        }
        else {
            if (this.$br)
                this.$br.style.display = "none";
        }
    }
    
    var handlers = {
        //Handlers for flexible box layout
        "true" : {
            "width" : function(value){
                if (this.parentNode.$vbox && this.parentNode.align == "stretch")
                    return;
                
                this.$ext.style.width = value 
                    ? value + "px"
                    : "";
            },
            
            "height" : function(value){
                if (!this.parentNode.$vbox && this.parentNode.align == "stretch")
                    return;

                this.$ext.style.height = value 
                    ? value + "px"
                    : "";
            },
            
            "margin" : function(value){
                var b = apf.getBox(value);
                b[this.parentNode.$vbox ? 2 : 1] += this.padding;
                this.$ext.style.margin = b.join("px ") + "px";
            },
            
            "flex" : function(value){
                if (value) {
                    if (!this.$altExt) {
                        var doc = this.$ext.ownerDocument;
                        var sp = (this.$altExt = doc.createElement("div")).appendChild(doc.createElement("span"));
                        this.parentNode.$int.replaceChild(this.$altExt, this.$ext);
                        sp.appendChild(this.$ext);
                        
                        this.$altExt.style.display = CSSPREFIX2 + "-box";
                        sp.style.display  = apf.isGecko ? "-moz-stack" : CSSPREFIX2 + "-box";
                        sp.style.position = "relative";
                        if (!this.parentNode.$vbox)
                            sp.style["width"] = "43px";
                        else if (!apf.isWebkit) //stupid webkit isnt 90 degrees symmetrical
                            sp.style["height"] = "0px";
                        sp.style[this.parentNode.$vbox ? "minHeight" : "minWidth"] = "100%";
                        sp.style[CSSPREFIX + "BoxOrient"] = "horizontal";
                        sp.style[CSSPREFIX + "BoxFlex"]   = 1;
                        
                        this.$ext.style[CSSPREFIX + "BoxFlex"] = 1;
                    }
                    this.$altExt.style[CSSPREFIX + "BoxFlex"] = parseInt(value) || 1;
                }
                else {
                    this.parentNode.$int.replaceChild(this.$ext, this.$altExt);
                    this.$ext.style[CSSPREFIX + "BoxFlex"] = "";
                    delete this.$altExt;
                }
            }
        },
        
        //Handlers for older browsers
        "false" : {
            "width" : function(value){
                if (this.parentNode.$vbox && this.parentNode.align == "stretch")
                    return;
              
                this.$ext.style.width = value 
                    ? Math.max(0, value - apf.getWidthDiff(this.$ext)) + "px"
                    : "";
            },
            
            "height" : function(value){
                if (this.parentNode.localName == "hbox" && this.parentNode.align == "stretch")
                    return;
      
                this.$ext.style.height = value 
                    ? Math.max(0, value - apf.getHeightDiff(this.$ext)) + "px"
                    : "";
            },
            
            "margin" : function(value){
                var b = apf.getBox(value);
                b[this.parentNode.$vbox ? 2 : 1] += this.padding;
                this.$ext.style.margin = b.join("px ") + "px";
            },
            
            "flex" : function(value){
                if (this.$amlLoaded)
                    this.parentNode.$resize();
            }
        }
    }
    
    //@todo move this to enableTable, disableTable
    this.register = function(amlNode){
        if (amlNode.$altExt) //@todo hack, need to re-arch layouting
            return;

        amlNode.$propHandlers["left"]   = 
        amlNode.$propHandlers["top"]    = 
        amlNode.$propHandlers["right"]  = 
        amlNode.$propHandlers["bottom"] = apf.K;
        
        var propHandlers = handlers[apf.hasFlexibleBox];
        for (var prop in propHandlers) {
            amlNode.$propHandlers[prop] = propHandlers[prop];
        }

        if (amlNode.nodeFunc == apf.NODE_VISIBLE) {
            if (apf.hasFlexibleBox) {
                //if (apf.isGecko && apf.getStyle(amlNode.$ext, "display") == "block")
                    //amlNode.$ext.style.display = "-moz-stack"; //@todo visible toggle
                
                amlNode.$ext.style[CSSPREFIX + "BoxSizing"] = "border-box";
            }
            else {
                amlNode.addEventListener("prop.visible", visibleHandler);
                if (this.$vbox) {
                    amlNode.$br = this.$int.insertBefore(amlNode.$ext.ownerDocument.createElement("br"), amlNode.$ext.nextSibling);
                    amlNode.$br.style.lineHeight = "0";
                }
                else {
                    amlNode.$ext.style.display = INLINE;
                    this.$int.style.whiteSpace = "";
                    amlNode.$ext.style.whiteSpace = apf.getStyle(amlNode.$ext, "whiteSpace") || "normal";
                    this.$int.style.whiteSpace = "nowrap";
                }
            }
    
            this.$noResize = true;
            
            if (amlNode.height)
                propHandlers.height.call(amlNode, amlNode.height);
            if (amlNode.width)
                propHandlers.width.call(amlNode, amlNode.width);
            if (amlNode.margin)
                propHandlers.margin.call(amlNode, amlNode.margin);
            if (amlNode.flex)
                propHandlers.flex.call(amlNode, amlNode.flex);    
            
            if (this.lastChild == amlNode) {
                this.$propHandlers["padding"].call(this, this.padding);
                
                if (!apf.hasFlexibleBox) {
                    this.$propHandlers["align"].call(this, this.align);
                    this.$propHandlers["pack"].call(this, this.pack);
                }
            }
        
            delete this.$noResize;
        }
    }
    
    this.unregister = function(amlNode){
        amlNode.$propHandlers["left"]   = 
        amlNode.$propHandlers["top"]    = 
        amlNode.$propHandlers["right"]  = 
        amlNode.$propHandlers["bottom"] = null;
        
        var propHandlers = handlers[apf.hasFlexibleBox];
        for (var prop in propHandlers) {
            delete amlNode.$propHandlers[prop];
        }
        
        //Clear css properties and set layout
        if (amlNode.nodeFunc == apf.NODE_VISIBLE) {
            if (amlNode.flex)
                propHandlers.flex.call(amlNode, 0);
            
            if (apf.hasFlexibleBox) {
                amlNode.$ext.style[CSSPREFIX + "BoxSizing"] = "";
            }
            else {
                amlNode.removeEventListener("prop.visible", visibleHandler);
                
                amlNode.$ext.style.verticalAlign = "";
                amlNode.$ext.style.textAlign = "";
                amlNode.$ext.style[CSSFLOAT] = "";
                
                if (amlNode.$br) {
                    amlNode.$br.parentNode.removeChild(amlNode.$br);
                    delete amlNode.$br;
                }
            }
            
            amlNode.$ext.style.display = amlNode.visible ? "block" : "none";
            
            if (amlNode.margin)
                amlNode.$ext.style.margin = "";
            
            if (amlNode.width)
                amlNode.$ext.style.width = "";
        }
    }
    /*
         this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        this.register(this.parentNode);
    });
    */
    
    /**** DOM Hooks ****/
    
    this.addEventListener("DOMNodeRemoved", function(e){
        if (e.$doOnlyAdmin || e.currentTarget == this)
            return;

        if (e.relatedNode == this){
            this.unregister(e.currentTarget);
            //e.currentTarget.$setLayout();
        }
    });

    /*this.addEventListener("DOMNodeInserted", function(e){
        if (e.currentTarget == this || e.currentTarget.nodeType != 1)
            return;

        if (e.relatedNode == this) {
            if (e.$isMoveWithinParent) {
                visibleHandler.call(e.currentTarget, {sync: true}); 
            }
            else {
                e.currentTarget.$setLayout("table");
                if (e.currentTarget.nextSibling)
                    visibleHandler.call(e.currentTarget, {sync: true});
            }
        }
    });*/
    
    this.addEventListener("prop.visible", function(e){
        if (e.value)
            this.$int.style.display = CSSPREFIX2 + "-box";
    });
    
    this.$draw = function(){
        var doc = this.$pHtmlNode.ownerDocument;
        this.$ext = this.$pHtmlNode.appendChild(doc.createElement("div"));
        this.$ext.className = this.localName;

        this.$vbox = this.localName == "vbox";
        this.$int = apf.isGecko || !apf.hasFlexibleBox && this.$vbox 
            ? this.$ext.appendChild(doc.createElement("div")) 
            : this.$ext;
        this.$ext.host = this;
        
        if (apf.isGecko) {
            this.$int.style.width = "100%";
            this.$int.style.height = "100%";
        }
        else if (!apf.hasFlexibleBox && this.$vbox) {
            this.$int.style.display = INLINE;
            this.$int.style.width   = "100%";
        }
        
        if (apf.hasFlexibleBox) {
            this.$int.style.display = CSSPREFIX2 + "-box";
            this.$int.style[CSSPREFIX + "BoxOrient"] = this.localName == "hbox" ? "horizontal" : "vertical";
            if (apf.isGecko) //!webkit
                this.$int.style[CSSPREFIX + "BoxSizing"] = "border-box";
            this.$int.style[CSSPREFIX + "BoxAlign"]  = "stretch";
        }
        else {
            if (!this.$vbox)
                this.$int.style.whiteSpace = "nowrap";

            var spacer = (!apf.hasFlexibleBox && this.$vbox ? this.$ext : this.$int)
                            .appendChild(doc.createElement("strong"));
            spacer.style.height        = "100%";
            spacer.style.display       = INLINE;
            //spacer.style.marginLeft    = "-4px";
            spacer.style.verticalAlign = "middle";
            
            //@todo make conditional based on stretch/flex
            this.addEventListener("resize", this.$resize);
        }

        if (this.getAttribute("class")) 
            apf.setStyleClass(this.$ext, this.getAttribute("class"));
        
        this.$originalMin = [this.minwidth || 0,  this.minheight || 0];
    };
    
    this.$resize = function(){
        if (!this.$amlLoaded || this.$noResize)
            return;

        /*if (this.$table.offsetWidth >= this.$ext.offsetWidth)
            this.$ext.style.minWidth = (this.minwidth = Math.max(0, this.$table.offsetWidth 
                - apf.getWidthDiff(this.$ext))) + "px";
        else {
            this.$ext.style.minWidth = "";
            this.minwidth = this.$originalMin[0];
        }

        if (this.$table.offsetHeight >= this.$ext.offsetHeight)
            this.$ext.style.minHeight = (this.minheight = Math.max(0, this.$table.offsetHeight 
                - apf.getHeightDiff(this.$ext))) + "px";
        else {
            this.$ext.style.minHeight = "";
            this.minheight = this.$originalMin[1];
        }*/
        
        var total    = 0;
        var size     = this.$vbox ? "width" : "height";
        var osize    = this.$vbox ? "height" : "width";
        var offset   = this.$vbox ? "offsetWidth" : "offsetHeight";
        var ooffset  = this.$vbox ? "offsetHeight" : "offsetWidth";
        var getDiff  = this.$vbox ? "getWidthDiff" : "getHeightDiff";
        var ogetDiff = this.$vbox ? "getHeightDiff" : "getWidthDiff";
        var inner    = this.$vbox ? "getHtmlInnerWidth" : "getHtmlInnerHeight";
        var oinner   = this.$vbox ? "getHtmlInnerHeight" : "getHtmlInnerWidth";

        var nodes = this.childNodes, hNodes = [], fW = 0;
        for (var node, i = 0; i < nodes.length; i++) {
            if ((node = nodes[i]).nodeFunc != apf.NODE_VISIBLE || node.visible === false || !node.$amlLoaded)
                continue;

            hNodes.push(node);
            if (!node[size]) 
                node.$ext.style[size] = "";
            if (parseInt(node.flex))
                total += parseFloat(node.flex);
            
            if (!parseInt(node.flex)) {
                var m = node.margin && apf.getBox(node.margin);
                if (m && !this.$vbox) m.shift();
                fW += node.$ext[ooffset] + this.padding + (m ? m[0] + m[2] : 0);
            }
        }
        
        //Stretching - for IE8 this could be done using box-sizing and height:100%
        if (!this.$vbox && this.align == "stretch") {
            var pH = this.$int[offset] - apf[getDiff](this.$int);// - (2 * this.padding);
            for (var i = 0, l = hNodes.length; i < l; i++) {
                node = hNodes[i];
                
                if (!node[size]) {
                    var m = node.margin && apf.getBox(node.margin);
                    if (m && this.$vbox) m.shift();
                    node.$ext.style[size] = Math.max(0, pH - apf[getDiff](node.$ext) - (m ? m[0] + m[2] : 0)) + "px";
                }
            }
        }

        //Flexing
        if (total > 0) {
            if (this.$vbox)
                this.$int.style.height = "100%";
            
            var rW = apf[oinner](this.$int) - apf[getDiff](this.$int) - fW;
              //- ((hNodes.length - 1) * this.padding);// - (2 * this.edge);
            var lW = rW, done = 0;
            for (var i = 0, l = hNodes.length; i < l; i++) {
                if ((node = hNodes[i]).flex) {
                    var v = Math.round((rW / total) * parseInt(node.flex));
                    done += parseInt(node.flex);
                    var m = node.margin && apf.getBox(node.margin);
                    if (m && this.localName == "hbox") m.shift();
                    node.$ext.style[osize] = Math.max(0, (done == total ? lW : v) - apf[ogetDiff](node.$ext) - (m ? m[0] + m[2] : 0)) + "px"; //this.padding - 
                    lW -= v;
                }
            }
        }
        else if (this.$vbox)
            this.$int.style.height = "";

        //@todo all non-flex elements should have resize
        /*cdi.childNodes[2].onresize = function(){
            cdi.onresize();
        }*/
    }
    
    this.$loadAml = function(x){
        if (this.padding == undefined)
            this.$propHandlers.padding.call(this, this.padding = 2);
        if (this.edge == undefined)
            this.$propHandlers.edge.call(this, this.edge = 5);
        if (this.pack == undefined)
            this.$propHandlers.pack.call(this, this.edge = "start");
        if (this.align == undefined)
            this.$propHandlers.align.call(this, this.align = "stretch");
    };
}).call(apf.vbox.prototype = new apf.GuiElement());

apf.hbox.prototype = apf.vbox.prototype;

apf.aml.setElement("hbox", apf.hbox);
apf.aml.setElement("vbox", apf.vbox);
// #endif
