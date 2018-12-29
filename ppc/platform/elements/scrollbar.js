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
 * @constructor
 * @private
 */
apf.scrollbar = function(struct, tagName){
    this.$init(tagName || "scrollbar", apf.NODE_VISIBLE, struct);
};

(function(){
    this.realtime = true;
    this.visible  = false;
    this.overflow = "scroll";
    this.position = 0;
    
    this.$visible         = true;
    this.$scrollSizeValue = 0;
    this.$stepValue       = 0.03;
    this.$bigStepValue    = 0.1;
    this.$timer           = null;
    this.$scrollSizeWait;
    this.$slideMaxSize;
    
    this.$booleanProperties = ["showonscroll"];

    this.addEventListener("focus", function(){
        this.$viewport.focus();
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
                    _self.attach(amlNode);
                });
            }
            else
                this.attach(amlNode);
        }
    }
    
    this.addEventListener("prop.visible", function(e){
        if (!this.$updating) {
            this.$visible = e.value;
        }
    });
    
    this.attach = function(viewport){
        if (viewport.nodeFunc) {
            // #ifdef __WITH_VIRTUALVIEWPORT
            if (viewport.hasFeature(apf.__VIRTUALVIEWPORT__))
                viewport = viewport.$viewport;
            else
            // #endif
                viewport = new apf.ViewPortAml(viewport);
        }
        else if (viewport.style)
            viewport = new apf.ViewPortHtml(viewport);
        
        this.$attach(viewport);
    };
    
    /**
     * @todo detach
     */
    this.$attach = function(viewport){
        if (!viewport)
            return apf.console.warn("Scrollbar could not connect to viewport");
        
        var _self = this;
        
        this.$viewport = viewport;
        
        if (this.$viewport.scrollbar != this) {
            this.$viewport.setScrollbar(this, function(e){
                if (_self.$viewport != viewport)
                    return;
                
                _self.$update();
                
                if (_self.showonscroll) { // && e.byUser) {
                    _self.scrolling = true;
                    
                    clearTimeout(_self.$hideOnScrollTimer);
                    if (_self.$hideOnScrollControl)
                        _self.$hideOnScrollControl.stop();
                    
                    apf.setOpacity(_self.$ext, 1);
                    !_self.visible ? _self.show() : _self.$ext.style.display = "block";
                    _self.$update();
                    
                    _self.$hideOnScrollTimer = _self.animHideScrollbar(500, function(){
                        _self.scrolling = false;
                    });
                }
            });
        }

        this.$recalc();
        this.$update();
        
        return this;
    };
    
    this.$resize = function(){
        if (!this.$viewport || !this.$viewport.isVisible())
            return;
            
        this.$recalc();
        this.$update();
        
        if (!this.$viewport.virtual)
            return;
        
        this.setScrollPosition(this.position, true);
    }
    
    this.$recalc = function(){
        this.$viewheight         = this.$viewport.getHeight();
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

        var viewport = this.$viewport;
        if (!viewport || !viewport.isVisible())
            return;

        this.$updating = true;
        
        //Disable scrollbar
        var vp = viewport.getHeight();
        var sz = viewport.getScrollHeight();

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

            this.position = viewport.getScrollTop() / (sz - vp);

            var bUpHeight = this.$btnUp ? this.$btnUp[this.$offsetSize] : 0;
            this.$caret.style[this.$pos] = (bUpHeight + (apf[this.$getInner](this.$caret.parentNode)
            - (bUpHeight * 2) - this.$caret[this.$offsetSize]) * this.position) + "px";
        }
        
        this.$updating = false;
    }
    
    this.setScrollPosition = function(position, preventEvent) {
        if (position == NaN) {
            //#ifdef __DEBUG
            apf.console.warn("Scrollbar is hidden while scrolling.");
            //#endif
            return;
        }
        
        if (position > 1) 
            position = 1;
        if (position < 0) 
            position = 0;
        
        this.position = position;
        
        // Set the caret position
        var bUpHeight = this.$btnUp ? this.$btnUp[this.$offsetSize] : 0;
        this.$caret.style[this.$pos] = (bUpHeight + (apf[this.$getInner](this.$caret.parentNode)
            - (bUpHeight * 2) - this.$caret[this.$offsetSize]) * this.position) + "px";

        // Don't signal anything when animating or when not visible
        if (this.animating || !this.$visible) 
            return;

        var vp   = this.$viewport;
        var to   = (vp.getScrollHeight() - vp.getHeight()) * position;

        vp.setScrollTop(to, preventEvent);
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
                steps : 20,
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
        this.setScrollPosition(this.position + this.$bigStepValue);
        
        if (this.$slideFast) {
            this.$slideFast.style[this.$size] = Math.max(1, this.$caret[this.$offsetPos]
                - this.$btnUp[this.$offsetSize]) + "px";
            this.$slideFast.style[this.$pos]    = this.$btnUp[this.$offsetSize] + "px";
        }
    }
    
    this.scrollDown = function (v){
        if (v < this.$caret[this.$offsetPos] + this.$caret[this.$offsetSize]) 
            return this.$ext.onmouseup();
        this.setScrollPosition(this.position + this.$bigStepValue);
        
        if (this.$slideFast) {
            this.$slideFast.style[this.$pos]    = (this.$caret[this.$offsetPos] + this.$caret[this.$offsetSize]) + "px";
            this.$slideFast.style[this.$size] = Math.max(1, apf[this.$getInner](this.$caret.parentNode) - this.$slideFast[this.$offsetPos]
                - this.$btnUp[this.$offsetSize]) + "px";
        }
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
                
                _self.setScrollPosition(_self.position - _self.$stepValue);
                apf.stopPropagation(e);
                
                //apf.window.$mousedown(e);
                
                _self.$timer = $setTimeout(function(){
                    _self.$timer = setInterval(function(){
                        _self.setScrollPosition(_self.position - _self.$stepValue);
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
                
                _self.setScrollPosition(_self.position + _self.$stepValue)
                apf.stopPropagation(e);
                
                //apf.window.$mousedown(e);
                
                _self.$timer = $setTimeout(function(){
                    _self.$timer = setInterval(function(){
                        _self.setScrollPosition(_self.position + _self.$stepValue)
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

                _self.setScrollPosition((next - min) / (max - min));
            };
            
            document.onmouseup = function(){
                _self.$startPos = false;
                if (!_self.realtime)
                    _self.setScrollPosition(_self.position);
                
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
                _self.setScrollPosition(_self.position + _self.$bigStepValue);
                
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
                _self.setScrollPosition(_self.position - _self.$bigStepValue);
                
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
                _self.setScrollPosition(_self.position);
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
            return sb && apf.isTrue(sb.getAttribute("showonscroll"));
        }
        
        var oHtml = this.$container || this.$int || this.$ext, timer, sb;
        var mouseMove;
        apf.addListener(oHtml, "mousemove", mouseMove = function(e){
            if (!_self.$sharedScrollbar)
                _self.$sharedScrollbar = self[name];
            
            sb = _self.$sharedScrollbar;
            
            if (!sb.$addedMouseOut) {
                apf.addListener(sb.$ext, "mouseout", function(e){
                    if (!hasOnScroll())
                        return;

                    if (apf.findHost(e.fromElement) == sb && apf.findHost(e.toElement) != sb) {
                        clearTimeout(timer);
                        hideScrollbar();
                    }
                });
                sb.$addedMouseOut = true;
            }
            
            if (!sb.$viewport || sb.$viewport.amlNode != _self) {
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
            
            if (hasOnScroll() && e) {
                clearTimeout(timer);
                
                var pos = apf.getAbsolutePosition(oHtml);
                var rightPos = oHtml.offsetWidth - (e.clientX - pos[0]);
                var show = rightPos < 25 && rightPos > right;
                if (show && sb.$ext.style.display == "none" 
                  || !show && sb.$ext.style.display == "block") {
                    if (show)
                        showScrollbar();
                    else
                        hideScrollbar();
                }
                else if (!show)
                    sb.showonscroll = true;
            }
        });
        
        this.$sharedScrollbarMove = mouseMove;
        
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

            var el = apf.findHost(e.toElement || e.rangeParent);
            if (el != sb && el != sbShared.$viewport.amlNode) {
                clearTimeout(timer);
                hideScrollbar();
            }
        });
    }
};

apf.ViewPortAml = function(amlNode){
    this.amlNode = amlNode;
    
    var _self = this;
    var update = function(){
        if (_self.scrollbar)
            _self.scrollbar.$update();
    };
    
    amlNode.addEventListener("resize", update);
    if (amlNode.hasFeature(apf.__DATABINDING__)) {
        amlNode.addEventListener("afterload", update);
        amlNode.addEventListener("xmlupdate", update);
    }
    
    amlNode.addEventListener("prop.value", update);
    
    if (amlNode.$isTreeArch) {
        amlNode.addEventListener("collapse", update);
        amlNode.addEventListener("expand", update);
    }
    
    amlNode.addEventListener("mousescroll", function(e){
        _self.$mousescroll(e);
    });
    
    var htmlNode = _self.$getHtmlHost();
    apf.addListener(htmlNode, "scroll", function(){
        if (_self.scrollbar.animating || !_self.scrollbar.$visible) 
            return;
        
        _self.setScrollTop(this.scrollTop);
    });
    
    if ("HTML|BODY".indexOf(htmlNode.tagName) > -1) {
        var lastHeight = htmlNode.scrollHeight;
        setInterval(function(){
            if (lastHeight != htmlNode.scrollHeight) {
                lastHeight = htmlNode.scrollHeight;
                _self.scrollbar.$recalc();
                _self.scrollbar.$update();
            }
        }, 100);
    }
};

(function(){
    this.setScrollbar = function(scrollbar, onscroll){
       this.scrollbar = scrollbar;
       
       this.amlNode.addEventListener("scroll", onscroll);
    }
    
    this.isVisible = function(){
        var htmlNode = this.$getHtmlHost();
        return htmlNode.offsetHeight || htmlNode.offsetWidth ? true : false;
    }
    
    this.focus = function(){
        if (this.amlNode.focus && this.amlNode.$isWindowContainer !== true)
            this.amlNode.focus();
    }
    
    this.getScrollTop = function(){
        var htmlNode = this.$getHtmlHost();
        return htmlNode.scrollTop;
    }
    
    this.getScrollLeft = function(){
        var htmlNode = this.$getHtmlHost();
        return htmlNode.scrollLeft;
    }
    
    this.getScrollHeight = function(){
        var htmlNode = this.$getHtmlHost();
        return (apf.isIE && htmlNode.lastChild 
            ? htmlNode.lastChild.offsetTop 
                + htmlNode.lastChild.offsetHeight
                + apf.getBox(apf.getStyle(htmlNode, "padding"))[2]
                + (parseInt(apf.getStyle(htmlNode, "marginBottom")) || 0)
            : htmlNode.scrollHeight);
    }
    
    this.getScrollWidth = function(){
        var htmlNode = this.$getHtmlHost();
        return (apf.isIE && htmlNode.lastChild 
            ? htmlNode.lastChild.offsetLeft 
                + htmlNode.lastChild.offsetWidth
                + apf.getBox(apf.getStyle(htmlNode, "padding"))[1]
                + (parseInt(apf.getStyle(htmlNode, "marginRight")) || 0)
            : htmlNode.scrollWidth);
    }
    
    this.getHeight = function(){
        var htmlNode = this.$getHtmlHost();
        return htmlNode.tagName == "HTML" || htmlNode.tagName == "BODY" 
            ? apf.getWindowHeight() 
            : apf.getHtmlInnerHeight(htmlNode);
    }
    
    this.getWidth = function(){
        var htmlNode = this.$getHtmlHost();
        return htmlNode.tagName == "HTML" || htmlNode.tagName == "BODY" 
            ? apf.getWindowHeight() 
            : apf.getHtmlInnerWidth(htmlNode);
    }
    
    this.setScrollTop = function(value, preventEvent, byUser){
        var htmlNode = this.$getHtmlHost();
        htmlNode.scrollTop = value;
        
        if (!preventEvent) {
            this.amlNode.dispatchEvent("scroll", {
                direction : "vertical",
                byUser    : byUser,
                viewport  : this,
                scrollbar : this.scrollbar
            });
        }
    }
    
    this.setScrollLeft = function(value, preventEvent, byUser){
        var htmlNode = this.$getHtmlHost();
        htmlNode.scrollLeft = value;
        
        if (!preventEvent) {
            this.amlNode.dispatchEvent("scroll", {
                direction : "horizontal",
                byUser    : byUser,
                viewport  : this,
                scrollbar : this.scrollbar
            });
        }
    }
    
    // *** Private *** //
    
    this.$getHtmlHost = function(){
        var htmlNode = this.amlNode.$int || this.amlNode.$container;
        return (htmlNode.tagName == "BODY" || htmlNode.tagName == "HTML" 
            ? (apf.isSafari || apf.isChrome ? document.body : htmlNode.parentNode) 
            : htmlNode);
    }

    this.$mousescroll = function(e){
        if (this.scrollbar.horizontal)
            return;
        
        if (e.returnValue === false)
            return;
    
        var oHtml = this.$getHtmlHost();
    
        var sb  = this.scrollbar;
        var div = this.getScrollHeight() - this.getHeight();
        if (div) {
            if (oHtml[sb.$scrollPos] == 0 && e.delta > 0) {
                if (this.$lastScrollState === 0)
                    return;
                setTimeout(function(){this.$lastScrollState = 0;}, 300);
            }
            else if (oHtml[sb.$scrollPos] == this.getScrollHeight() - oHtml[sb.$offsetSize] && e.delta < 0) {
                if (this.$lastScrollState === 1)
                    return;
                setTimeout(function(){this.$lastScrollState = 1;}, 300);
            }
            delete this.$lastScrollState;
            
            this.setScrollTop(this.getScrollTop()
                + -1 * e.delta * Math.min(45, this.getHeight()/10), false, true);
            
            e.preventDefault();
        }
    }
}).call(apf.ViewPortAml.prototype);

apf.ViewPortHtml = function(htmlNode){
    // *** Private *** //
    
    this.$getHtmlHost = function(){
        return htmlNode;
    }
    
    // *** Init *** //
    
    var _self = this;
    
    htmlNode = (htmlNode.tagName == "BODY" || htmlNode.tagName == "HTML" 
        ? (apf.isSafari || apf.isChrome ? document.body : htmlNode.parentNode) 
        : htmlNode);

    apf.addEventListener("mousescroll", function(e){
        if (htmlNode == e.target 
          || (htmlNode == document.documentElement && e.target == document.body))
            _self.$mousescroll(e);
    })
    
    apf.addListener(htmlNode, "scroll", function(){
        _self.setScrollTop(this.scrollTop);
    });
    
    if ("HTML|BODY".indexOf(htmlNode.tagName) > -1) {
        var lastHeight = htmlNode.scrollHeight;
        setInterval(function(){
            if (lastHeight != htmlNode.scrollHeight) {
                lastHeight = htmlNode.scrollHeight;
                _self.scrollbar.$recalc();
                _self.scrollbar.$update();
            }
        }, 100);
    }
    
    this.amlNode = new apf.Class().$init();
}

apf.ViewPortHtml.prototype = apf.ViewPortAml.prototype;

//#endif