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
 * @define vsplitbox Container that stacks two children vertically.
 * @see element.hsplitbox
 * @define hsplitbox Container that stacks two children horizontally.
 * @addnode elements
 * @constructor
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       3.0
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
    
    /**** Properties and Attributes ****/

    this.$focussable = false;
    this.$useLateDom = true; 
    this.$box        = true;
    this.$layout     = true;
    
    /**
     * @attribute {String}  padding      the space between each element. Defaults to 2.
     * @attribute {String}  edge         the space between the container and the elements, space seperated in pixels for each side. Similar to css in the sequence top right bottom left. Defaults to "5 5 5 5".
     */
    this.$booleanProperties["splitters"] = true;
    this.$supportedProperties.push("padding", "edge", "splitters");
    
    this.$propHandlers["padding"] = function(value){
        this.padding = parseInt(value);
        
        if (!this.$amlLoaded)
            return;
            
        if (this.$splitter)
            this.$splitter.$ext.style[this.$vbox ? "height" : "width"] = value + "px";
        
        if (this.$vbox) {
            //Two flex children
            if (this.flexChild2) {
                this.flexChild2.$ext.style.marginTop = 
                    (this.$edge[0] + value 
                        + apf.getHeightDiff(this.flexChild2.$ext)) + "px";
            }
            
            //One flex child (first)
            else if (this.flexChild1 == this.firstChild) {
                this.flexChild1.style.bottom =   
                    (parseInt(this.fixedChild.height) + value + this.$edge[2]) + "px";
            }
                
            //One flex child (last)
            else if (this.flexChild1 == this.lastChild)
                this.flexChild1.style.top = 
                    (parseInt(this.fixedChild.height) + value + this.$edge[2]) + "px";
        }
        else {
            //Two flex children
            if (this.flexChild2) {
                this.flexChild2.$ext.style.marginLeft = 
                    (this.$edge[3] + value 
                        + apf.getWidthDiff(this.flexChild2.$ext)) + "px";
            }
            
            //One flex child (first)
            else if (this.flexChild1 == this.firstChild) {
                this.flexChild1.style.right =   
                    (this.fixedChild.width + value + this.$edge[1]) + "px";
            }
                
            //One flex child (last)
            else if (this.flexChild1 == this.lastChild)
                this.flexChild1.style.left = 
                    (this.fixedChild.width + value + this.$edge[3]) + "px";
        }
    }
    
    this.$propHandlers["splitter"] = function(value){
        if (value) {
            this.$splitter = this.insertBefore(
                this.ownerDocument.createElementNS(apf.ns.aml, "splitter"), 
                this.lastChild);
            
            //@todo position the splitter;
        }
        else {
            this.$splitter.destroy(true, true);
        }
    }
    
    this.$propHandlers["edge"]  = function(value){
        this.$edge = apf.getBox(value);
        
        if (!this.$amlLoaded)
            return;
        
        var fNode = this.getFirstVisibleChild();
        if (!fNode)
            return;
        
        fNode.$ext.style.left = this.$edge[3] + "px";
        fNode.$ext.style.top = this.$edge[0] + "px";
        if (this.$vbox)
            fNode.$ext.style.right = this.$edge[1] + "px";
        else
            fNode.$ext.style.bottom = this.$edge[2] + "px";
        
        var lNode = this.getSecondVisibleChild();
        if (lNode && lNode.visible) {
            lNode.$ext.style.right = this.$edge[1] + "px";
            lNode.$ext.style.bottom = this.$edge[2] + "px";
            if (this.$vbox) {
                lNode.$ext.style.left = this.$edge[3] + "px";
                lNode.$ext.style.top = String(fNode.height).indexOf("%") > -1 
                    ? fNode.height 
                    : ((parseInt(fNode.height) + this.padding + this.$edge[0]) + "px");
                
                if (this.$splitter) {
                    this.$splitter.$ext.style.left = this.$edge[3] + "px";
                    this.$splitter.$ext.style.right = this.$edge[1] + "px";
                    this.$splitter.$ext.style.top = String(fNode.height).indexOf("%") > -1 
                        ? fNode.height 
                        : ((parseInt(fNode.height) + this.$edge[0]) + "px");
                }
            }
            else {
                lNode.$ext.style.top = this.$edge[0] + "px";
                lNode.$ext.style.right = String(fNode.width).indexOf("%") > -1 
                    ? fNode.width 
                    : ((parseInt(fNode.width) + this.padding + this.$edge[3]) + "px");
                
                if (this.$splitter) {
                    this.$splitter.$ext.style.top = this.$edge[3] + "px";
                    this.$splitter.$ext.style.bottom = this.$edge[1] + "px";
                    this.$splitter.$ext.style.width = String(fNode.width).indexOf("%") > -1 
                    ? fNode.width 
                    : ((parseInt(fNode.width) + this.$edge[3]) + "px");
                }
            }
            
            if (this.$splitter)
                this.$splitter.$ext.style.position = "absolute";
        }
        else {
            if (!this.$vbox)
                fNode.$ext.style.right = this.$edge[1] + "px";
            else
                fNode.$ext.style.bottom = this.$edge[2] + "px";
        }
    };
    
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
        if (this.parentNode.$splitter) {
            if (!e.value)
                this.parentNode.$splitter.hide();
            else
                this.parentNode.$splitter.show();
        }
        
        this.parentNode.$propHandlers.edge
            .call(this.parentNode, this.parentNode.edge);
        
        apf.layout.forceResize(this.parentNode.$int);
        
        //If no children visible, hide me
    }
