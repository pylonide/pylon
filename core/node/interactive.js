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

var __INTERACTIVE__ = 1 << 21;

//#ifdef __WITH_INTERACTIVE

/**
 * Baseclass giving interactive features to this element, it makes an
 * element draggable and resizable.
 * 
 * @attribute {Boolean} draggable makes an element draggable. The user will 
 * able to move the element around while holding the mouse button down on the 
 * element.
 * Example:
 * <pre class="code">
 *  <j:bar draggable="true" />
 * </pre>
 * @attribute {Boolean} resizable makes an element resizable. The user will able 
 * to resize the element by grabbing one of the four edges of the element and 
 * pulling it in either direction. Grabbing the corners allow the users the 
 * resize horizontally and vertically at the same time. The right bottom corner 
 * is special because it offers an especially big grab area. The size of this 
 * area can be configured in the skin of the element.
 * Example:
 * <pre class="code">
 *  <j:window resizable="true" />
 * </pre>
 * @attribute {Number} minwidth  the minimum horizontal size the element can get when resizing.
 * @attribute {Number} minheight the minimum vertical size the element can get when resizing.
 * @attribute {Number} maxwidth  the maximum horizontal size the element can get when resizing.
 * @attribute {Number} maxheight the maximum vertical size the element can get when resizing.
 *
 * @constructor
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       1.0
 */
