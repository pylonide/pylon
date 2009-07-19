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
apf.scrollbar = function(){
    var SCROLLVALUE  = 0;
    var STEPVALUE    = 0.03;
    var BIGSTEPVALUE = 0.1;
    var CURVALUE     = 0;
    var TIMER        = null;
    var SCROLLWAIT;
    var SLIDEMAXHEIGHT;
    var _self = this;
    
    var offsetName = apf.isIE ? "offset" : "layer";
    
    //Init Class
    var uniqueId = this.uniqueId = apf.all.push(this) - 1;
    apf.makeClass(this);
    
    //Init Skin
    this.realtime = true;
    this.$supportedProperties = [];
    this.$propHandlers = {};
    this.implement(apf.Presentation); /** @inherits apf.Presentation */
    if (this.$loadSkin) 
        this.$loadSkin("default:scrollbar");
    
    //Init DragDrop mode
    apf.dragmode.defineMode("scrollbar" + this.uniqueId, this);
    
    //Build Skin
    this.$getNewContext("main");
    this.oExt               = apf.xmldb.htmlImport(this.$getLayoutNode("main"), document.body);
    this.oExt.host          = this;
    this.oExt.style.display = "none";
    
    var MAIN        = this.oExt;
    var INDICATOR   = this.$getLayoutNode("main", "indicator", this.oExt);
    var SLIDEFAST   = this.$getLayoutNode("main", "slidefast", this.oExt);
    var BTNUP = BTN = this.$getLayoutNode("main", "btnup",     this.oExt)
    var BTNDOWN     = this.$getLayoutNode("main", "btndown",   this.oExt);
    var STARTPOS    = false;
    
    INDICATOR.ondragstart = function(){
        return false
    };
    
    //document.getElementById('btnup').ondblclick = 
    BTNUP.onmousedown = function(e){
        if (!e) 
            e = event;
        this.className = "btnup btnupdown";
        clearTimeout(TIMER);
        
        CURVALUE -= STEPVALUE;
        setScroll();
        e.cancelBubble = true;
        
        TIMER = setTimeout(function(){
            TIMER = setInterval(function(){
                CURVALUE -= STEPVALUE;
                apf.lookup(uniqueId).setScroll();
            }, 20);
        }, 300);
    };
    
    //document.getElementById('btndown').ondblclick = 
    BTNDOWN.onmousedown = function(e){
        if (!e) 
            e = event;
        this.className = "btndown btndowndown";
        clearTimeout(TIMER);
        
        CURVALUE += STEPVALUE;
        setScroll();
        e.cancelBubble = true;
        
        TIMER = setTimeout(function(){
            TIMER = setInterval(function(){
                CURVALUE += STEPVALUE;
                apf.lookup(uniqueId).setScroll();
            }, 20);
        }, 300);
    };
    
    BTNUP.onmouseout = BTNUP.onmouseup = function(){
        this.className = "btnup";
        clearInterval(TIMER);
    };
    
    BTNDOWN.onmouseout = BTNDOWN.onmouseup = function(){
        this.className = "btndown";
        clearInterval(TIMER);
    };
    
    INDICATOR.onmousedown = function(e){
        if (!e) 
            e = event;
        STARTPOS = [e[offsetName + "X"], e[offsetName + "Y"] + BTN.offsetHeight];

        apf.dragmode.setMode("scrollbar" + _self.uniqueId);
        
        e.cancelBubble = true;
        return false;
    };
    
    MAIN.onmousedown = function(e){
        if (!e) 
            e = event;
        clearInterval(TIMER);
        var offset;
        
        if (e[offsetName + "Y"] > INDICATOR.offsetTop + INDICATOR.offsetHeight) {
            CURVALUE += BIGSTEPVALUE;
            setScroll(true);
            
            SLIDEFAST.style.display = "block";
            SLIDEFAST.style.top     = (INDICATOR.offsetTop
                + INDICATOR.offsetHeight) + "px";
            SLIDEFAST.style.height  = (MAIN.offsetHeight - SLIDEFAST.offsetTop
                - BTN.offsetHeight) + "px";
            
            offset = e[offsetName + "Y"];
            TIMER = setTimeout(function(){
                TIMER = setInterval(function(){
                    apf.lookup(uniqueId).scrollDown(offset);
                }, 20);
            }, 300);
        }
        else 
            if (e[offsetName + "Y"] < INDICATOR.offsetTop) {
                CURVALUE -= BIGSTEPVALUE;
                setScroll(true);
                
                SLIDEFAST.style.display = "block";
                SLIDEFAST.style.top = BTN.offsetHeight + "px";
                SLIDEFAST.style.height = (INDICATOR.offsetTop - BTN.offsetHeight) + "px";
                
                offset = e[offsetName + "Y"];
                TIMER = setTimeout(function(){
                    TIMER = setInterval(function(){
                        apf.lookup(uniqueId).scrollUp(offset);
                    }, 20);
                }, 300);
            }
    };
    
    MAIN.onmouseup = function(){
        clearInterval(TIMER);
        if (!_self.realtime)
            setScroll();
        SLIDEFAST.style.display = "none";
    };
    
    this.onmousemove = function(e){
        if (!e) 
            e = event;
        //if(e.button != 1) return this.onmouseup();
        if (!STARTPOS) 
            return false;
        
        var next = BTN.offsetHeight + (e.clientY - STARTPOS[1]
            - apf.getAbsolutePosition(MAIN)[1] - BTN.offsetHeight / 3);
        var min = BTN.offsetHeight;
        if (next < min) 
            next = min;
        var max = (MAIN.offsetHeight - (BTN.offsetHeight) - INDICATOR.offsetHeight);
        if (next > max) 
            next = max;
        //INDICATOR.style.top = next + "px"
        
        CURVALUE = (next - min) / (max - min);
        setTimeout(function(){
            setScroll(true);
        });
    };
    
    this.onmouseup = function(){
        STARTPOS = false;
        if (!_self.realtime)
            setScroll();
        apf.dragmode.clear();
    };
    
    var LIST, viewheight, scrollheight;

    function onscroll(timed, perc){
        LIST.scrollTop = (LIST.scrollHeight - LIST.offsetHeight + 4) * CURVALUE;
        /*var now = new Date().getTime();
         if (timed && now - LIST.last < (timed ? SCROLLWAIT : 0)) return;
         LIST.last = now;
         var value = parseInt((DATA.length - LIST.len + 1) * CURVALUE);
         showData(value);*/
    }
    
    this.attach = function(oHtml, o, scroll_func){
        LIST         = o;
        onscroll     = scroll_func;
        viewheight   = oHtml.offsetHeight;
        scrollheight = viewheight;
        
        oHtml.parentNode.appendChild(this.oExt);
        this.oExt.style.display = "block";
        this.oExt.style.zIndex  = 100000;
        //this.oExt.style.left    = "166px";//(o.offsetLeft + o.offsetWidth) + "px";
        this.oExt.style.top     = "24px";//o.offsetTop + "px";
        this.oExt.style.height  = "160px";//o.offsetHeight + "px";
        
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
    
                
            STEPVALUE = (o.limit / o.length) / 5;
            CURVALUE += ((apf.isOpera ? 1 : -1) * delta * STEPVALUE);
            setScroll(true);
        }
        
        if (document.addEventListener)
            document.addEventListener('DOMMouseScroll', wheel, false);
        else 
            oHtml.onmousewheel = wheel;
        
        SCROLLWAIT     = 0;//(LIST.len * COLS)/2;
        SLIDEMAXHEIGHT = MAIN.offsetHeight - BTNDOWN.offsetHeight - BTNUP.offsetHeight;
        STEPVALUE      = (viewheight / scrollheight) / 20;
        BIGSTEPVALUE   = STEPVALUE * 3;
        
        //viewheight / scrollheight
        if (o.length) {
            INDICATOR.style.height = Math.max(5, ((o.limit / o.length)
                * SLIDEMAXHEIGHT)) + "px";
            if (INDICATOR.offsetHeight - 4 == SLIDEMAXHEIGHT) 
                MAIN.style.display = "none";
        }
        
        return this;
    };
    
    var amlNode = this;
    function setScroll(timed, noEvent){
        if (CURVALUE > 1) 
            CURVALUE = 1;
        if (CURVALUE < 0) 
            CURVALUE = 0;
        INDICATOR.style.top = (BTN.offsetHeight + (MAIN.offsetHeight
            - (BTN.offsetHeight * 2) - INDICATOR.offsetHeight) * CURVALUE) + "px";
        
        //status = CURVALUE;
        amlNode.pos = CURVALUE;//(INDICATOR.offsetTop-BTNUP.offsetHeight)/(SLIDEMAXHEIGHT-INDICATOR.offsetHeight);
        if (!noEvent)
            onscroll(timed, amlNode.pos);
    }
    
    this.setScroll = setScroll;
    
    function scrollUp(v){
        if (v > INDICATOR.offsetTop) 
            return MAIN.onmouseup();
        CURVALUE -= BIGSTEPVALUE;
        setScroll();
        
        SLIDEFAST.style.height = Math.max(1, INDICATOR.offsetTop
            - BTN.offsetHeight) + "px";
        SLIDEFAST.style.top    = BTN.offsetHeight + "px";
    }
    
    this.scrollUp = scrollUp;
    
    function scrollDown(v){
        if (v < INDICATOR.offsetTop + INDICATOR.offsetHeight) 
            return MAIN.onmouseup();
        CURVALUE += BIGSTEPVALUE;
        setScroll();
        
        SLIDEFAST.style.top    = (INDICATOR.offsetTop + INDICATOR.offsetHeight) + "px";
        SLIDEFAST.style.height = Math.max(1, MAIN.offsetHeight - SLIDEFAST.offsetTop
            - BTN.offsetHeight) + "px";
    }
    
    this.scrollDown = scrollDown;
    
    this.getPosition = function(){
        return this.pos;
    };
    
    this.setPosition = function(pos, noEvent){
        CURVALUE = pos;
        setScroll(null, noEvent);
    };
    
    this.update = function(){
        var o = LIST;
        if (o.length) {
            SLIDEMAXHEIGHT = MAIN.offsetHeight - BTNDOWN.offsetHeight - BTNUP.offsetHeight;
            INDICATOR.style.height = Math.max(5, ((o.limit / o.length) * 2
                * SLIDEMAXHEIGHT)) + "px";
            if (INDICATOR.offsetHeight - 4 == SLIDEMAXHEIGHT) 
                MAIN.style.display = "none";
            
            STEPVALUE = (o.limit / o.length) / 20;
            BIGSTEPVALUE   = STEPVALUE * 3;
        }
        
        this.oExt.style.top    = "-2px";
        this.oExt.style.right  = 0;
        
        if (this.oExt.parentNode.offsetHeight)
            this.oExt.style.height = (this.oExt.parentNode.offsetHeight - 20) + "px";
        else 
            this.oExt.style.height = "100%"
    }
};

//#endif
