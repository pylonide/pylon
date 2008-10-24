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
 * This abstraction is using for creating block elements which can be move by
 * mouse or keyboard, rotate with 90 degrees step, flip horizontal and vertical
 * and resize on the fly using mouse. Each block could have inputs defined in
 * template file. Inputs allows creating stiff connections between block
 * elements. If block haven't inputs, connection is created in most optimal way.
 * 
 * @event onmousedown   Fires when mouse button is pressed on document body
 * @event onmousemove   Fires when mouse cursor is moving over document body
 * @event onmouseup     Fires when mouse button is hold off over the document body
 * 
 * @attribute {Boolean} isdraged             When block is moving this attribute is set to true. It gives information to other methods what happends with block element.
 *     Possible values:
 *     true   block moves
 *     false  block don't move
 * @attribute {Object}  objCanvases          storage workareas objects, it allows to easy access to them if need be
 * @attribute {Object}  cachedInputs         storage unused inputs
 * @attribute {Object}  usedInputs           storage used inputs
 * @attribute {Object}  connectionsTemp      when work mode is set to "connection-add", it keeps informations about block and his input from which connection will be created to other block
 * @attribute {Object}  inputManager         the input manage object, it's called from other methods which needs to show or hide block inputs
 * @attribute {Object}  connectionsManager   create connection when connectionsTemp variable is set
 * @attribute {Number}  sSize                define connection line width
 * @attrubite {Number}  fsSize               define size of first and last connection segment
 * 
 * @default_private
 * 
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       1.0
 * @namespace jpf
 */

jpf.flow = {
    isdraged           : false,
    objCanvases        : {},

    cachedInputs       : [], /* cached Block inputs */
    usedInputs         : [], /* used Block inputs */

    connectionsTemp    : null,

    inputManager       : null,
    connectionsManager : null,

    sSize  : 1,
    fsSize : 10,

    init : function() {
        jpf.flow.inputsManager      = new jpf.flow.inputsManager;
        jpf.flow.connectionsManager = new jpf.flow.connectionsManager;

        document.onmousedown = function(e) {
            e = (e || event);

            /* Looking for Block element */
            var target = jpf.isGecko ? e.target : e.srcElement;

            if (target.tagName == 'HTML')
                return;
            while (target != document.body && !jpf.flow.findBlock(target.id)) {
                target = jpf.isGecko ? target.parentNode : target.parentElement;
            }
            /* Looking for Block element - End*/

            var objBlock = jpf.flow.isBlock(target);

            if (!objBlock)
                return;
            if (!objBlock.draggable)
                return;

            var sx = e.clientX, sy = e.clientY,
                dx, dy,
                l = parseInt(target.style.left), t = parseInt(target.style.top),
                hideSquares = true, obm = jpf.flow.onbeforemove;

            if (e.preventDefault) {
                e.preventDefault();
            }
            //e.returnValue = false;

            document.onmousemove = function(e) {
                e = (e || event);

                dx = e.clientX - sx;
                dy = e.clientY - sy;

                target.style.left = (l + dx) + "px";
                target.style.top  = (t + dy) + "px";
                objBlock.onMove();

                if (obm && hideSquares && (dx || dy) !== 0 ) {
                    jpf.flow.onbeforemove();
                    jpf.flow.inputsManager.hideInputs();

                    hideSquares = false;
                    jpf.flow.isdraged = true;
                }
                return false;
            }

            document.onmouseup = function(e) {
                document.onmousemove = null;
                if (!hideSquares) {
                    if(jpf.flow.onaftermove) {
                        jpf.flow.onaftermove(t + dy, l + dx);
                    }
                    jpf.flow.inputsManager.showInputs(objBlock);
                    hideSquares = true;
                    jpf.flow.isdraged = false;
                }
            }
        };
    }
};

