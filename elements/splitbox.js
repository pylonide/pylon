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
// #ifdef __AMLHSPLITBOX || __AMLVSPLITBOX || __INC_ALL

/**
 * 
 * A container that stacks two children vertically. 
 * 
 * Programatically, this is identical to a regular [[vbox]], except that it can
 * only accept two children, and uses absolute positioning. Because of this, there
 * is more work required to construct AML that matches a regular `<a:vbox>`; however,
 * the performance improvements in using a `<a:vsplitbox>` are massive.
 *
 * @class apf.vsplitbox
 * @define vsplitbox
 * @layout
 *
 * @inheritDoc apf.hsplitbox
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       3.0
 * @see element.hsplitbox
 */
/**
 *
 * A container that stacks two children horizontally.
 * 
 * Programatically, this is identical to a regular [[apf.hbox]], except that it can
 * only accept two children, and uses absolute positioning. Because of this, there
 * is more work required to construct AML that matches a regular `<a:hbox>`; however,
 * the performance improvements in using a `<a:hsplitbox>` are massive.
 *
 * @class apf.hsplitbox
 * @define hsplitbox 
 * @layout
 * @inherits apf.GuiElement
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       3.0\
 * @see element.vsplitbox
 */
apf.hsplitbox = function(struct, tagName){
    this.$init(tagName || "hsplitbox", apf.NODE_VISIBLE, struct);
};
apf.vsplitbox = function(struct, tagName){
    this.$init(tagName || "vsplitbox", apf.NODE_VISIBLE, struct);
};

