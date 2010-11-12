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

//#ifdef __WITH_DATABINDING

/**
 * @attribute {String}  icon
 * @attribute {String}  caption
 * @attribute {String}  width
 * @attribute {String}  options
 * @attribute {String}  editor
 * @attribute {String}  colspan
 * @attribute {String}  align
 * @attribute {String}  css
 * @attribute {Boolean} tree
 */
apf.BindingColumnRule = function(struct, tagName){
    this.$init(tagName, apf.NODE_HIDDEN, struct);
    
    this.$className = "col" + this.$uniqueId;
};

(function(){
    this.$defaultwidth = "100";
    this.$width        = 100;
    
    this.$sortable  = true; //@todo set defaults based on localName of element to which its applied
    this.$resizable = true;
    this.$movable   = true;
    this.$cssInit   = false;
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        css         : 1,
        icon        : 1,
        caption     : 1,
        eachcaption : 1,
        eachvalue   : 1,
        each        : 1,
        icon        : 1
    }, this.$attrExcludePropBind);
    
    this.$supportedProperties.push("tree", "icon", "caption", "width", "options", 
        "check", "editor", "colspan", "align", "css", "sorted", "each", 
        "eachvalue", "eachcaption", "model");
    
    this.$booleanProperties["tree"]  = true;
    this.$booleanProperties["check"] = true;
    this.$booleanProperties["sorted"]  = true;
    
    this.$propHandlers["width"]  = function(value, prop){
        if (!value)
            value = this.$defaultwidth;

        this.$isPercentage = value && String(value).indexOf("%") > -1;
        this.$width = parseFloat(value);
    }
    
    this.$propHandlers["options"]  = function(value, prop){
        this.$sortable  = value.indexOf("sort") > -1;
        this.$resizable = value.indexOf("size") > -1;
        this.$movable   = value.indexOf("move") > -1;
    }
    
    this.resize = function(newsize, pNode){
        var hN;
        if (this.$isPercentage) {
            var oldsize = (this.$ext.offsetWidth - (pNode.$widthdiff - 3)),
                ratio = newsize / oldsize, //div 0 ??
                next  = [],
                fixed = [],
                total = 0,
                node  = this.$ext.nextSibling;
            
            while (node && node.getAttribute("hid")) {
                hN = apf.all[node.getAttribute("hid")];
                if (hN.$isPercentage) {
                    next.push(hN);
                    total += hN.$width;
                }
                else fixed.push(hN);
                node = node.nextSibling;
            }
            
            if (fixed.length && !next.length)
                return fixed[0].resize(fixed[0].$width + (oldsize - newsize), pNode);
            
            var newPerc  = ratio * this.$width,
                diffPerc = newPerc - this.$width,
                diffRatio = (total - diffPerc) / total;
            if (diffRatio < 0.01) {
                if (newsize < 20) return;
                return this.resize(newsize - 10, pNode);//pNode.resizeColumn(nr, newsize - 10);
            }
            
            for (var n, i = 0; i < next.length; i++) {
                n = next[i];
                n.$width *= diffRatio;
                apf.setStyleRule("." + n.$className, "width", n.$width + "%"); //Set
                //apf.setStyleRule("." + pNode.$baseCSSname + " .records ."
                    //+ n.$className, "width", n.$width + "%", null, pNode.oWin); //Set
            }
            
            this.$width = newPerc;
            apf.setStyleRule("." + this.$className, "width", this.$width + "%"); //Set
            //apf.setStyleRule("." + pNode.$baseCSSname + " .records ."
                //+ h.$className, "width", this.$width + "%", null, pNode.oWin); //Set
        }
        else {
            var diff = newsize - this.$width;
            this.$width = newsize;
            if (apf.isIE && pNode.oIframe) {
                this.$ext.style.width = newsize + "px";
            }
            else {
                //apf.setStyleRule("." + this.$className, "width", newsize + "px"); //Set
            }
            apf.setStyleRule("." + this.$className, "width", newsize + "px", null, pNode.oWin); //Set

            pNode.$fixed += diff;
            var vLeft = (pNode.$fixed) + "px";

            if (!this.$isFixedGrid) {
                //apf.setStyleRule("." + this.$baseCSSname + " .headings ." + hFirst.$className, "marginLeft", "-" + vLeft); //Set
                //apf.setStyleRule("." + this.$baseCSSname + " .records ." + hFirst.$className, "marginLeft", "-" + vLeft); //Set
                apf.setStyleRule("." + pNode.$baseCSSname + " .row" + pNode.$uniqueId,
                    "paddingRight", vLeft, null, this.oWin); //Set
                apf.setStyleRule("." + pNode.$baseCSSname + " .row" + pNode.$uniqueId,
                    "marginRight", "-" + vLeft, null, pNode.oWin); //Set
            
                //headings and records have same padding-right
                pNode.$container.style.paddingRight  =
                pNode.$head.style.paddingRight = vLeft;
            }
        }
    }
    
    this.hide = function(){
        apf.setStyleRule("." + this.$baseCSSname + " .records ." + h.$className,
            "visibility", "hidden", null, this.oWin);
        
        //Change percentages here
    }
    
    this.show = function(){
        apf.setStyleRule("." + this.$baseCSSname + " .records ." + h.$className,
            "visibility", "visible", null, this.oWin);
        
        //Change percentages here
    }
    
    /**
     * Sorts a column.
     * @param {Number} hid the heading number; this number is based on the sequence of the column elements.
     */
    this.sort = function(pNode, initial){
        if (pNode.$lastSorted == this) {
            apf.setStyleClass(this.$int,
                pNode.toggleSortOrder()
                    ? "ascending"
                    : "descending", ["descending", "ascending"]);
            return;
        }

        var h;
        if (h = pNode.$lastSorted) {
            apf.setStyleRule("." + h.$className, "background", "white"); //This breaks row coloring
            apf.setStyleClass(h.$int, "", ["descending", "ascending"]);
        }
        
        apf.setStyleRule("." + this.$className, "background", "#f3f3f3");
        apf.setStyleClass(this.$int, "ascending", ["descending", "ascending"]);

        pNode.resort({
            order : "ascending",
            xpath : (this.cvalue || this.compile("value")).xpaths[1]
            //type : 
        }, false, initial || !pNode.length);
        
        
        //@todo needs more thought
        /*if (pNode.$lastSorted)
            pNode.$lastSorted.setProperty("sorted", false);
        this.setProperty("sorted", true);*/
        
        pNode.$lastSorted = this;
    };
    
    /**
     * Moves a column to another position.
     * @param {Number} fromHid the heading number of the column to move; this number is based on the sequence of the column elements.
     * @param {Number} toHid   the position the column is moved to;
     */
    this.move = function(hTo, pNode){
        if (hTo && this == hTo) 
            return;
        
        var hFrom       = this,
            childNrFrom = apf.getChildNumber(hFrom.$int),
            childNrTo   = hTo && apf.getChildNumber(hTo.$int);

        pNode.$head.insertBefore(hFrom.$int, hTo && hTo.$int || null);

        if (!pNode.length)
            return;

        (function _recur(nodes){
            for (var node, i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType != 1)
                    continue;
                //if (pNode.$withContainer && ((i+1) % 2) == 0)
                    //continue;
    
                node = nodes[i];
                if (pNode.$isTreeArch && node.tagName == "BLOCKQUOTE") { //@todo small hack
                    _recur(node.childNodes);
                }
                else {
                    node.insertBefore(node.childNodes[childNrFrom], 
                        childNrTo != undefined && node.childNodes[childNrTo] || null);
                }
            }
        })(pNode.$container.childNodes);
        
        /*if (this.$first == from || this.$first == to) {
            var hReset = this.$first == from ? hFrom : hTo;
            
            apf.setStyleRule("." + this.$baseCSSname + " .headings ."
                + hReset.className, "marginLeft", "-5px"); //Reset
            apf.setStyleRule("." + this.$baseCSSname + " .records ."
                + hReset.className, "marginLeft", "-5px"); //Reset
            
            this.$first = pNode.$head.firstChild.getAttribute("hid");
            var h = headings[this.$first];
            var vLeft = "-" + (this.$fixed + 5) + "px";

            apf.setStyleRule("." + this.$baseCSSname + " .headings ."
                + h.className, "marginLeft", vLeft); //Set
            apf.setStyleRule("." + this.$baseCSSname + " .records ."
                + h.className, "marginLeft", vLeft); //Set
        }*/
    }
    
    this.$draw = function(pNode, caption, width, className){
        //Find the parent this rule works on
        var pNode = pNode || this.parentNode;
        while (pNode.$bindingRule)
            pNode = pNode.parentNode;
        
        if (!pNode.hasFeature(apf.__PRESENTATION__))
            return;
            
        if (width) 
            this.$propHandlers["width"].call(this, width);

        //"." + this.$baseCSSname + " .headings 
        //if initial
        //only needs once if this works
        apf.importStylesheet([
          ["." + this.$className,
            "width:" + this.$width + (this.$isPercentage ? "%;" : "px;")
            + "text-align:" + this.align]
        ]);
        
        //Add to htmlRoot
        pNode.$getNewContext("headitem");
        var $head = pNode.$getLayoutNode("headitem");
        $head.setAttribute("class", this.$className + (className ? " " + className : ""));
        $head.setAttribute("hid", this.$uniqueId);
        
        var hCaption = pNode.$getLayoutNode("headitem", "caption");
        /*if (this.icon) {
            this.$sortable = false;
            $head.setAttribute("style", "background-image:url("
                + apf.getAbsolutePath(pNode.iconPath, this.icon) 
                + ")");
            hCaption.nodeValue = "&nbsp;";
        }
        else*/
            hCaption.nodeValue = this.caption || caption || '&nbsp';
        
        this.$ext = this.$int = apf.insertHtmlNode($head, pNode.$head || pNode.$container);
        
        var dragging = false;
        var _self    = this;
        
        if (this.sorted)
            this.sort(pNode, true);
        
        /*this.$int.onmouseover = function(e){
            if (!e) e = event;
            
            if (pNode.disabled) return;
            
            clearTimeout(this.$timer);

            apf.setStyleClass(this, "hover", ["down"]);
        };*/
        
        this.$int.onmouseup = function(e){
            if (!e) e = event;
            
            if (pNode.disabled || !apf.isChildOf(dragging, this, true)) 
                return;
            
            apf.setStyleClass(this, "hover", ["down"]);

            if (_self.$sortable)
                _self.sort(pNode);
            
            //@todo pNode or Self?
            pNode.dispatchEvent("sortcolumn", _self);
        };
        
        this.$int.onmousedown = function(e){
            if (!e) e = event;
            dragging = target = this;
            
            if (pNode.disabled) return;

            //Resizing
            var pos   = apf.getAbsolutePosition(target),
                sLeft = pNode.$head.scrollLeft;
            var d     = e.clientX - pos[0] + sLeft;
            if (d < 4 || target.offsetWidth - d - 8 < 3
              && apf.getChildNumber(_self.$int) < pNode.$headings.length - 1) {
                var t = d < 4 && target.previousSibling || target;
                
                if (_self.$resizable) {
                    pos   = apf.getAbsolutePosition(t);
                    apf.setStyleClass(pNode.$pointer, "size_pointer", ["move_pointer"]);
                    pNode.$pointer.style.display = "block";
                    pNode.$pointer.style.left    = (t.offsetLeft - sLeft - 1) + "px";
                    pNode.$pointer.style.width   = (t.offsetWidth - pNode.$widthdiff + 1) + "px";
                    
                    // #ifdef __WITH_PLANE
                    apf.plane.show(pNode.$pointer, null, true);
                    // #endif

                    dragging = true;
                    document.onmouseup = function(){
                        if (!e) e = event;
    
                        document.onmouseup = 
                        document.onmousemove = null;
                        
                        apf.all[t.getAttribute("hid")].resize(pNode.$pointer.offsetWidth, pNode);
                        
                        dragging = false;
                        pNode.$pointer.style.display = "none";
                        
                        // #ifdef __WITH_PLANE
                        apf.plane.hide();
                        // #endif

                    };
                    
                    document.onmousemove = function(e){
                        if (!e) e = event;

                        pNode.$pointer.style.width = Math.max(10, 
                            Math.min(pNode.$container.offsetWidth - pNode.$pointer.offsetLeft - 20, 
                                e.clientX - pos[0] - 1 + sLeft)) + "px";
                    };
                    
                    return;
                }
            }
            
            apf.setStyleClass(target, "down", ["hover"]);
            
            //Moving
            if (!_self.$movable) {
                document.onmouseup = function(e){
                    document.onmouseup = null;
                    dragging = false;
                };
                
                return;
            }
            
            apf.setStyleClass(pNode.$pointer, "move_pointer", ["size_pointer"]);
            
            var x = e.clientX - target.offsetLeft, sX = e.clientX,
                y = e.clientY - target.offsetTop,  sY = e.clientY,
                copy;
            
            document.onmouseup = function(e){
                if (!e) e = event;
                
                document.onmouseup   =
                document.onmousemove = null;
                
                dragging = false;
                pNode.$pointer.style.display = "none";
                
                if (!copy)
                    return;
                    
                copy.style.top = "-100px";
                
                var el = document.elementFromPoint(e.clientX, e.clientY);
                if (el.parentNode == copy.parentNode) {
                    var pos = apf.getAbsolutePosition(el);
                    var beforeNode = (e.clientX - pos[0] > el.offsetWidth / 2
                        ? el.nextSibling
                        : el);

                    _self.move(beforeNode ? apf.all[beforeNode.getAttribute("hid")] : null, pNode);
                }
                
                apf.destroyHtmlNode(copy);
            };

            document.onmousemove = function(e){
                if (!e) e = event;
                
                if (!copy) {
                    if (Math.abs(e.clientX - sX) < 3 && Math.abs(e.clientY - sY) < 3)
                        return;
                    
                    copy = target.cloneNode(true);
                    copy.style.position = "absolute";
                    var diff = apf.getWidthDiff(target);
                    copy.style.width    = (target.offsetWidth - diff
                        - pNode.$widthdiff + 2) + "px";
                    copy.style.left     = target.offsetLeft;
                    copy.style.top      = target.offsetTop;
                    copy.style.margin   = 0;
                    copy.removeAttribute("hid")
                    
                    apf.setStyleClass(copy, "drag", ["ascending", "descending"]);
                    target.parentNode.appendChild(copy);
                }
                
                copy.style.top               = "-100px";
                pNode.$pointer.style.display = "none";
                
                var el = document.elementFromPoint(e.clientX, e.clientY);
                if (el.parentNode == copy.parentNode) {
                    var pos = apf.getAbsolutePosition(el);
                    pNode.$pointer.style.left = (el.offsetLeft 
                        + ((e.clientX - pos[0] > el.offsetWidth / 2)
                            ? el.offsetWidth - 8
                            : 0)) + "px";
                    pNode.$pointer.style.display = "block";
                }
                
                copy.style.left = (e.clientX - x) + 'px';
                copy.style.top  = (e.clientY - y) + 'px';
            };
        };
        
        this.$int.onmouseout = function(e){
            if (!e) e = event;

            if (pNode.disabled) 
                return;
            
            var _self = this;
            this.$timer = setTimeout(function(){
                pNode.$ext.style.cursor = "";
                apf.setStyleClass(_self, "", ["hover", "down"]);
            }, 10);
        };
        
        this.$int.onmousemove = function(e){
            if (dragging || pNode.disabled)
                return;
                
            if (!e) e = event;

            var pos   = apf.getAbsolutePosition(this),
                sLeft = pNode.$head.scrollLeft;
            var d = e.clientX - pos[0] + sLeft;

            if (d < 4 || this.offsetWidth - d - pNode.$widthdiff < 3 
              && apf.getChildNumber(_self.$int) < pNode.$headings.length - 1) {
                var t = d < 4 ? this.previousSibling : this;
                pNode.$ext.style.cursor = t && _self.$resizable
                    ? "w-resize"
                    : "default";
                
                apf.setStyleClass(this, "", ["hover", "down"]);
            }
            else {
                pNode.$ext.style.cursor = "default";
                apf.setStyleClass(this, "hover", ["down"]);
            }
        };

        if (!this.options && pNode.options)
            this.$propHandlers["options"].call(this, 
                this.options = pNode.options);
        
        return this;
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        this.$draw();
    });
    
    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        if (!this.$int)
            return;
        
        this.$int.onmouseover   =
        this.$int.onmouseup     =
        this.$int.onmousedown   =
        this.$int.onmousemove   =
        this.$int.onmouseout    = null;
    });
    
}).call(apf.BindingColumnRule.prototype = new apf.BindingRule());

apf.aml.setElement("column", apf.BindingColumnRule);
// #endif