/**
 * This class creates workarea on which possible is work with blocks and 
 * connections.
 * 
 * @param {HTMLElement}   htmlElement    the html representation of a workarea
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

    this.setMode = function(mode) {
        this.mode = mode;
    }
};

/**
 * Creates new block object which can be move by mouse or keyboard, rotate
 * with 90 degrees step, flip horizontal and vertical and resize on the fly
 * using mouse. Each block could have inputs, background picture and minimal
 * dimension defined in template file. It's possible to create connections
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
 *    {Boolean}   flipv   wether to mirror the block over the vertical axis, background image is fliped automaticly, default is false
 *        Possible values:
 *        true    block element is fliped
 *        false   block element is not fliped
 *    {Boolean}   fliph   wether to mirror the block over the horizontal axis, background image is fliped automaticly. default is false
 *        Possible values:
 *        true    block element is fliped
 *        false   block element is not fliped
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
 */
jpf.flow.block = function(htmlElement, objCanvas, other) {

    if (!htmlElement.getAttribute("id")) {
        jpf.setUniqueHtmlId(htmlElement);
    }

    this.canvas        = objCanvas;
    this.htmlElement   = htmlElement;
    this.id            = htmlElement.getAttribute("id");
    this.moveListeners = new Array();
    this.draggable     = true;

    this.inputs        = [];
    this.image         = null;
    this.other         = other;

    var _self = this;

    this.initBlock = function() {
        this.canvas.htmlBlocks[this.htmlElement.getAttribute("id")] = this;

        var bChilds = this.htmlElement.childNodes;
        for (var i = 0, l = bChilds.length; i < l; i++) {
            var tag = bChilds[i].tagName;
            if (tag) {
                if (tag.toLowerCase() == "img") {
                   this.image = bChilds[i];
                }
            }
        }
        if (this.other.picture == null) {
            jpf.setStyleClass(this.htmlElement, "empty");
        }
        else {
            this.image.src = this.other.picture;

            this.image.onload = function() {
                _self.changeRotation(_self.other.rotation, _self.other.fliph,
                                     _self.other.flipv);
            }
        }

        this.lock(this.other.lock)
    };
    
    /**
     * Immobilise block element on workarea
     * 
     * @param {Number}   lock   prohibit block move, default is false
     *     Possible values:
     *     true    block is locked
     *     false   block is unlocked
     */
    this.lock = function(lock) {
        this.draggable = !lock;
        this.other.lock = lock;
            jpf.flow.inputsManager.hideInputs();
    };

    /**
     * Set rotation and flip and call to redraw image function.
     *
     * @param {Number}   rotation   the rotation in degrees clockwise, background image is rotated automaticly, Default is 0.
     *     Possible values:
     *     0     0   degrees rotation
     *     90    90  degrees rotation
     *     180   180 degrees rotation
     *     270   270 degrees rotation
     * @param {Boolean}   fliph      wether to mirror the block over the vertical axis, background image is fliped automaticly. Default is false.
     *     Possible values:
     *     true    block element is fliped
     *     false   block element is not fliped
     * @param {Boolean}   flipv      wether to mirror the block over the horizontal axis, background image is fliped automaticly. Default is false.
     *    Possible values:
     *    true    block element is fliped
     *    false   block element is not fliped
     */
    this.changeRotation = function(rotation, fliph, flipv) {
        var o = this.other, prev = [o.rotation, o.fliph, o.flipv];
        if (!o.type)
            return;

        o.rotation = parseInt(rotation) % 360 || 0;
        o.fliph    = fliph == "true" ? true : false;
        o.flipv    = flipv == "true" ? true : false;

        var flip = (o.fliph && !o.flipv
            ? "horizontal" 
            : (!o.fliph && o.flipv
                ? "vertical"
                : "none"));

        if (prev[0] != o.rotation || prev[1] != o.fliph || prev[2] != o.flipv) {
            this.repaintImage(flip, o.rotation, 'rel');
            this.onMove();
        }
    };

    /**
     * Function repaint default block's image with new rotation and flip.
     * 
     * @param {String}   flip    wether to mirror the image over the vertical or horizontal axis
     *     Possible values:
     *     none         image is not fliped
     *     horizontal   image is fliped horizontal
     *     vertical     image is fliped vertical
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
        this.htmlElement.replaceChild(canvas, p);
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
     * Calculate new input position if block is resized, fliped or rotated.
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
            w = parseInt(b.offsetWidth), h = parseInt(b.offsetHeight),
            ior = input ? input.position : "auto",
            x = input ? input.x : w / 2, y = input ? input.y : h / 2,
            dw = o.dwidth, dh = o.dheight,
            fv = o.flipv, fh = o.fliph, r = o.rotation;
        var positions = {0 : "top", 1 : "right", 2 : "bottom", 3 : "left",
                         "top" : 0, "right" : 1, "bottom" : 2, "left" : 3};
        var sSize = jpf.flow.sSize;

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
                ? w - (y + sSize)
                : (r == 180
                    ? w - (x + sSize)
                    : (r == 270
                        ? y
                        : x));
            _y = r == 90
                ? x
                : (r == 180
                    ? h - (y + sSize)
                    : (r == 270
                        ? w - (x + sSize)
                        : y));

            /* Flip Vertical and Horizontal */
            _x = fh ? w - (_x + sSize) : _x;
            _y = fv ? h - (_y + sSize) : _y;
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

            _x = ior == "top" || ior == "bottom" ? w/2 : ior == "right" ? w : 0;
            _y = ior == "left" || ior == "right" ? h/2 : ior == "bottom" ? h : 0;
        }

        return [_x, _y, ior];
    };

    /* ********************************
     * Events 
     **********************************/

    this.htmlElement.onmouseover = function(e) {
        if (jpf.flow.isdraged || _self.other.lock == 1) {
            return;
        }
        jpf.flow.inputsManager.showInputs(_self);
    }

    this.htmlElement.onmouseout = function(e) {
        if (jpf.flow.isdraged || _self.other.lock == 1) {
            return;
        }

        e = e || event;
        var t = e.relatedTarget || e.toElement;
        if (jpf.flow.isCanvas(t)) {
            jpf.flow.inputsManager.hideInputs();
        }
    }
    this.htmlElement.onclick = function(e) {
        if (_self.canvas.mode == "connection-add" && !_self.other.type) {
            jpf.flow.connectionsManager.addBlock(_self, 0);
        }
    }
};

