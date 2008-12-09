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

/**
 * This abstraction is using for resizing block elements. Resizing is allowed
 * with square elements in vertical, horizontal or both planes. Symmetric
 * resizing is possible with SHIFT button.
 * 
 * @attribute {Object} scales
 *     Properties:
 *     {Boolean} scalex       resizing in horizontal plane, default is true
 *         Possible values:
 *         true   resizing in horizontal plane is allowed
 *         false  resizing in horizontal plane is not allowed
 *     {Boolean} scaley       resizing in vertical plane, default is true
 *         Possible values:
 *         true   resizing in vertical plane is allowed
 *         false  resizing in vertical plane is not allowed
 *     {Boolean} scaleratio   resizing in horizontal or vertical plane only is not allowed. Resizing in two dimensions plane at the same time is allowed.
 *         Possible values:
 *         true   resizing in two dimensions plane at the same time is allowed
 *         false  Resizing in two dimensions plane at the same time is not allowed
 *     {Number}  dwidth       the minimal horizontal size of Block element, default is 56 pixels
 *     {Number}  dheight      the minimal vertical size of Block element, default is 56 pixels
 * @attribute {HTMLElement}   htmlElement   html representation of resized block element
 * @attribute {Object}        squares       store object representations of inputs elements
 * 
 * @default_private
 * @constructor
 * 
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       1.0
 * @namespace jpf
 */

jpf.resize = function() {
    this.scales = {
        scalex    : false,
        scaley    : false,
        scaleratio: false,
        dwidth    : 0,
        dheight   : 0
    };

    this.htmlElement;

    var squares = [];

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

        /*if (!sx && !sy && !sr)
            return;*/

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

/**
 * Creates html and object representation for square element. Square is used for
 * resizing block elements.
 * 
 * @param {String}   posY        square vertical align relative to resized block element
 *     Possible values:
 *     top      square is on top of resized block element
 *     middle   square is in the middle of the resized block element
 *     bottom   square is on the bottom of resized block element
 * @param {String}   posX        square vertical align relative to resized block element
 *     Possible values:
 *     left     square is on the left of resized block element
 *     middle   square is in the middle of the resized block element
 *     right    square is on the right of resized block element
 * @param {Object}   objResize   resize class constructor
 * @constructor
 */
jpf.resize.square = function(posY, posX, objResize) {
    this.visible  = true;
    this.posX     = posX;
    this.posY     = posY;

    var margin = 0;
    var _self  = this;

    this.htmlElement = objResize.htmlElement.parentNode.appendChild(document.createElement('div'));
    jpf.setStyleClass(this.htmlElement, "square");

    this.repaint = function() {
        if (this.visible) {
            var block = objResize.htmlElement;
            this.htmlElement.style.display = "block";

            var bw = parseInt(block.style.width) + jpf.getDiff(block)[0];
            var bh = parseInt(block.style.height) + jpf.getDiff(block)[1];
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
        jpf.removeNode(this.htmlElement);
    };

    /* Events */
    this.htmlElement.onmouseover = function(e) {
        jpf.setStyleClass(_self.htmlElement, "squareHover");
    };

    this.htmlElement.onmouseout = function(e) {
        jpf.setStyleClass(_self.htmlElement, "", ["squareHover"]);
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

            objBlock = jpf.flow.isBlock(block),
            r  = objBlock.other.ratio,

            posX = _self.posX,
            posY = _self.posY,

            width, height, top, left, dx, dy,
            prev_w, prev_h,

            l = parseInt(block.style.left),
            t = parseInt(block.style.top),
            w = parseInt(block.style.width),
            h = parseInt(block.style.height),
            resized = false;

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

                /* Keep minimal size */
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

                /* Keep minimal size */
                width = Math.max(dw, width);
                height = Math.max(dh, height);
            }

            if(objResize.onresize) {
                objResize.onresize(block, top, left, width, height);
            }

            objResize.show();
            
            resized = true;
        };

        document.onmouseup = function(e) {
            document.onmousemove = null;
            if (objResize.onresizedone) {
                if(resized) {
                    objResize.onresizedone(width, height, top, left);
                    objBlock.other.ratio = width / height;
                    resized = false;
                }
            }
        };
    };
}

//#endif