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

//#ifdef __WITH_FLOW

/**
 * This abstraction is used for creating block elements which can be moved by
 * mouse or keyboard, rotated with 90 degreed steps, flipped horizontally and vertically
 * and resized on the fly using the mouse. Each block can have inputs defined in
 * a template file. Inputs allow creating stiff connections between block
 * elements. If a block does not have inputs, the connection is created in the most optimal way.
 *
 * @event onmousedown   Fires when mouse button is pressed on document body
 * @event onmousemove   Fires when mouse pointer is moving over document body
 * @event onmouseup     Fires when mouse button is released while the pointer is over the document body
 *
 * @attribute {Boolean} isMoved              the state of movement. When connection is moving, this attribute is set to true. It gives information to other methods what happens with the connection element.
 *     Possible values:
 *     true   block moves
 *     false  block don't move
 * @attribute {Object}  objCanvases          storage workareas objects, it allows an easy access to them if need 
 * @attribute {Object}  connectionsTemp      keeps information about source block and its input in moment of connection creation. (mode must be set to "connection-add")
 * @attribute {Object}  connectionsManager   manage of entire connection creation process
 * @attribute {Number}  sSize                connection line width
 * @attrubite {Number}  fsSize               define size of first and last connection segment
 *
 * @private
 * @default_private
 * @constructor
 *
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       1.0
 * @namespace jpf
 */

jpf.flow = {
    isMoved            : false,
    objCanvases        : {},
    connectionsTemp    : null,
    connectionsManager : null,

    sSize  : 7,
    fsSize : 15,

    init : function() {
        //jpf.flow.connectionsManager = new jpf.flow.connectionsManager;

        document.onmousedown = function(e) {
            e = (e || event);

            /* Looking for Block element */
            var target = e.target || e.srcElement;
            var isDraged = false;

            if (target.tagName == 'HTML')
                return;
            while (target != document.body && !jpf.flow.findBlock(target.id)) {
                target = target.parentNode || target.parentElement;
            }
            /* Looking for Block element - End*/

            var objBlock = jpf.flow.isBlock(target);

            if (!objBlock)
                return;
            if (!objBlock.draggable)
                return;

            var sx = e.clientX, sy = e.clientY,
                dx = 0, dy = 0,
                l = parseInt(target.style.left),
                t = parseInt(target.style.top);

            //objBlock.canvas.htmlElement.scrollLeft = Math.round(l+dx+target.offsetWidth);

            if (e.preventDefault) {
                e.preventDefault();
            }

            document.onmousemove = function(e) {
                e = (e || event);

                isDraged = true;

                dx = e.clientX - sx;
                dy = e.clientY - sy;

                target.style.left = (l + dx) + "px";
                target.style.top  = (t + dy) + "px";

                objBlock.onMove();
                jpf.flow.onblockmove();

                return false;
            }

            document.onmouseup = function(e) {
                document.onmousemove = null;

                if(jpf.flow.onaftermove && isDraged) {
                    jpf.flow.onaftermove(dy, dx);
                    isDraged = false;
                }
            }
        };
    }
};

/**
 * Workarea where blocks and connections its placed
 *
 * @param {HTMLElement}   htmlElement    the html representation of a workarea
 * @constructor
 */
jpf.flow.canvas = function(htmlElement) {
    if (!htmlElement.getAttribute("id")) {
        jpf.setUniqueHtmlId(htmlElement);
    }

    this.id             = htmlElement.getAttribute("id");
    this.htmlElement    = htmlElement;

    this.htmlBlocks     = {};
    this.htmlConnectors = {};

    this.mode           = "normal";
    this.disableremove  = false;

    this.initCanvas = function() {
        jpf.flow.objCanvases[this.htmlElement.getAttribute("id")] = this;
    };

    this.removeConnector = function(id) {
        var c = this.htmlConnectors[id];
        c.htmlElement.parentNode.removeChild(c.htmlElement);
        this.htmlConnectors[id] = c = null;
        delete this.htmlConnectors[id];
    };

    this.deselectConnections = function() {
        for (var id in this.htmlConnectors) {
            var con = this.htmlConnectors[id];
            if (con.selected) {
                con.deselect("selected");
                con.deselectInputs("Selected");
                con.selected = false;
            }
        }
    }

    this.setMode = function(mode) {
        this.mode = mode;
    };

    this.getMode = function() {
        return this.mode;
    };
    
    this.getScrollLeft = function() {
        return document.documentElement.scrollLeft || document.body.scrollLeft;
    }
    
    this.getScrollTop = function() {
        return document.documentElement.scrollTop || document.body.scrollTop;
    }
};

/**
 * Creates a new block object which can be moved by mouse or keyboard, rotated
 * with 90 degrees steps, flipped horizontally and vertically and resized on the fly
 * using the mouse. Each block can have inputs, background picture and minimal
 * dimension defined in the template file. It is possible to create connections
 * between blocks.
 *
 * @param {HTMLElement}   htmlElement   the html representation of block
 * @param {Object}        objCanvas     object representation of workarea (canvas) element
 * @param {Object}        other         the properties of the block element
 *    Properties:
 *    {Boolean}   lock   prohibit block move, default is false
 *        Possible values:
 *        false   block element is unlocled
 *        true    block element is locked
 *    {Boolean}   flipv   whether to mirror the block over the vertical axis, background image is flipped automaticly, default is false
 *        Possible values:
 *        true    block element is flipped
 *        false   block element is not flipped
 *    {Boolean}   fliph   whether to mirror the block over the horizontal axis, background image is flipped automaticly. default is false
 *        Possible values:
 *        true    block element is flipped
 *        false   block element is not flipped
 *    {Number}    rotation   the rotation in degrees clockwise, background image is rotated automaticly, default is 0
 *        Possible values:
 *        0     0   degrees rotation
 *        90    90  degrees rotation
 *        180   180 degrees rotation
 *        270   270 degrees rotation
 *    {Object}   inputList   Block's inputs list, block could haven't any inputs
 *        Properties:
 *        {Number}  x          position in pixels relative to Block's horizontal dimension
 *        {Number}  y          position in pixels relative to Block's vertical dimension
 *        {String}  position   edge where input is placed
 *            Possible values:
 *            top      input is placed on top edge of block
 *            right    input is placed on right edge of block
 *            bottom   input is placed on bottom edge of block
 *            left     input is placed on left edge of block
 *    {String}       type         name of block with special abilities, which could set in template file
 *    {String}       picture      Path to image file.
 *    {Number}       dwidth       the minimal horizontal size of Block element
 *    {Number}       dheight      the minimal vertical size of Block element
 *    {Boolean}      scalex       resizing in horizontal plane
 *    {Boolean}      scaley       resizing in vertical plane
 *    {Boolean}      scaleratio   resizing in horizontal or vertical plane only is not allowed. Resizing in two dimensions plane at the same time is allowed.
 *    {XMLElement}   xmlNode      the xml representation of block from model
 *    {String}       caption      description placed under block element
 * @constructor
 */