/**
 * Creates object representation of input element. Each block could have no
 * limited number of inputs.
 * 
 * @param {Object}   objBlock   object representation of block element
 */

jpf.flow.input = function(objBlock) {
    this.objBlock = objBlock;
    this.htmlElement = objBlock.canvas.htmlElement.appendChild(document.createElement("div"));
    this.number = null;

    var _self = this;

    jpf.setStyleClass(this.htmlElement, "input");

    this.hide = function() {
        this.htmlElement.style.display = "none";
    };

    this.show = function() {
        this.htmlElement.style.display = "block";
    };

    this.moveTo = function(x, y) {
        this.htmlElement.style.left = (x - jpf.flow.sSize) + "px";
        this.htmlElement.style.top  = (y - jpf.flow.sSize) + "px";
    };

    this.htmlElement.onmouseout = function(e) {
        if(jpf.flow.isdraged) 
            return;
        jpf.flow.inputsManager.hideInputs();
    };

    var connection;
    this.htmlElement.onmousedown = function(e) {
        e              = (e || event);
        e.cancelBubble = true;

        var pn         = _self.htmlElement.parentNode,
            canvas     = _self.objBlock.canvas,
            mode       = canvas.mode;

        if (e.preventDefault) {
            e.preventDefault();
        }

        var vMB = new jpf.flow.virtualMouseBlock(canvas, e);

        switch(mode) {
            case "normal":
                break;
            case "connection-change":
                var con = jpf.flow.findConnector(_self.objBlock, _self.number);
                if (con) {
                    var source = con.source
                        ? con.connector.objDestination
                        : con.connector.objSource;
                    var sourceInput = con.source
                        ? con.connector.other.input
                        : con.connector.other.output;

                    _self.objBlock.onremoveconnection([con.connector.other.xmlNode]);
                    jpf.flow.removeConnector(con.connector.htmlElement);
    
                    connection = new jpf.flow.addConnector(canvas , source, vMB, {
                        output : sourceInput
                    });
                    jpf.flow.connectionsManager.addBlock(source, sourceInput);
                }
                break;
            case "connection-add":
                connection = new jpf.flow.addConnector(canvas , _self.objBlock,
                                                       vMB, {
                    output : _self.number
                });
                jpf.flow.connectionsManager.addBlock(_self.objBlock,
                                                     _self.number);
                break;
        };

        document.onmousemove = function(e) {
            e = (e || event);

            switch(mode) {
                case "normal":
                    break;
                case "connection-change":
                case "connection-add":
                    if(vMB)
                        vMB.onMove(e);
                    break;
            }
        };

        document.onmouseup = function(e) {
            document.onmousemove = null;

            switch(mode) {
                case "normal":
                    break;
                case "connection-change":
                case "connection-add":
                    if (connection) {
                        jpf.flow.removeConnector(connection.newConnector.htmlElement);
                    }
                    if (vMB) {
                        vMB.destroy();
                        vMB = null;
                    }
                    _self.objBlock.canvas.setMode("normal");
                    jpf.flow.connectionsManager.clear();
                    break;
            }
        };
    };

    this.htmlElement.onmouseup = function(e) {
        var mode = _self.objBlock.canvas.mode;

        switch (mode) {
            case "normal":
                break;
            case "connection-change":
            case "connection-add":
                if (connection) {
                    jpf.flow.removeConnector(connection.newConnector.htmlElement);
                }
                jpf.flow.connectionsManager.addBlock(_self.objBlock, _self.number);
                break;
        }
    };
};

