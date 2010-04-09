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

apf.__INTERACTIVE__ = 1 << 21;

//#ifdef __WITH_INTERACTIVE

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have interactive features, making an
 * element draggable and resizable.
 * Example:
 * <code>
 *  <a:textarea draggable="true" resizable="true" />
 * </code>
 * 
 * @attribute {Boolean} draggable whether an element is draggable. The user will
 * able to move the element around while holding the mouse button down on the 
 * element.
 * Example:
 * <code>
 *  <a:bar 
 *    draggable = "true" 
 *    width     = "200" 
 *    height    = "200" 
 *    left      = "10" 
 *    top       = "10" />
 * </code>
 * @attribute {Boolean} resizable whether an element is resizable. The user will able
 * to resize the element by grabbing one of the four edges of the element and 
 * pulling it in either direction. Grabbing the corners allows users to 
 * resize horizontally and vertically at the same time. The right bottom corner 
 * is special, because it offers an especially big grab area. The size of this
 * area can be configured in the skin of the element.
 * Example:
 * <code>
 *  <a:window 
 *    resizable = "true"
 *    visible   = "true" 
 *    width     = "400" 
 *    height    = "200" />
 * </code>
 * @attribute {Number} minwidth  the minimum horizontal size the element can get when resizing.
 * @attribute {Number} minheight the minimum vertical size the element can get when resizing.
 * @attribute {Number} maxwidth  the maximum horizontal size the element can get when resizing.
 * @attribute {Number} maxheight the maximum vertical size the element can get when resizing.
 *
 * @event drag          Fires when the widget has been dragged.
 * @event resizestart   Fires before the widget is resized.
 *   cancelable: Prevents this resize action to start.
 *   object:
 *   {String} type the type of resize. This is a combination of the four directions, n, s, e, w.
 * @event resize        Fires when the widget has been resized.
 *
 * @constructor
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       1.0
 *
 * @see element.appsettings.attribute.outline
 * @see element.appsettings.attribute.resize-outline
 * @see element.appsettings.attribute.drag-outline
 */