jpf.flow.block = function(htmlElement, objCanvas, other) {
    this.canvas        = objCanvas;
    this.htmlElement   = htmlElement;
    this.id            = htmlElement.getAttribute("id");
    this.moveListeners = new Array();
    this.draggable     = true;
    this.htmlOutputs   = {};

    this.image         = null;
    this.other         = other;

    var _self = this;

    this.destroy = function() {
        //removing events
        this.htmlElement.onmouseover =
        this.htmlElement.onmouseout =
        this.htmlElement.onclick = null;

        //removing connections
        for (var i = this.moveListeners.length-1; i >= 0; i--) {
            this.moveListeners[i].destroy();
            this.moveListeners.removeIndex(i);
        }
        //removing objBlock from canvas
        delete this.canvas.htmlBlocks[this.id];
    }

    this.initBlock = function() {
        this.canvas.htmlBlocks[this.id] = this;

        var bChilds = this.htmlElement.childNodes;
        for (var i = 0, l = bChilds.length; i < l; i++) {
            var tag = bChilds[i].tagName;
            if (tag) {
                if (tag.toLowerCase() == "div") {
                   var dChilds = bChilds[i].childNodes;

                   for (var j = 0; j < dChilds.length; j++) {
                       if(dChilds[j].tagName.toLowerCase() == "img") {
                           this.imageContainer = bChilds[i];
                           this.image = dChilds[j];
                       }
                   }
                }
                else if (tag.toLowerCase() == "blockquote") {
                    this.caption = bChilds[i];
                }
            }
        }

        if (!this.other.type) {
            jpf.setStyleClass(this.htmlElement, "empty");
            this.image.style.display = "none";
        }
        else {
            if (this.other.picture == null) {
                this.image.style.display = "none";
            }
            else {
                this.image.style.display = "block";
                this.image.src = this.other.picture;
                this.image.onload = function() {
                    _self.changeRotation(_self.other.rotation,
                        _self.other.fliph, _self.other.flipv, true);
                }
            }
        }
        /* Set last scale ratio */
        this.other.ratio = this.other.dwidth / this.other.dheight;

        this.changeRotation(_self.other.rotation,
            _self.other.fliph, _self.other.flipv, true);
        this.setCaption(this.other.caption);
        this.setLock(this.other.lock, true)

        this.updateOutputs();
    };

    this.updateOutputs = function() {
        var inp = this.other.inputList;

        for (var id in inp) {
            var input = this.htmlOutputs[id]
                ? this.htmlOutputs[id]
                : new jpf.flow.input(this, id);

            if (!this.htmlOutputs[id])
                this.htmlOutputs[id] = input;
            var pos = this.updateInputPos(inp[id]);

            var _x = pos[0] - (pos[2] == "left" || pos[2] == "right"
                ? Math.ceil(parseInt(jpf.getStyle(input.htmlElement, "width"))/2)
                : Math.ceil(jpf.flow.sSize/2));
            var _y = pos[1] - (pos[2] == "top" || pos[2] == "bottom"
                ? Math.ceil(parseInt(jpf.getStyle(input.htmlElement, "height"))/2)
                : Math.ceil(jpf.flow.sSize/2));

            input.lastUpdate = pos;
            input.moveTo(_x, _y);
        }
    };

    this.outputsVisibility = function(visible) {
        var inp = this.htmlOutputs;
        for (var id in inp) {
            var input = inp[id];
            if (visible)
                input.show();
            else
                input.hide();
        }
    };

    /**
     * Immobilise block element on workarea
     *
     * @param {Number}   lock   prohibit block move, default is false
     *     Possible values:
     *     true    block is locked
     *     false   block is unlocked
     */
    this.setLock = function(lock, init) {
        if (this.other.lock !== lock || init) {
            this.draggable = !lock;
            this.other.lock = lock;
            this.outputsVisibility(!lock);

            if (lock)
                jpf.setStyleClass(this.htmlElement, "locked");
            else
                jpf.setStyleClass(this.htmlElement, "", ["locked"]);
        }
    };

    /**
     * Sets new description which is placed under block element
     *
     * @param {String}   caption   block description
     */
    this.setCaption = function(caption) {
        var c = this.caption;
        c.innerHTML = caption;
        if (this.other.capPos == "inside") {
            if (c.offsetWidth !== 0 && c.offsetHeight !== 0) {
                c.style.marginLeft =
                    "-" + (Math.ceil(c.offsetWidth / 2)) + "px";
                c.style.marginTop =
                    "-" + (Math.ceil(c.offsetHeight / 2)) + "px";
            }
        }
    }

    /**
     * Moves block to new x, y position
     *
     * @param {Number}   top   vertical coordinate
     * @param {Number}   left   horizontal coordinate
     */
    this.moveTo = function(top, left) {
        var t = parseInt(this.htmlElement.style.top);
        var l = parseInt(this.htmlElement.style.left);

        if (t !== top || l !== left) {
            this.htmlElement.style.top  = top + "px";
            this.htmlElement.style.left = left + "px";
        }
    }

    /**
     * Resize block element
     *
     * @param {Number}   width   new vertical block size
     * @param {Number}   height   new horizontal block size
     */
    this.resize = function(width, height) {
        var w = parseInt(this.htmlElement.style.width);
        var h = parseInt(this.htmlElement.style.height);

        if (w !== width || h !== height) {
            this.htmlElement.style.width  = this.imageContainer.style.width
                                      = width + "px";
            this.htmlElement.style.height = this.imageContainer.style.height
                                      = height + "px";
            this.image.style.height = height + "px";
            this.image.style.width = width + "px";
        }
    }

    /**
     * Set rotation and flip and call to redraw image function.
     *
     * @param {Number}   rotation   the rotation in degrees clockwise, background image is rotated automaticly, Default is 0.
     *     Possible values:
     *     0     0   degrees rotation
     *     90    90  degrees rotation
     *     180   180 degrees rotation
     *     270   270 degrees rotation
     * @param {Boolean}   fliph      whether to mirror the block over the vertical axis, background image is flipped automaticly. Default is false.
     *     Possible values:
     *     true    block element is flipped
     *     false   block element is not flipped
     * @param {Boolean}   flipv      whether to mirror the block over the horizontal axis, background image is flipped automaticly. Default is false.
     *    Possible values:
     *    true    block element is flipped
     *    false   block element is not flipped
     * @param {Boolean}   init
     */
    this.changeRotation = function(rotation, fliph, flipv, init) {
        var o = this.other, prev = [o.rotation, o.fliph, o.flipv];
        if (!o.type)
            return;

        o.rotation = parseInt(rotation) % 360 || 0;
        o.fliph    = String(fliph) == "true" ? true : false;
        o.flipv    = String(flipv) == "true" ? true : false;

        var flip = (o.fliph && !o.flipv
            ? "horizontal"
            : (!o.fliph && o.flipv
                ? "vertical"
                : "none"));

        if (init || (prev[0] != o.rotation  || prev[1] != o.fliph || prev[2] != o.flipv)) {
            this.repaintImage(flip, o.rotation, 'rel');
        }
    };

    /**
     * Function repaints default block's image with new rotation and flip.
     *
     * @param {String}   flip    whether to mirror the image over the vertical or horizontal axis
     *     Possible values:
     *     none         image is not flipped
     *     horizontal   image is flipped horizontal
     *     vertical     image is flipped vertical
     * @param {Number}   angle   degrees angle
     *     Possible values:
     *     0     0   degrees angle
     *     90    90  degrees angle
     *     180   180 degrees angle
     *     270   270 degrees amgle
     * @param {String}   whence
     */
    this.repaintImage = function(flip, angle, whence) {
        var p = this.image;
        if(p.style.display == "none")
            return;
        else
            p.style.display = "block";

        p.angle = !whence
            ? ((p.angle == undefined ? 0 : p.angle) + angle) % 360
            : angle;

        var rotation = Math.PI *(p.angle >= 0 ? p.angle : 360 + p.angle)/ 180;
        var costheta = Math.cos(rotation);
        var sintheta = Math.sin(rotation);

        if (document.all && !window.opera) {
            var canvas          = document.createElement('img');
            canvas.src          = p.src;
            canvas.style.height = p.height + "px";
            canvas.style.width  = p.width + "px";

            canvas.style.filter = "progid:DXImageTransform.Microsoft.Matrix(M11="
                                + costheta + ",M12=" + (-sintheta)
                                + ",M21=" + sintheta
                                + ",M22=" + costheta
                                + ",SizingMethod='auto expand')";

            if (flip !== "none") {
                canvas.style.filter += "progid:DXImageTransform.Microsoft.BasicImage("
                                    +(flip == "horizontal"
                                        ? "mirror=1"
                                        : "rotation=2, mirror=1")
                                    +")";
            }
        }
        else {
            var canvas = document.createElement('canvas');
            if (!p.oImage) {
                canvas.oImage = new Image();
                canvas.oImage.src = p.src;
            }
            else {
                canvas.oImage = p.oImage;
            }

            canvas.style.width  = canvas.width
                                = Math.abs(costheta * canvas.oImage.width)
                                + Math.abs(sintheta * canvas.oImage.height);
            canvas.style.height = canvas.height
                                = Math.abs(costheta * canvas.oImage.height)
                                + Math.abs(sintheta * canvas.oImage.width);

            var context = canvas.getContext('2d');
            context.save();

            switch (flip) {
                case "vertical":
                    context.translate(0, canvas.oImage.height);
                    context.scale(1, -1);
                    break;
                case "horizontal":
                    context.translate(canvas.oImage.height, 0);
                    context.scale(-1, 1);
                    break;
            }

            if (rotation <= Math.PI / 2) {
                context.translate(sintheta * canvas.oImage.height, 0);
            }
            else if (rotation <= Math.PI) {
                context.translate(canvas.width,
                                  -costheta * canvas.oImage.height);
            }
            else if (rotation <= 1.5 * Math.PI) {
                context.translate(-costheta * canvas.oImage.width,
                                  canvas.height);
            }
            else {
                context.translate(0, -sintheta * canvas.oImage.width);
            }
            context.rotate(rotation);

            try {
                context.drawImage(canvas.oImage, 0, 0, canvas.oImage.width,
                    canvas.oImage.height);
                context.restore();
            }
            catch (e) {}
        }
        canvas.angle = p.angle;
        this.imageContainer.replaceChild(canvas, p);
        this.image = canvas;
    };

    /**
     * When Block change his position notify other elements about that fact
     * (actualy notify only connections, but it's not important what type
     * element have. Notified object must have onMove function).
     */
    this.onMove = function() {
        for (var i = 0, ml = this.moveListeners, l = ml.length; i < l; i++) {
            ml[i].onMove();
        }
    };

    /**
     * Calculates the new input position if block is resized, flipped or rotated.
     * Base on default informations about block element from template.
     *
     * @param {Object}   input   object representation of input element
     *     Properties:
     *     {Number}  x          x position in pixels based on Block's dimensions
     *     {Number}  y          y position in pixels based on Block's dimensions
     *     {String}  position   input orientation
     *         Possible values:
     *         top      input is placed on top edge of block
     *         right    input is placed on right edge of block
     *         bottom   input is placed on bottom edge of block
     *         left     input is placed on left edge of block
     * @param {Object}   [dPos]  destination block position
     *     Properties:
     *     dPos[0]   destination block horizontal coordinate
     *     dPos[1]   destination block vertical coordinate
     *     dPos[2]   horizontal size of destination block element
     *     dPos[3]   vertical size of destination block element
     * @return {Object}   new input position
     */
    this.updateInputPos = function(input, dPos) {
        var b = this.htmlElement,
            o = this.other,
            w = parseInt(b.style.width), h = parseInt(b.style.height),
            ior = input ? input.position : "auto",
            x = input ? input.x : w / 2, y = input ? input.y : h / 2,
            dw = o.dwidth, dh = o.dheight,
            fv = o.flipv, fh = o.fliph, r = o.rotation;
        var positions = {0 : "top", 1 : "right", 2 : "bottom", 3 : "left",
                         "top" : 0, "right" : 1, "bottom" : 2, "left" : 3};
        var sSize = jpf.flow.sSize, hSize = Math.floor(jpf.flow.sSize/2);

        /* Changing input floating */
        ior = ior == "auto"
            ? "auto"
            : positions[(positions[ior] + parseInt(r) / 90)%4];

        if (ior !== "auto") {
            if (fv)
                ior = ior == "top" ? "bottom" : (ior == "bottom" ? "top" : ior);
            if (fh)
                ior = ior == "left" ? "right" : (ior == "right" ? "left" : ior);

            /* If block is resized, block keep proportion */
            x = r == 90 || r == 270 ? x*h / dh : x*w / dw;
            y = r == 90 || r == 270 ? y*w / dw : y*h / dh;

            /* If rotate, change inputs coordinates */
            var _x = x, _y = y;

            _x = r == 90
                ? w - y - 1
                : (r == 180
                    ? w - x - 1
                    : (r == 270
                        ? y
                        : x));
            _y = r == 90
                ? x
                : (r == 180
                    ? h - y - 1
                    : (r == 270
                        ? h - x - 1
                        : y));

            /* Flip Vertical and Horizontal */
            _x = fh ? w - _x : _x;
            _y = fv ? h - _y : _y;

            _x = fh ? (ior == "top" || ior == "bottom" ? _x - 1 : _x) : _x
            _y = fv ? (ior == "left" || ior == "right" ? _y - 1 : _y) : _y

            _x = ior == "top" || ior == "bottom"
                ? _x - (sSize/2) + (jpf.isIE || jpf.isOpera || jpf.isChrome ? 1 : 0)
                : _x;
            _y = ior == "left" || ior == "right"
                ? _y - (sSize/2) + (jpf.isIE || jpf.isOpera || jpf.isChrome ? 1 : 0)
                : _y;
        }
        else {
            var st = parseInt(b.style.top), sl = parseInt(b.style.left),
                dt = dPos[1], dl = dPos[0], dw = dPos[2], dh = dPos[3];

            if (st + h * 1.5 < dt) {
                ior = "bottom";
            }
            else if (st > dt + dh * 1.5) {
                ior = "top";
            }
            else {
                if (sl > dl + dw / 2) {
                    ior = "left";
                }
                else if (sl < dl) {
                    ior = "right";
                }
                else {
                    ior = "left";
                }
            }

            _x = ior == "top" || ior == "bottom"
                ? w/2 - hSize
                : ior == "right"
                    ? w
                    : 0;
            _y = ior == "left" || ior == "right"
                ? h/2 - hSize
                : ior == "bottom"
                    ? h
                    : 0;
        }
        return [_x, _y, ior];
    };

    this.htmlElement.onmouseup = function(e) {
        if (!_self.other.type && _self.canvas.mode == "connection-add") {
            jpf.flow.connectionsManager.addBlock(_self, 0);
        }
    }
};