/**
 * Manage informations about clicked blocks and/or inputs. If mode
 * connection-add is active and if two blocks or inputs has clicked, new
 * connection will be created.
 */
jpf.flow.connectionsManager = function() {
    this.addBlock = function(objBlock, inputNumber) {
        var s = jpf.flow.connectionsTemp;

        if (!s) {
            jpf.flow.connectionsTemp = {
                objBlock    : objBlock,
                inputNumber : inputNumber
            };
        }
        else {
            objBlock.oncreateconnection(s.objBlock.other.xmlNode, s.inputNumber,
                objBlock.other.xmlNode, inputNumber);
            objBlock.canvas.setMode("normal");
            this.clear();
        }
    };

    this.clear = function() {
        jpf.flow.connectionsTemp = null;
    };
};

/**
 * Manage elements inputs. When mouse is over block element, his inputs
 * will be displayed. All inputs are created only one time and redrawed for 
 * other block elements.
 */
jpf.flow.inputsManager = function() {
    this.showInputs = function(objBlock) {
        var inp = objBlock.other.inputList;

        for (var i = 0, l = jpf.flow.usedInputs.length; i < l; i++) {
            jpf.flow.cachedInputs.push(jpf.flow.usedInputs[i]);
        }
        jpf.flow.usedInputs = [];

        var l = parseInt(objBlock.htmlElement.style.left);
        var t = parseInt(objBlock.htmlElement.style.top);

        for (var id in inp) {
            var input = jpf.flow.cachedInputs.length
                ? jpf.flow.cachedInputs.pop()
                : new jpf.flow.input(objBlock);
            input.number = id;
            input.objBlock = objBlock;
            jpf.flow.usedInputs.push(input);
            var pos = objBlock.updateInputPos(inp[id]);

            input.moveTo(l + pos[0], t + pos[1]);
            input.show();
        }
    };

    this.hideInputs = function() {
       var ui = jpf.flow.usedInputs;
       var ci = jpf.flow.cachedInputs;

       for (var i = 0, l = ui.length; i < l; i++) {
           ui[i].hide();
       }

       for (var i = 0, l = ci.length; i < l; i++) {
           ci[i].hide();
       }
    };
};

/**
 * Simulate block element. Temporary connection is created between source
 * block and mouse cursor, until destination block is not clicked.
 * 
 * @param {Object}   canvas   object representation of canvas element
 */
