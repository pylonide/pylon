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

//#ifdef __WITH_POPUP

jpf.Popup = {
    cache      : {},
    
    setContent : function(cacheId, content, style, width, height){
        if (!this.popup) this.init();

        this.cache[cacheId] = {
            content : content,
            style   : style,
            width   : width,
            height  : height
        };
        content.style.position = "absolute";
        //if(content.parentNode) content.parentNode.removeChild(content);
        //if(style) jpf.importCssString(this.popup.document, style);
        
        return content.ownerDocument;
    },
    
    removeContent : function(cacheId){
        this.cache[cacheId] = null;
        delete this.cache[cacheId];
    },
    
    init : function(){
        //consider using iframe
        this.popup = {};
    },
    
    show : function(cacheId, x, y, animate, ref, width, height, callback, draggable){
        if (!this.popup)
           this.init();
        if (this.last != cacheId)
            this.hide();
        if (typeof draggable == "undefined")
            draggable = false;
        
        var o = this.cache[cacheId];
        //if(this.last != cacheId) 
        //this.popup.document.body.innerHTML = o.content.outerHTML;

        var popup = o.content;
        o.content.onmousedown  = function(e) {
            (e || event).cancelBubble = true;
        };
        o.content.style.zIndex = 10000000;
        if (o.content.style.display && o.content.style.display.indexOf('none') > -1)
            o.content.style.display = "";
        
        var pos    = jpf.getAbsolutePosition(ref);//[ref.offsetLeft+2,ref.offsetTop+4];//
        var top    = y + pos[1];
        var p      = jpf.getOverflowParent(o.content); 
        var moveUp = (top + height + y) > (p.offsetHeight + p.scrollTop);
        
        popup.style.top = top + "px";
        popup.style.left = (x + pos[0]) + "px";
        if (width || o.width)
            popup.style.width = ((width || o.width) - 3) + "px";

        if (animate) {
            var iVal, steps = 7, i = 0;
            
            iVal = setInterval(function(){
                var value = ++i * ((height || o.height) / steps);
                popup.style.height = value + "px";
                if (moveUp)
                    popup.style.top = (top - value - y) + "px"
                else
                    popup.scrollTop = -1 * (i - steps - 1) * ((height || o.height) / steps);
                popup.style.display = "block";
                if (i > steps) {
                    clearInterval(iVal)
                    callback(popup);
                }
            }, 10);
        }
        else {
             if (height || o.height)
                 popup.style.height = (height || o.height) + "px";
             callback(popup);
        }

        this.last = cacheId;

        if (draggable)
            this.makeDraggable();
    },
    
    hide : function(){
        if (this.isDragging) return;

        if (this.cache[this.last])
            this.cache[this.last].content.style.display = "none";
        //if(this.popup) this.popup.hide();
    },

    isDragging   : false,

    makeDraggable: function() {
        if (!this.last) return;

        var oHtml = this.cache[this.last].content;
        
        // @todo implement using jpf.dragmode.isDragging when it's available
        var nX, nY;

        var _self = this;

        function dragMove (e){
            if (!e) e = window.event;
            var newX = e.clientX + nX;
            var newY = e.clientY + nY;
            // usability rule: start dragging ONLY when mouse pointer has moved delta 5 pixels
            if (!_self.isDragging && (Math.abs(newX - nX) < 5 || Math.abs(newY - nY) < 5))
                return;
            else if (!_self.isDragging)
                _self.isDragging = true;
            oHtml.style.left = newX + "px";
            oHtml.style.top  = newY + "px";
        }
        
        function dragStart(e){
            if (!e) e = window.event;
            if (_self.isDragging || !oHtml)
                return;

            _self.isDragging = true;

            var pos = jpf.getAbsolutePosition(oHtml, oHtml.offsetParent);
            nX = pos[0] - e.clientX;
            nY = pos[1] - e.clientY;

            document.onmousemove = dragMove;
            document.onmouseup   = function(){
                document.onmousemove = document.onmouseup = null;
                _self.isDragging = false;
                nX = nY = 0;
            }

            return false;
        }
        
        oHtml.onmousedown = dragStart
    },
    
    dragStart: function(e) {
        
    },
    
    dragMove: function(e) {
        
    },
    
    forceHide : function(){
        if (this.last) {
            var o = jpf.lookup(this.last);
            if (!o)
                this.last = null;
            else
                o.dispatchEvent("onpopuphide");
        }
    },

    destroy : function(){
        if (!this.popup) return;
        //this.popup.document.body.c = null;
        //this.popup.document.body.onmouseover = null;
    }
}

function makeDraggable(oHtml) {
    
}

//#endif