/**
 * Creates object representation for input elements. Each block can have 
 * unlimited inputs.
 *
 * @param {Object}   objBlock   object representation of block element
 * @param {Number}   number     unique input number for block element
 * @constructor
 */
jpf.flow.input = function(objBlock, number) {
    this.objBlock    = objBlock;
    this.htmlElement = objBlock.htmlElement.appendChild(document.createElement("div"));
    this.number      = number;
    this.lastUpdate    = null;

    var _self = this;

    jpf.setStyleClass(this.htmlElement, "input");

    /**
     * Hides inpiut
     */
    this.hide = function() {
        this.htmlElement.style.display = "none";
    };
    
    /**
     * Shows input
     */
    this.show = function() {
        this.htmlElement.style.display = "block";
    };

    /**
     * Moves input to new position
     * 
     * @param {Number}   x   new horizontal position
     * @param {Number}   y   new vertical position
     */
    this.moveTo = function(x, y) {
        this.htmlElement.style.left = x + "px";
        this.htmlElement.style.top  = y + "px";
    };

    var connection;
    var vMB;
    this.htmlElement.onmousedown = function(e) {
        e              = (e || event);
        e.cancelBubble = true;
        jpf.flow.isMoved = true;

        var pn         = _self.htmlElement.parentNode,
            canvas     = _self.objBlock.canvas,
            mode       = canvas.mode;

        if (e.preventDefault) {
            e.preventDefault();
        }

        vMB = new jpf.flow.virtualMouseBlock(canvas, e);

        var con = jpf.flow.findConnector(_self.objBlock, _self.number);
        if (con) {
            var source = con.source
                ? con.connector.objDestination
                : con.connector.objSource;
            var destination = con.source
                ? con.connector.objSource
                : con.connector.objDestination;
            var sourceInput = con.source
                ? con.connector.other.input
                : con.connector.other.output;
            var destinationInput = con.source
                ? con.connector.other.output
                : con.connector.other.input;
            /* Temporary connection must keeping output direction */
            vMB.other.inputList[1].position = destination.updateInputPos(
                destination.other.inputList[destinationInput])[2];

            _self.objBlock.onremoveconnection([con.connector.other.xmlNode]);
            jpf.flow.removeConnector(con.connector.htmlElement);

            connection = new jpf.flow.addConnector(canvas , source, vMB, {
                output : sourceInput, input : 1
            });
            jpf.flow.connectionsManager.addBlock(source, sourceInput);
            canvas.setMode("connection-change");
        }
        else {
            connection = new jpf.flow.addConnector(canvas, _self.objBlock, vMB, {
                output : _self.number
            });
            jpf.flow.connectionsManager.addBlock(_self.objBlock, _self.number);
            canvas.setMode("connection-add");
        }
        connection.newConnector.virtualSegment = true;
        vMB.onMove(e);

        document.onmousemove = function(e) {
            e = (e || event);

            if(vMB)
                vMB.onMove(e);
        };

        document.onmouseup = function(e) {
            e = (e || event);
            var t = e.target || e.srcElement;
            document.onmousemove = null;
            jpf.flow.isMoved = false;

            if (t && canvas.mode == "connection-change") {
                if ((t.className || "").indexOf("input") == -1) {
                    jpf.flow.connectionsManager.addBlock(destination, destinationInput);
                }
            }
            jpf.flow.connectionsManager.clear();

            if (connection) {
                jpf.flow.removeConnector(connection.newConnector.htmlElement);
            }
            if (vMB) {
                vMB.destroy();
                vMB = null;
                _self.objBlock.canvas.setMode("normal");
            }
        };
    };

    this.htmlElement.onmouseup = function(e) {
        jpf.flow.connectionsManager.addBlock(_self.objBlock, _self.number);
    };

    this.htmlElement.onmouseover = function(e) {
        var mode = _self.objBlock.canvas.mode;
        if (mode == "connection-add" || mode == "connection-change") {
            jpf.setStyleClass(_self.htmlElement, "inputHover");
        }
    };

    this.htmlElement.onmouseout = function(e) {
        jpf.setStyleClass(_self.htmlElement, "", ["inputHover"]);
    };
};

