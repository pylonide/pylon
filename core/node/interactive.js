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

__INTERACTIVE__ = 1 << 21;

//#ifdef __WITH_INTERACTIVE

/**
 * Baseclass giving interactive features to this component, it adds a
 * draggable and resizable attribute to the component
 *
 * @classDescription		
 * @return
 * @type
 * @constructor
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       1.0
 */
jpf.Interactive = function(){
    var nX, nY, rX, rY, startPos, lastCursor, l, t, lMax, tMax, 
        w, h, we, no, ea, so, rszborder, rszcorner, marginBox,
        verdiff, hordiff, _self = this, posAbs, oX, oY, overThreshold;
        
    this.$regbase = this.$regbase | __INTERACTIVE__;

    this.$propHandlers["draggable"] = function(value){
        var o = this.oDrag || this.oExt;
        if (o.interactive & 1) 
            return;

        var mdown = o.onmousedown;
        o.onmousedown = function(){
            if (mdown && mdown.apply(this, arguments) === false)
                return;

            _self.dragStart.apply(this, arguments);
            
            //#ifdef __WITH_WINDOW_FOCUS
            //For jpf.popup, I don't understand where it gets cancelbubbled
            if (jpf.hasFocusBug)
                jpf.window.$focusfix();
            //#endif
        }
        o.interactive = (o.interactive||0)+1;
        
        //this.oExt.style.position = "absolute";
    };
    
    this.$propHandlers["resizable"] = function(value){
        var o = this.oResize || this.oExt;
        if (o.interactive & 2) 
            return;
        
        var mdown = o.onmousedown;
        var mmove = o.onmousemove;
        
        o.onmousedown = function(){
            if (mdown && mdown.apply(this, arguments) === false)
                return;

            _self.resizeStart.apply(this, arguments);
            
            //#ifdef __WITH_WINDOW_FOCUS
            //For jpf.popup, I don't understand where it gets cancelbubbled
            if (jpf.hasFocusBug)
                jpf.window.$focusfix();
            //#endif
        };

        o.onmousemove = function(){
            if (mmove && mmove.apply(this, arguments) === false)
                return;

            _self.resizeIndicate.apply(this, arguments);
        };
        
        o.interactive = (o.interactive||0)+2;
        
        //this.oExt.style.position = "absolute";
        
        rszborder = this.$getOption && parseInt(this.$getOption("Main", "resize-border")) || 3;
        rszcorner = this.$getOption && parseInt(this.$getOption("Main", "resize-corner")) || 12;
        marginBox = jpf.getBox(jpf.getStyle(this.oExt, "borderWidth"));
    };
    
    /*
    this.$propHandlers["minwidth"]  = 
    this.$propHandlers["maxwidth"]  = 
    this.$propHandlers["minheight"] = 
    this.$propHandlers["maxheight"] = function(value, force, prop){
        if (this.aData)
            this.aData[prop] = parseInt(value);
    }
    if (this.aData) {
        this.aData.minwidth = this.minwidth;
        this.aData.minheight = this.minheight;
    }*/
    
    this.dragStart = function(e){
        if (!e) e = event;

        if (!_self.draggable || jpf.dragmode.isDragging)
            return;

        jpf.dragmode.isDragging = true;
        overThreshold           = false;
        
        //@todo not for docking
        jpf.plane.show(_self.oExt, true);
        
        var diff = jpf.getDiff(_self.oExt);
        hordiff  = diff[0];
        verdiff  = diff[1];

        posAbs = "absolute|fixed".indexOf(jpf.getStyle(_self.oExt, "position")) > -1;
        if (!posAbs)
            _self.oExt.style.position = "relative";

        var pos = posAbs 
            ? jpf.getAbsolutePosition(_self.oExt, _self.oExt.offsetParent) 
            : [parseInt(_self.oExt.style.left) || 0, 
               parseInt(_self.oExt.style.top) || 0];
            
        nX = pos[0] - (oX = e.clientX);
        nY = pos[1] - (oY = e.clientY);
        
        if (_self.hasFeature && _self.hasFeature(__ANCHORING__))
            _self.disableAnchoring();

        document.onmousemove = _self.dragMove;
        document.onmouseup   = function(){
            document.onmousemove = document.onmouseup = null;
            jpf.plane.hide();
            
            if (overThreshold && _self.setProperty) {
                if(l) _self.setProperty("left", l);
                if(t) _self.setProperty("top", t);
            }
            
            if (!posAbs)
                _self.oExt.style.position = "relative";
            
            if (_self.showdragging)
                jpf.setStyleClass(_self.oExt, "", ["dragging"]);
            
            jpf.dragmode.isDragging = false;
        };

        return false;
    };
    
    this.dragMove = function(e){
        if(!e) e = event;
        
        if (!overThreshold && _self.showdragging)
            jpf.setStyleClass(_self.oExt, "dragging");
        
        // usability rule: start dragging ONLY when mouse pointer has moved delta x pixels
        var dx = e.clientX - oX,
            dy = e.clientY - oY,
            distance; 
        
        if (!overThreshold 
          && (distance = dx*dx > dy*dy ? dx : dy) * distance < 25)
            return;
        
        _self.oExt.style.left = (l = e.clientX + nX) + "px";
        _self.oExt.style.top  = (t = e.clientY + nY) + "px";
        
        overThreshold = true;
    };
    
    this.resizeStart = function(e){
        if (!e) e = event;

        if (!_self.resizable)
            return;
        
        var diff = jpf.getDiff(_self.oExt);
        hordiff  = diff[0];
        verdiff  = diff[1];

        startPos = jpf.getAbsolutePosition(_self.oExt, _self.oExt.offsetParent);
        startPos.push(_self.oExt.offsetWidth);
        startPos.push(_self.oExt.offsetHeight);
        var x = (oX = e.clientX) - startPos[0];
        var y = (oY = e.clientY) - startPos[1];

        var resizeType = getResizeType.call(_self.oExt, x, y);
        rX = x;
        rY = y;

        if (!resizeType)
            return;

        if (_self.hasFeature && _self.hasFeature(__ANCHORING__))
            _self.disableAnchoring();

        jpf.dragmode.isDragging = true;
        overThreshold           = false;

        var r = "|" + resizeType + "|"
        we = "|w|nw|sw|".indexOf(r) > -1;
        no = "|n|ne|nw|".indexOf(r) > -1;
        ea = "|e|se|ne|".indexOf(r) > -1;
        so = "|s|se|sw|".indexOf(r) > -1;
        
        if (!_self.minwidth)  _self.minwidth  = 0;
        if (!_self.minheight) _self.minheight = 0;
        if (!_self.maxwidth)  _self.maxwidth  = 10000;
        if (!_self.maxheight) _self.maxheight = 10000;

        if (posAbs) {
            lMax = startPos[0] + startPos[2] - _self.minwidth;
            tMax = startPos[1] + startPos[3] - _self.minheight;
            lMin = startPos[0] + startPos[2] - _self.maxwidth;
            tMin = startPos[1] + startPos[3] - _self.maxheight;
        }
        
        if (posAbs)
            jpf.plane.show(_self.oExt);
        
        lastCursor = document.body.style.cursor;
        document.body.style.cursor = resizeType + "-resize";

        document.onmousemove = _self.resizeMove;
        document.onmouseup   = function(e){
            document.onmousemove = document.onmouseup = null;
            if (posAbs)
                jpf.plane.hide();
            
            if (_self.setProperty) {
                doResize(e || event);
                
                if (l) _self.setProperty("left", l);
                if (t) _self.setProperty("top", t);
                if (w) _self.setProperty("width", w + hordiff) 
                if (h) _self.setProperty("height", h + verdiff); 
            }
            
            l = t = w = h = null;
            
            document.body.style.cursor = lastCursor;
            
            jpf.dragmode.isDragging = false;
        };
        
        return false;
    };
    
    var min = Math.min, max = Math.max, lastTime;
    this.resizeMove = function(e){
        if(!e) e = event;
        
        // usability rule: start dragging ONLY when mouse pointer has moved delta x pixels
        /*var dx = e.clientX - oX,
            dy = e.clientY - oY,
            distance; 
        
        if (!overThreshold 
          && (distance = dx*dx > dy*dy ? dx : dy) * distance < 25)
            return;*/
        
        if (lastTime && new Date().getTime() - lastTime < jpf.mouseEventBuffer)
            return;
        lastTime = new Date().getTime();
        
        doResize(e);
        
        //overThreshold = true;
    };
    
    function doResize(e){
        if (we) {
            _self.oExt.style.left = (l = max(lMin, min(lMax, e.clientX - rX))) + "px";
            _self.oExt.style.width = (w = min(_self.maxwidth - hordiff, 
                max(hordiff, _self.minwidth, 
                    startPos[2] - (e.clientX - startPos[0]) + rX 
                    ) - hordiff)) + "px"; //@todo
        }
        
        if (no) {
            _self.oExt.style.top = (t = max(tMin, min(tMax, e.clientY - rY))) + "px";
            _self.oExt.style.height = (h = min(_self.maxheight - verdiff, 
                max(verdiff, _self.minheight, 
                    startPos[3] - (e.clientY - startPos[1]) + rY 
                    ) - verdiff)) + "px"; //@todo
        }
        
        if (ea)
            _self.oExt.style.width  = (w = min(_self.maxwidth - hordiff, 
                max(hordiff, _self.minwidth, 
                    e.clientX - startPos[0] + (startPos[2] - rX))
                    - hordiff)) + "px";

        if (so)
            _self.oExt.style.height = (h = min(_self.maxheight - verdiff, 
                max(verdiff, _self.minheight, 
                    e.clientY - startPos[1] + (startPos[3] - rY))
                    - verdiff)) + "px";
        
        if (jpf.hasSingleRszEvent)
            jpf.layout.forceResize(_self.oInt);
    }
    
    function getResizeType(x, y){
        var cursor  = "", 
            tcursor = "";
        posAbs = "absolute|fixed".indexOf(jpf.getStyle(_self.oExt, "position") > -1);

        if (y < rszborder + marginBox[0])
            cursor = posAbs ? "n" : "";
        else if (y > this.offsetHeight - rszborder) //marginBox[0] - marginBox[2] - 
            cursor = "s";
        else if (y > this.offsetHeight - rszcorner) //marginBox[0] - marginBox[2] - 
            tcursor = "s";

        if (x < (cursor ? rszcorner : rszborder))  // + marginBox[3]
            cursor += tcursor + (posAbs ? "w" : "");
        else if (x > this.offsetWidth - (cursor || tcursor ? rszcorner : rszborder)) //marginBox[1] - marginBox[3] - 
            cursor += tcursor + "e";

        return cursor;
    }
    
    this.resizeIndicate = function(e){
        if(!e) e = event;
        
        if (!_self.resizable || document.onmousemove)
            return;

        var pos = jpf.getAbsolutePosition(_self.oExt, _self.oExt.offsetParent);
        var x = e.clientX - pos[0];
        var y = e.clientY - pos[1];
        
        var cursor = getResizeType.call(_self.oExt, x, y);
        this.style.cursor = cursor 
            ? cursor + "-resize" 
            : "default";
    };
};

// #endif