apf.Interactive = function(){
    var nX, nY, rX, rY, startPos, lastCursor = null, l, t, lMax, tMax, lMin, 
        tMin, w, h, we, no, ea, so, rszborder, rszcorner, marginBox,
        verdiff, hordiff, _self = this, posAbs, oX, oY, overThreshold,
        dragOutline, resizeOutline, myPos;

    this.$regbase = this.$regbase | apf.__INTERACTIVE__;

    this.$propHandlers["draggable"] = function(value){
        if (apf.isFalse(value))
            this.draggable = value = false;
        else if (apf.isTrue(value))
            this.draggable = value = true;
        
        var o = this.oDrag || this.$ext;
        if (o.interactive & 1) 
            return;

        var mdown = o.onmousedown;
        o.onmousedown = function(e, reparent){
            if (!_self.editable && mdown && mdown.apply(this, arguments) === false)
                return;
            
            if (!reparent && (e || event).button == 2)
                return;
            
            dragStart.apply(this, arguments);
        }
        o.interactive = (o.interactive||0)+1;
        
        //this.$ext.style.position = "absolute";
    };

    this.$propHandlers["resizable"] = function(value){
        if (apf.isFalse(value))
            this.resizable = value = false;
        else if (apf.isTrue(value))
            this.resizable = value = true;
        
        var o = this.oResize || this.$ext;
        if (o.interactive & 2) 
            return;

        if (!_self.editable) {        
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
        }
        
        o.interactive = (o.interactive||0)+2;
        
        //this.$ext.style.position = "absolute";
        
        rszborder = this.$getOption && parseInt(this.$getOption("Main", "resize-border")) || 3;
        rszcorner = this.$getOption && parseInt(this.$getOption("Main", "resize-corner")) || 12;
        marginBox = apf.getBox(apf.getStyle(this.$ext, apf.isIE ? "borderWidth" : "border-width"));
    };
    
    /*
    this.$propHandlers["minwidth"]  = 
    this.$propHandlers["maxwidth"]  = 
    this.$propHandlers["minheight"] = 
    this.$propHandlers["maxheight"] = function(value, prop){
        if (this.aData)
            this.aData[prop] = parseInt(value);
    }
    if (this.aData) {
        this.aData.minwidth = this.minwidth;
        this.aData.minheight = this.minheight;
    }*/
    
    this.$cancelInteractive = function(){
        document.onmouseup(null, true);
    }
    
    function dragStart(e, reparent){
        if (!e) e = event;

        if (!reparent && (!_self.draggable || apf.dragMode))//_self.editable || 
            return;
        
        //#ifdef __WITH_OUTLINE
        dragOutline = _self.dragOutline == true || apf.config.dragOutline;
        /*#else
        dragOutline = false;        
        #endif */
        
        apf.dragMode  = true;
        overThreshold = false;
        
        //#ifdef __WITH_POPUP
        apf.popup.forceHide();
        //#endif
        
        posAbs = "absolute|fixed".indexOf(apf.getStyle(_self.$ext, "position")) > -1;
        if (!posAbs) {
            _self.$ext.style.position = posAbs //(posAbs = _self.dragSelection) 
                ? "absolute" : "relative";
        }
        if (_self.editable)
            posAbs = true;

        //@todo not for docking
        //#ifdef __WITH_PLANE
        if (posAbs && !_self.aData) {
            apf.plane.show(dragOutline
                ? oOutline
                : _self.$ext);//, true
        }
        //#endif

        var pos = posAbs
            ? apf.getAbsolutePosition(_self.$ext, _self.$ext.offsetParent, true) 
            : [parseInt(apf.getStyle(_self.$ext, "left")) || 0, 
               parseInt(apf.getStyle(_self.$ext, "top")) || 0];

        nX = pos[0] - (oX = e.clientX);
        nY = pos[1] - (oY = e.clientY);
        
        //if (_self.hasFeature && _self.hasFeature(apf.__ANCHORING__))
            //_self.$disableAnchoring();

        //#ifdef __WITH_OUTLINE
        if (posAbs && dragOutline) {
            oOutline.className     = "drag";
            
            var diffOutline = apf.getDiff(oOutline);
            _self.$ext.offsetParent.appendChild(oOutline);
            oOutline.style.left    = pos[0] + "px";
            oOutline.style.top     = pos[1] + "px";
            oOutline.style.width   = (_self.$ext.offsetWidth - diffOutline[0]) + "px";
            oOutline.style.height  = (_self.$ext.offsetHeight - diffOutline[1]) + "px";
            
            if (_self.editable)
                oOutline.style.display = "block";
        }
        else
        //#endif
        {
            if (_self.$ext.style.right) {
                _self.$ext.style.left = pos[0] + "px";
                _self.$ext.style.right = "";
            }
            if (_self.$ext.style.bottom) {
                _self.$ext.style.top = pos[1] + "px";
                _self.$ext.style.bottom = "";
            }
        }

        document.onmousemove = dragMove;
        document.onmouseup   = function(e, cancel){
            document.onmousemove = document.onmouseup = null;

            //#ifdef __WITH_PLANE
            if (posAbs && !_self.aData)
                apf.plane.hide();
            //#endif
            
            var htmlNode = dragOutline
                ? oOutline
                : _self.$ext;

            if (overThreshold) {
                if (cancel) {
                    l = _self.left;
                    t = _self.top;
                    r = _self.right;
                    b = _self.bottom;
                    w = _self.width;
                    h = _self.height;
                }
                
                if (_self.setProperty) {
                    updateProperties();
                }
                else if (dragOutline) {
                    _self.$ext.style.left = l + "px";
                    _self.$ext.style.top  = t + "px";
                }
            }
            
            l = t = w = h = null;
            
            if (!posAbs)
                _self.$ext.style.position = "relative";
            
            if (_self.showdragging)
                apf.setStyleClass(_self.$ext, "", ["dragging"]);
            
            if (posAbs && dragOutline)
                oOutline.style.display = "none";
            
            apf.dragMode = false;

            if (_self.dispatchEvent)
                _self.dispatchEvent("afterdrag", {
                    htmlNode : htmlNode
                });
        };
        
        if (reparent)
            document.onmousemove(e);
        else if (apf.isIE)
            apf.window.$mousedown(e);

        return false;
    };
    
    function dragMove(e){
        if(!e) e = event;
        
        //if (_self.dragSelection)
            //overThreshold = true;
        
        if (!overThreshold && _self.showdragging)
            apf.setStyleClass(_self.$ext, "dragging");
        
        // usability rule: start dragging ONLY when mouse pointer has moved delta x pixels
        var dx = e.clientX - oX,
            dy = e.clientY - oY,
            distance; 

        if (!overThreshold 
          && (distance = dx*dx > dy*dy ? dx : dy) * distance < 2)
            return;

        //Drag outline support
        else if (!overThreshold) {
            if (dragOutline 
              && oOutline.style.display != "block")
                oOutline.style.display = "block";

            if (_self.dispatchEvent && _self.dispatchEvent("beforedrag") === false) {
                document.onmouseup();
                return;
            }
        }

        var oHtml = dragOutline
            ? oOutline
            : _self.$ext;

        oHtml.style.left = (l = e.clientX + nX) + "px";
        oHtml.style.top  = (t = e.clientY + nY) + "px";

        if (_self.realtime) {
            var change = _self.$stick = {};
            _self.$showDrag(l, t, oHtml, e, change);
            
            if (typeof change.l != "undefined") 
                l = change.l, oHtml.style.left = l + "px";
            if (typeof change.t != "undefined") 
                t = change.t, oHtml.style.top = t + "px";
        }

        overThreshold = true;
    };
    
    this.$resizeStart = resizeStart;
    function resizeStart(e, options){
        if (!e) e = event;

        //|| _self.editable 
        if (!_self.resizable 
          || String(_self.height).indexOf("%") > -1 && _self.parentNode.localName == "vbox" //can't resize percentage based for now
          || String(_self.width).indexOf("%") > -1 && _self.parentNode.localName == "hbox") //can't resize percentage based for now
            return;

        //#ifdef __WITH_OUTLINE
        resizeOutline = !(_self.resizeOutline == false || !apf.config.resizeOutline);
        /*#else
        resizeOutline = false;        
        #endif */
        
        if (!resizeOutline) {
            var diff = apf.getDiff(_self.$ext);
            hordiff  = diff[0];
            verdiff  = diff[1];
        }
        
        //@todo This is probably not gen purpose
        startPos = apf.getAbsolutePosition(_self.$ext);//, _self.$ext.offsetParent);
        startPos.push(_self.$ext.offsetWidth);
        startPos.push(_self.$ext.offsetHeight);
        myPos    = apf.getAbsolutePosition(_self.$ext, _self.$ext.offsetParent, true);

        var sLeft = 0,
            sTop  = 0,
            x     = (oX = e.clientX) - startPos[0] + sLeft + document.documentElement.scrollLeft,
            y     = (oY = e.clientY) - startPos[1] + sTop + document.documentElement.scrollTop,
            resizeType;

        if (options && options.resizeType) {
            posAbs = "absolute|fixed".indexOf(apf.getStyle(_self.$ext, "position")) > -1;
            resizeType = options.resizeType;
        }
        else {
            resizeType = getResizeType.call(_self.$ext, x, y);
        }
        rX = x;
        rY = y;

        if (!resizeType)
            return;

        if (_self.dispatchEvent && _self.dispatchEvent("beforeresize", {
            type    : resizeType,
            setType : function(type){
                resizeType = type;
            }
          }) === false) {
            if (apf.isIE)
                apf.window.$mousedown(e); //@todo is this necessary?
            return;
        }
        
        //#ifdef __WITH_POPUP
        apf.popup.forceHide();
        //#endif

        //if (_self.hasFeature && _self.hasFeature(apf.__ANCHORING__))
            //_self.$disableAnchoring();
        
        apf.dragMode  = true;
        overThreshold = false;

        we = resizeType.indexOf("w") > -1;
        no = resizeType.indexOf("n") > -1;
        ea = resizeType.indexOf("e") > -1;
        so = resizeType.indexOf("s") > -1;
        
        if (!_self.minwidth)  _self.minwidth  = 0;
        if (!_self.minheight) _self.minheight = 0;
        if (!_self.maxwidth)  _self.maxwidth  = 10000;
        if (!_self.maxheight) _self.maxheight = 10000;

        if (posAbs) {
            lMax = myPos[0] + startPos[2];
            tMax = myPos[1] + startPos[3];
            lMin = myPos[0] + startPos[2];
            tMin = myPos[1] + startPos[3];
            document.title = tMax + ":" + tMin;
        }

        //#ifdef __WITH_PLANE
        if (posAbs) {
            apf.plane.show(resizeOutline
                ? oOutline
                : _self.$ext);//, true
        }
        //#endif
        
        //#ifdef __WITH_OUTLINE
        if (resizeOutline) {
            oOutline.className     = "resize";
            var diffOutline = apf.getDiff(oOutline);
            hordiff = diffOutline[0];
            verdiff = diffOutline[1];
            
            //_self.$ext.parentNode.appendChild(oOutline);
            oOutline.style.left    = startPos[0] + "px";
            oOutline.style.top     = startPos[1] + "px";
            oOutline.style.width   = (_self.$ext.offsetWidth - hordiff) + "px";
            oOutline.style.height  = (_self.$ext.offsetHeight - verdiff) + "px";
            oOutline.style.display = "block";
        }
        else
        //#endif
        {
            if (_self.$ext.style.right) {
                _self.$ext.style.left = myPos[0] + "px";
                //_self.$ext.style.right = "";
            }
            if (_self.$ext.style.bottom) {
                _self.$ext.style.top = myPos[1] + "px";
                //_self.$ext.style.bottom = "";
            }
        }
        
        if (!options || !options.nocursor) {
            if (lastCursor === null)
                lastCursor = document.body.style.cursor;//apf.getStyle(document.body, "cursor");
            document.body.style.cursor = resizeType + "-resize";
        }
        
        document.onmousemove = resizeMove;
        document.onmouseup   = function(e, cancel){
            document.onmousemove = document.onmouseup = null;
            
            //#ifdef __WITH_PLANE
            if (posAbs)
                apf.plane.hide();
            //#endif
            
            clearTimeout(timer);
            
            if (resizeOutline) {
                var diff = apf.getDiff(_self.$ext);
                hordiff  = diff[0];
                verdiff  = diff[1];
            }

            if (cancel) {
                l = _self.left;
                t = _self.top;
                r = _self.right;
                b = _self.bottom;
                w = _self.width;
                h = _self.height;
            }
            else
                doResize(e || event, true);

            if (_self.setProperty)
                updateProperties();
            
            l = t = w = h = null;

            document.body.style.cursor = lastCursor;
            lastCursor = null;
            
            if (resizeOutline)
                oOutline.style.display = "none";
            
            apf.dragMode = false;

            if (_self.dispatchEvent)
                _self.dispatchEvent("afterresize");
        };
        
        if (apf.isIE)
            apf.window.$mousedown(e);
        
        return false;
    }
    
    function updateProperties(left, top, width, height, hdiff, vdiff){
        if (typeof left == "undefined") {
            left = l, top = t, width = w, height = h, 
                vdiff = verdiff, hdiff  = hordiff;
        }

        var hasLeft   = _self.left || _self.left === 0;
        var hasRight  = _self.right || _self.right === 0;
        var hasBottom = _self.bottom || _self.bottom === 0;
        var hasTop    = _self.top || _self.top === 0;

        if (posAbs) {
            var htmlNode = oOutline.style.display == "block"
                ? oOutline
                : _self.$ext;

            if (hasRight) {
                _self.setProperty("right", apf.getHtmlRight(htmlNode), 0, _self.editable);
                if (!_self.left)
                    htmlNode.style.left = "";
            }
            
            if (hasBottom) {
                _self.setProperty("bottom", apf.getHtmlBottom(htmlNode), 0, _self.editable);
                if (!_self.top)
                    htmlNode.style.top = "";
            }
        
            if ((left || left === 0) && (!hasRight || hasLeft)) 
                _self.setProperty("left", left, 0, _self.editable);
            if ((top || top === 0) && (!hasBottom || hasTop)) 
                _self.setProperty("top", top, 0, _self.editable);
        }

        if (width && (!hasLeft || !hasRight)) 
            _self.setProperty("width", width + hdiff, 0, _self.editable) 
        if (height && (!_self.top || !hasBottom)) 
            _self.setProperty("height", height + vdiff, 0, _self.editable); 
    }
    this.$updateProperties = updateProperties;
    
    var min = Math.min, max = Math.max, lastTime, timer;
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
        
        clearTimeout(timer);
        if (lastTime && new Date().getTime() 
          - lastTime < (resizeOutline ? 6 : apf.mouseEventBuffer)) {
            var z = {
                clientX: e.clientX,
                clientY: e.clientY
            }
            timer = setTimeout(function(){
                doResize(z);
            }, 10);
            return;
        }
        lastTime = new Date().getTime();
        
        doResize(e);
        
        //overThreshold = true;
    }
    
    function doResize(e, force){
        var oHtml = resizeOutline && !force
            ? oOutline
            : _self.$ext;

        var sLeft = document.documentElement.scrollLeft,
            sTop  = document.documentElement.scrollTop;
        
        if (we) {
            if (posAbs)
                oHtml.style.left = (l = max((lMin - _self.maxwidth), 
                    min((lMax - _self.minwidth), 
                    myPos[0] + e.clientX - oX + sLeft))) + "px";
            oHtml.style.width = (w = min(_self.maxwidth - hordiff, 
                max(hordiff, _self.minwidth, 
                    startPos[2] - (e.clientX - oX) + sLeft
                    ) - hordiff)) + "px"; //@todo
        }
        
        if (no) {
            if (posAbs)
                oHtml.style.top = (t = max((tMin - _self.maxheight), 
                    min((tMax - _self.minheight), 
                    myPos[1] + e.clientY - oY + sTop))) + "px";
            oHtml.style.height = (h = min(_self.maxheight - verdiff, 
                max(verdiff, _self.minheight, 
                    startPos[3] - (e.clientY - oY) + sTop
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

        //@todo apf3.0 this is execution wise inefficient
        if (_self.parentNode && _self.parentNode.localName == "table") {
            updateProperties();
            apf.layout.processQueue();
        }
        
        if (_self.realtime) {
            var change = _self.$stick = {};
            
            //@todo calc l and t once at start of resize (subtract borders)
            _self.$showResize(l || apf.getHtmlLeft(oHtml), t || apf.getHtmlTop(oHtml), 
                w && w + hordiff || oHtml.offsetWidth, 
                h && h + verdiff || oHtml.offsetHeight, e, change, we, no, ea, so);

            if (we && typeof change.l != "undefined")
                oHtml.style.left = (l = max((lMin - _self.maxwidth), min((lMax - _self.minwidth), change.l))) + "px";
            
            if (no && typeof change.t != "undefined")
                oHtml.style.top = (t = max((tMin - _self.maxheight), min((tMax - _self.minheight), change.t))) + "px";
            
            if (typeof change.w != "undefined") 
                oHtml.style.width = (w = min(_self.maxwidth - hordiff, 
                    max(hordiff, _self.minwidth, 
                        change.w) - hordiff)) + "px";
            if (typeof change.h != "undefined") 
                oHtml.style.height = (h = min(_self.maxheight - verdiff, 
                    max(verdiff, _self.minheight, 
                        change.h) - verdiff)) + "px";
        }

        //#ifdef __WITH_LAYOUT
        if (apf.hasSingleRszEvent)
            apf.layout.forceResize(_self.$int);
        //#endif
    }
    
    function getResizeType(x, y){
        var cursor  = "", 
            tcursor = "";
        posAbs = "absolute|fixed".indexOf(apf.getStyle(_self.$ext, "position")) > -1;

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
        
        if (!_self.resizable || _self.editable || document.onmousemove)
            return;

        //@todo This is probably not gen purpose
        var pos   = apf.getAbsolutePosition(_self.$ext),//, _self.$ext.offsetParent
            sLeft = 0,
            sTop  = 0,
            x     = e.clientX - pos[0] + sLeft + document.documentElement.scrollLeft,
            y     = e.clientY - pos[1] + sTop + document.documentElement.scrollTop;
        
        if (!originalCursor)
            originalCursor = apf.getStyle(this, "cursor");

        var cursor = getResizeType.call(_self.$ext, x, y);
        this.style.cursor = cursor 
            ? cursor + "-resize" 
            : originalCursor || "default";
    };

    //#ifdef __WITH_OUTLINE
    var oOutline;
    function initOutline(e){
        oOutline = this.$pHtmlDoc.getElementById("apf_outline");
        if (!oOutline) {
            oOutline = this.$pHtmlDoc.body.appendChild(this.$pHtmlDoc.createElement("div"));
            
            oOutline.refCount = 0;
            oOutline.setAttribute("id", "apf_outline");
            
            oOutline.style.position = "absolute";
            oOutline.style.display  = "none";
            oOutline.style.zIndex   = 2000000;
        }
        oOutline.refCount++
    }

    if (this.addEventListener && this.hasFeature(apf.__AMLNODE__) && !this.$amlLoaded) {
        this.addEventListener("DOMNodeInsertedIntoDocument", initOutline);
    }
    else {
        this.$pHtmlDoc = document;
        initOutline.call(this);
    }
    //#endif
    
    /*this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        oOutline.refCount--;
        
        if (!oOutline.refCount) {
            //destroy
        }
    });*/
};

apf.GuiElement.propHandlers["resizable"] = function(value){
    this.implement(apf.Interactive);
    this.$propHandlers["resizable"].apply(this, arguments);
}

apf.GuiElement.propHandlers["draggable"] = function(value){
    this.implement(apf.Interactive);
    this.$propHandlers["draggable"].apply(this, arguments);
};

// #endif
