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
    
    this.$scrollValue  = 0;
    this.$stepValue    = 0.03;
    this.$bigStepValue = 0.1;
    this.$curValue     = 0;
    this.$timer        = null;
    this.$scrollWait;
    this.$slideMaxHeight;
    
    this.addEventListener("focus", function(){
        this.$host.host.focus();
    });
    
    this.attach = function(oHtml, o, scroll_func){
        this.$host     = o;
        this.$onscroll = scroll_func;
        this.$viewheight     = oHtml.offsetHeight;
        this.$scrollheight   = this.$viewheight;
        this.$attachedHtml   = oHtml;
        
        oHtml.parentNode.appendChild(this.$ext);
        if (this.overflow == "scroll")
            this.$ext.style.display = "block";
        this.$ext.style.zIndex  = 100000;
        //this.$ext.style.left    = "166px";//(o.offsetLeft + o.offsetWidth) + "px";
        //this.$ext.style.top     = "24px";//o.offsetTop + "px";
        //this.$ext.style.height  = "160px";//o.offsetHeight + "px";
        
        //@todo use the main one on the document
        var _self = this;
        function wheel(e){
            if (!e) 
                e = event;
                
            var delta = null;
            if (e.wheelDelta) {
                delta = e.wheelDelta / 120;
                if (apf.isOpera)
                    delta *= -1;
            }
            else if (e.detail)
                delta = -e.detail / 3;
    
            if (delta !== null) {
                var ev = {delta: delta};
                var res = apf.dispatchEvent("mousescroll", ev);
                if (res === false || ev.returnValue === false) {
                    if (e.preventDefault)
                        e.preventDefault();
    
                    e.returnValue = false;
                }
            }
    
                
            _self.$stepValue = (o.limit / o.length) / 5;
            _self.$curValue += ((apf.isOpera ? 1 : -1) * delta * _self.$stepValue);
            _self.setScroll(true);
            
            if (e.preventDefault)
                e.preventDefault();
            return false;
        }
        
        if (document.addEventListener)
            document.addEventListener('DOMMouseScroll', wheel, false);
        else 
            oHtml.onmousewheel = wheel;
        
        this.$scrollWait     = 0;//(this.$host.len * COLS)/2;
        this.$slideMaxHeight = this.$ext.offsetHeight - this.$btnDown.offsetHeight - this.$btnUp.offsetHeight;
        this.$stepValue      = (this.$viewheight / this.$scrollheight) / 20;
        this.$bigStepValue   = this.$stepValue * 3;
        
        //this.$viewheight / this.$scrollheight
        if (o.length) {
            this.$caret.style.height = Math.max(5, ((o.limit / o.length)
                * this.$slideMaxHeight)) + "px";
            if (this.$caret.offsetHeight - 4 == this.$slideMaxHeight) 
                this.$ext.style.display = "none";
        }
        
        return this;
    };
    
    this.setScroll = function (timed, noEvent){
        if (this.$curValue > 1) 
            this.$curValue = 1;
        if (this.$curValue < 0) 
            this.$curValue = 0;
        this.$caret.style.top = (this.$btnUp.offsetHeight + (this.$ext.offsetHeight
            - (this.$btnUp.offsetHeight * 2) - this.$caret.offsetHeight) * this.$curValue) + "px";

        //status = this.$curValue;
        this.pos = this.$curValue;//(this.$caret.offsetTop-this.$btnUp.offsetHeight)/(this.$slideMaxHeight-this.$caret.offsetHeight);
        if (!noEvent)
            this.$onscroll(timed, this.pos);
    }
    
    this.scrollUp = function (v){
        if (v > this.$caret.offsetTop) 
            return this.$ext.onmouseup();
        this.$curValue -= this.$bigStepValue;
        this.setScroll();
        
        this.$slideFast.style.height = Math.max(1, this.$caret.offsetTop
            - this.$btnUp.offsetHeight) + "px";
        this.$slideFast.style.top    = this.$btnUp.offsetHeight + "px";
    }
    
    this.scrollDown = function (v){
        if (v < this.$caret.offsetTop + this.$caret.offsetHeight) 
            return this.$ext.onmouseup();
        this.$curValue += this.$bigStepValue;
        this.setScroll();
        
        this.$slideFast.style.top    = (this.$caret.offsetTop + this.$caret.offsetHeight) + "px";
        this.$slideFast.style.height = Math.max(1, this.$ext.offsetHeight - this.$slideFast.offsetTop
            - this.$btnUp.offsetHeight) + "px";
    }
    
    this.getPosition = function(){
        return this.pos;
    };
    
    this.setPosition = function(pos, noEvent){
        this.$curValue = pos;
        setScroll(null, noEvent);
    };
    
    this.update = function(oHtml){
        var oHtml = this.$attachedHtml;
        this.$ext.style.left = (oHtml.offsetLeft + oHtml.offsetWidth + 1) + 'px';
        this.$ext.style.top = (oHtml.offsetTop - 1) + 'px';
        this.$ext.style.height = (oHtml.offsetHeight - 2) + 'px';
        
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

        /*if (this.$ext.parentNode.offsetHeight)
            this.$ext.style.height = "400px";//(this.$ext.parentNode.offsetHeight - 20) + "px";
        else 
            this.$ext.style.height = "100%"*/
    }
    
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
        this.$ext.style.display = "none";
        
        this.$caret   = this.$getLayoutNode("main", "indicator", this.$ext);
        this.$slideFast   = this.$getLayoutNode("main", "slidefast", this.$ext);
        this.$btnUp       = this.$getLayoutNode("main", "btnup",     this.$ext)
        this.$btnDown     = this.$getLayoutNode("main", "btndown",   this.$ext);

        this.$startPos    = false;
        
        this.$caret.ondragstart = function(){
            return false
        };
        
        var _self = this;
        
        //document.getElementById('this.$btnUp').ondblclick = 
        this.$btnUp.onmousedown = function(e){
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
        
        //document.getElementById('this.$btnDown').ondblclick = 
        this.$btnDown.onmousedown = function(e){
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
        
        this.$btnUp.onmouseout = this.$btnUp.onmouseup = function(){
            this.className = "btnup";
            clearInterval(_self.$timer);
        };
        
        this.$btnDown.onmouseout = this.$btnDown.onmouseup = function(){
            this.className = "btndown";
            clearInterval(_self.$timer);
        };
        
        this.$caret.onmousedown = function(e){
            if (!e) 
                e = event;
            _self.$startPos = [e.offsetX, e.offsetY + _self.$btnUp.offsetHeight];
    
            if (this.setCapture)
                this.setCapture();
    
            document.onmousemove = function(e){
                if (!e) 
                    e = event;
                //if(e.button != 1) return _self.onmouseup();
                if (!_self.$startPos) 
                    return false;
                
                var next = _self.$btnUp.offsetHeight + (e.clientY - _self.$startPos[1]
                    - apf.getAbsolutePosition(_self.$ext)[1] - 2);
                var min = _self.$btnUp.offsetHeight;
                if (next < min) 
                    next = min;
                var max = (_self.$ext.offsetHeight - (_self.$btnUp.offsetHeight) - _self.$caret.offsetHeight);
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
            if (!e) 
                e = event;
            clearInterval(_self.$timer);
            var offset;
            
            if (e.offsetY > _self.$caret.offsetTop + _self.$caret.offsetHeight) {
                _self.$curValue += _self.$bigStepValue;
                _self.setScroll(true);
                
                _self.$slideFast.style.display = "block";
                _self.$slideFast.style.top     = (_self.$caret.offsetTop
                    + _self.$caret.offsetHeight) + "px";
                _self.$slideFast.style.height  = (_self.$ext.offsetHeight - _self.$slideFast.offsetTop
                    - _self.$btnUp.offsetHeight) + "px";
                
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
                
                _self.$slideFast.style.display = "block";
                _self.$slideFast.style.top = _self.$btnUp.offsetHeight + "px";
                _self.$slideFast.style.height = (_self.$caret.offsetTop - _self.$btnUp.offsetHeight) + "px";
                
                offset = e.offsetY;
                _self.$timer = $setTimeout(function(){
                    _self.$timer = setInterval(function(){
                        _self.scrollUp(offset);
                    }, 20);
                }, 300);
            }
        };
        
        this.$ext.onmouseup = function(){
            clearInterval(_self.$timer);
            if (!_self.realtime)
                _self.setScroll();
            _self.$slideFast.style.display = "none";
        };
    }
}).call(apf.scrollbar.prototype = new apf.Presentation());
apf.aml.setElement("scrollbar", apf.scrollbar);
//#endif
