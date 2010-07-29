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
    this.overflow = "scroll";
    
    this.$scrollSizeValue  = 0;
    this.$stepValue    = 0.03;
    this.$bigStepValue = 0.1;
    this.$curValue     = 0;
    this.$timer        = null;
    this.$scrollSizeWait;
    this.$slideMaxSize;
    
    this.addEventListener("focus", function(){
        if (this.$host.focus)
            this.$host.focus();
    });

    this.$propHandlers["overflow"] = function(value){
        
    }

    this.$propHandlers["for"] = function(value){
        if (value)
            this.$attach(typeof value == "string" ? self[value] : value);
    }
    
    this.$detach = function(){
        
    }
    
    //@deprecated
    this.attach = function(oHtml, o, scroll_func){
        this.$attach(o);
        this.addEventListener("scroll", scroll_func);
    }
    
    this.$getHtmlHost = function(){
        var h = this.$host && (this.$host.$int || this.$host.$container);
        return h && h.tagName == "BODY" ? h.parentNode : h;
    }
    
    //oHtml, o, scroll_func
    this.$attach = function(amlNode){
        if (!amlNode)
            return apf.console.warn("Scrollbar could not connect to amlNode");
        
        if (amlNode.host)
            amlNode = amlNode.host;

        if (!amlNode.nodeFunc && amlNode.style) {
            this.$host = {
                empty : true,
                $int  : amlNode
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
            scrolling = apf.isIE;
            var oHtml = _self.$getHtmlHost();

            //oHtml[_self.$scrollPos] += e.delta * -1 * apf[_self.$getInner](oHtml)/5;
            var div = (oHtml[_self.$scrollSize] - oHtml[_self.$offsetSize]);
            if (div) {
                _self.$curValue = (oHtml[_self.$scrollPos] + -1 * e.delta * apf[_self.$getInner](oHtml)/5) / div;
                _self.setScroll();
                e.preventDefault();
            }
        };

        var _self = this, scrolling;
        if (!this.$host.empty) {
            amlNode.addEventListener("resize", function(){
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
            amlNode.addEventListener("mousescroll", scrollFunc);
        }
        else {
            apf.dispatchEvent("mousescroll", function(e){
                if (amlNode == e.target)
                    scrollFunc();
            })
        }

        var oHtml = _self.$getHtmlHost();
        oHtml.onscroll = function(){
            if (!scrolling) {
                var oHtml = _self.$getHtmlHost();
                var m = oHtml[_self.$scrollSize] - oHtml[_self.$offsetSize];
                var p = oHtml[_self.$scrollPos] / m;
                if (Math.abs(_self.$curValue - p) > 1/m) {
                    _self.$curValue = p;
                    _self.setScroll();
                }
                return false;
            }
            scrolling = false;
        }
        
        this.$update();
        
        return this;
    };
    
    this.$recalc = function(){
        var oHtml            = this.$getHtmlHost();
        if (!oHtml) return;
        
        this.$viewheight     = oHtml[this.$offsetSize];
        this.$scrollSizeheight   = this.$viewheight;
        this.$scrollSizeWait     = 0;//(this.$host.len * COLS)/2;
        this.$stepValue      = (this.$viewheight / this.$scrollSizeheight) / 20;
        this.$bigStepValue   = this.$stepValue * 3;
        this.$slideMaxSize = this.$caret.parentNode[this.$offsetSize] 
            - (this.$btnDown ? this.$btnDown[this.$offsetSize] : 0)
            - (this.$btnUp ? this.$btnUp[this.$offsetSize] : 0);
    }
    
    this.$update = function(){
        var oHtml = this.$getHtmlHost();
        
        //Disable scrollbar
        if (oHtml[this.$offsetSize] >= oHtml[this.$scrollSize]) {
            if (this.overflow == "scroll") {
                this.$caret.style.display = "none";
                this.disable();
            }
            else {
                this.$ext.style.display = "none";
            }
            
            //oHtml.style.overflowY = "visible";
        }
        //Enable scrollbar
        else {
            if (this.overflow == "scroll") {
                this.$caret.style.display = "block";
                this.enable();
            }
            else {
                this.$ext.style.display = "block";
                this.$caret.style.display = "block";
            }
            
            //oHtml.style.overflowY = "scroll";
            
            //Set scroll size
            this.$caret.style[this.$size] = (Math.max(5, (oHtml[this.$offsetSize] / oHtml[this.$scrollSize]
                * this.$slideMaxSize)) - apf[this.$getDiff](this.$caret)) + "px";
            //if (this.$caret.offsetHeight - 4 == this.$slideMaxSize) 
                //this.$ext.style.display = "none";
            
            this.$curValue = oHtml[this.$scrollPos] / (oHtml[this.$scrollSize] - apf[this.$getInner](oHtml));
            
            var bUpHeight = this.$btnUp ? this.$btnUp[this.$offsetSize] : 0;
            this.$caret.style[this.$pos] = (bUpHeight + (apf[this.$getInner](this.$caret.parentNode)
            - (bUpHeight * 2) - this.$caret[this.$offsetSize]) * this.$curValue) + "px";
        }
    }
    
    this.setScroll = function (timed, noEvent){
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

        //status = this.$curValue;
        this.pos = this.$curValue;//(this.$caret.offsetTop-this.$btnUp.offsetHeight)/(this.$slideMaxSize-this.$caret.offsetHeight);
        if (!noEvent) {
            this.dispatchEvent("scroll", {
                timed : timed, 
                pos   : this.pos
            });
            
            if (this.$host) {
                var oHtml = this.$getHtmlHost();
                oHtml[this.$scrollPos] = (oHtml[this.$scrollSize] - apf[this.$getInner](oHtml)) * this.pos;
            }
        }
    }
    
    this.scrollUp = function (v){
        if (v > this.$caret[this.$offsetPos]) 
            return this.$ext.onmouseup();
        this.$curValue -= this.$bigStepValue;
        this.setScroll();
        
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
        this.setScroll();
        
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
        setScroll(null, noEvent);
    };
    
    /*this.$update = function(){
        //var oHtml = this.$attachedHtml;
        //this.$ext.style.left = (oHtml.offsetLeft + oHtml.offsetWidth + 1) + 'px';
        //this.$ext.style.top = (oHtml.offsetTop - 1) + 'px';
        //this.$ext.style.height = (oHtml.offsetHeight - 2) + 'px';
        var oHtml = this.$getHtmlHost();

        var o = this.$host;
        if (o.length) {
            this.$ext.style.display = "block";
            
            o.initialLimit = 0;
            o.findNewLimit();

            var indHeight;
            this.$slideMaxSize = this.$ext.offsetHeight - this.$btnDown.offsetHeight - this.$btnUp.offsetHeight;
            this.$caret.style.height = ((indHeight = Math.max(10, (((o.limit - 1) / o.length)
                * this.$slideMaxSize))) - apf.getHeightDiff(this.$caret)) + "px";
            this.$caret.style.top = (this.$curValue * (this.$slideMaxSize - Math.round(indHeight)) + this.$btnUp.offsetHeight) + "px";
            
            this.$stepValue = (o.limit / o.length) / 20;
            this.$bigStepValue   = this.$stepValue * 3;
        }
        
        if (!o.length || o.limit >= o.length && oHtml.scrollHeight < oHtml.offsetHeight) {
            if (this.overflow == "scroll") {
                this.$caret.style.display = "none";
                this.disable();
            }
            else {
                this.$ext.style.display = "none";
            }
            
            oHtml.style.overflowY = "visible";
        }
        else {
            if (this.overflow == "scroll") {
                this.$caret.style.display = "block";
                this.enable();
            }
            else {
                this.$ext.style.display = "block";
                this.$caret.style.display = "block";
            }
            
            oHtml.style.overflowY = "scroll";
        }
        
        //this.$ext.style.top    = "-2px";
        //this.$ext.style.right  = 0;

        //if (this.$ext.parentNode.offsetHeight)
        //    this.$ext.style.height = "400px";//(this.$ext.parentNode.offsetHeight - 20) + "px";
        //else 
        //    this.$ext.style.height = "100%"
    }*/
    
    this.updatePos = function(){
        var o = this.$host;
        var indHeight = Math.round(Math.max(10, (((o.limit - 1) / o.length) * this.$slideMaxSize)));
        this.$caret.style[this.$pos] = (this.$curValue * (this.$slideMaxSize - indHeight) + this.$btnUp[this.$offsetSize]) + "px";
    }
    
    this.$onscroll = function(timed, perc){
        this.$host[this.$scrollPos] = (this.$host[this.$scrollSize] - this.$host[this.$offsetSize] + 4) * this.$curValue;
        /*var now = new Date().getTime();
         if (timed && now - this.$host.last < (timed ? this.$scrollSizeWait : 0)) return;
         this.$host.last = now;
         var value = parseInt((DATA.length - this.$host.len + 1) * this.$curValue);
         showData(value);*/
    }
    
    this.$draw = function(){
        //Build Skin
        this.$getNewContext("main");
        this.$ext               = this.$getExternal();
        //this.$ext.style.display = "none";
        this.disable();

        this.$caret       = this.$getLayoutNode("main", "indicator", this.$ext);
        this.$slideFast   = this.$getLayoutNode("main", "slidefast", this.$ext);
        this.$btnUp       = this.$getLayoutNode("main", "btnup",     this.$ext)
        this.$btnDown     = this.$getLayoutNode("main", "btndown",   this.$ext);
        this.$img         = [
            this.$getOption("main", "img"),
            this.$getOption("main", "img-scroll")
        ];

        this.horizontal   = apf.isTrue(this.$getOption("main", "horizontal"));
        
        this.$offsetSize = this.horizontal ? "offsetWidth" : "offsetHeight";
        this.$size       = this.horizontal ? "width" : "height";
        this.$offsetPos  = this.horizontal ? "offsetLeft" : "offsetTop";
        this.$pos        = this.horizontal ? "left" : "top";
        this.$scrollSize = this.horizontal ? "scrollWidth" : "scrollHeight";
        this.$scrollPos  = this.horizontal ? "scrollLeft" : "scrollTop";
        this.$getDiff    = this.horizontal ? "getWidthDiff" : "getHeightDiff";
        this.$getInner   = this.horizontal ? "getHtmlInnerWidth" : "getHtmlInnerHeight"; 
        this.$eventDir   = this.horizontal ? (apf.isIE ? "offsetX" : "layerX") : (apf.isIE ? "offsetY" : "layerY");
        this.$clientDir  = this.horizontal ? "clientX" : "clientY";
        
        if (this.$img[0]) {
            this.$caret.innerHTML = "<img width='100%' height='100%' />";
            this.$caret.firstChild.src = this.$img[0];
        }

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
                
                _self.setScroll();
                apf.stopPropagation(e);
                
                //apf.window.$mousedown(e);
                
                _self.$timer = $setTimeout(function(){
                    _self.$timer = setInterval(function(){
                        _self.$curValue -= _self.$stepValue;
                        _self.setScroll();
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
                _self.setScroll();
                apf.stopPropagation(e);
                
                //apf.window.$mousedown(e);
                
                _self.$timer = $setTimeout(function(){
                    _self.$timer = setInterval(function(){
                        _self.$curValue += _self.$stepValue;
                        _self.setScroll();
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
        
        this.$caret.onmouseup = function() {
            _self.$setStyleClass(_self.$ext, "", [_self.$baseCSSname + "Down"]);
        };
        
        this.$caret.onmousedown = function(e){
            if (_self.disabled)
                return;

            if (!e) 
                e = event;
            _self.$startPos = e[_self.$eventDir] + 
                (_self.$btnUp ? _self.$btnUp[_self.$offsetSize] : 0);

            if (this.setCapture)
                this.setCapture();
    
            if (_self.$img[1])
                _self.$caret.firstChild.src = _self.$img[1];
            
            _self.$setStyleClass(_self.$ext, _self.$baseCSSname + "Down");
    
            document.onmousemove = function(e){
                if (!e) 
                    e = event;
                //if(e.button != 1) return _self.onmouseup();
                if (_self.$startPos === false) 
                    return false;

                var bUpHeight = _self.$btnUp ? _self.$btnUp[_self.$offsetSize] : 0;
                var next = bUpHeight + (e[_self.$clientDir] - _self.$startPos
                    + document.documentElement[_self.$scrollPos]
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
                //setTimeout(function(){
                    _self.setScroll(true);
                //});
            };
            
            document.onmouseup = function(){
                _self.$startPos = false;
                if (!_self.realtime)
                    _self.setScroll();
                
                if (_self.$img)
                    _self.$caret.firstChild.src = _self.$img[0];
                
                if (this.releaseCapture)
                    this.releaseCapture();
                
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
                _self.setScroll(true);
                
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
                        _self.scrollDown(offset);
                    }, 20);
                }, 300);
            }
            else if (e[_self.$eventDir] < _self.$caret[_self.$offsetPos]) {
                _self.$curValue -= _self.$bigStepValue;
                _self.setScroll(true);
                
                if (_self.$slideFast) {
                    _self.$slideFast.style.display = "block";
                    _self.$slideFast.style[_self.$pos] = _self.$btnUp[_self.$offsetSize] + "px";
                    _self.$slideFast.style[_self.$size] = (_self.$caret[_self.$offsetPos] - _self.$btnUp[_self.$offsetSize]) + "px";
                }
                
                offset = e[_self.$eventDir];
                _self.$timer = $setTimeout(function(){
                    _self.$timer = setInterval(function(){
                        _self.scrollUp(offset);
                    }, 20);
                }, 300);
            }
        };
        
        this.$ext.onmouseup = function(){
            if (_self.disabled)
                return;
                
            clearInterval(_self.$timer);
            if (!_self.realtime)
                _self.setScroll();
            if (_self.$slideFast)
                _self.$slideFast.style.display = "none";
        };
    }
    
    this.$loadAml = function(){
        this.addEventListener("resize", function(){
            this.$recalc();
            this.$update();
        });
    }
}).call(apf.scrollbar.prototype = new apf.Presentation());
apf.aml.setElement("scrollbar", apf.scrollbar);
//#endif
