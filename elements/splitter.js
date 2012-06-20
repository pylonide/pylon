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
    this.minwidth    = 0;
    this.minheight   = 0;
    
    this.$scale = 0; // 0 both, 1 left/top, 2 right/bottom 
    
    this.$focussable = false; // This object can get the focus
    this.$splitter   = true;
    
    this.$booleanProperties["realtime"] = true;
    
    this.$propHandlers["realtime"] = function(value){
        this.$setStyleClass(this.$ext, value && (this.$baseCSSname + "Realtime") || "", 
            [this.$baseCSSname + "Realtime"]);
    }
    
    this.$propHandlers["scale"] = function(value){
        this.$scale = value == "left" || value == "top"
            ? 1 : (value == "right" || "bottom " 
                ? 2 : 0);
    }
    
    this.$propHandlers["parent"] = function(value){
        this.$parent = typeof value == "object" ? value : self[value];
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
        
        /*if (e.$oldParent) {
            e.$oldParent.removeEventListener("DOMNodeInserted", this.$siblingChange);
            e.$oldParent.removeEventListener("DOMNodeRemoved", this.$siblingChange);
        }*/
        
        this.init && this.init();
    });
    
    /*this.$siblingChange = function(e){
        //if (e.currentTarget
        
        //this.init();
    }*/
    
    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal();

        var template = "vbox|hbox".indexOf(this.parentNode.localName) > -1
            ? "box" : "splitbox";
            
        apf.extend(this, apf.splitter.templates[template]);
        this.decorate();
    };
        
    this.$loadAml = function(x){
        if (this.realtime !== false) // && (!apf.isIE || apf.isIE > 8))
            this.$propHandlers.realtime.call(this, this.realtime = true);
    };
}).call(apf.splitter.prototype = new apf.Presentation());

