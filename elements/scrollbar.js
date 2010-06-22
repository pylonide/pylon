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
    
    this.$scrollValue  = 0;
    this.$stepValue    = 0.03;
    this.$bigStepValue = 0.1;
    this.$curValue     = 0;
    this.$timer        = null;
    this.$scrollWait;
    this.$slideMaxHeight;
    
    this.addEventListener("focus", function(){
        this.$host.focus();
    });

    this.$propHandlers["overflow"] = function(value){
        
    }

    this.$propHandlers["for"] = function(value){
        this.$attach(self[value]);
    }
    
    this.$detach = function(){
        
    }
    
    //@deprecated
    this.attach = function(oHtml, o, scroll_func){
        this.$attach(o);
        this.addEventListener("scroll", scroll_func);
    }
    
    this.$getHtmlHost = function(){
        return this.$host.$int || this.$host.$container;
    }
    
    //oHtml, o, scroll_func
    this.$attach = function(amlNode){
        this.$host         = amlNode;
        
        //oHtml.parentNode.appendChild(this.$ext);
        //if (this.overflow == "scroll") {
        //    this.$ext.style.display = "block";
        //    this.enable();
        //}
        
        //this.$ext.style.zIndex  = 100000;
        //this.$ext.style.left    = "166px";//(o.offsetLeft + o.offsetWidth) + "px";
        //this.$ext.style.top     = "24px";//o.offsetTop + "px";
        //this.$ext.style.height  = "160px";//o.offsetHeight + "px";
        
        var oHtml            = this.$getHtmlHost();
        this.$viewheight     = oHtml.offsetHeight;
        this.$scrollheight   = this.$viewheight;
        this.$scrollWait     = 0;//(this.$host.len * COLS)/2;
        this.$stepValue      = (this.$viewheight / this.$scrollheight) / 20;
        this.$bigStepValue   = this.$stepValue * 3;
        this.$slideMaxHeight = this.$caret.offsetParent.offsetHeight 
            - (this.$btnDown ? this.$btnDown.offsetHeight : 0)
            - (this.$btnUp ? this.$btnUp.offsetHeight : 0);
        
        //this.$viewheight / this.$scrollheight
        //if (o.length) {
        //    this.$caret.style.height = Math.max(5, ((o.limit / o.length)
        //        * this.$slideMaxHeight)) + "px";
        //    if (this.$caret.offsetHeight - 4 == this.$slideMaxHeight) 
        //        this.$ext.style.display = "none";
        //}
        
        var _self = this;
        amlNode.addEventListener("resize", function(){
            _self.$update();
        });
        
        oHtml.onscroll = function(){
            
        }
        
        this.$update();
        
        return this;
    };
    
    this.$update = function(){
        var oHtml = this.$getHtmlHost();
        
        //Disable scrollbar
        if (oHtml.offsetHeight >= oHtml.scrollHeight) {
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
            this.$caret.style.height = (Math.max(5, (oHtml.offsetHeight / oHtml.scrollHeight
                * this.$slideMaxHeight)) - apf[this.horizontal ? "getWidthDiff" : "getHeightDiff"](this.$caret)) + "px";
            //if (this.$caret.offsetHeight - 4 == this.$slideMaxHeight) 
                //this.$ext.style.display = "none";
            
            this.$curValue = oHtml.scrollTop / (oHtml.scrollHeight - oHtml.offsetHeight);
            
            var bUpHeight = this.$btnUp ? this.$btnUp.offsetHeight : 0;
            this.$caret.style.top = (bUpHeight + (this.$caret.offsetParent.offsetHeight
            - (bUpHeight * 2) - this.$caret.offsetHeight) * this.$curValue) + "px";
        }
    }
    
    this.setScroll = function (timed, noEvent){
        if (this.$curValue > 1) 
            this.$curValue = 1;
        if (this.$curValue < 0) 
            this.$curValue = 0;
        
        var bUpHeight = this.$btnUp ? this.$btnUp.offsetHeight : 0;
        this.$caret.style.top = (bUpHeight + (this.$caret.offsetParent.offsetHeight
            - (bUpHeight * 2) - this.$caret.offsetHeight) * this.$curValue) + "px";

        //status = this.$curValue;
        this.pos = this.$curValue;//(this.$caret.offsetTop-this.$btnUp.offsetHeight)/(this.$slideMaxHeight-this.$caret.offsetHeight);
        if (!noEvent) {
            this.dispatchEvent("scroll", {
                timed : timed, 
                pos   : this.pos
            });
            
            if (this.$host) {
                var oHtml = this.$getHtmlHost();
                oHtml.scrollTop = (oHtml.scrollHeight - oHtml.offsetHeight) * this.pos;
            }
        }
    }
    
    this.scrollUp = function (v){
        if (v > this.$caret.offsetTop) 
            return this.$ext.onmouseup();
        this.$curValue -= this.$bigStepValue;
        this.setScroll();
        
        if (this.$slideFast) {
            this.$slideFast.style.height = Math.max(1, this.$caret.offsetTop
                - this.$btnUp.offsetHeight) + "px";
            this.$slideFast.style.top    = this.$btnUp.offsetHeight + "px";
        }
    }
    
    this.scrollDown = function (v){
        if (v < this.$caret.offsetTop + this.$caret.offsetHeight) 
            return this.$ext.onmouseup();
        this.$curValue += this.$bigStepValue;
        this.setScroll();
        
        if (this.$slideFast) {
            this.$slideFast.style.top    = (this.$caret.offsetTop + this.$caret.offsetHeight) + "px";
            this.$slideFast.style.height = Math.max(1, this.$caret.offsetParent.offsetHeight - this.$slideFast.offsetTop
                - this.$btnUp.offsetHeight) + "px";
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
            this.$slideMaxHeight = this.$ext.offsetHeight - this.$btnDown.offsetHeight - this.$btnUp.offsetHeight;
            this.$caret.style.height = ((indHeight = Math.max(10, (((o.limit - 1) / o.length)
                * this.$slideMaxHeight))) - apf.getHeightDiff(this.$caret)) + "px";
            this.$caret.style.top = (this.$curValue * (this.$slideMaxHeight - Math.round(indHeight)) + this.$btnUp.offsetHeight) + "px";
            
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
        var indHeight = Math.round(Math.max(10, (((o.limit - 1) / o.length) * this.$slideMaxHeight)));
        this.$caret.style.top = (this.$curValue * (this.$slideMaxHeight - indHeight) + this.$btnUp.offsetHeight) + "px";
    }
    
    this.$onscroll = function(timed, perc){
        this.$host.scrollTop = (this.$host.scrollHeight - this.$host.offsetHeight + 4) * this.$curValue;
        /*var now = new Date().getTime();
         if (timed && now - this.$host.last < (timed ? this.$scrollWait : 0)) return;
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
                e.cancelBubble = true;
                
                apf.window.$mousedown();
                
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
                e.cancelBubble = true;
                
                apf.window.$mousedown();
                
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
        
        this.$caret.onmousedown = function(e){
            if (_self.disabled)
                return;
                
            if (!e) 
                e = event;
            _self.$startPos = [e.offsetX, e.offsetY + 
                (_self.$btnUp ? _self.$btnUp.offsetHeight : 0)];
    
            if (this.setCapture)
                this.setCapture();
    
            if (_self.$img)
                _self.$caret.firstChild.src = _self.$img[1];
    
            document.onmousemove = function(e){
                if (!e) 
                    e = event;
                //if(e.button != 1) return _self.onmouseup();
                if (!_self.$startPos) 
                    return false;
                
                var bUpHeight = _self.$btnUp ? _self.$btnUp.offsetHeight : 0;
                
                var next = bUpHeight + (e.clientY - _self.$startPos[1]
                    - apf.getAbsolutePosition(_self.$ext)[1] - 2);
                var min = bUpHeight;
                if (next < min) 
                    next = min;
                var max = (_self.$ext.offsetHeight 
                    - bUpHeight - _self.$caret.offsetHeight);
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
    
            e.cancelBubble = true;
            apf.window.$mousedown();
            
            return false;
        };
        
        this.$ext.onmousedown = function(e){
            if (_self.disabled)
                return;
                
            if (!e) 
                e = event;
            clearInterval(_self.$timer);
            var offset;
            
            if (e.offsetY > _self.$caret.offsetTop + _self.$caret.offsetHeight) {
                _self.$curValue += _self.$bigStepValue;
                _self.setScroll(true);
                
                if (_self.$slideFast) {
                    _self.$slideFast.style.display = "block";
                    _self.$slideFast.style.top     = (_self.$caret.offsetTop
                        + _self.$caret.offsetHeight) + "px";
                    _self.$slideFast.style.height  = (_self.$ext.offsetHeight - _self.$slideFast.offsetTop
                        - _self.$btnUp.offsetHeight) + "px";
                }
                
                offset = e.offsetY;
                _self.$timer = $setTimeout(function(){
                    _self.$timer = setInterval(function(){
                        _self.scrollDown(offset);
                    }, 20);
                }, 300);
            }
            else if (e.offsetY < _self.$caret.offsetTop) {
                _self.$curValue -= _self.$bigStepValue;
                _self.setScroll(true);
                
                if (_self.$slideFast) {
                    _self.$slideFast.style.display = "block";
                    _self.$slideFast.style.top = _self.$btnUp.offsetHeight + "px";
                    _self.$slideFast.style.height = (_self.$caret.offsetTop - _self.$btnUp.offsetHeight) + "px";
                }
                
                offset = e.offsetY;
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
            this.$attach(this.$host);
        });
    }
}).call(apf.scrollbar.prototype = new apf.Presentation());
apf.aml.setElement("scrollbar", apf.scrollbar);
//#endif