/**
 * Manage informations about clicked blocks and/or inputs. If mode
 * connection-add is active and if two blocks or inputs has clicked, new
 * connection will be created.
 * @constructor
 */
jpf.flow.connectionsManager = new (function() {
    this.addBlock = function(objBlock, inputNumber) {
        if (objBlock && (inputNumber || inputNumber == 0)) {
            var s = jpf.flow.connectionsTemp;

            if (!s) {
                jpf.flow.connectionsTemp = {
                    objBlock    : objBlock,
                    inputNumber : inputNumber
                };
            }
            else {
                if (s.objBlock.id !== objBlock.id || s.inputNumber !== inputNumber) {
                    objBlock.oncreateconnection(s.objBlock.other.xmlNode,
                        s.inputNumber, objBlock.other.xmlNode, inputNumber);
                    objBlock.canvas.setMode("normal");
                }
                this.clear();
            }
        }
    };

    this.clear = function() {
        jpf.flow.connectionsTemp = null;
    };
})();

/**
 * Simulate block element to create temporary connection between source
 * block and mouse cursor, until destination block is not clicked.
 *
 * @param {Object}   canvas   object representation of canvas element
 * @constructor
 */
jpf.flow.virtualMouseBlock = function(canvas) {
    var hook = [0, 0, "virtual"];
    this.canvas = canvas;
    this.htmlElement = document.createElement('div');

    this.canvas.htmlElement.appendChild(this.htmlElement);

    this.htmlElement.style.display = "block";
    this.moveListeners             = new Array();
    this.draggable                 = 0;
    this.htmlOutputs               = {};
    this.htmlOutputs[1] = {
        htmlElement : this.htmlElement.appendChild(document.createElement("div")),
        number      : 1,
        lastUpdate  : hook
    };
    this.other                     = {};
    this.other.inputList           = {};
    this.other.inputList[1]        = {x : hook[0], y : hook[1], position : hook[2]};

    jpf.setStyleClass(this.htmlElement, "vMB");

    var sPos = jpf.getAbsolutePosition(this.htmlElement.parentNode);

    this.onMove = function(e) {
        this.htmlElement.style.left = (e.clientX - sPos[0] + 2 + this.canvas.getScrollLeft()) + "px";
        this.htmlElement.style.top  = (e.clientY - sPos[1] + 2 + this.canvas.getScrollTop()) + "px";

        for (var i = 0, l = this.moveListeners.length; i < l; i++) {
            this.moveListeners[i].onMove();
        }
    };

    this.destroy = function() {
        this.htmlElement.parentNode.removeChild(this.htmlElement);
    };

    this.updateInputPos = function(input) {
        return hook;
    };
};


/**
 * Creates connection between two block elements. To remove connection is needed
 * select it by mouse and press delete button.
 *
 * @param {HTMLElement}   htmlElement      html representation of connector element
 * @param {Object}        objCanvas        object representation of connector element
 * @param {Object}        objSource        object representation of source block element
 * @param {Object}        objDestination   object representation of destination block element
 * @param {Object}        other            connection properties
 *     Properties:
 *     {Number}     output    source block input number
 *     {Number}     input     destination block input number
 *     {XMLElement} xmlNode   xml representation of connection element
 * @constructor
 */
