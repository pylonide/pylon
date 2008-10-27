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

/**
 * @private
 */
jpf.popup = {
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
        
        content.onmousedown  = function(e) {
            (e || event).cancelBubble = true;
        };
        
        return content.ownerDocument;
    },
    
    removeContent : function(cacheId){
        this.cache[cacheId] = null;
        delete this.cache[cacheId];
    },
    
    init : function(){
        //consider using iframe
        this.popup = {};
        
        jpf.addEventListener("hotkey", function(e){
            if (e.keyCode == "27" || e.altKey) 
                jpf.popup.forceHide();
        });
    },
    
    show : function(cacheId, options){
        options = jpf.extend({
            x            : 0,
            y            : 0,
            animate      : false,
            ref          : null,
            width        : null,
            height       : null,
            callback     : null,
            draggable    : false,
            resizable    : false,
            allowTogether: false
        }, options);
        if (!this.popup)
           this.init();
        if ((!options.allowTogether || options.allowTogether != this.last) && this.last != cacheId)
            this.hide();
        
        var o = this.cache[cacheId];
        //if(this.last != cacheId) 
        //this.popup.document.body.innerHTML = o.content.outerHTML;

        var popup = o.content;
        if (!o.content.style.zIndex)
            o.content.style.zIndex = 10000000;
        if (o.content.style.display && o.content.style.display.indexOf('none') > -1)
            o.content.style.display = "";
        
        var pos    = jpf.getAbsolutePosition(options.ref);//[ref.offsetLeft+2,ref.offsetTop+4];//
        var top    = (options.y || 0) + pos[1];
        var p      = jpf.getOverflowParent(o.content); 
        
        if (options.width || o.width)
            popup.style.width = ((options.width || o.width) - 3) + "px";
        
        var moveUp = false;//(top + (height || o.height || o.content.offsetHeight) + y) > (p.offsetHeight + p.scrollTop);
        
        if (moveUp)
            popup.style.top = (pos[1] - (options.height || o.height || o.content.offsetHeight)) + "px"
        else
            popup.style.top = top + "px";
        popup.style.left = ((options.x || 0) + pos[0]) + "px";

        if (options.animate) {
            if (options.animate == "fade") {
                jpf.tween.single(popup, {
                    type  : 'fade',
                    from  : 0,
                    to    : 1,
                    anim  : jpf.tween.NORMAL,
                    steps : jpf.isIE ? 5 : 10
                });
            }
            else { 
                var iVal, steps = 7, i = 0;
                
                iVal = setInterval(function(){
                    var value = ++i * ((options.height || o.height) / steps);
                    popup.style.height = value + "px";
                    if (moveUp)
                        popup.style.top = (top - value - options.y) + "px";
                    else
                        popup.scrollTop = -1 * (i - steps - 1) * ((options.height || o.height) / steps);
                    popup.style.display = "block";
                    if (i > steps) {
                        clearInterval(iVal)
                        callback(popup);
                    }
                }, 10);
            }
        }
        else {
            if (options.height || o.height)
                popup.style.height = (options.height || o.height) + "px";

            if (options.callback)
               options.callback(popup);
        }

        this.last = cacheId;

        if (options.draggable)
            this.makeDraggable(options);
    },
    
    hide : function(){
        if (this.isDragging) return;

        if (this.cache[this.last])
            this.cache[this.last].content.style.display = "none";
        //if(this.popup) this.popup.hide();
    },

    isDragging   : false,

    makeDraggable: function(options) {
        if (!this.last || !jpf.Interactive) return;

        var oHtml = this.cache[this.last].content;
        var o = {
            $propHandlers : {},
            minwidth      : 10,
            minheight     : 10,
            maxwidth      : 10000,
            maxheight     : 10000,

            draggable     : true,
            resizable     : options.resizable,
            oExt          : oHtml,
            oDrag         : oHtml.firstChild
        };

        oHtml.onmousedown =
        oHtml.firstChild.onmousedown = function(){
            //#ifdef __WITH_WINDOW_FOCUS
            //@todo I don't understand where it gets cancelbubbled
            if (jpf.hasFocusBug)
                jpf.window.$focusfix();
            //#endif
        }

        jpf.inherit.call(o, jpf.Interactive);

        o.$propHandlers["draggable"].call(o, true);
        o.$propHandlers["resizable"].call(o, true);
    },
    
    forceHide : function(){
        if (this.last && !jpf.plane.current) {
            var o = jpf.lookup(this.last);
            if (!o)
                this.last = null;
                
            else if (o.dispatchEvent("popuphide") !== false)
                this.hide();
        }
    },

    destroy : function(){
        for (var cacheId in this.cache) {
            if (this.cache[cacheId]) {
                this.cache[cacheId].content.onmousedown = null;
                jpf.removeNode(this.cache[cacheId].content);
                this.cache[cacheId].content = null;
            }
        }
        
        if (!this.popup) return;
        //this.popup.document.body.c = null;
        //this.popup.document.body.onmouseover = null;
    }
}

//#endif