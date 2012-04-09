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

//#ifdef __WITH_SCROLLBAR

//@todo: fix the stuff with all the uppercase variable and function names...wazzup?

/**
 * This library needs to be refactored.
 * @constructor
 * @private
 */
apf.scrollbar = function(struct, tagName){
    this.$init(tagName || "scrollbar", apf.NODE_VISIBLE, struct);
};

(function(){
    this.realtime = true;
    this.visible  = false;
    this.$visible = true;
    this.overflow = "scroll";
    
    this.$scrollSizeValue  = 0;
    this.$stepValue    = 0.03;
    this.$bigStepValue = 0.1;
    this.$curValue     = 0;
    this.$timer        = null;
    this.$scrollSizeWait;
    this.$slideMaxSize;
    
    this.$booleanProperties = ["showonscroll"];

    this.addEventListener("focus", function(){
        if (this.$host.focus && this.$host.$isWindowContainer !== true)
            this.$host.focus();
    });

    this.$propHandlers["showonscroll"] = function(value){
        clearTimeout(this.$hideOnScrollTimer);
        
        if (value) {
            this.$ext.style.display = "none";
        }
        else {
            this.$ext.style.display = "block";
            this.show(); //Trigger positioning event
        }
    };

    this.$propHandlers["overflow"] = function(value){
        if (this.showonscroll)
            return;
        
        if (value == "auto") {
            this.$ext.style.display = "none";
            this.$resize();
        }
        else if (value == "scroll") {
            this.setProperty("visible", true);
        }
    }
    
    this.$propHandlers["for"] = function(value){
        if (value) {
            var amlNode = typeof value == "string" ? self[value] : value;
            if (!amlNode || !amlNode.$amlLoaded) {
                var _self = this;
                apf.queue.add("scrollbar" + this.$uniqueId, function(){
                    if (!amlNode) {
                        amlNode = typeof value == "string" ? self[value] : value;
                        
                        if (!amlNode) {
                            throw new Error(apf.formatErrorString(0, _self,
                               "Attaching scrollbar to element",
                               "Could not find element to attach scrollbar to: " + value));
                        }
                    }
                    _self.$attach(amlNode);
                });
            }
            else
                this.$attach(amlNode);
        }
    }
    
    this.addEventListener("prop.visible", function(e){
        if (!this.$updating) {
            this.$visible = e.value;
        }
    });
    
    this.$detach = function(){
        
    }
    
    //@deprecated
    this.attach = function(oHtml, o, scroll_func){
        this.$attach(o);
        this.addEventListener("scroll", scroll_func);
    }
    
    this.$getHtmlHost = function(){
        var h = this.$host && (this.$host.$int || this.$host.$container);
        return (h && (h.tagName == "BODY" || h.tagName == "HTML") ? (apf.isSafari || apf.isChrome ? document.body : h.parentNode) : h);
    }
    
    this.$getViewPort = function(oHtml){
        if (this.$host.viewport)
            return this.$host.viewport.limit;
        
        return oHtml.tagName == "HTML" || oHtml.tagName == "BODY" ? apf[this.$windowSize]() : oHtml[this.$offsetSize];
    }
    this.$getScrollHeight = function(oHtml){
        if (this.$host.viewport)
            return this.$host.viewport.length;
        
        //add margin + bottom padding
        return (apf.isIE && oHtml.lastChild 
            ? oHtml.lastChild[this.$offsetPos] 
                + oHtml.lastChild[this.$offsetSize] 
                + apf.getBox(apf.getStyle(oHtml, "padding"))[2]
                + (parseInt(apf.getStyle(oHtml, "marginBottom")) || 0)
            : oHtml[this.$scrollSize]);
    }
    
    //oHtml, o, scroll_func
    this.$attach = function(amlNode){
        if (!amlNode)
            return apf.console.warn("Scrollbar could not connect to amlNode");
        
//        if (amlNode.host)
//            amlNode = amlNode.host;

        if (!amlNode.nodeFunc && amlNode.style || amlNode.host) {
            this.$host = {
                empty : true,
                $int  : amlNode.host 
                    ? amlNode.host.$int || amlNode.host.$container
                    : amlNode,
                viewport : amlNode
            };
        }
        else {
            this.$host = amlNode;
        }

        //oHtml.parentNode.appendChild(this.$ext);
        //if (this.overflow == "scroll") {
        //    this.$ext.style.display = "block";
        //    this.enable();
        //}
        
        //this.$ext.style.zIndex  = 100000;
        //this.$ext.style.left    = "166px";//(o.offsetLeft + o.offsetWidth) + "px";
        //this.$ext.style.top     = "24px";//o.offsetTop + "px";
        //this.$ext.style.height  = "160px";//o.offsetHeight + "px";
        
        this.$recalc();
        
        //this.$viewheight / this.$scrollSizeheight
        //if (o.length) {
        //    this.$caret.style.height = Math.max(5, ((o.limit / o.length)
        //        * this.$slideMaxSize)) + "px";
        //    if (this.$caret.offsetHeight - 4 == this.$slideMaxSize) 
        //        this.$ext.style.display = "none";
        //}

        var scrollFunc = function(e){
            if (e.returnValue === false)
                return;

            scrolling = apf.isIE;
            var oHtml = _self.$getHtmlHost();

            var div = (_self.$getScrollHeight(oHtml) - _self.$getViewPort(oHtml));
            if (div) {
                if (_self.$host.viewport) {
                    var viewport = _self.$host.viewport;
                    _self.$curValue = ((_self.$curValue * div) + (-1 * e.delta * viewport.limit / 10)) / div;
                    //console.log(viewport.offset, viewport.limit, div, _self.$curValue);
                }
                else {
                    if (oHtml[_self.$scrollPos] == 0 && e.delta > 0) {
                        if (_self.$lastScrollState === 0)
                            return;
                        setTimeout(function(){_self.$lastScrollState = 0;}, 300);
                    }
                    else if (oHtml[_self.$scrollPos] == _self.$getScrollHeight(oHtml) - oHtml[_self.$offsetSize] && e.delta < 0) {
                        if (_self.$lastScrollState === 1)
                            return;
                        setTimeout(function(){_self.$lastScrollState = 1;}, 300);
                    }
                    delete _self.$lastScrollState;
                    _self.$curValue = (oHtml[_self.$scrollPos] + -1 * e.delta * Math.min(45, apf[_self.$getInner](oHtml)/10)) / div;
                }
                
                _self.setScroll(null, null, null, true);
                e.preventDefault();
            }
        };
        
        var _self = this, scrolling;
        if (!this.$host.empty) {
            amlNode.addEventListener("resize", function(){ //@todo cleanup?
                _self.$update();
            });
            if (amlNode.hasFeature(apf.__DATABINDING__)) {
                amlNode.addEventListener("afterload", function(){
                    _self.$update();
                });
                amlNode.addEventListener("xmlupdate", function(){
                    _self.$update();
                });
            }
            
            amlNode.addEventListener("prop.value", function(){
                _self.$update();
            });
            
            if (amlNode.$isTreeArch) {
                amlNode.addEventListener("collapse", function(){
                    _self.$update();
                });
                amlNode.addEventListener("expand", function(){
                    _self.$update();
                });
            }
            
            if (!this.horizontal)
                amlNode.addEventListener("mousescroll", scrollFunc);
        }
        else {
            if (!this.horizontal) {
                apf.addEventListener("mousescroll", function(e){
                    if (amlNode.host || amlNode == e.target || (amlNode == document.documentElement && e.target == document.body))
                        scrollFunc(e);
                })
            }
        }
        
        var oHtml = _self.$getHtmlHost();
        if (!this.$host.viewport)
            apf.addListener(oHtml, "scroll", function(){
                if (_self.animating || !_self.$visible) 
                    return;
                
                if (!scrolling) {
                    var oHtml = _self.$getHtmlHost();
                    var m = _self.$getScrollHeight(oHtml) - _self.$getViewPort(oHtml);
                    var p = oHtml[_self.$scrollPos] / m;
                    if (Math.abs(_self.$curValue - p) > 1/m) {
                        _self.$curValue = p;
                        _self.setScroll(null, null, null, true);
                    }
                    return false;
                }
                scrolling = false;
            });
        
        if ("HTML|BODY".indexOf(oHtml.tagName) > -1) {
            var lastHeight = oHtml.scrollHeight;
            setInterval(function(){
                if (lastHeight != oHtml.scrollHeight) {
                    lastHeight = oHtml.scrollHeight;
                    _self.$recalc();
                    _self.$update();
                    //_self.setScroll(null, true);*/
                }
            }, 100);
        }
        
        this.$update();
        
        return this;
    };
    
    this.$resize = function(){
        var oHtml = this.$getHtmlHost();
        if (!oHtml || !oHtml.offsetHeight) 
            return;
        
        this.$recalc();
        this.$update();
        this.setScroll(null, true, true);
    }
    
    this.$recalc = function(){
        var oHtml = this.$getHtmlHost();
        if (!oHtml) return;
        
        this.$viewheight         = this.$getViewPort(oHtml);
        this.$scrollSizeheight   = this.$viewheight;
        this.$scrollSizeWait     = 0;//(this.$host.len * COLS)/2;
        this.$stepValue          = (this.$viewheight / this.$scrollSizeheight) / 20;
        this.$bigStepValue       = this.$stepValue * 3;
        this.$slideMaxSize       = this.$caret.parentNode[this.$offsetSize] 
            - (this.$btnDown ? this.$btnDown[this.$offsetSize] : 0)
            - (this.$btnUp ? this.$btnUp[this.$offsetSize] : 0);
    }
    
    //@todo this function is called way too many times
    this.$update = function(){
        // Commented this out because otherwise a tree expansion wouldn't
        // show the scrollbar again
        //if (this.animating || !this.$visible)
        //    return;

        if (this.showonscroll && !this.$ext.offsetHeight)
            return;

        var oHtml = this.$getHtmlHost();
        if (!oHtml || !oHtml.offsetHeight) //@todo generalize this to resize for non-ie
            return;
        
        this.$updating = true;
        
        //Disable scrollbar
        var vp = this.$getViewPort(oHtml);
        var sz = this.$getScrollHeight(oHtml);//this.$getScrollHeight(oHtml);

        if (vp >= sz) {
            if (this.overflow == "scroll") {
                this.$caret.style.display = "none";
                this.disable();
            }
            else if (this.visible) {
                this.hide();
                
                //this.$ext.style.display = "none";
            }
            //if (this.id == "sbtest") console.log(vp + ":" + sz);
            //oHtml.style.overflowY = "visible";
        }
        //Enable scrollbar
        else {
            if (this.overflow == "scroll") {
                this.$caret.style.display = "block";
                this.enable();
            }
            else if (!this.visible) {
                this.show();
                //this.$ext.style.display = "block";
                //this.$caret.style.display = "block";
            }
            
            if (!this.$slideMaxSize)
                this.$recalc();
            if (!this.$slideMaxSize)
                return;
            
            //oHtml.style.overflowY = "scroll";
            
            //Set scroll size
            this.$caret.style[this.$size] = (Math.max(5, (vp / sz
                * this.$slideMaxSize)) - apf[this.$getDiff](this.$caret)) + "px";
            //if (this.$caret.offsetHeight - 4 == this.$slideMaxSize) 
                //this.$ext.style.display = "none";
            
            this.$curValue = oHtml[this.$scrollPos] / (sz - vp);

            var bUpHeight = this.$btnUp ? this.$btnUp[this.$offsetSize] : 0;
            this.$caret.style[this.$pos] = (bUpHeight + (apf[this.$getInner](this.$caret.parentNode)
            - (bUpHeight * 2) - this.$caret[this.$offsetSize]) * this.$curValue) + "px";
        }
        
        this.$updating = false;
    }
    
    this.setScroll = function (timed, noEvent, noUpdateParent, byUser){
        if (this.$curValue > 1) 
            this.$curValue = 1;
        if (this.$curValue < 0) 
            this.$curValue = 0;

        if (this.$curValue == NaN) {
            //#ifdef __DEBUG
            apf.console.warn("Scrollbar is hidden while scrolling.");
            //#endif
            return;
        }
        
        var bUpHeight = this.$btnUp ? this.$btnUp[this.$offsetSize] : 0;
        this.$caret.style[this.$pos] = (bUpHeight + (apf[this.$getInner](this.$caret.parentNode)
            - (bUpHeight * 2) - this.$caret[this.$offsetSize]) * this.$curValue) + "px";

        if (this.animating || !this.$visible) 
            return;

        var oHtml, from, viewport, to;
        if (this.$host) {
            oHtml    = this.$getHtmlHost();
            from     = oHtml[this.$scrollPos];
            viewport = this.$getViewPort(oHtml);
            to       = (this.$getScrollHeight(oHtml) - viewport) * this.$curValue;
        }

        if (!noUpdateParent) {
            if (this.$host)
                oHtml[this.$scrollPos] = to;
        }

        if (!noEvent) {
            (this.$host && this.$host.dispatchEvent 
              ? this.$host 
              : this).dispatchEvent("scroll", {
                    timed        : timed,
                    viewportSize : viewport,
                    scrollPos    : to,
                    scrollSize   : this.$getScrollHeight(oHtml),
                    from         : from,
                    pos          : this.$curValue //this.pos
                });
        }
        
        if (this.showonscroll && byUser) {
            var _self = this;
            this.scrolling = true;
            
            clearTimeout(this.$hideOnScrollTimer);
            if (_self.$hideOnScrollControl)
                _self.$hideOnScrollControl.stop();
            
            apf.setOpacity(this.$ext, 1);
            !this.visible ? this.show() : this.$ext.style.display = "block";
            this.$update();
            
            this.$hideOnScrollTimer = this.animHideScrollbar(500, function(){
                _self.scrolling = false;
            });
        }
        
        this.pos = this.$curValue;
    }
    
    this.animShowScrollbar = function(timeout, cb){
        var _self = this;
        return setTimeout(function(){
            _self.$ext.style.display = "block";
            
            if (_self.$showOnScrollControl
              && _self.$showOnScrollControl.state == apf.tween.RUNNING)
                return;
            
            if (_self.$hideOnScrollControl)
                _self.$hideOnScrollControl.stop();

            apf.tween.single(_self.$ext, {
                control : _self.$hideOnScrollControl = {},
                type : "fade",
                from : 0,
                to   : 1,
                onfinish : function(){
                    cb && cb();
                }
            });
        }, timeout)
    }
    
    this.animHideScrollbar = function(timeout, cb){
        var _self = this;
        return setTimeout(function(){
            if (_self.$hideOnScrollControl
              && _self.$hideOnScrollControl.state == apf.tween.RUNNING)
                return;
            
            if (_self.$showOnScrollControl)
                _self.$showOnScrollControl.stop();
            apf.tween.single(_self.$ext, {
                control : _self.$hideOnScrollControl = {},
                type : "fade",
                from : 1,
                to   : 0,
                onfinish : function(){
                    _self.$ext.style.display = "none";
                    apf.setOpacity(_self.$ext, 1);
                    
                    cb && cb();
                }
            });
        }, timeout)
    }
    
    this.scrollUp = function (v){
        if (v > this.$caret[this.$offsetPos]) 
            return this.$ext.onmouseup();
        this.$curValue -= this.$bigStepValue;
        this.setScroll(null, null, null, true);
        
        if (this.$slideFast) {
            this.$slideFast.style[this.$size] = Math.max(1, this.$caret[this.$offsetPos]
                - this.$btnUp[this.$offsetSize]) + "px";
            this.$slideFast.style[this.$pos]    = this.$btnUp[this.$offsetSize] + "px";
        }
    }
    
    this.scrollDown = function (v){
        if (v < this.$caret[this.$offsetPos] + this.$caret[this.$offsetSize]) 
            return this.$ext.onmouseup();
        this.$curValue += this.$bigStepValue;
        this.setScroll(null, null, null, true);
        
        if (this.$slideFast) {
            this.$slideFast.style[this.$pos]    = (this.$caret[this.$offsetPos] + this.$caret[this.$offsetSize]) + "px";
            this.$slideFast.style[this.$size] = Math.max(1, apf[this.$getInner](this.$caret.parentNode) - this.$slideFast[this.$offsetPos]
                - this.$btnUp[this.$offsetSize]) + "px";
        }
    }
    
    this.getPosition = function(){
        return this.pos;
    };
    
    this.setPosition = function(pos, noEvent){
        this.$curValue = pos;
        this.setScroll(null, noEvent);
    };
    
    this.updatePos = function(){
        if (this.animating || !this.$visible) 
            return;
        
        var o = this.$host;
        var indHeight = Math.round(Math.max(10, (((o.limit - 1) / o.length) * this.$slideMaxSize)));
        this.$caret.style[this.$pos] = (this.$curValue * (this.$slideMaxSize - indHeight) + this.$btnUp[this.$offsetSize]) + "px";
    }
    
    this.$onscroll = function(timed, perc){
        this.$host[this.$scrollPos] = (this.$host[this.$scrollSize] - this.$host[this.$offsetSize] + 4) * this.$curValue;
    }
    
    this.$draw = function(){
        //Build Skin
        this.$getNewContext("main");
        this.$ext         = this.$getExternal();
        //this.$ext.style.display = "none";

        this.$caret       = this.$getLayoutNode("main", "indicator", this.$ext);
        this.$slideFast   = this.$getLayoutNode("main", "slidefast", this.$ext);
        this.$btnUp       = this.$getLayoutNode("main", "btnup",     this.$ext)
        this.$btnDown     = this.$getLayoutNode("main", "btndown",   this.$ext);

        this.horizontal   = apf.isTrue(this.$getOption("main", "horizontal"));
        
        this.$windowSize = this.horizontal ? "getWindowWidth" : "getWindowHeight";
        this.$offsetSize = this.horizontal ? "offsetWidth" : "offsetHeight";
        this.$size       = this.horizontal ? "width" : "height";
        this.$offsetPos  = this.horizontal ? "offsetLeft" : "offsetTop";
        this.$pos        = this.horizontal ? "left" : "top";
        this.$scrollSize = this.horizontal ? "scrollWidth" : "scrollHeight";
        this.$scrollPos  = this.horizontal ? "scrollLeft" : "scrollTop";
        this.$getDiff    = this.horizontal ? "getWidthDiff" : "getHeightDiff";
        this.$getInner   = this.horizontal ? "getHtmlInnerWidth" : "getHtmlInnerHeight"; 
        this.$eventDir   = this.horizontal 
            ? (apf.isIE || apf.isWebkit ? "offsetX" : "layerX") 
            : (apf.isIE || apf.isWebkit ? "offsetY" : "layerY");
        this.$clientDir  = this.horizontal ? "clientX" : "clientY";
        this.$posIndex   = this.horizontal ? 0 : 1;
        
        this.$startPos    = false;
        
        this.$caret.ondragstart = function(){
            return false
        };

        var _self = this;
        if (this.$btnUp) {
            this.$btnUp.onmousedown = function(e){
                if (_self.disabled)
                    return;
                
                if (!e) 
                    e = event;
                this.className = "btnup btnupdown";
                clearTimeout(_self.$timer);
                
                _self.$curValue -= _self.$stepValue;
                
                _self.setScroll(null, null, null, true);
                apf.stopPropagation(e);
                
                //apf.window.$mousedown(e);
                
                _self.$timer = $setTimeout(function(){
                    _self.$timer = setInterval(function(){
                        _self.$curValue -= _self.$stepValue;
                        _self.setScroll(null, null, null, true);
                    }, 20);
                }, 300);
            };
            
            this.$btnUp.onmouseout = this.$btnUp.onmouseup = function(){
                if (_self.disabled)
                    return;
                    
                this.className = "btnup";
                clearInterval(_self.$timer);
            };
        }
        
        if (this.$btnDown) {
            this.$btnDown.onmousedown = function(e){
                if (_self.disabled)
                    return;
                    
                if (!e) 
                    e = event;
                this.className = "btndown btndowndown";
                clearTimeout(_self.$timer);
                
                _self.$curValue += _self.$stepValue;
                _self.setScroll(null, null, null, true);
                apf.stopPropagation(e);
                
                //apf.window.$mousedown(e);
                
                _self.$timer = $setTimeout(function(){
                    _self.$timer = setInterval(function(){
                        _self.$curValue += _self.$stepValue;
                        _self.setScroll(null, null, null, true);
                    }, 20);
                }, 300);
            };
        
            this.$btnDown.onmouseout = this.$btnDown.onmouseup = function(){
                if (_self.disabled)
                    return;
                    
                this.className = "btndown";
                clearInterval(_self.$timer);
            };
        }
        
        this.$caret.onmousedown = function(e){
            if (_self.disabled)
                return;

            if (!e) 
                e = event;
            
            var tgt = e.target || e.srcElement;
            var pos = tgt != this
                ? [tgt.offsetLeft, tgt.offsetTop] //Could be improved
                : [0, 0];
            
            var relDelta = e[_self.$eventDir] + pos[_self.$posIndex];
            _self.$startPos = relDelta + 
                (_self.$btnUp ? _self.$btnUp[_self.$offsetSize] : 0);

            if (this.setCapture)
                this.setCapture();

            _self.$setStyleClass(_self.$ext, _self.$baseCSSname + "Down");
            _self.dispatchEvent("mousedown", {});
            
            _self.dragging = true;

            document.onmousemove = function(e){
                if (!e) 
                    e = event;
                //if(e.button != 1) return _self.onmouseup();
                if (_self.$startPos === false) 
                    return false;

                var bUpHeight = _self.$btnUp ? _self.$btnUp[_self.$offsetSize] : 0;
                var next = bUpHeight + (e[_self.$clientDir] - _self.$startPos
                    + (apf.isWebkit ? document.body : document.documentElement)[_self.$scrollPos]
                    - apf.getAbsolutePosition(_self.$caret.parentNode)[_self.horizontal ? 0 : 1]); // - 2
                var min = bUpHeight;
                if (next < min) 
                    next = min;
                var max = (apf[_self.$getInner](_self.$caret.parentNode)
                    - bUpHeight - _self.$caret[_self.$offsetSize]);
                if (next > max) 
                    next = max;
                //_self.$caret.style.top = next + "px"

                _self.$curValue = (next - min) / (max - min);
                _self.setScroll(true);
            };
            
            document.onmouseup = function(){
                _self.$startPos = false;
                if (!_self.realtime)
                    _self.setScroll();
                
                if (this.releaseCapture)
                    this.releaseCapture();
                
                _self.$setStyleClass(_self.$ext, "", [_self.$baseCSSname + "Down"]);
                _self.dispatchEvent("mouseup", {});
                
                _self.dragging = false;
                
                document.onmouseup   = 
                document.onmousemove = null;
            };
    
            apf.stopPropagation(e);
            //apf.window.$mousedown(e);
            
            return false;
        };
        
        this.$ext.onmousedown = function(e){
            if (_self.disabled)
                return;
            if (!e) 
                e = event;
            clearInterval(_self.$timer);
            var offset;
            if (e[_self.$eventDir] > _self.$caret[_self.$offsetPos] + _self.$caret[_self.$offsetSize]) {
                _self.$curValue += _self.$bigStepValue;
                _self.setScroll(true, null, null, true);
                
                if (_self.$slideFast) {
                    _self.$slideFast.style.display = "block";
                    _self.$slideFast.style[_self.$pos]     = (_self.$caret[_self.$offsetPos]
                        + _self.$caret[_self.$offsetSize]) + "px";
                    _self.$slideFast.style[_self.$size]  = (apf[_self.$getInner](_self.$caret.parentNode) - _self.$slideFast[_self.$offsetPos]
                        - _self.$btnUp[_self.$offsetSize]) + "px";
                }
                
                offset = e[_self.$eventDir];
                _self.$timer = $setTimeout(function(){
                    _self.$timer = setInterval(function(){
                        _self.scrollDown(offset, null, null, true);
                    }, 20);
                }, 300);
            }
            else if (e[_self.$eventDir] < _self.$caret[_self.$offsetPos]) {
                _self.$curValue -= _self.$bigStepValue;
                _self.setScroll(true, null, null, true);
                
                if (_self.$slideFast) {
                    _self.$slideFast.style.display = "block";
                    _self.$slideFast.style[_self.$pos] = _self.$btnUp[_self.$offsetSize] + "px";
                    _self.$slideFast.style[_self.$size] = (_self.$caret[_self.$offsetPos] - _self.$btnUp[_self.$offsetSize]) + "px";
                }
                
                offset = e[_self.$eventDir];
                _self.$timer = $setTimeout(function(){
                    _self.$timer = setInterval(function(){
                        _self.scrollUp(offset, null, null, true);
                    }, 20);
                }, 300);
            }
        };
        
        this.$ext.onmouseup = function(){
            if (_self.disabled)
                return;
                
            clearInterval(_self.$timer);
            if (!_self.realtime)
                _self.setScroll(null, null, null, true);
            if (_self.$slideFast)
                _self.$slideFast.style.display = "none";
        };

        this.$ext.onmouseover = function(e){
            _self.dispatchEvent("mouseover", {htmlEvent : e || event});
        };

        this.$ext.onmouseout = function(e){
            _self.dispatchEvent("mouseout", {htmlEvent : e || event});
        };
    }
    
    this.$loadAml = function(){
        if (this.overflow == "scroll")
            this.disable();
        else {
            this.$caret.style.display = "block";
            this.enable();
        }
        
        this.addEventListener("resize", this.$resize);
        this.$update();
    }
}).call(apf.scrollbar.prototype = new apf.Presentation());
apf.aml.setElement("scrollbar", apf.scrollbar);