jpf.flow.connector = function(htmlElement, objCanvas, objSource, objDestination, other) {
    /**
     * Connection segments
     */
    this.htmlSegments    = [];
    
    /**
     * Array used when connection is repainting
     */
    var htmlSegmentsTemp = [];
    
    /**
     * Connection label - text defined by user in the middle of connection
     */
    this.htmlLabel       = null;
    
    /**
     * Connector-start object, it could be an arrow
     */
    this.htmlStart       = null;
    
    /**
     * Connector-end object, it could be an arrow
     */
    this.htmlEnd         = null;

    /**
     * Object of source block
     */
    this.objSource       = objSource;
    
    /**
     * Object of destination block
     */
    this.objDestination  = objDestination;
    this.other           = other;

    this.selected        = false;

    this.htmlElement     = htmlElement;
    this.virtualSegment  = null;

    var sSize            = jpf.flow.sSize; //Segment size
    var fsSize           = jpf.flow.fsSize; //First segment size
    var hSize            = Math.floor(sSize/2);

    var sourceHtml       = this.objSource.htmlElement;
    var destinationHtml  = this.objDestination.htmlElement;

    var _self = this;

    this.initConnector = function() {
        if (!htmlElement.getAttribute("id")) {
            jpf.setUniqueHtmlId(htmlElement);
        }
        objCanvas.htmlConnectors[htmlElement.getAttribute("id")] = this;

        this.objSource.moveListeners.push(this);
        this.objDestination.moveListeners.push(this);
        this.activateInputs();
        this.onMove();
    };

    this.activateInputs = function() {
        this.i1 = other.output && this.objSource.other.inputList[other.output]
            ? this.objSource.other.inputList[other.output]
            : {x : 0, y : 0, position : "auto"};

        this.i2 = other.input && this.objDestination.other.inputList[other.input]
            ? this.objDestination.other.inputList[other.input]
            : {x : 0, y : 0, position : "auto"};
    }

    this.destroy = function() {
        _self.deselectInputs("Selected");
        var sl = this.objSource.moveListeners;
        for (var i = 0, l = sl.length; i < l; i++) {
            if (sl[i] == this) {
                this.objSource.moveListeners.removeIndex(i);
            }
        }

        var dl = this.objDestination.moveListeners;
        for (var i = 0, l = dl.length; i < l; i++) {
            if (dl[i] == this) {
                this.objDestination.moveListeners.removeIndex(i);
            }
        }
        objCanvas.removeConnector(this.htmlElement.getAttribute("id"));
    };

    this.onMove = function() {
        this.draw();
        if (this.selected) {
            this.deselectInputs("Hover");
            this.deselect("selected");
            this.deselectInputs("Selected");
            this.selected = false;
        }
    };

    this.draw = function() {
        var l = [],
            s = [parseInt(sourceHtml.style.left),
                 parseInt(sourceHtml.style.top)],
            d = [parseInt(destinationHtml.style.left),
                 parseInt(destinationHtml.style.top)];

        htmlSegmentsTemp = this.htmlSegments;
        /*for (var i = 0, l = this.htmlSegments.length; i < l; i++) {
            htmlSegmentsTemp.push(this.htmlSegments[i]);
        }*/
        this.htmlSegments = [];

        if (this.i1.position == "auto" || this.i2.position == "auto") {
            var sIPos = this.objSource.updateInputPos(this.i1, d);
            var dIPos = this.objDestination.updateInputPos(this.i2, s);
        }
        else {
            var sIPos = this.objSource.htmlOutputs[other.output].lastUpdate;
            var dIPos = this.objDestination.htmlOutputs[other.input].lastUpdate;
        }

        var sO = sIPos[2];
        var dO = dIPos[2];

        s[0] += sIPos[0];
        s[1] += sIPos[1];

        d[0] += dIPos[0];
        d[1] += dIPos[1];

        if (sO !== "virtual") {
            s = this.createSegment(s, [fsSize, sO], true);
        }

        if (dO !== "virtual") {
            d = this.createSegment(d, [fsSize, dO], true);
        }

        l = s;
        position = s[0] > d[0]
                 ? (s[1] > d[1]
                     ? "TL" : (s[1] < d[1] ? "BL" : "ML"))
                 : (s[0] < d[0]
                     ? (s[1] > d[1]
                         ? "TR" : (s[1] < d[1] ? "BR" : "MR"))
                     : (s[1] > d[1]
                         ? "TM" : (s[1] < d[1] ? "MM" : "BM")));

        var condition = position
                      + (sO == "left"
                          ? 1
                          : (sO == "right"
                              ? 2
                              : sO == "top"
                                  ? 4
                                  : 8))
                      + (dO == "left"
                          ? 1
                          : (dO == "right"
                              ? 2
                              : dO == "top"
                                  ? 4
                                  : 8));
    //rot.setValue(condition)

        switch (condition) {
            case "TR41":
                l = this.createSegment(l, [jpf.isGecko ? s[1] - d[1] : Math.ceil(s[1] - d[1]), "top"]);
                l = this.createSegment(l, [jpf.isGecko ? d[0] - s[0] : Math.ceil(d[0] - s[0]), "right"]);
                break;
            case "TR44":
            case "TR14":
            case "TR11":
                l = this.createSegment(l, [jpf.isGecko ? s[1] - d[1] : Math.ceil(s[1] - d[1]), "top"]);
                l = this.createSegment(l, [jpf.isGecko ? d[0] - s[0] : Math.floor(d[0] - s[0]), "right"]);
                break;
            case "BR22":
            case "BR24":
            case "BR42":
            case "BR44":
                l = this.createSegment(l, [jpf.isGecko ? d[0] - s[0] : Math.floor(d[0] - s[0]), "right"]);
                l = this.createSegment(l, [Math.ceil(Math.abs(d[1] - s[1])), "bottom"]);
                break;
            case "BR41":
                l = this.createSegment(l, [jpf.isGecko ? (d[0] - s[0]) / 2 : (d[0] - s[0]) / 2, "right"]);
                l = this.createSegment(l, [d[1] - s[1], "bottom"]);
                l = this.createSegment(l, [jpf.isGecko ? (d[0] - s[0]) / 2 : Math.ceil((d[0] - s[0]) / 2), "right"]);
                break;
            case "BR48":
            case "BR28":
                l = this.createSegment(l, [jpf.isGecko ? (d[0] - s[0]) / 2 : (d[0] - s[0]) / 2, "right"]);
                l = this.createSegment(l, [jpf.isGecko ? d[1] - s[1] : Math.ceil(d[1] - s[1]), "bottom"]);
                l = this.createSegment(l, [jpf.isGecko ? (d[0] - s[0]) / 2 : (d[0] - s[0]) / 2, "right"]);
                break;
            case "BR21":
                l = this.createSegment(l, [jpf.isGecko ? (d[0] - s[0]) / 2 : (d[0] - s[0]) / 2, "right"]);
                l = this.createSegment(l, [jpf.isGecko ? d[1] - s[1] : Math.ceil(d[1] - s[1]), "bottom"]);
                l = this.createSegment(l, [parseInt((d[0] - s[0]) / 2)+1, "right"]);
                break;
            case "TL44":
            case "TL42":
            case "TL24":
            case "TL22":
                l = this.createSegment(l, [jpf.isGecko ? s[1] - d[1] : Math.ceil(s[1] - d[1]), "top"]);
                l = this.createSegment(l, [jpf.isGecko ? s[0] - d[0] : Math.ceil(s[0] - d[0]), "left"]);
                break;
            case "TR21":
            case "TR24":
            case "TR81":
            case "TR84":
            case "TR21":
            case "TR24":
            case "TR81":
            case "TR84":
                l = this.createSegment(l, [jpf.isGecko ? (d[0] - s[0]) / 2 : (d[0] - s[0]) / 2, "right"]);
                l = this.createSegment(l, [jpf.isGecko ? s[1] - d[1] : Math.ceil(s[1] - d[1]), "top"]);
                l = this.createSegment(l, [jpf.isGecko ? (d[0] - s[0]) / 2 : (d[0] - s[0]) / 2, "right"]);
                break;
            case "BR18":
            case "BR88":
            case "BR81":
            case "BR11":
                l = this.createSegment(l, [d[1] - s[1], "bottom"]);
                l = this.createSegment(l, [jpf.isGecko ? d[0] - s[0] : Math.ceil(d[0] - s[0]), "right"]);
                break;
            case "BR14":
                l = this.createSegment(l, [jpf.isGecko ? (d[1] - s[1]) / 2 : Math.ceil((d[1] - s[1]) / 2) , "bottom"]);
                l = this.createSegment(l, [jpf.isGecko ? d[0] - s[0] : Math.floor(d[0] - s[0]), "right"]);
                l = this.createSegment(l, [Math.ceil((d[1] - s[1]) / 2), "bottom"]);
                break;
            case "BR84":
            case "BR82":
            case "BR12":
                l = this.createSegment(l, [jpf.isGecko ? (d[1] - s[1]) / 2 : Math.ceil((d[1] - s[1]) / 2) , "bottom"]);
                l = this.createSegment(l, [jpf.isGecko ? d[0] - s[0] : Math.floor(d[0] - s[0]), "right"]);
                l = this.createSegment(l, [(d[1] - s[1]) / 2, "bottom"]);
                break;
            case "BL84":
            case "BL24":
            case "BL21":
                l = this.createSegment(l, [jpf.isGecko ? (d[1] - s[1]) / 2 : Math.ceil((d[1] - s[1]) / 2), "bottom"]);
                l = this.createSegment(l, [jpf.isGecko ? s[0] - d[0] : Math.ceil(s[0] - d[0]), "left"]);
                l = this.createSegment(l, [jpf.isGecko ? (d[1] - s[1]) / 2 : Math.ceil((d[1] - s[1]) / 2), "bottom"]);
                break;
            case "BL11":
            case "BL14":
            case "BL41":
            case "BL44":
            case "BL81":
                l = this.createSegment(l, [jpf.isGecko ? s[0] - d[0] : Math.ceil(s[0] - d[0]), "left"]);
                l = this.createSegment(l, [jpf.isGecko ? d[1] - s[1] : Math.ceil(d[1] - s[1]), "bottom"]);
                break;
            case "BL12":
            case "BL18":
            case "BL42":
            case "BL48":
                l = this.createSegment(l, [jpf.isGecko ? (s[0] - d[0]) / 2 : (s[0] - d[0]) / 2, "left"]);
                l = this.createSegment(l, [jpf.isGecko ? d[1] - s[1] : Math.ceil(d[1] - s[1]), "bottom"]);
                l = this.createSegment(l, [jpf.isGecko ? (s[0] - d[0]) / 2 : (s[0] - d[0]) / 2, "left"]);
                break;
            case "BL88":
            case "BL82":
            case "BL28":
            case "BL22":
                l = this.createSegment(l, [jpf.isGecko ? d[1] - s[1] : Math.ceil(d[1] - s[1]), "bottom"]);
                l = this.createSegment(l, [jpf.isGecko ? s[0] - d[0] : Math.ceil(s[0] - d[0]), "left"]);
                break;
            case "TL88":
            case "TL81":
            case "TL18":
            case "TL11":
                l = this.createSegment(l, [jpf.isGecko ? s[0] - d[0] : Math.ceil(s[0] - d[0]), "left"]);
                l = this.createSegment(l, [jpf.isGecko ? s[1] - d[1] : Math.ceil(s[1] - d[1]), "top"]);
                break;
            case "TL41":
                l = this.createSegment(l, [jpf.isGecko ? (s[1] - d[1]) / 2 : Math.floor((s[1] - d[1]) / 2), "top"]);
                l = this.createSegment(l, [jpf.isGecko ? s[0] - d[0] : Math.ceil(s[0] - d[0]), "left"]);
                l = this.createSegment(l, [jpf.isGecko ? (s[1] - d[1]) / 2 : Math.ceil((s[1] - d[1]) / 2), "top"]);
                break;
            case "TL48":
            case "TL28":
            case "TL21":
                l = this.createSegment(l, [jpf.isGecko ? (s[1] - d[1]) / 2 : Math.floor((s[1] - d[1]) / 2), "top"]);
                l = this.createSegment(l, [jpf.isGecko ? s[0] - d[0] : Math.ceil(s[0] - d[0]), "left"]);
                l = this.createSegment(l, [jpf.isGecko ? (s[1] - d[1]) / 2 : Math.floor((s[1] - d[1]) / 2), "top"]);
                break;
            case "TL12":
            case "TL14":
            case "TL82":
            case "TL84":
                l = this.createSegment(l, [jpf.isGecko ? (s[0] - d[0]) / 2 : (s[0] - d[0]) / 2, "left"]);
                l = this.createSegment(l, [jpf.isGecko ? s[1] - d[1] : Math.ceil(s[1] - d[1]), "top"]);
                l = this.createSegment(l, [jpf.isGecko ? (s[0] - d[0]) / 2 : (s[0] - d[0]) / 2, "left"]);
                break;
            case "TR12":
            case "TR18":
            case "TR42":
            case "TR48":
                l = this.createSegment(l, [jpf.isGecko ? (s[1] - d[1]) / 2 : Math.floor((s[1] - d[1]) / 2), "top"]);
                 l = this.createSegment(l, [jpf.isGecko ? d[0] - s[0] : Math.floor(d[0] - s[0]), "right"]);
                l = this.createSegment(l, [jpf.isGecko ? (s[1] - d[1]) / 2 : Math.floor((s[1] - d[1]) / 2), "top"]);
                break;
            case "TR22":
            case "TR28":
            case "TR82":
            case "TR88":
                l = this.createSegment(l, [jpf.isGecko ? d[0] - s[0] : Math.floor(d[0] - s[0]), "right"]);
                l = this.createSegment(l, [jpf.isGecko ? s[1] - d[1] : Math.ceil(s[1] - d[1]), "top"]);
                break;
            default:
                switch (position) {
                    case "ML":
                        l = this.createSegment(l, [jpf.isGecko ? s[0] - d[0] : Math.ceil(s[0] - d[0]), "left"]);
                        break;
                    case "MM":
                        l = this.createSegment(l, [jpf.isGecko ? s[0] - d[0] : Math.ceil(s[0] - d[0]), "left"]);
                        l = this.createSegment(l, [jpf.isGecko ? d[1] - s[1] : Math.ceil(d[1] - s[1]), "bottom"]);
                        break;
                    case "TM":
                        l = this.createSegment(l, [jpf.isGecko ? s[1] - d[1] : Math.ceil(s[1] - d[1]), "top"]);
                        l = this.createSegment(l, [jpf.isGecko ? s[0] - d[0] : Math.ceil(s[0] - d[0]), "left"]);
                        break;
                    case "MR":
                        // This part is not checked, MR41 needs only "right"
                        // line, else need them both
                        l = this.createSegment(l, [jpf.isGecko ? d[0] - s[0] : Math.floor(d[0] - s[0]), "right"]);
                        if (condition.substring(2,4) == "41")
                            break;
                        l = this.createSegment(l, [Math.abs(d[1] - s[1]),
                                               "bottom"]);
                        break;
                }
                break;
        }

        for (var i = htmlSegmentsTemp.length - 1; i >= 0; i--) {
            htmlSegmentsTemp[i][0].style.display = "none";
        }

        if (this.other.label) {
           this.htmlLabel = jpf.flow.label(this);
        }

        if (this.other.type) {
            var _type = this.other.type.split("-");

            if (_type[0] !== "none") {
                this.htmlStart = jpf.flow.connectorsEnds(this, "start", _type[0]);
            }
            if(_type[1] !== "none") {
                this.htmlEnd = jpf.flow.connectorsEnds(this, "end", _type[1]);
            }
        }
    };

    this.createSegment = function(coor, lines, startSeg) {
        var or = lines[1], l = lines[0],
            sX = coor[0] || 0, sY = coor[1] || 0,
            _temp = htmlSegmentsTemp.shift(),
            segment = _temp ? _temp[0] : null;
        var plane = or == "top" || or == "bottom" ? "ver" : "hor";

        if (!segment) {
            var segment = htmlElement.appendChild(document.createElement("div"));

            jpf.setUniqueHtmlId(segment);
            jpf.setStyleClass(segment, "segment");

            if (_self.selected)
                _self.select("selected");

            var canvas = this.objSource.canvas;
            /* Segment events */
            segment.onmouseover = function(e) {
                if (!jpf.flow.isMoved && ((canvas.mode == "connection-change"
                    && _self.selected) || canvas.mode == "connection-add")) {
                    _self.select("hover");
                }
            }

            segment.onmouseout = function(e) {
                _self.deselect("hover");
            }

            segment.onmousedown = function(e) {
                e = e || event;
                e.cancelBubble = true;
                _self.deselect("selected");
                _self.select("clicked");
            }

            segment.onmouseup = function(e) {
                e = (e || event);
                e.cancelBubble = true;
                var ctrlKey  = e.ctrlKey;
                var temp = _self.selected;

                if (!ctrlKey) {
                    _self.objSource.canvas.deselectConnections();
                }

                _self.selected = temp ? false : _self.selected ? false : true;

                if (_self.selected) {
                    _self.selectInputs("Selected");
                    _self.deselect("clicked");
                    _self.select("selected");
                    canvas.setMode("connection-change");
                }
                else {
                    _self.deselectInputs("Selected");
                    _self.deselect("clicked");
                    _self.deselect("selected");
                    canvas.setMode("normal");
                }
            }
        }

        segment.plane = plane;

        var w = plane == "ver" ? sSize : l;
        var h = plane == "ver" ? l : sSize;
        var className = "segment "+"seg_" + plane;

        if (_self.virtualSegment) {
            className += " seg_"+plane+"_virtual";
        }

        segment.className = className;

        if (or == "top")
            sY -= l;
        if (or == "left")
            sX -=l;

        segment.style.display = "block";
        segment.style.left    = sX
            + (plane == "hor" && !startSeg || (or =="left" && startSeg) ? 3 : 0)
            + "px";
        segment.style.top     = sY + (plane == "ver" ? 3 : 0) + "px";
        segment.style.width   = w + (or =="left" && startSeg ? -3 : (or == "right" && startSeg ? 3 : 0)) + "px";
        segment.style.height  = h + "px";

        /* Define the connection end point */
        if (or == "bottom")
            sY += h;
        if (or == "right")
            sX += w;

        this.htmlSegments.push([segment, or]);

        return [sX, sY];
    };

    this.deselect = function(type) {
        var segments = _self.htmlElement.childNodes;

        for (var i = 0, l = segments.length; i < l; i++) {
            if ((segments[i].className || "").indexOf("segment") != -1) {
                jpf.setStyleClass(segments[i], "",
                    ["seg_" + segments[i].plane + "_" + type]);
            }
        }
        if (!_self.selected)
            _self.deselectInputs("Selected");

        if (this.htmlLabel && type == "selected")
            this.htmlLabel.className = "label";
    };

    this.select = function(type) {
        var segments = this.htmlElement.childNodes;

        for (var i = 0, l = segments.length; i < l; i++) {
            if ((segments[i].className || "").indexOf("segment") != -1) {
                jpf.setStyleClass(segments[i],
                    "seg_" + segments[i].plane + "_" + type);
            }
        }
        _self.selectInputs();
        if (this.htmlLabel && type == "selected")
            this.htmlLabel.className = "label labelSelected";
    };

    this.selectInputs = function(type) {
        if (_self.other.output && _self.objSource.htmlOutputs[other.output]) {
            var output = _self.objSource.htmlOutputs[other.output].htmlElement;
            jpf.setStyleClass(output, "input" + type);
        }
        if (_self.other.input && _self.objDestination.htmlOutputs[other.input]) {
            var input = _self.objDestination.htmlOutputs[other.input].htmlElement;
            jpf.setStyleClass(input, "input" + type);
        }
    };

    this.deselectInputs = function(type) {
        if (_self.other.output && _self.objSource.htmlOutputs[_self.other.output]) {
            var output = _self.objSource.htmlOutputs[_self.other.output].htmlElement;
            jpf.setStyleClass(output, "", ["input" + type]);
        }
        if (_self.other.input && _self.objDestination.htmlOutputs[_self.other.input]) {
            var input = _self.objDestination.htmlOutputs[_self.other.input].htmlElement;
            jpf.setStyleClass(input, "", ["input" + type]);
        }
    };
};