(function(){
    this.minwidth    = 0;
    this.minheight   = 0;
    
    this.padding = 0;
    this.edge = 0;
    this.$edge = [0,0,0,0];
    
    // *** Properties and Attributes *** //

    this.$focussable = false;
    this.$useLateDom = true; 
    this.$box        = true;
    this.$layout     = true;
    
    /**
     * @attribute {String}  [padding="2"]      Sets or gets the space between each element.
     */
    /**
     * @attribute {String}  [edge="5 5 5 5"]         Sets or gets the space between the container and the elements, space seperated in pixels for each side. Similar to CSS in the sequence of `top right bottom left`.
     */
    this.$booleanProperties["splitter"] = true;
    this.$supportedProperties.push("padding", "edge", "splitter");
    
    this.$propHandlers["padding"] = function(value){
        this.padding = parseInt(value);
        
        if (!this.$amlLoaded)
            return;
            
        if (this.$handle)
            this.$handle.$ext.style[this.$vbox ? "height" : "width"] = value + "px";
        
        var firstChild = this.getFirstChild();
        var lastChild  = this.getSecondChild();
        
        if (this.$vbox) {
            //Two flex children
            if (this.flexChild2) {
                if (firstChild.height) {
                    lastChild.$ext.style.marginTop = firstChild.visible
                        ? (this.$edge[0] + value 
                            + apf.getHeightDiff(firstChild.$ext)) + "px"
                        : 0;
                }
                else {
                    firstChild.$ext.style.marginBottom = lastChild.visible
                        ? (this.$edge[2] + value 
                            + apf.getHeightDiff(lastChild.$ext)) + "px"
                        : 0;
                }
            }
            else if (this.fixedChild && this.fixedChild.visible) {
                //One flex child (first)
                if (this.flexChild1 == firstChild) {
                    if (this.fixedChild.visible) {
                        this.flexChild1.$ext.style.bottom = 
                            (parseInt(this.fixedChild.height) + value + this.$edge[2]) + "px";
                    }
                }
                    
                //One flex child (last)
                else if (this.flexChild1 == lastChild) {
                    this.flexChild1.$ext.style.top = 
                        (parseInt(this.fixedChild.height) + value + this.$edge[2]) + "px";
                }
            }
        }
        else {
            //Two flex children
            if (this.flexChild2) {
                if (firstChild.width) {
                    lastChild.$ext.style.marginLeft = 
                        (this.$edge[3] + value 
                            + apf.getWidthDiff(firstChild.$ext)) + "px";
                }
                else {
                    firstChild.$ext.style.marginRight = 
                        (this.$edge[1] + value 
                            + apf.getWidthDiff(lastChild.$ext)) + "px";
                }
            }
            else if (this.fixedChild && this.fixedChild.visible) {
                //One flex child (first)
                if (this.flexChild1 == firstChild) {
                    this.flexChild1.$ext.style.right =   
                        (parseInt(this.fixedChild.width) + value + this.$edge[1]) + "px";
                }
                    
                //One flex child (last)
                else if (this.flexChild1 == lastChild) {
                    this.flexChild1.$ext.style.left = 
                        (parseInt(this.fixedChild.width) + value + this.$edge[3]) + "px";
                }
            }
        }
    }
    
    this.$propHandlers["splitter"] = function(value){
        if (value) {
            if (this.$handle)
                this.$handle.show();
            else {
                this.$handle = this.insertBefore(
                    this.ownerDocument.createElementNS(apf.ns.aml, "splitter"), 
                    this.lastChild);
            }
        }
        else {
            this.$handle.hide();//destroy(true, true);
        }
    }
    
    this.$propHandlers["edge"]  = function(value, setSize){
        this.$edge = apf.getBox(value);
        
        if (!this.$amlLoaded)
            return;
        
        var fNode = this.getFirstVisibleChild();
        if (!fNode) {
            this.hide();
            return false;
        }
        fNode.$ext.style.left = (this.$edge[3] + fNode.$margin[3]) + "px";
        fNode.$ext.style.top = (this.$edge[0] + fNode.$margin[0]) + "px";
        if (this.$vbox)
            fNode.$ext.style.right = (this.$edge[1] + fNode.$margin[1]) + "px";
        else
            fNode.$ext.style.bottom = (this.$edge[2] + fNode.$margin[2]) + "px";
        
        var lNode = this.getSecondVisibleChild();
        if (lNode && lNode.visible) {
            lNode.$ext.style.right = (this.$edge[1] + lNode.$margin[1]) + "px";
            lNode.$ext.style.bottom = (this.$edge[2] + lNode.$margin[2]) + "px";
            if (this.$vbox) {
                var isPercentage;
                
                lNode.$ext.style.left = (this.$edge[3] + lNode.$margin[3]) + "px";
                if (fNode.height) {
                    isPercentage = String(fNode.height).indexOf("%") > -1;
                    lNode.$ext.style.top = isPercentage 
                        ? fNode.height 
                        : ((parseInt(fNode.height) + this.padding 
                            + this.$edge[0] + fNode.$margin[0]) + "px");
                    
                    if (this.$handle) {
                        this.$handle.$ext.style.top = isPercentage
                            ? fNode.height 
                            : ((parseInt(fNode.height) + this.$edge[0]) + "px");
                        this.$handle.$ext.style.marginTop = isPercentage
                            ? this.padding + "px"
                            : "0";
                    }
                }
                else {
                    isPercentage = String(lNode.height).indexOf("%") > -1;
                    lNode.$ext.style.top = "";
                    fNode.$ext.style.bottom = isPercentage 
                        ? lNode.height 
                        : ((parseInt(lNode.height) + this.padding 
                            + this.$edge[2] + lNode.$margin[2]) + "px");
                    
                    if (this.$handle) {
                        this.$handle.$ext.style.bottom = isPercentage
                            ? lNode.height 
                            : ((parseInt(lNode.height) + this.$edge[0]) + "px");
                        this.$handle.$ext.style.marginBottom = isPercentage
                            ? this.padding + "px"
                            : "0";
                    }
                }
                
                if (this.$handle) {
                    this.$handle.$ext.style.left = this.$edge[3] + "px";
                    this.$handle.$ext.style.right = this.$edge[1] + "px";
                }
            }
            else {
                lNode.$ext.style.top = this.$edge[0] + "px";
                
                if (fNode.width) {
                    var isPercentage = String(fNode.width).indexOf("%") > -1;
                    lNode.$ext.style.left = isPercentage
                        ? fNode.width 
                        : ((parseInt(fNode.width) + this.padding 
                            + this.$edge[3] + fNode.$margin[3]) + "px");
                    
                    if (this.$handle) {
                        this.$handle.$ext.style.left = isPercentage
                            ? fNode.width 
                            : ((parseInt(fNode.width) + this.$edge[3]) + "px");
                        this.$handle.$ext.style.marginLeft = isPercentage
                            ? this.padding + "px"
                            : "0";
                    }
                }
                else {
                    var isPercentage = String(lNode.width).indexOf("%") > -1;
                    lNode.$ext.style.left = "";
                    fNode.$ext.style.right = isPercentage
                        ? lNode.width 
                        : ((parseInt(lNode.width) + this.padding 
                            + this.$edge[1] + lNode.$margin[1]) + "px");
                    
                    if (this.$handle) {
                        this.$handle.$ext.style.right = isPercentage
                            ? lNode.width 
                            : ((parseInt(lNode.width) + this.$edge[3]) + "px");
                        this.$handle.$ext.style.marginRight = isPercentage
                            ? this.padding + "px"
                            : "0";
                    }
                }
                
                if (this.$handle) {
                    this.$handle.$ext.style.top = this.$edge[0] + "px";
                    this.$handle.$ext.style.bottom = this.$edge[2] + "px";
                }
            }
            
            if (this.$handle)
                this.$handle.$ext.style.position = "absolute";
        }
        else {
            if (!this.$vbox) {
                fNode.$ext.style.right = (this.$edge[1] + fNode.$margin[1]) + "px";
                fNode.$ext.style.width = "";
            }
            else {
                fNode.$ext.style.bottom = (this.$edge[2] + fNode.$margin[2]) + "px";
                fNode.$ext.style.height = "";
            }
            
            if (this.$handle)
                this.$handle.hide();
        }
        
        if (setSize === true) {
            var size = this.$vbox ? "height" : "width";
            fNode.$propHandlers[size].call(fNode, fNode[size]);
        }
    };
    
    this.getFirstChild = function(startNode) {
        var node = startNode || this.firstChild;
        while (node && node.$splitter) {
            node = node.nextSibling;
        }
        return node || false;
    }
    this.getSecondChild = function(){
        var node = this.getFirstChild();
        if (!node)
            return false;
        return node.nextSibling && this.getFirstChild(node.nextSibling);
    }
    
    this.getFirstVisibleChild = function(startNode){
        var node = startNode || this.firstChild;
        while (node && (!node.visible || node.$splitter)) {
            node = node.nextSibling;
        }
        if (node && node.visible)
            return node;
        return false;
    }
    
    this.getSecondVisibleChild = function(){
        var node = this.getFirstVisibleChild();
        if (!node)
            return false;
        return node.nextSibling && this.getFirstVisibleChild(node.nextSibling);
    }
    
    function visibleHandler(e){
        if (this.parentNode.$handle) {
            if (!e.value || this.parentNode.childNodes.length < 3)
                this.parentNode.$handle.hide();
            else
                this.parentNode.$handle.show();
        }
        
        if (e.value && !this.parentNode.visible)
            this.parentNode.show();
        
        this.parentNode.$propHandlers.edge
            .call(this.parentNode, this.parentNode.edge, true);
        
        apf.layout.forceResize(this.parentNode.$int);
        
        //Change margin
        this.parentNode.$propHandlers.padding
            .call(this.parentNode, this.parentNode.padding)
    }
    
    var handlers = {
        "width" : function(value){
            //@todo this should check the largest and only allow that one
            //if (this.parentNode.$vbox && this.parentNode.align == "stretch")
                //return;
            
            //@todo change fixedChild flexChild1 and flexChild2 based on this

            this.$ext.style.width = !apf.isNot(value) 
                ? (parseFloat(value) == value 
                    ? (value - apf.getWidthDiff(this.$ext)) + "px"
                    : value)
                : "";
            
            //This can be optimized
            if (this.$amlLoaded)
                this.parentNode.$propHandlers["edge"].call(this.parentNode, this.parentNode.edge);
        },
        
        "height" : function(value){
            //@todo this should check the largest and only allow that one
            //if (!this.parentNode.$vbox && this.parentNode.align == "stretch")
                //return;

            //@todo change fixedChild flexChild1 and flexChild2 based on this

            this.$ext.style.height = !apf.isNot(value) 
                ? (parseFloat(value) == value 
                    ? (value - apf.getHeightDiff(this.$ext)) + "px"
                    : value)
                : "";
            
            //This can be optimized
            if (this.$amlLoaded)
                this.parentNode.$propHandlers["edge"].call(this.parentNode, this.parentNode.edge);
        },
        
        "margin" : function(value){
            this.$margin = apf.getBox(value);
            
            //This can be optimized
            if (this.$amlLoaded)
                this.parentNode.$propHandlers["edge"].call(this.parentNode, this.parentNode.edge);
        }
    }
    
    this.register = function(amlNode, insert){
        if (amlNode.$splitter || amlNode.nodeFunc != apf.NODE_VISIBLE)
            return;

        amlNode.$margin = [0, 0, 0, 0];
        
        amlNode.$propHandlers["left"]   = 
        amlNode.$propHandlers["top"]    = 
        amlNode.$propHandlers["right"]  = 
        amlNode.$propHandlers["bottom"] = apf.K;

        for (var prop in handlers) {
            amlNode.$propHandlers[prop] = handlers[prop];
        }

        if (this.flexChild1 && this.flexChild1 == amlNode){ }
        else if (this.$vbox) {
            if (!amlNode.height || String(amlNode.height).indexOf("%") > -1)
                this[!this.flexChild1 ? "flexChild1" : "flexChild2"] = amlNode;
            else
                this.fixedChild = amlNode;
        }
        else {
            if (!amlNode.width || String(amlNode.width).indexOf("%") > -1)
                this[!this.flexChild1 ? "flexChild1" : "flexChild2"] = amlNode;
            else
                this.fixedChild = amlNode;
        }

        amlNode.addEventListener("prop.visible", visibleHandler);
        amlNode.$ext.style.position = "absolute";

        if (amlNode.height)
            handlers.height.call(amlNode, amlNode.height);
        if (amlNode.width)
            handlers.width.call(amlNode, amlNode.width);
        if (amlNode.margin)
            handlers.margin.call(amlNode, amlNode.margin);
            
        var isLast = this.lastChild == amlNode;
        if (isLast || insert) {
            this.$propHandlers["padding"].call(this, this.padding);
            this.$propHandlers["edge"].call(this, this.edge);
        }
        
        if (this.$handle && this.childNodes.length > 2)
            this.$handle.show();
    }
    
    this.unregister = function(amlNode){
        if (!amlNode.$splitter || amlNode.nodeFunc != apf.NODE_VISIBLE)
            return;
        
        delete amlNode.$margin;
        
        amlNode.$propHandlers["left"]   = 
        amlNode.$propHandlers["top"]    = 
        amlNode.$propHandlers["right"]  = 
        amlNode.$propHandlers["bottom"] = null;
        
        for (var prop in handlers) {
            delete amlNode.$propHandlers[prop];
        }
        
        if (this.fixedChild == amlNode)
            delete this.fixedChild;
        else if (this.flexChild1 == amlNode)
            delete this.flexChild1;
        else if (this.flexChild2 == amlNode)
            delete this.flexChild2;
        
        //Clear css properties and set layout
        amlNode.removeEventListener("prop.visible", visibleHandler);
        amlNode.$ext.style.display = amlNode.visible ? "block" : "none";
        
        if (amlNode.width)
            amlNode.$ext.style.width = "";
        if (amlNode.height)
            amlNode.$ext.style.height = "";
        amlNode.$ext.style.position = 
        amlNode.$ext.style.left = 
        amlNode.$ext.style.top = 
        amlNode.$ext.style.right = 
        amlNode.$ext.style.bottom = "";
        
        if (this.$handle)
            this.$handle.hide();
    }
    
    // *** DOM Hooks *** //
    
    this.addEventListener("DOMNodeRemoved", function(e){
        if (e.$doOnlyAdmin || e.currentTarget == this)
            return;

        if (e.relatedNode == this){
            this.unregister(e.currentTarget);
            //e.currentTarget.$setLayout();
        }
    });

    this.addEventListener("DOMNodeInserted", function(e){
        if (e.currentTarget == this) {
            if (this.visible)
                this.$ext.style.display = apf.CSSPREFIX2 + "-box"; //Webkit issue
            return;
        }
        
        if (e.currentTarget.nodeType != 1 
          || e.currentTarget.nodeFunc != apf.NODE_VISIBLE)
            return;
        
//        if (this.$handle) {
//            var _self = this;
//            setTimeout(function(){
//                if (_self.$handle.nextSibling != _self.lastChild)
//                    _self.insertBefore(_self.$handle, _self.lastChild);
//            });
//        }

        if (e.relatedNode == this && !e.$isMoveWithinParent) {
            e.currentTarget.$setLayout(this.localName, true);
            
            if (e.currentTarget.$altExt) {
                
                return false;
            }
        }
    });

    this.$draw = function(){
        var doc = this.$pHtmlNode.ownerDocument;
        this.$ext = this.$pHtmlNode.appendChild(doc.createElement("div"));
        if (this.getAttribute("style"))
            this.$ext.setAttribute("style", this.getAttribute("style"));
        this.$ext.className = this.localName;

        this.$vbox = this.localName == "vsplitbox";
        this.$int = this.$ext;
        this.$ext.host = this;
        
        if (this.getAttribute("class")) 
            apf.setStyleClass(this.$ext, this.getAttribute("class"));
    };
    
    this.$loadAml = function(x){
    };
}).call(apf.vsplitbox.prototype = new apf.GuiElement());

apf.hsplitbox.prototype = apf.vsplitbox.prototype;

apf.aml.setElement("hsplitbox", apf.hsplitbox);
apf.aml.setElement("vsplitbox", apf.vsplitbox);

// #endif