jpf.Interactive = function(){
    var nX, nY, rX, rY, startPos, lastCursor = null, l, t, lMax, tMax, 
        w, h, we, no, ea, so, rszborder, rszcorner, marginBox,
        verdiff, hordiff, _self = this, posAbs, oX, oY, overThreshold,
        dragOutline, resizeOutline;

    this.$regbase = this.$regbase | __INTERACTIVE__;

    this.$propHandlers["draggable"] = function(value){
        if (jpf.isFalse(value))
            this.draggable = value = false;
        else if (jpf.isTrue(value))
            this.draggable = value = true;
        
        var o = this.oDrag || this.oExt;
        if (o.interactive & 1) 
            return;

        var mdown = o.onmousedown;
        o.onmousedown = function(){
            if (mdown && mdown.apply(this, arguments) === false)
                return;

            dragStart.apply(this, arguments);
        }
        o.interactive = (o.interactive||0)+1;
        
        //this.oExt.style.position = "absolute";
    };

    this.$propHandlers["resizable"] = function(value){
        if (jpf.isFalse(value))
            this.resizable = value = false;
        else if (jpf.isTrue(value))
            this.resizable = value = true;
        
        var o = this.oResize || this.oExt;
        if (o.interactive & 2) 
            return;
        
        var mdown = o.onmousedown;
        var mmove = o.onmousemove;

        o.onmousedown = function(){
            if (mdown && mdown.apply(this, arguments) === false)
                return;

            resizeStart.apply(this, arguments);
        };

        o.onmousemove = function(){
            if (mmove && mmove.apply(this, arguments) === false)
                return;

            resizeIndicate.apply(this, arguments);
        };
        
        o.interactive = (o.interactive||0)+2;
        
        //this.oExt.style.position = "absolute";
        
        rszborder = this.$getOption && parseInt(this.$getOption("Main", "resize-border")) || 3;
        rszcorner = this.$getOption && parseInt(this.$getOption("Main", "resize-corner")) || 12;
        marginBox = jpf.getBox(jpf.getStyle(this.oExt, jpf.isIE ? "borderWidth" : "border-width"));
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
    
    function dragStart(e){
        if (!e) e = event;

        if (!_self.draggable || jpf.dragmode.isDragging)
            return;
        
        //#ifdef __WITH_OUTLINE
        dragOutline = !(_self.dragOutline == false || !jpf.appsettings.dragOutline);
        /*#else
        dragOutline = false;        
        #endif */
        
        jpf.dragmode.isDragging = true;
        overThreshold           = false;
        
        //#ifdef __WITH_POPUP
        jpf.popup.forceHide();
        //#endif
        
        posAbs = "absolute|fixed".indexOf(jpf.getStyle(_self.oExt, "position")) > -1;
        if (!posAbs)
            _self.oExt.style.position = "relative";

        //@todo not for docking
        //#ifdef __WITH_PLANE
        if (posAbs && !_self.aData) {
            jpf.plane.show(dragOutline
                ? oOutline
                : _self.oExt);//, true
        }
        //#endif

        var pos = posAbs 
            ? jpf.getAbsolutePosition(_self.oExt, _self.oExt.offsetParent) 
            : [parseInt(_self.oExt.style.left) || _self.oExt.offsetLeft || 0, 
               parseInt(_self.oExt.style.top) || _self.oExt.offsetTop || 0];
            
        nX = pos[0] - (oX = e.clientX);
        nY = pos[1] - (oY = e.clientY);
        
        if (_self.hasFeature && _self.hasFeature(__ANCHORING__))
            _self.disableAnchoring();

        //#ifdef __WITH_OUTLINE
        if (posAbs && dragOutline) {
            oOutline.className     = "drag";
            
            var diffOutline = jpf.getDiff(oOutline);
            _self.oExt.parentNode.appendChild(oOutline);
            oOutline.style.left    = pos[0] + "px";
            oOutline.style.top     = pos[1] + "px";
            oOutline.style.width   = (_self.oExt.offsetWidth - diffOutline[0]) + "px";
            oOutline.style.height  = (_self.oExt.offsetHeight - diffOutline[1]) + "px";
        }
        //#endif

        //#ifdef __WITH_DRAGMODE
        jpf.dragmode.mode = true;
        //#endif
        
        document.onmousemove = dragMove;
        document.onmouseup   = function(){
            document.onmousemove = document.onmouseup = null;
            
            //#ifdef __WITH_DRAGMODE
            jpf.dragmode.mode = false;
            //#endif
            
            //#ifdef __WITH_PLANE
            if (posAbs && !_self.aData)
                jpf.plane.hide();
            //#endif
            
            if (overThreshold) {
                if (_self.setProperty) {
                    if(l) _self.setProperty("left", l);
                    if(t) _self.setProperty("top", t);
                }
                else if (dragOutline) {
                    _self.oExt.style.left = l + "px";
                    _self.oExt.style.top  = t + "px";
                }
            }
            
            if (!posAbs)
                _self.oExt.style.position = "relative";
            
            if (_self.showdragging)
                jpf.setStyleClass(_self.oExt, "", ["dragging"]);
            
            if (posAbs && dragOutline)
                oOutline.style.display = "none";
            
            jpf.dragmode.isDragging = false;
            
            if (_self.dispatchEvent)
                _self.dispatchEvent("drag");
        };
        
        if (jpf.isIE)
            document.onmousedown();

        return false;
    };
    
    function dragMove(e){
        if(!e) e = event;
        
        if (!overThreshold && _self.showdragging)
            jpf.setStyleClass(_self.oExt, "dragging");
        
        // usability rule: start dragging ONLY when mouse pointer has moved delta x pixels
        var dx = e.clientX - oX,
            dy = e.clientY - oY,
            distance; 

        if (!overThreshold 
          && (distance = dx*dx > dy*dy ? dx : dy) * distance < 2)
            return;

        //Drag outline support
        else if (!overThreshold && dragOutline 
          && oOutline.style.display != "block")
            oOutline.style.display = "block";

        var oHtml = dragOutline
            ? oOutline
            : _self.oExt;

        oHtml.style.left = (l = e.clientX + nX) + "px";
        oHtml.style.top  = (t = e.clientY + nY) + "px";

        overThreshold = true;
    };
    
    function resizeStart(e){
        if (!e) e = event;

        if (!_self.resizable)
            return;
        
        //#ifdef __WITH_OUTLINE
        resizeOutline = !(_self.resizeOutline == false || !jpf.appsettings.resizeOutline);
        /*#else
        resizeOutline = false;        
        #endif */
        
        if (!resizeOutline) {
            var diff = jpf.getDiff(_self.oExt);
            hordiff  = diff[0];
            verdiff  = diff[1];
        }
        
        //@todo This is probably not gen purpose
        startPos = jpf.getAbsolutePosition(_self.oExt);//, _self.oExt.offsetParent);
        startPos.push(_self.oExt.offsetWidth);
        startPos.push(_self.oExt.offsetHeight);
        
        var sLeft = document.documentElement.scrollLeft;
        var sTop = document.documentElement.scrollTop;
        var x = (oX = e.clientX) - startPos[0] + sLeft;
        var y = (oY = e.clientY) - startPos[1] + sTop;

        var resizeType = getResizeType.call(_self.oExt, x, y);
        rX = x;
        rY = y;

        if (!resizeType)
            return;

        if (_self.dispatchEvent && _self.dispatchEvent("resizestart", {
            type : resizeType
          }) === false)
            return;
        
        //#ifdef __WITH_POPUP
        jpf.popup.forceHide();
        //#endif

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

        //#ifdef __WITH_PLANE
        if (posAbs) {
            jpf.plane.show(resizeOutline
                ? oOutline
                : _self.oExt);//, true
        }
        //#endif
        
        //#ifdef __WITH_OUTLINE
        if (resizeOutline) {
            oOutline.className     = "resize";
            var diffOutline = jpf.getDiff(oOutline);
            hordiff = diffOutline[0];
            verdiff = diffOutline[1];
            
            //_self.oExt.parentNode.appendChild(oOutline);
            oOutline.style.left    = startPos[0] + "px";
            oOutline.style.top     = startPos[1] + "px";
            oOutline.style.width   = (_self.oExt.offsetWidth - hordiff) + "px";
            oOutline.style.height  = (_self.oExt.offsetHeight - verdiff) + "px";
            oOutline.style.display = "block";
        }
        //#endif
        
        if (lastCursor === null)
            lastCursor = document.body.style.cursor;//jpf.getStyle(document.body, "cursor");
        document.body.style.cursor = resizeType + "-resize";

        //#ifdef __WITH_DRAGMODE
        jpf.dragmode.mode = true;
        //#endif

        document.onmousemove = resizeMove;
        document.onmouseup   = function(e){
            document.onmousemove = document.onmouseup = null;
            
            //#ifdef __WITH_DRAGMODE
            jpf.dragmode.mode = false;
            //#endif
            
            //#ifdef __WITH_PLANE
            if (posAbs)
                jpf.plane.hide();
            //#endif
            
            if (resizeOutline) {
                var diff = jpf.getDiff(_self.oExt);
                hordiff  = diff[0];
                verdiff  = diff[1];
            }
            
            doResize(e || event, true);
            
            if (_self.setProperty) {
                if (posAbs) {
                    if (l) _self.setProperty("left", l);
                    if (t) _self.setProperty("top", t);
                }
                
                if (w) _self.setProperty("width", w + hordiff) 
                if (h) _self.setProperty("height", h + verdiff); 
            }
            
            l = t = w = h = null;

            document.body.style.cursor = lastCursor;
            lastCursor = null;
            
            if (resizeOutline)
                oOutline.style.display = "none";
            
            jpf.dragmode.isDragging = false;
            
            if (_self.dispatchEvent)
                _self.dispatchEvent("resize");
        };
        
        if (jpf.isIE)
            document.onmousedown();
        
        return false;
    };
    
    var min = Math.min, max = Math.max, lastTime;
    function resizeMove(e){
        if(!e) e = event;
        
        //if (!e.button)
            //return this.onmouseup();
        
        // usability rule: start dragging ONLY when mouse pointer has moved delta x pixels
        /*var dx = e.clientX - oX,
            dy = e.clientY - oY,
            distance; 
        
        if (!overThreshold 
          && (distance = dx*dx > dy*dy ? dx : dy) * distance < 4)
            return;*/
        
        if (lastTime && new Date().getTime() 
          - lastTime < (resizeOutline ? 6 : jpf.mouseEventBuffer))
            return;
        lastTime = new Date().getTime();
        
        doResize(e);
        
        //overThreshold = true;
    };
    
    function doResize(e, force){
        var oHtml = resizeOutline && !force
            ? oOutline
            : _self.oExt;

        var sLeft = document.documentElement.scrollLeft;
        var sTop = document.documentElement.scrollTop;
        
        if (we) {
            oHtml.style.left = (l = max(lMin, min(lMax, e.clientX - rX + sLeft))) + "px";
            oHtml.style.width = (w = min(_self.maxwidth - hordiff, 
                max(hordiff, _self.minwidth, 
                    startPos[2] - (e.clientX - startPos[0]) + rX + sLeft
                    ) - hordiff) + sLeft) + "px"; //@todo
        }
        
        if (no) {
            oHtml.style.top = (t = max(tMin, min(tMax, e.clientY - rY + sTop))) + "px";
            oHtml.style.height = (h = min(_self.maxheight - verdiff, 
                max(verdiff, _self.minheight, 
                    startPos[3] - (e.clientY - startPos[1]) + rY + sTop
                    ) - verdiff)) + "px"; //@todo
        }

        if (ea)
            oHtml.style.width  = (w = min(_self.maxwidth - hordiff, 
                max(hordiff, _self.minwidth, 
                    e.clientX - startPos[0] + (startPos[2] - rX) + sLeft)
                    - hordiff)) + "px";

        if (so)
            oHtml.style.height = (h = min(_self.maxheight - verdiff, 
                max(verdiff, _self.minheight, 
                    e.clientY - startPos[1] + (startPos[3] - rY) + sTop)
                    - verdiff)) + "px";

        if (jpf.hasSingleRszEvent)
            jpf.layout.forceResize(_self.oInt);
    }
    
    function getResizeType(x, y){
        var cursor  = "", 
            tcursor = "";
        posAbs = "absolute|fixed".indexOf(jpf.getStyle(_self.oExt, "position")) > -1;

        if (_self.resizable == true || _self.resizable == "vertical") {
            if (y < rszborder + marginBox[0])
                cursor = posAbs ? "n" : "";
            else if (y > this.offsetHeight - rszborder) //marginBox[0] - marginBox[2] - 
                cursor = "s";
            else if (y > this.offsetHeight - rszcorner) //marginBox[0] - marginBox[2] - 
                tcursor = "s";
        }
        
        if (_self.resizable == true || _self.resizable == "horizontal") {
            if (x < (cursor ? rszcorner : rszborder) + marginBox[0])
                cursor += tcursor + (posAbs ? "w" : "");
            else if (x > this.offsetWidth - (cursor || tcursor ? rszcorner : rszborder)) //marginBox[1] - marginBox[3] - 
                cursor += tcursor + "e";
        }
        
        return cursor;
    }
    
    var originalCursor;
    function resizeIndicate(e){
        if(!e) e = event;
        
        if (!_self.resizable || document.onmousemove)
            return;

        //@todo This is probably not gen purpose
        var pos = jpf.getAbsolutePosition(_self.oExt);//, _self.oExt.offsetParent
        var sLeft = document.documentElement.scrollLeft;
        var sTop = document.documentElement.scrollTop;
        var x = e.clientX - pos[0] + sLeft;
        var y = e.clientY - pos[1] + sTop;
        
        if (!originalCursor)
            originalCursor = jpf.getStyle(this, "cursor");
        
        var cursor = getResizeType.call(_self.oExt, x, y);
        this.style.cursor = cursor 
            ? cursor + "-resize" 
            : originalCursor || "default";
    };

    if (!this.pHtmlDoc)
        this.pHtmlDoc = window.document;
    
    //#ifdef __WITH_OUTLINE
    var oOutline = this.pHtmlDoc.getElementById("jpf_outline");
    if (!oOutline) {
        oOutline = this.pHtmlDoc.body.appendChild(this.pHtmlDoc.createElement("div"));
        
        oOutline.refCount = 0;
        oOutline.setAttribute("id", "jpf_outline");
        
        oOutline.style.position = "absolute";
        oOutline.style.display  = "none";
        oOutline.style.zIndex   = 100000000;
    }
    oOutline.refCount++;
    //#endif
    
    /*this.$jmlDestroyers.push(function(){
        oOutline.refCount--;
        
        if (!oOutline.refCount) {
            //destroy
        }
    });*/
};

// #endif