jpf.flow.connectorsEnds = function(connector, place, type) {
    var conEnd = place == "start" ? connector.htmlStart : connector.htmlEnd;
    var segment = connector.htmlSegments[place == "start" ? 0 : 1];

    var l = parseInt(segment[0].style.left);
    var t = parseInt(segment[0].style.top);

    var htmlElement = conEnd ? conEnd : connector.htmlElement.appendChild(document.createElement("div"));

    t += segment[1] == "top" ? parseInt(segment[0].style.height) - 14 : 0;
    l += segment[1] == "left" ? parseInt(segment[0].style.width) - 11 : (segment[1] == "right" ? 3 : 0);

    htmlElement.style.left = l + "px";
    htmlElement.style.top = t + "px";
    htmlElement.className = "connector-end " + type + " or"+segment[1];

    return htmlElement;
}

jpf.flow.label = function(connector, number) {
    var number = number || Math.ceil(connector.htmlSegments.length/2);
    var segment = connector.htmlSegments[number];
    var l = parseInt(segment[0].style.left);
    var t = parseInt(segment[0].style.top);

    if (connector.htmlLabel) {
        var htmlElement = connector.htmlLabel;
    }
    else {
        var htmlElement = connector.htmlElement.appendChild(document.createElement("span"));
        jpf.setStyleClass(htmlElement, "label");
    }

    l += segment[1] == "top" || segment[1] == "bottom"
        ? segment[0].offsetWidth + 3
        : (segment[0].offsetWidth - htmlElement.offsetWidth) / 2;
    t += segment[1] == "top" || segment[1] == "bottom"
        ? (segment[0].offsetHeight - htmlElement.offsetHeight) / 2
        : segment[0].offsetHeight - 2;

    htmlElement.style.left = l + "px";
    htmlElement.style.top = t + "px";
    htmlElement.innerHTML = connector.other.label;

    return htmlElement;
}