apf.splitter.templates = {
    box : {
        update : function(newPos, finalPass){
            with (this.$info) {
                //var pos = Math.ceil(apf.getAbsolutePosition(this.$ext, this.parentNode.$int)[d1] - posPrev[d1]);
                var max = this.$previous 
                    ? this.$previous.$ext[offsetSize] + this.$next.$ext[offsetSize]
                    : (this.parentNode).getWidth();
                var method = finalPass ? "setAttribute" : "setProperty";
                if (apf.hasFlexibleBox)
                    newPos -= this.$previous ? apf.getAbsolutePosition(this.$previous.$ext, this.parentNode.$int)[d1] : 0;
    
                //Both flex
                if (this.$previous && this.$next && (this.$previous.flex || this.$previous.flex === 0) && (this.$next.flex || this.$next.flex === 0)) {
                    if (!finalPass && !this.realtime) 
                        newPos -= this.$ext[offsetSize];
    
                    //var totalFlex = this.$previous.flex + this.$next.flex - (finalPass && !this.realtime ? this.parentNode.padding : 0);
                    if (!this.$scale || this.$scale == 1)
                        this.$previous[method]("flex", newPos);
                    if (!this.$scale || this.$scale == 2)
                        this.$next[method]("flex", this.$totalFlex - newPos);
                }
                //Fixed
                else {
                    if (this.$next && !this.$next.flex && (!this.$scale || this.$scale == 2))
                        this.$next[method](osize, max - newPos);
                    if (this.$previous && !this.$previous.flex && (!this.$scale || this.$scale == 1))
                        this.$previous[method](osize, newPos);
                }
            }
    
            if (apf.hasSingleResizeEvent)
                apf.layout.forceResize(this.$ext.parentNode);
        },
        
        $setSiblings : function(){
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
        },
        
        init : function(size, refNode, oItem){
            //this.parentNode.addEventListener("DOMNodeInserted", this.$siblingChange);
            //this.parentNode.addEventListener("DOMNodeRemoved", this.$siblingChange);
            
            this.$setSiblings();
            
            this.$thickness = null;
            if (this.parentNode && this.parentNode.$box) {
                this.setProperty("type", this.parentNode.localName == "vbox" 
                    ? "horizontal" 
                    : "vertical");
                this.$thickness = parseInt(this.parentNode.padding);
            }
            
            if (!this.$previous || !this.$next)
                return this;
            
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
        },
        
        decorate : function(){
            var _self = this;
            this.$ext.onmousedown = function(e){
                if (!e)
                    e = event;
                
                if (_self.dispatchEvent("dragstart") === false)
                    return;
                
                apf.dragMode = true; //prevent selection
                
                _self.$setSiblings();
    
                var changedPosition, pHtml = _self.parentNode.$int, diff = 0;
                if ("absolute|fixed|relative".indexOf(apf.getStyle(pHtml, "position")) == -1) {
                    pHtml.style.position = "relative";
                    changedPosition = true;
                }
    
                _self.$totalFlex = 0;
                with (_self.$info) {
                    if (_self.$parent) {
                        if (!_self.$previous) {
                            var posNext = apf.getAbsolutePosition(_self.$next.$ext, _self.parentNode.$int);
                            var wd = _self.$parent.getWidth();
                            
                            if (_self.$scale == 2) {
                                var max = posNext[d1] + _self.$next.$ext[offsetSize] - this[offsetSize];
                                diff = (_self.parentNode.$int[offsetSize] - max);
                                var min = max - wd - diff;
                            }
                        }
                        else if (!_self.$next) {
                            //@todo
                        }
                    }
                    else {
                        if (_self.$previous) {
                            var posPrev = apf.getAbsolutePosition(_self.$previous.$ext, _self.parentNode.$int);
                            var min = _self.$scale 
                                ? 0 
                                : (posPrev[d1] || 0) + (parseInt(_self.$previous.minwidth) || 0);
                        }
                        if (_self.$next) {
                            var posNext = apf.getAbsolutePosition(_self.$next.$ext, _self.parentNode.$int);
                            var max = posNext[d1] + _self.$next.$ext[offsetSize] 
                                - this[offsetSize] - (parseInt(_self.$next.minwidth) || 0);
                        }
                    }
                    
                    //Set flex to pixel sizes
                    if (_self.$previous && _self.$next) {
                        if ((_self.$previous.flex || _self.$previous.flex === 0) 
                          && (_self.$next.flex || _self.$next.flex === 0)) {
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
                        
                        _self.$totalFlex += _self.$next.flex + _self.$previous.flex;
                    }
                    
                    var startPos, startOffset;
                    if (apf.hasFlexibleBox) {
                        var coords = apf.getAbsolutePosition(this);
                        startPos = e[clientPos] - coords[d1];
    
                        if (!_self.realtime) {
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
                            
                            var diff = apf.getDiff(this);
                            this.style.left     = coords[0] + "px";
                            this.style.top      = coords[1] + "px"; //(apf.getHtmlTop(this) - Math.ceil(this.offsetHeight/2))
                            this.style.width    = (this.offsetWidth - diff[0]) + "px";
                            this.style.height   = (this.offsetHeight - diff[1]) + "px";
                            this.style.position = "absolute";
                        }
                    }
                    else {
                        var coords = apf.getAbsolutePosition(this.offsetParent);
                        startOffset = apf.getAbsolutePosition(_self.$previous.$ext)[d1];
                        startPos    = e[clientPos] - coords[d1];
                        
                        if (!_self.realtime) {
                            this.style.left     = "0px";
                            this.style.top      = "0px";
                            this.style.position = "relative";
                        }
                        min = -1000; //@todo
                    }
                }
                
                //e.returnValue  = false;
                //e.cancelBubble = true;
                //apf.stopEvent(e);
                
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
                    
                    with (_self.$info) {
                        var newPos;
                        if (e[clientPos] >= 0) {
                            var coords = apf.getAbsolutePosition(_self.$ext.offsetParent);
                            newPos = (Math.min(max, Math.max(min, (e[clientPos] - coords[d1]) - 
                                (apf.hasFlexibleBox ? startPos : startOffset)))) + diff;
                        }
                    }
    
                    _self.$setStyleClass(_self.$ext, "", [_self.$baseCSSname + "Moving"]);
                    _self.$setStyleClass(document.body, "", ["n-resize", "w-resize"]);
                    
                    if (changedPosition)
                        pHtml.style.position = "";
                    
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
                    
                    _self.dispatchEvent("dragdrop");
                    
                    document.onmouseup   = 
                    document.onmousemove = null;
                    
                    apf.dragMode = false; //return to default selection policy
                };
                
                //@todo convert to proper way
                document.onmousemove = function(e){
                    if(!e) e = event;
            
                    with (_self.$info) {
                        var newPos;
                        if (e[clientPos] >= 0) {
                            var coords = apf.getAbsolutePosition(_self.$ext.offsetParent);
                            newPos = (Math.min(max, Math.max(min, (e[clientPos] - coords[d1]) - 
                                (apf.hasFlexibleBox || !_self.realtime ? startPos : startOffset)))) + diff;
    
                            if (_self.realtime)
                                _self.update(newPos);
                            else {
                                _self.$ext.style[pos] = newPos + "px";
                            }
                        }
                    }
                    
                    apf.stopEvent(e);
                    //e.returnValue  = false;
                    //e.cancelBubble = true;
                    
                    _self.dispatchEvent("dragmove");
                };
            }
            
            apf.queue.add("splitter" + this.$uniqueId, function(){
                _self.init();
            });
        }
    },
    
    splitbox : {
        update : function(newPos, finalPass){
            this[this.parentNode.$vbox ? "updateV" : "updateH"](newPos, finalPass);
        },
        
        updateV : function(newPos, finalPass){
            var method = finalPass ? "setAttribute" : "setProperty";
            
            var pNode = this.$parent || this.parentNode;
            if (pNode.fixedChild) {
                if (pNode.fixedChild == pNode.firstChild) {
                    pNode.fixedChild[method]("height", newPos - pNode.$edge[0]);
                }
                else {
                    pNode.fixedChild[method]("height", 
                        apf.getHtmlInnerHeight(pNode.$int) - newPos 
                        - pNode.padding - pNode.$edge[1]);
                }
            }
            else if (pNode.firstChild.height) {
                var total = apf.getHtmlInnerHeight(pNode.$int);
                pNode.firstChild[method]("height", 
                    ((newPos - pNode.$edge[0])/total*100) + "%");
            }
            else {
                var total = apf.getHtmlInnerHeight(pNode.$int) ;
                pNode.lastChild[method]("height", 
                    ((total - newPos - pNode.$edge[2] - pNode.padding)/total*100) + "%");
            }
    
            if (apf.hasSingleResizeEvent)
                apf.layout.forceResize(this.$ext.parentNode);
        },
        
        updateH : function(newPos, finalPass){
            var method = finalPass ? "setAttribute" : "setProperty";

            var pNode = this.$parent || this.parentNode;
            if (pNode.fixedChild) {
                if (pNode.fixedChild == pNode.firstChild) {
                    pNode.fixedChild[method]("width", newPos - pNode.$edge[3]);
                }
                else {
                    pNode.fixedChild[method]("width", 
                        apf.getHtmlInnerWidth(pNode.$int) - newPos 
                        - pNode.padding - pNode.$edge[2]);
                }
            }
            else if (pNode.firstChild.width) {
                var total = apf.getHtmlInnerWidth(pNode.$int);
                pNode.firstChild[method]("width", 
                    ((newPos - pNode.$edge[3])/total*100) + "%");
            }
            else {
                var total = apf.getHtmlInnerWidth(pNode.$int) ;
                pNode.lastChild[method]("width", 
                    ((total - newPos - pNode.$edge[1] - pNode.padding)/total*100) + "%");
            }
    
            if (apf.hasSingleResizeEvent)
                apf.layout.forceResize(this.$ext.parentNode);
        },
        
        $setSiblings : function(){
            this.$previous = this.parentNode.firstChild
            this.$next = this.parentNode.lastChild;
        },
        
        decorate : function(){
            var _self = this;
            
            if (this.parentNode && this.parentNode.$box) {
                this.setProperty("type", this.parentNode.$vbox
                    ? "horizontal" 
                    : "vertical");
            }
            
            this.$ext.onmousedown = function(e){
                if (!e)
                    e = event;

                if (_self.dispatchEvent("dragstart") === false)
                    return;

                apf.dragMode = true; //prevent selection
                
                _self.$setSiblings();

                var pNode = _self.$parent || _self.parentNode;
                if (pNode.$vbox) {
                    var min = parseInt(pNode.firstChild.minheight) + pNode.$edge[0];
                    var max = apf.getHtmlInnerHeight(pNode.$ext) - pNode.lastChild.minheight 
                        - pNode.$edge[2] - pNode.padding;
                    var offset = e.layerY || e.offsetY;
                }
                else {
                    var min = parseInt(pNode.firstChild.minwidth) + pNode.$edge[3];
                    var max = apf.getHtmlInnerWidth(pNode.$ext) - pNode.lastChild.minwidth 
                        - pNode.$edge[1] - pNode.padding;
                    var offset = e.layerX || e.offsetX;
                }
                
                function update(e, final){
                    var newPos, coords;
                    if (pNode.$vbox) {
                        if (e.clientY >= 0) {
                            coords = apf.getAbsolutePosition(_self.$parent ? _self.$parent.$ext : _self.$ext.offsetParent);
                            newPos = Math.min(max, Math.max(min, (e.clientY - coords[1] - offset)));
                        }
                    }
                    else {
                        if (e.clientX >= 0) {
                            coords = apf.getAbsolutePosition(_self.$parent ? _self.$parent.$ext : _self.$ext.offsetParent);
                            newPos = Math.min(max, Math.max(min, (e.clientX - coords[0] - offset)));
                        }
                    }
                    
                    if (!newPos) return;
                    
                    if (_self.realtime || final)
                        _self.update(newPos, final);
                    else {
                        _self.$ext.style[pNode.$vbox ? "top" : "left"] = newPos + "px";
                    }
                }
    
                // #ifdef __WITH_PLANE
                apf.plane.show(this);
                // #endif
    
                _self.$setStyleClass(this, _self.$baseCSSname + "Moving");
                
                _self.$setStyleClass(document.body,
                    _self.type == "vertical" ? "w-resize" : "n-resize",
                    [_self.type == "vertical" ? "n-resize" : "w-resize"]);
                
                //@todo convert to proper way
                document.onmouseup = function(e){
                    if (!e) e = event;
                    
                    _self.$setStyleClass(_self.$ext, "", [_self.$baseCSSname + "Moving"]);
                    _self.$setStyleClass(document.body, "", ["n-resize", "w-resize"]);
                    
                    update(e, true);
                    
                    // #ifdef __WITH_PLANE
                    apf.plane.hide();
                    // #endif
                    
                    if (!_self.realtime) {
                        _self.$ext.style.left     = "";
                        _self.$ext.style.top      = "";
                        _self.$ext.style[_self.$info.size] = "";
                        _self.$ext.style.position = "";
                    }
                    
                    _self.dispatchEvent("dragdrop");
                    
                    document.onmouseup   = 
                    document.onmousemove = null;
                    
                    apf.dragMode = false; //return to default selection policy
                };
                
                //@todo convert to proper way
                document.onmousemove = function(e){
                    if (!e) e = event;
            
                    update(e);
                    
                    apf.stopEvent(e);
                    //e.returnValue  = false;
                    //e.cancelBubble = true;
                    
                    _self.dispatchEvent("dragmove");
                };
            }
        }
    }
};

apf.aml.setElement("splitter", apf.splitter);
// #endif