apf.GuiElement.propHandlers["scrollbar"] = function(value) {
    if (this.$sharedScrollbar == undefined) {
        var values = value.split(" ");
        var name = values[0];
        var top  = values[1] || 0;
        var right  = values[2] || 0;
        var bottom  = values[3] || 0;
        
        var _self = this;
        this.$sharedScrollbar = self[name] || false;
        
        function hasOnScroll(){
            return apf.isTrue(sb.getAttribute("showonscroll"));
        }
        
        var oHtml = this.$container || this.$int || this.$ext, timer, sb;
        var mouseMove;
        apf.addListener(oHtml, "mousemove", mouseMove = function(e){
            if (!_self.$sharedScrollbar)
                _self.$sharedScrollbar = self[name];
            
            sb = _self.$sharedScrollbar;
            
            if (sb.$host != _self) {
                var pNode = (_self.$ext == oHtml ? _self.$ext.parentNode : _self.$ext);
                pNode.appendChild(sb.$ext);
                
                if (apf.getStyle(pNode, "position") == "static") 
                    pNode.style.position = "relative";
                    
                sb.setProperty("showonscroll", true);
                sb.$ext.style.display = "block";
                sb.setAttribute("top", top);
                sb.setAttribute("right", right);
                sb.setAttribute("bottom", bottom);
                sb.setAttribute("for", _self);
                sb.$ext.style.display = "none";
                sb.dragging = false;
                if (sb.$hideOnScrollControl)
                    sb.$hideOnScrollControl.stop();
            }
            
            if (hasOnScroll()) {
                clearTimeout(timer);
                var pos = apf.getAbsolutePosition(oHtml);
                var show = oHtml.offsetWidth - (e.clientX - pos[0]) < 25;
                if (show && sb.$ext.style.display == "none" || !show && sb.$ext.style.display == "block") {
                    if (show)
                        showScrollbar();
                    else
                        hideScrollbar();
                }
                else if (!show)
                    sb.showonscroll = true;
            }
        });
        
        function showScrollbar(){
            sb.setProperty("showonscroll", false);
            sb.$ext.style.display = "none";
            timer = sb.animShowScrollbar(200);
        }
        
        function hideScrollbar(timeout){
            if (sb.scrolling)
                return;
            
            if (!sb.dragging)
                timer = sb.animHideScrollbar(timeout || 200, function(){
                    sb.setProperty("showonscroll", true);
                });
            else
                apf.addListener(document, "mouseup", function(e){
                    var tgt = apf.findHost(e.target);
                    if (tgt == sb)
                        return;
                        
                    if (tgt == _self)
                        mouseMove(e);
                    else
                        hideScrollbar();
                    
                    apf.removeListener(document, "mouseup", arguments.callee);
                });
        }
        
        apf.addListener(oHtml, "mouseout", function(e){
            if (!hasOnScroll())
                return;
            
            if (apf.findHost(e.relatedTarget) == sb) {
                apf.addListener(sb.$ext, "mouseout", function(e){
                    hideScrollbar();
                    
                    apf.removeListener(sb.$ext, "mouseout", arguments.callee);
                });
                return;
            }
            
            clearTimeout(timer);
            hideScrollbar();
        });
    }
};

apf.ViewPortAml = function(amlNode){
    this.getScrollTop = function(){
        
    }
    
    this.getScrollLeft = function(){
        
    }
    
    this.getScrollHeight = function(){
        
    }
    
    this.getScrollWidth = function(){
        
    }
    
    this.getHeight = function(){
        
    }
    
    this.getWidth = function(){
        
    }
    
    this.setScrollTop = function(value){
        
    }
    
    this.setScrollLeft = function(value){
        
    }
}

apf.ViewPortHtml = function(){
    
}


//#endif