/*
 * Utility functions
 */

/**
 * Looking for object representation of block element with given id.
 *
 * @param {String}   blockId   html representation of block element id
 * @return {Object}   object representation of block element
 */
jpf.flow.findBlock = function(blockId) {
    var c = jpf.flow.objCanvases;

    for (var id in c) {
        if (c[id].htmlBlocks[blockId]) {
            return c[id].htmlBlocks[blockId];
        }
    }
};

/**
 * Looking for object representation of block element with given HTMLElement.
 *
 * @param {HTMLElement}   htmlNode   html representation of block element
 * @return {Object}   object representation of block element
 */
jpf.flow.isBlock = function(htmlNode) {
    var c = jpf.flow.objCanvases;

    for (var id in c) {
        var block = c[id].htmlBlocks[htmlNode.getAttribute("id")];
        if (block) {
            return block;
        }
    }
};

/**
 * Looking for object representation of canvas element with given HTMLElement.
 *
 * @param {HTMLElement}   htmlNode   html representation of canvas element
 * @return {Object}   object representation of canvas element
 */
jpf.flow.isCanvas = function(htmlNode) {
    if (htmlNode) {
        return jpf.flow.objCanvases[htmlNode.id];
    }
};

/**
 * Looking for object representation of connector element with given object
 * representation of source and destination block element and with source and
 * destination input number.
 *
 * @param {Object}   objBlock    object representation of block element
 * @param {Number}   iNumber     block bnput number
 * @param {Object}   objBlock2   object representation of block element
 * @param {Number}   iNumber2    block input number
 *
 * @return {Object}   object representation of connector element and source description
 *     Properties:
 *     {Object}  connector   object representation of connector element
 *     {Boolean} source      infortmation about which block is a source block
 *         Possible values:
 *         true    when objBlock is a source block
 *         false   when objBlock isn't a source block
 */
