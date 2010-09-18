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

// #ifdef __WITH_ALIGNMENT

/**
 * @constructor
 * @private
 */
apf.splitter = function(struct, tagName){
    this.$init(tagName || "splitter", apf.NODE_VISIBLE, struct);
};

(function() {
    this.$focussable = false; // This object can get the focus
    this.$splitter   = true;
    
    this.$booleanProperties["realtime"] = true;
    
    this.$propHandlers["realtime"] = function(value){
        this.$setStyleClass(this.$ext, value && (this.$baseCSSname + "Realtime") || "", 
            [this.$baseCSSname + "Realtime"]);
    }
    
    this.$propHandlers["type"] = function(value){
        this.$setStyleClass(this.$ext, value,
            [value == "horizontal" ? "vertical" : "horizontal"]);
        
        if (value == "vertical")
            this.$setStyleClass(this.$ext, "w-resize", ["n-resize"]);
        else
            this.$setStyleClass(this.$ext, "n-resize", ["w-resize"]);

        //Optimize this to not recalc for certain cases
        if (value == "horizontal") {
            this.$info = {
                pos         : "top",
                opos        : "left",
                size        : "width",
                osize       : "height",
                offsetPos   : "offsetTop",
                offsetSize  : "offsetHeight",
                oOffsetPos  : "offsetLeft",
                oOffsetSize : "offsetWidth",
                clientPos   : "clientY",
                d1          : 1,
                d2          : 0,
                x1          : 0,
                x2          : 2
            };
        }
        else {
            this.$info = {
                pos         : "left",
                opos        : "top",
                size        : "height",
                osize       : "width",
                offsetPos   : "offsetLeft",
                offsetSize  : "offsetWidth",
                oOffsetPos  : "offsetTop",
                oOffsetSize : "offsetHeight",
                clientPos   : "clientX",
                d1          : 0,
                d2          : 1,
                x1          : 3,
                x2          : 1
            }
        }
    }
    
    this.addEventListener("DOMNodeInserted", function(e){
        if (e.currentTarget != this)
            return;
        
        if (e.$oldParent) {
            e.$oldParent.removeEventListener("DOMNodeInserted", this.$siblingChange);
            e.$oldParent.removeEventListener("DOMNodeRemoved", this.$siblingChange);
        }
        
        this.init();
    });
    
    this.$siblingChange = function(e){
        //if (e.currentTarget
        
        //this.init();
    }
    
    this.update = function(newPos, finalPass){
        with (this.$info) {
            var posPrev = apf.getAbsolutePosition(this.$previous.$ext, this.parentNode.$int);
            //var pos = Math.ceil(apf.getAbsolutePosition(this.$ext, this.parentNode.$int)[d1] - posPrev[d1]);
            var max = this.$previous.$ext[offsetSize] + this.$next.$ext[offsetSize];
            newPos -= posPrev[d1];
            
            //Both flex
            if (this.$previous.flex && this.$next.flex) {
                if (!finalPass || this.realtime) 
                    newPos -= this.$ext[offsetSize];
                var totalFlex = this.$previous.flex + this.$next.flex - (finalPass && !this.realtime ? this.parentNode.padding : 0);
                this.$previous.setAttribute("flex", newPos);
                this.$next.setAttribute("flex", totalFlex - newPos);
            }
            //Fixed
            else {
                if (!this.$next.flex)
                    this.$next.setAttribute(osize, max - newPos);
                if (!this.$previous.flex)
                    this.$previous.setAttribute(osize, newPos);
            }
        }
        
        apf.layout.forceResize(this.$ext.parentNode);
    };
    
    this.init = function(size, refNode, oItem){
        this.parentNode.addEventListener("DOMNodeInserted", this.$siblingChange);
        this.parentNode.addEventListener("DOMNodeRemoved", this.$siblingChange);
        
        this.$previous = this.previousSibling;
        while(this.$previous && (this.$previous.nodeType != 1 
          || this.$previous.visible === false 
          || this.$previous.nodeFunc != apf.NODE_VISIBLE))
            this.$previous = this.$previous.previousSibling;
        this.$next     = this.nextSibling;
        while(this.$next && (this.$next.nodeType != 1 
          || this.$next.visible === false 
          || this.$next.nodeFunc != apf.NODE_VISIBLE))
            this.$next = this.$next.nextSibling;

        this.$thickness = null;
        if (this.parentNode.$box) {
            this.setProperty("type", this.parentNode.localName == "vbox" 
                ? "horizontal" 
                : "vertical");
            this.$thickness = parseInt(this.parentNode.padding);
        }
        
        with (this.$info) {
            var diff = apf.getDiff(this.$ext);
            if (!this.parentNode.$box) {
                var iSize  = Math.max(
                    this.$previous.$ext[offsetSize], this.$next.$ext[offsetSize]);
                this.$ext.style[size] = (iSize - diff[d1]) + "px";
            }

            var iThick = this[osize] = this.$thickness 
                || (this.$next[oOffsetPos] - this.$previous[oOffsetPos] 
                    - this.$previous[oOffsetSize]);

            this.$ext.style[osize] = (iThick - diff[d2]) + "px";
        }
        
        return this;
    };
    
    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal();

        var _self = this;
        this.$ext.onmousedown = function(e){
            if (!e)
                e = event;
            
            _self.parentNode.$int.style.position = "relative";
            
            with (_self.$info) {
                var posPrev = apf.getAbsolutePosition(_self.$previous.$ext, _self.parentNode.$int);
                var min = posPrev[d1] || 0;
                var posNext = apf.getAbsolutePosition(_self.$next.$ext, _self.parentNode.$int);
                var max = posNext[d1] + _self.$next.$ext[offsetSize] - this[offsetSize];
            
                //Set flex to pixel sizes
                if (_self.$previous.flex && _self.$next.flex) {
                    var set = [], nodes = _self.parentNode.childNodes, padding = 0;
                    for (var node, i = 0, l = nodes.length; i < l; i++) {
                        if ((node = nodes[i]).visible === false 
                          || node.nodeFunc != apf.NODE_VISIBLE || node.$splitter)
                            continue;
                        
                        if (node.flex)
                            set.push(node, node.$ext[offsetSize] 
                                + (apf.hasFlexibleBox && !_self.realtime && node == _self.$previous 
                                    ? 2 * _self.parentNode.padding : 0));
                    }
                    for (var i = 0, l = set.length; i < l; i+=2) {
                        set[i].setAttribute("flex", set[i+1]);
                    }
                }
            
                var startPos;
                if (apf.hasFlexibleBox) {
                    var pos = apf.getAbsolutePosition(this);
                    startPos = e[clientPos] - pos[d1];
                    
                    if (!_self.realtime) {
                        if (apf.hasFlexibleBox) {
                            if (_self.$previous.flex && !_self.$next.flex) {
                                var mBox = apf.getBox(_self.$next.margin);
                                mBox[x1] = _self.parentNode.padding;
                                _self.$next.$ext.style.margin = mBox.join("px ") + "px";
                            }
                            else {
                                var mBox = apf.getBox(_self.$previous.margin);
                                mBox[x2] = _self.parentNode.padding;
                                _self.$previous.$ext.style.margin = mBox.join("px ") + "px";
                            }
                        }
                        
                        var diff = apf.getDiff(this);
                        this.style.left     = pos[0] + "px";
                        this.style.top      = pos[1] + "px"; //(apf.getHtmlTop(this) - Math.ceil(this.offsetHeight/2))
                        this.style.width    = (this.offsetWidth - diff[0]) + "px";
                        this.style.height   = (this.offsetHeight - diff[1]) + "px";
                        this.style.position = "absolute";
                    }
                }
                else {
                    startPos            = 0;
                    this.style.left     = "0px";
                    this.style.top      = "0px";
                    this.style.position = "relative";
                }
            }
            
            e.returnValue  = false;
            e.cancelBubble = true;
            
            // #ifdef __WITH_PLANE
            apf.plane.show(this);
            // #endif

            _self.$setStyleClass(this, _self.$baseCSSname + "Moving");
            
            _self.$setStyleClass(document.body,
                _self.type == "vertical" ? "w-resize" : "n-resize",
                [_self.type == "vertical" ? "n-resize" : "w-resize"]);
            
            //@todo convert to proper way
            document.onmouseup = function(e){
                if(!e) e = event;
                
                var newPos;
                with (_self.$info) {
                    var newPos;
                    if (e[clientPos] >= 0) {
                        var pos = apf.getAbsolutePosition(_self.$ext.offsetParent);
                        newPos = (Math.min(max, Math.max(min, (e[clientPos] - pos[d1]) - startPos)));
                    }
                }
                
                _self.$setStyleClass(_self.$ext, "", [_self.$baseCSSname + "Moving"]);
                _self.$setStyleClass(document.body, "", ["n-resize", "w-resize"]);
                
                _self.parentNode.$int.style.position = "";
                
                if (apf.hasFlexibleBox && !_self.realtime)
                    (_self.$previous.flex && !_self.$next.flex
                      ? _self.$next : _self.$previous).$ext.style.margin 
                        = apf.getBox(_self.$previous.margin).join("px ") + "px";
                
                if (newPos)
                    _self.update(newPos, true);
                
                // #ifdef __WITH_PLANE
                apf.plane.hide();
                // #endif
                
                if (!_self.realtime) {
                    _self.$ext.style.left     = "";
                    _self.$ext.style.top      = "";
                    _self.$ext.style[_self.$info.size] = "";
                    _self.$ext.style.position = "";
                }
                
                document.onmouseup   = 
                document.onmousemove = null;
            };
            
            //@todo convert to proper way
            document.onmousemove = function(e){
                if(!e) e = event;
        
                with (_self.$info) {
                    var newPos;
                    if (e[clientPos] >= 0) {
                        var pos = apf.getAbsolutePosition(_self.$ext.offsetParent);
                        newPos = (Math.min(max, Math.max(min, (e[clientPos] - pos[d1]) - startPos)));
                    
                        if (_self.realtime)
                            _self.update(newPos);
                        else
                            _self.$ext.style[pos] = newPos + "px";
                    }
                }
                
                e.returnValue  = false;
                e.cancelBubble = true;
            };
        }
        
        apf.queue.add("splitter" + this.$uniqueId, function(){
            _self.init();
        });
    };
        
    this.$loadAml = function(x){
        if (this.realtime !== false && (!apf.isIE || apf.isIE > 8))
            this.$propHandlers.realtime.call(this, this.realtime = true);
    };
}).call(apf.splitter.prototype = new apf.Presentation());

apf.aml.setElement("splitter", apf.splitter);
// #endif
