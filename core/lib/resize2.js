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

//#ifdef __WITH_RESIZE2

/**
 * This abstraction is using for resizing block elements. Resizing is allowed
 * with square elements in vertical, horizontal or both planes. Symmetric
 * resizing is possible with SHIFT button.
 *
 * @private
 * @default_private
 * @constructor
 *
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       1.0
 * @namespace apf
 */

/*apf.resize = function() {
    this.scales = {
        scalex    : false,
        scaley    : false,
        scaleratio: false,
        dwidth    : 0,
        dheight   : 0,
        snap      : false,
        gridW     : 48,
        gridH     : 48
    };

    this.htmlElement;

    var squares = [];

    this.init = function() {
        squares = [
            new apf.resize.square("top",    "left",   this),
            new apf.resize.square("top",    "middle", this),
            new apf.resize.square("top",    "right",  this),
            new apf.resize.square("middle", "left",   this),
            new apf.resize.square("middle", "right",  this),
            new apf.resize.square("bottom", "left",   this),
            new apf.resize.square("bottom", "middle", this),
            new apf.resize.square("bottom", "right",  this)];
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
        var sx   = this.scales.scalex;
        var sy   = this.scales.scaley;
        var sr   = this.scales.scaleratio;

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
                            ? ((s.posY == "top" || s.posY == "bottom")
                              && s.posX !== "middle"
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

apf.resize.square = function(posY, posX, objResize) {
    this.visible  = true;
    this.posX     = posX;
    this.posY     = posY;

    var margin = 0;
    var _self  = this;

    this.htmlElement = objResize.htmlElement.parentNode.appendChild(document.createElement('div'));
    apf.setStyleClass(this.htmlElement, "square");

    this.repaint = function() {
        if (this.visible) {
            var block = objResize.htmlElement;
            this.htmlElement.style.display = "block";

            var bw = parseInt(block.style.width) + apf.getDiff(block)[0];
            var bh = parseInt(block.style.height) + apf.getDiff(block)[1];
            var bt = parseInt(block.style.top);
            var bl = parseInt(block.style.left);

            var sw = this.htmlElement.offsetWidth;
            var sh = this.htmlElement.offsetHeight;

            var t = posY == "top"
                ? bt - margin - sh
                : posY == "middle"
                    ? bt + bh/2 - sh/2
                    : bt + bh + margin;
            var l = posX == "left"
                ? bl - margin - sw
                : posX == "middle"
                    ? bl + bw/2 - sw/2
                    : bl + bw + margin;

            var c = (posY == "middle" 
                ? "w-resize"
                : (posX == "middle"
                     ? "n-resize"
                     : (posY + posX == "topleft"
                       || posY + posX == "bottomright") 
                         ? "nw-resize" 
                         : "ne-resize"));

            this.htmlElement.style.top    = (t - 1) + "px";
            this.htmlElement.style.left   = (l - 1) + "px";
            this.htmlElement.style.cursor = c;
        }
        else {
            //IE bug
            var sw = this.htmlElement.offsetWidth;
            this.htmlElement.style.display = 'none';
        }
    };

    this.destroy = function(){
        apf.destroyHtmlNode(this.htmlElement);
    };

    // Events
    this.htmlElement.onmouseover = function(e) {
        apf.setStyleClass(_self.htmlElement, "squareHover");
    };

    this.htmlElement.onmouseout = function(e) {
        apf.setStyleClass(_self.htmlElement, "", ["squareHover"]);
    };

    this.htmlElement.onmousedown = function(e) {
        e = (e || event);

        var block = objResize.htmlElement,

            sx = e.clientX,
            sy = e.clientY,

            pt = block.parentNode.offsetTop,
            pl = block.parentNode.offsetLeft,

            dw = objResize.scales.dwidth,
            dh = objResize.scales.dheight,
            
            snap = objResize.scales.snap,
            gridH = objResize.scales.gridH,
            gridW = objResize.scales.gridW,

            objBlock = apf.flow.isBlock(block),
            r = objBlock.other.ratio,

            posX = _self.posX,
            posY = _self.posY,

            width, height, top, left, dx, dy,
            prev_w, prev_h,

            l = parseInt(block.style.left),
            t = parseInt(block.style.top),
            w = parseInt(block.style.width),
            h = parseInt(block.style.height),
            resized = false;
            
        objResize.onresizedone(w, h, t, l);

        if (e.preventDefault) {
            e.preventDefault();
        }

        document.onmousemove = function(e) {
            e = (e || event);

            dx = e.clientX - sx;
            dy = e.clientY - sy;
            var shiftKey = e.shiftKey,
                proportion = r;

            if (shiftKey) {
                if (posX == "right" && posY == "bottom") {
                    width  = w + dx;
                    height = width/proportion;
                    left   = l;
                    top    = t;
                }
                else if (posX == "right" && posY == "top") {
                    width  = w + dx;
                    height = width/proportion;
                    left   = l;
                    top    = t - dx/proportion;
                }
                else if (posX == "left" && posY == "bottom") {
                    width  = w - dx;
                    height = width/proportion;
                    left   = l + dx;
                    top    = t;
                }
                else if (posX == "left" && posY == "top") {
                    width  = w - dx;
                    height = width/proportion;
                    left   = l + dx;
                    top    = t + dx/proportion;
                }

                // Keep minimal size
                if(width >= dw && height >= dh) {
                    width  = prev_w = Math.max(dw, width);
                    height = prev_h = Math.max(dh, height);
                }
                else {
                    width  = prev_w;
                    height = prev_h;
                    return false;
                }
            }
            else {
                width = posX == "right"
                    ? w + dx
                    : (posX == "left"
                        ? w - dx
                        : w);
                height = posY == "bottom"
                    ? h + dy
                    : (posY == "top"
                        ? h - dy
                        : h);
                left = posX == "right"
                    ? l
                    : (posX == "left"
                        ? Math.min(l + w - dw, l + dx)
                        : l);
                top = posY == "bottom"
                    ? t
                    : (posY == "top"
                        ? Math.min(t + h - dh, t + dy)
                        : t);

                // Keep minimal size
                width = Math.max(dw, width);
                height = Math.max(dh, height);
            }

            if (snap) {
                left   = Math.floor(left / gridW) * gridW;
                top    = Math.floor(top / gridH) * gridH;
                width  = Math.ceil(width / gridW) * gridW;
                height = Math.ceil(height / gridH) * gridH;
            }

            if (objResize.onresize) {
                objResize.onresize(block, top, left, width, height);
            }

            objResize.show();
            
            resized = true;
        };

        document.onmouseup = function(e) {
            document.onmousemove = null;
            if (objResize.onresizedone && resized) {
                objResize.onresizedone(width, height, top, left);
                objBlock.other.ratio = width / height;
                resized = false;
            }
        };
    };
}*/

//#endif