jpf.flow.findConnector = function(objBlock, iNumber, objBlock2, iNumber2) {
    var c = jpf.flow.objCanvases;
    var connectors;

    for (var id in c) {
        connectors = c[id].htmlConnectors;
        for (var id2 in connectors) {
            if (connectors[id2]) {
                var cobjS = connectors[id2].objSource;
                var cobjD = connectors[id2].objDestination;
                var co = connectors[id2].other.output;
                var ci = connectors[id2].other.input;

                if (objBlock2 && iNumber2) {
                    if (cobjS.id == objBlock.id && co == iNumber
                        && cobjD.id == objBlock2.id && ci == iNumber2) {
                        return {connector : connectors[id2], source : true};
                    }
                    else if (cobjD.id == objBlock.id && ci == iNumber
                             && cobjS.id == objBlock2.id && co == iNumber2) {
                        return {connector : connectors[id2], source : false};
                    }
                }
                else {
                    if (cobjS == objBlock && co == iNumber) {
                        return {connector : connectors[id2], source : true};
                    }
                    else if (cobjD == objBlock && ci == iNumber) {
                        return {connector : connectors[id2], source : false};
                    }
                }
            }
        }
    }
};

/**
 * Looking for object representation of connector element with given HTMLElement.
 *
 * @param {HTMLElement}   htmlNode   html representation of connector element
 * @return {Object}   object representation of connector element
 */
jpf.flow.isConnector = function(htmlNode) {
    var c = jpf.flow.objCanvases;
    for (var id in c) {
        if (c[id].htmlConnectors[htmlNode.id])
            return c[id].htmlConnectors[htmlNode.id];
    }
};

/**
 * Creates object representation of canvas element
 *
 * @param {HTMLElement}   htmlNode   html representation of canvas element
 * @return {Object}    newCanvas     object representation of canvas element
 */
jpf.flow.getCanvas = function(htmlNode) {
    var newCanvas = jpf.flow.isCanvas(htmlNode);

    if (!newCanvas) {
        newCanvas = new jpf.flow.canvas(htmlNode);
        newCanvas.initCanvas();
    }
    return newCanvas;
};

/**
 * Removes html representation of canvas element with his all elements.
 *
 * @param {HTMLElement}   htmlNode   html representation of canvas element
 *
 */
jpf.flow.removeCanvas = function(htmlNode) {
    var canvas = jpf.flow.isCanvas(htmlNode);
    canvas.destroy();
};

/**
 * Creates object representation of block
 *
 * @param {HTMLElement}   htmlElement   html representation of block element
 * @param {Object}        objCanvas     object representation of Canvas element
 * @param {Object}        other         block properties
 *    Properties:
 *    {Boolean}   lock   prohibit block move. Default is false.
 *        Possible values:
 *        false   block element is unlocled
 *        true    block element is locked
 *    {Boolean}   flipv   whether to mirror the block over the vertical axis, background image is flipped automaticly. Default is false.
 *        Possible values:
 *        true    block element is flipped
 *        false   block element is not flipped
 *    {Boolean}   fliph   whether to mirror the block over the horizontal axis, background image is flipped automaticly. Default is false.
 *        Possible values:
 *        true    block element is flipped
 *        false   block element is not flipped
 *    {Number}    rotation   the rotation in degrees clockwise, background image is rotated automaticly, Default is 0.
 *        Possible values:
 *        0     0   degrees rotation
 *        90    90  degrees rotation
 *        180   180 degrees rotation
 *        270   270 degrees rotation
 *    {Object}   inputList   Block's inputs list, block could haven't any inputs
 *        Properties:
 *        {Number}  x          position in pixels relative to Block's horizontal dimension
 *        {Number}  y          position in pixels relative to Block's vertical dimension
 *        {String}  position   edge where input is placed
 *            Possible values:
 *            top      input is placed on top edge of block
 *            right    input is placed on right edge of block
 *            bottom   input is placed on bottom edge of block
 *            left     input is placed on left edge of block
 *    {String}       type         name of block with special abilities, which could set in template file
 *    {String}       picture      Path to image file.
 *    {Number}       dwidth       the minimal horizontal size of Block element
 *    {Number}       dheight      the minimal vertical size of Block element
 *    {Boolean}      scalex       Allows only horizontal resizing
 *    {Boolean}      scaley       Allows only vertical resizing
 *    {Boolean}      scaleratio   Vertical or horiznotal resizing only is not allowed. It's possible to resizing in two dimensions plane at the same time.
 *    {XMLElement}   xmlNode      xml representation of block from model
 *    {String}       caption      description placed under block element
 * @return {Object}   object representation of block element
 */
jpf.flow.addBlock = function(htmlElement, objCanvas, other) {
    if (!jpf.flow.isBlock(htmlElement)) {
        if (!htmlElement.getAttribute("id")) {
            jpf.setUniqueHtmlId(htmlElement);
        }
        var newBlock = new jpf.flow.block(htmlElement, objCanvas, other);
        newBlock.initBlock();
        return newBlock;
    }
};

/**
 * Removes html representation of block element with his all connections elements.
 *
 * @param {HTMLElement}   htmlElement   html representation of block element
 *
 */
jpf.flow.removeBlock = function(htmlElement) {
    var block = jpf.flow.isBlock(htmlElement);
    block.destroy();
};

/**
 * Creates html representation of connector element between two blocks
 *
 * @param {Object}   c   object representation of canvas element
 * @param {Object}   s   object representation of source block element
 * @param {Object}   d   object representation of destination block element
 * @param {Object}   o   connector properties
 *     Properties:
 *     {Number}     output    source block input number
 *     {Number}     input     destination block input number
 *     {XMLElement} xmlNode   xml representation of connection element
 */
jpf.flow.addConnector = function(c, s, d, o) {
    var htmlElement = c.htmlElement.appendChild(document.createElement("div"));
    this.newConnector = new jpf.flow.connector(htmlElement, c, s, d, o);
    this.newConnector.initConnector();
};

/**
 * Removes html representation of connector element from canvas.
 *
 * @param {HTMLElement}   htmlElement   html representation of connector element
 */
jpf.flow.removeConnector = function(htmlElement) {
    var connector = jpf.flow.isConnector(htmlElement);
    if (connector) {
        connector.destroy();
    }
    delete connector;
};
//#endif