jpf.flow.virtualMouseBlock = function(canvas) {
    this.canvas = canvas;
    this.htmlElement = document.createElement('div');

    this.canvas.htmlElement.appendChild(this.htmlElement);

    this.htmlElement.style.display = "block";
    this.moveListeners             = new Array();
    this.draggable                 = 0;

    var pn = this.htmlElement.parentNode;
    jpf.setStyleClass(this.htmlElement, "vMB");

    var sX = this.htmlElement.offsetLeft;
    var sY = this.htmlElement.offsetTop;

    var _self = this;

    this.onMove = function(e) {
        e = (e || event);
        var cx = e.clientX;
        var cy = e.clientY;

        var pos = [(parseInt(pn.style.left) || pn.offsetLeft || 0),
                   (parseInt(pn.style.top) || pn.offsetTop || 0)];

        this.htmlElement.style.left = (cx + sX - pos[0]) + "px";
        this.htmlElement.style.top = (cy + sY - pos[1])+ "px";

        for (var i = 0, l = this.moveListeners.length; i < l; i++) {
            this.moveListeners[i].onMove();
        }
    };

    this.destroy = function() {
        this.htmlElement.parentNode.removeChild(this.htmlElement);
    };

    this.updateInputPos = function(input) {
        return [0, 0, "virtual"];
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
 */
jpf.flow.connector = function(htmlElement, objCanvas, objSource,
                              objDestination, other) {
    var htmlSegments     = [];
    var htmlSegmentsTemp = [];

    this.objSource       = objSource;
    this.objDestination  = objDestination;
    this.other           = other;

    this.selected        = false;

    this.htmlElement     = htmlElement;

    var sSize            = jpf.flow.sSize; //Segment size
    var fsSize           = jpf.flow.fsSize; //First segment size

    this.i1 = other.output && this.objSource.other.inputList[other.output]
        ? this.objSource.other.inputList[other.output]
        : {x : 0, y : 0, position : "auto", last : "auto"};
    this.i2 = other.input && this.objDestination.other.inputList[other.input]
        ? this.objDestination.other.inputList[other.input]
        : {x : 0, y : 0, position : "auto", last : "auto"};

    var _self = this;

    this.initConnector = function() {
        if (!htmlElement.getAttribute("id")) {
            jpf.setUniqueHtmlId(htmlElement);
        }
        objCanvas.htmlConnectors[htmlElement.getAttribute("id")] = this;

        this.objSource.moveListeners.push(this);
        this.objDestination.moveListeners.push(this);
        this.draw();
    };

    this.destroy = function() {
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
    };

    this.draw = function() {
        var l = [], s = [], d = [];
        var sourceHtml = this.objSource.htmlElement;
        var destinationHtml = this.objDestination.htmlElement;

        s = [parseInt(sourceHtml.style.left),
             parseInt(sourceHtml.style.top),
             sourceHtml.offsetWidth,
             sourceHtml.offsetHeight];
        d = [parseInt(destinationHtml.style.left),
             parseInt(destinationHtml.style.top), 
             destinationHtml.offsetWidth,
             destinationHtml.offsetHeight];

        /* Moving old segments to temporary table */
        for (var i = 0, l = htmlSegments.length; i < l; i++) {
            htmlSegmentsTemp.push(htmlSegments[i]);
        }
        htmlSegments = [];

        var sIPos = this.objSource.updateInputPos(this.i1, d);
        var dIPos = this.objDestination.updateInputPos(this.i2, s);
        var sO = this.i1.last = sIPos[2];
        var dO = this.i2.last = dIPos[2];

        s[0] += sIPos[0];
        s[1] += sIPos[1];
        
        d[0] += dIPos[0];
        d[1] += dIPos[1];

        /* Source first line */
        if (sO !== "virtual") {
            s = this.createSegment(s, [fsSize, sO]);
        }

        /* Destination first line */
        if (dO !== "virtual") {
            d = this.createSegment(d, [fsSize, dO]);
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

        switch (condition) {
            case "TR41":
            case "TR44":
            case "TR14":
            case "TR11":
                l = this.createSegment(l, [s[1] - d[1], "top"]);
                l = this.createSegment(l, [d[0] - s[0], "right"]);
                break;
            case "BR22":
            case "BR24":
            case "BR42":
            case "BR44":
                l = this.createSegment(l, [d[0] - s[0], "right"]);
                l = this.createSegment(l, [Math.abs(d[1] - s[1]), "bottom"]);
                break;
            case "BR48":
            case "BR41":
            case "BR28":
            case "BR21":
                l = this.createSegment(l, [(d[0] - s[0]) / 2, "right"]);
                l = this.createSegment(l, [d[1] - s[1], "bottom"]);
                l = this.createSegment(l, [(d[0] - s[0]) / 2, "right"]);
                break;
            case "TL44":
            case "TL42":
            case "TL24":
            case "TL22":
                l = this.createSegment(l, [s[1] - d[1], "top"]);
                l = this.createSegment(l, [s[0] - d[0], "left"]);
                break;
            case "TR21":
            case "TR24":
            case "TR81":
            case "TR84":
            case "TR21":
            case "TR24":
            case "TR81":
            case "TR84":
                l = this.createSegment(l, [(d[0] - s[0]) / 2, "right"]);
                l = this.createSegment(l, [s[1] - d[1], "top"]);
                l = this.createSegment(l, [(d[0] - s[0]) / 2, "right"]);
                break;
            case "BR18":
            case "BR88":
            case "BR81":
            case "BR11":
                l = this.createSegment(l, [d[1] - s[1], "bottom"]);
                l = this.createSegment(l, [d[0] - s[0], "right"]);
                break;
            case "BR84":
            case "BR82":
            case "BR14":
            case "BR12":
                l = this.createSegment(l, [(d[1] - s[1]) / 2 , "bottom"]);
                l = this.createSegment(l, [d[0] - s[0], "right"]);
                l = this.createSegment(l, [(d[1] - s[1]) / 2, "bottom"]);
                break;
            case "BL84":
            case "BL24":
            case "BL21":
                l = this.createSegment(l, [(d[1] - s[1]) / 2, "bottom"]);
                l = this.createSegment(l, [s[0] - d[0], "left"]);
                l = this.createSegment(l, [(d[1] - s[1]) / 2, "bottom"]);
                break;
            case "BL11":
            case "BL14":
            case "BL41":
            case "BL44":
            case "BL81":
                l = this.createSegment(l, [s[0] - d[0], "left"]);
                l = this.createSegment(l, [d[1] - s[1], "bottom"]);
                break;
            case "BL12":
            case "BL18":
            case "BL42":
            case "BL48":
                l = this.createSegment(l, [(s[0] - d[0]) / 2, "left"]);
                l = this.createSegment(l, [d[1] - s[1], "bottom"]);
                l = this.createSegment(l, [(s[0] - d[0]) / 2, "left"]);
                break;
            case "BL88":
            case "BL82":
            case "BL28":
            case "BL22":
                l = this.createSegment(l, [d[1] - s[1], "bottom"]);
                l = this.createSegment(l, [s[0] - d[0], "left"]);
                break;
            case "TL88":
            case "TL81":
            case "TL18":
            case "TL11":
                l = this.createSegment(l, [s[0] - d[0], "left"]);
                l = this.createSegment(l, [s[1] - d[1], "top"]);
                break;
            case "TL41":
            case "TL48":
            case "TL28":
            case "TL21":
                l = this.createSegment(l, [(s[1] - d[1]) / 2, "top"]);
                l = this.createSegment(l, [s[0] - d[0], "left"]);
                l = this.createSegment(l, [(s[1] - d[1]) / 2, "top"]);
                break;
            case "TL12":
            case "TL14":
            case "TL82":
            case "TL84":
                l = this.createSegment(l, [(s[0] - d[0]) / 2, "left"]);
                l = this.createSegment(l, [s[1] - d[1], "top"]);
                l = this.createSegment(l, [(s[0] - d[0]) / 2, "left"]);
                break;
            case "TR12":
            case "TR18":
            case "TR42":
            case "TR48":
                l = this.createSegment(l, [(s[1] - d[1]) / 2, "top"]);
                l = this.createSegment(l, [d[0] - s[0], "right"]);
                l = this.createSegment(l, [(s[1] - d[1]) / 2, "top"]);
                break;
            case "TR22":
            case "TR28":
            case "TR82":
            case "TR88":
                l = this.createSegment(l, [d[0] - s[0], "right"]);
                l = this.createSegment(l, [s[1] - d[1], "top"]);
                break;
            default:
                switch (position) {
                    case "ML":
                        l = this.createSegment(l, [s[0] - d[0], "left"]);
                        break;
                    case "MM":
                        l = this.createSegment(l, [s[0] - d[0], "left"]);
                        l = this.createSegment(l, [d[1] - s[1], "bottom"]);
                        break;
                    case "TM":
                        l = this.createSegment(l, [s[1] - d[1], "top"]);
                        l = this.createSegment(l, [s[0] - d[0], "left"]);
                        break;
                    case "MR":
                        /* This part is not checked, only MR41 needs line with "right", 
                         * else need them both */
                        l = this.createSegment(l, [d[0] - s[0], "right"]);
                        if (condition.substring(2,4) == "41")
                            break;
                        l = this.createSegment(l, [Math.abs(d[1] - s[1]),
                                               "bottom"]);
                        break;
                }
                break;
        }

        for (var i = 0, l = htmlSegmentsTemp.length; i < l; i++) {
            htmlSegmentsTemp[i].style.display = "none";
        }
    };

    this.createSegment = function(coor, lines) {
        var or = lines[1], l = lines[0];
        var sX = coor[0], sY = coor[1];
        var segment = htmlSegmentsTemp.shift();

        if (!segment) {
            var segment = htmlElement.appendChild(document.createElement("div"));
            jpf.setUniqueHtmlId(segment);
            jpf.setStyleClass(segment, "segment");
            if (_self.selected)
                _self.select("Selected");
        }
        

        var w = or == "top" || or == "bottom" ? sSize : l;
        var h = or == "top" || or == "bottom" ? l : sSize;

        if (or == "top")
            sY -= l;
        if (or == "left")
            sX -=l;

        segment.style.display = "block";
        segment.style.left    = sX + "px";
        segment.style.top     = sY + "px";
        segment.style.width   = w + "px";
        segment.style.height  = h + "px";

        segment.onmouseover = function(e) {
            _self.select("Hover");
        }

        segment.onmouseout = function(e) {
            _self.deselect("Hover");
        }

        segment.onclick = function(e) {
            _self.selected = _self.selected ? false : true;
            if (_self.selected)
                _self.select("Selected");
            else
                _self.deselect("Selected");
        }

        if (or == "bottom")
            sY += h;
        if (or == "right")
            sX += w;

        htmlSegments.push(segment);

        return [sX, sY];
    };

    this.deselect = function(type) {
        var segments = _self.htmlElement.childNodes;

        for (var i = 0, l = segments.length; i < l; i++) {
            if ((segments[i].className || "").indexOf("segment") != -1) {
                jpf.setStyleClass(segments[i], "", ["segment" + type]);
            }
        }
    };

    this.select = function(type) {
        var segments = this.htmlElement.childNodes;

        for (var i = 0, l = segments.length; i < l; i++) {
            if ((segments[i].className || "").indexOf("segment") != -1) {
                jpf.setStyleClass(segments[i], "segment" + type);
            }
        }
    };
};

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
        if (c[id].htmlBlocks[htmlNode.id]) {
            return c[id].htmlBlocks[htmlNode.id];
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
 * @return {Object}   object representation of connector element and source discription
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
 *    {Boolean}   flipv   wether to mirror the block over the vertical axis, background image is fliped automaticly. Default is false.
 *        Possible values:
 *        true    block element is fliped
 *        false   block element is not fliped
 *    {Boolean}   fliph   wether to mirror the block over the horizontal axis, background image is fliped automaticly. Default is false.
 *        Possible values:
 *        true    block element is fliped
 *        false   block element is not fliped
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
 * @return {Object}   object representation of block element
 */
jpf.flow.addBlock = function(htmlElement, objCanvas, other) {
    if (!jpf.flow.isBlock(htmlElement)) {
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