//    
//    function resizeHandler(){
//        if (!this.flex) {
//            if (this.$isRszHandling || this.$lastSizeChild && 
//              this.$lastSizeChild[0] == this.$ext.offsetWidth && 
//              this.$lastSizeChild[1] == this.$ext.offsetHeight)
//                return;
//            
//            /*if (this.$skipResizeOnce)
//                delete this.$skipResizeOnce;
//            else*/
//                this.parentNode.$resize(true);
//            
//            this.$lastSizeChild = [this.$ext.offsetWidth, this.$ext.offsetHeight];
//        }
//    }
    
    var handlers = {
        "width" : function(value){
            //@todo this should check the largest and only allow that one
            //if (this.parentNode.$vbox && this.parentNode.align == "stretch")
                //return;

            (this.$altExt || this.$ext).style.width = !apf.isNot(value) 
                ? (parseFloat(value) == value 
                    ? value + "px"
                    : value)
                : "";
        },
        
        "height" : function(value){
            //@todo this should check the largest and only allow that one
            //if (!this.parentNode.$vbox && this.parentNode.align == "stretch")
                //return;

            (this.$altExt || this.$ext).style.height = !apf.isNot(value) 
                ? (parseFloat(value) == value 
                    ? value + "px"
                    : value)
                : (apf.isGecko && this.flex && this.parentNode.$vbox ? "auto" : "");
        },
        
        "margin" : function(value){
            var b = apf.getBox(value);
            //@todo
        }
    }
    
    this.register = function(amlNode, insert){
        if (amlNode.$splitter)
            return;
        
        amlNode.$propHandlers["left"]   = 
        amlNode.$propHandlers["top"]    = 
        amlNode.$propHandlers["right"]  = 
        amlNode.$propHandlers["bottom"] = apf.K;

        for (var prop in handlers) {
            amlNode.$propHandlers[prop] = handlers[prop];
        }

        if (this.$vbox) {
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
    }
    
    this.unregister = function(amlNode){
        if (!amlNode.$propHandlers)
            return;
        
        amlNode.$propHandlers["left"]   = 
        amlNode.$propHandlers["top"]    = 
        amlNode.$propHandlers["right"]  = 
        amlNode.$propHandlers["bottom"] = null;
        
        for (var prop in handlers) {
            delete amlNode.$propHandlers[prop];
        }
        
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
    }
    
    /**** DOM Hooks ****/
    
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
