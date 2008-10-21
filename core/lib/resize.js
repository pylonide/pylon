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

//#ifdef __WITH_RESIZE

jpf.resize = function() {
    this.scales = {
        scalex    : false,
        scaley    : false,
        scaleratio: false,
        dwidth    : 0,
        dheight   : 0
    };
    
    this.htmlElement;

    var squares = []
    
    this.init = function() {
        squares = [
            new jpf.resize.square("top",    "left",   this),
            new jpf.resize.square("top",    "middle", this),
            new jpf.resize.square("top",    "right",  this),
            new jpf.resize.square("middle", "left",   this),
            new jpf.resize.square("middle", "right",  this),
            new jpf.resize.square("bottom", "left",   this),
            new jpf.resize.square("bottom", "middle", this),
            new jpf.resize.square("bottom", "right",  this)];
    };

    this.grab = function(oHtml, scales) {
        this.htmlElement = oHtml;
        this.scales = scales;
        
        if (!squares.length)
            this.init();
        this.show();
    };

    this.hide = function() {
        for (var i = 0, l = squares.length; i < l; i++) {
            squares[i].visible = false;
            squares[i].repaint();
        }
    };

    this.show = function() {
        var sx = this.scales.scalex;
        var sy = this.scales.scaley;
        var sr = this.scales.scaleratio;

        for (var i = 0, l = squares.length, s; i < l; i++) {
            s = squares[i];
            s.visible = sx && sy
                ? true
                : (sy && !sx
                    ? (s.posX == "middle"
                        ? true
                        : false)
                    : (sx && !sy
                        ? (s.posY == "middle"
                            ? true
                            : false)
                        : (sr
                            ? ((s.posY == "top" || s.posY == "bottom") && s.posX !== "middle"
                                ? true
                                : false)
                            : false)));
            s.repaint();
        }
    };

    this.destroy = function(){
        for (var i = 0; i < squares.length; i++) {
            squares[i].destroy();
        }
    };

};

jpf.resize.square = function(posY, posX, objResize) {
    this.visible  = true;
    this.posX     = posX;
    this.posY     = posY;

    var _self     = this;

    this.htmlElement = objResize.htmlElement.parentNode.appendChild(document.createElement('div'));
    jpf.setStyleClass(this.htmlElement, "square");

    this.repaint = function() {
        if (this.visible) {
            var block = objResize.htmlElement;
            this.htmlElement.style.display = 'block';
            var margin = 4;
            var bw = block.offsetWidth;
            var bh = block.offsetHeight;
            var bt = parseInt(block.style.top);
            var bl = parseInt(block.style.left);
            
            var sw = this.htmlElement.offsetWidth; 
            var sh = this.htmlElement.offsetHeight;

            var t = posY == "top" ? bt - margin - sh : posY == "middle" ? bt + bh/2 - sh/2 : bt + bh + margin;
            var l = posX == "left" ? bl - margin - sw : posX == "middle" ? bl + bw/2 - sw/2 : bl + bw + margin;

            var c = (posY == "middle" 
                ? "w-resize"
                : (posX == "middle"
                     ? "n-resize"
                     : (posY + posX == "topleft" || posY + posX == "bottomright") 
                         ? "nw-resize" 
                         : "ne-resize"));

            this.htmlElement.style.top = t + "px";
            this.htmlElement.style.left = l + "px";
            this.htmlElement.style.cursor = c;
        }
        else {
            this.htmlElement.style.display = 'none';
        }
    };
    
    this.destroy = function(){
        jpf.removeNode(this.htmlElement);
    };
    
    /* Events */
    
    this.htmlElement.onmouseover = function(e){
        jpf.setStyleClass(_self.htmlElement, "squareHover");
    };

    this.htmlElement.onmouseout = function(e){
        jpf.setStyleClass(_self.htmlElement, "", ["squareHover"]);
    };
    
    this.htmlElement.onmousedown = function(e) {
        e = (e || event);
        
        var block = objResize.htmlElement;
        
        var sx = e.clientX;
        var sy = e.clientY;

        var pt = block.parentNode.offsetTop;
        var pl = block.parentNode.offsetLeft;

        var dw = objResize.scales.dwidth;
        var dh = objResize.scales.dheight;

        var posX = _self.posX;
        var posY = _self.posY;
        
        var width, height, top, left, dx, dy;
        
        var l = parseInt(block.style.left);
        var t = parseInt(block.style.top);
        var w = block.offsetWidth;
        var h = block.offsetHeight;
        var resized = false;
        
        if (!jpf.isIE6) {
            e.preventDefault();
        }
        
        document.onmousemove = function(e) {
            e = (e || event);

            dx = e.clientX - sx;
            dy = e.clientY - sy;
            var shiftKey = e.shiftKey;
            
            var proportion = (width || w) / (height || h);

            if (shiftKey) {
                if (posX == "right" && posY == "bottom") {
                    width = w + dx;
                    height = width/proportion;
                    left = l;
                    top = t;
                }
                else if (posX == "right" && posY == "top") {
                    width = w + dx;
                    height = width/proportion;
                    left = l;
                    top = t - dx/proportion;
                }
                else if (posX == "left" && posY == "bottom") {
                    width = w - dx;
                    height = width/proportion;
                    left = l + dx;
                    top = t;
                }
                else if (posX == "left" && posY == "top") {
                    width = w - dx;
                    height = width/proportion;
                    left = l + dx;
                    top = t + dx/proportion;
                }
            }
            else {
                width = posX == "right" ? w + dx : (posX == "left" ? w - dx : w);
                height = posY == "bottom" ? h + dy : (posY == "top" ? h - dy : h);
                left = posX == "right" ? l : (posX == "left" ? Math.min(l + w - dw, l + dx) : l);
                top = posY == "bottom" ? t : (posY == "top" ? Math.min(t + h - dh, t + dy) : t);
            }
            
            /* Keep minimal size */
            width = Math.max(dw, width);
            height = Math.max(dh, height);
            block.style.width = width + "px";
            block.style.height = height + "px";
            
            block.style.left = left + "px";
            block.style.top = top + "px";
            
            objResize.show();

            if(objResize.onresize) {
                objResize.onresize(block);
            }
            
            resized = true;
        };

        document.onmouseup = function(e) {
            document.onmousemove = null;
            if (objResize.onresizedone) {
                if(resized) {
                    objResize.onresizedone(width, height, top, left);
                    resized = false;
                }
            }
            
        };
    };
}

//#endif