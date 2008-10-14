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
 * Component implementing adding and removing new elements and connections 
 * on workflow component. 
 * 
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       1.0
 * @namespace jpf
 */

jpf.flow = {
    /*****************
     * drag and drop *
     *****************/
    isdrag        : false, /* this flag indicates that the mouse movement is actually a drag. */
    mouseStartX   : null, /* mouse position when drag starts */
    mouseStartY   : null,
    elementStartX : null, /* element position when drag starts */
    elementStartY : null,

    /**
     * the html element being dragged.
     */
    elementToMove : null,

    /**
     * an array containing the blocks being dragged. This is used to notify them of move.
     */
    blocksToMove : null,

    /**
     * an array containing bounds to be respected while dragging elements,
     * these bounds are left, top, left + width, top + height of the parent element.
     */
    bounds : new Array(4),

    /** 
     * an associate tables with block, connector and label objects
     *
     */
    htmlCanvases : {},

    cachedInputs       : [], /* cached Block inputs */
    usedInputs         : [], /* used Block inputs */
    
    inputManager : null,
    sSize : 1,
    fsSize : 10,

    init : function() {
        document.onmousedown = this.startDrag;
        document.onmouseup   = this.stopDrag;
        jpf.flow.inputManager = new jpf.flow.inputsManager;
    }
};

jpf.flow.mouseup = function(htmlBlock) {
    var c = jpf.flow.isBlock(htmlBlock).canvas;
    
    if (c.onblockmove)
        c.onblockmove(jpf.flow.elementToMove.htmlElement);
};

jpf.flow.movemouse = function(e) {
    e = (e || event);

    if (jpf.flow.isdrag) {
        var nX = jpf.flow.elementStartX + e.clientX - jpf.flow.mouseStartX;
        var nY = jpf.flow.elementStartY + e.clientY - jpf.flow.mouseStartY;

        // check bounds
        // note: the "-1" and "+1" is to avoid borders overlap
        var   b = jpf.flow.bounds;
        var etm = jpf.flow.elementToMove.htmlElement;

        etm.style.left = nX < b[0] ? b[0] + 1 : (nX + etm.offsetWidth > b[2] ? b[2] - etm.offsetWidth - 1 : nX) + "px";
        etm.style.top = nY < b[1] ? b[1] + 1 : (nY + etm.offsetHeight > b[3] ? b[3] - etm.offsetHeight - 1 : nY) + "px";

        etm.style.right  = null;
        etm.style.bottom = null;

        if (jpf.flow.onbeforemove) {
            jpf.flow.onbeforemove();
        }

        for (var i = 0, l = jpf.flow.blocksToMove.length; i < l; i++) {
            jpf.flow.blocksToMove[i].onMove();
        }
        
        jpf.flow.inputManager.hideInputs();
        
        return false;
    }
};

/**
 * finds the innermost draggable element starting from the one that generated the event "e"
 * (i.e.: the html element under mouse pointer), then setup the document's onmousemove function to
 * move the element around.
 */
jpf.flow.startDrag = function(e) {
    e = (e || event);
    var eS = jpf.isGecko ? e.target : e.srcElement;

    if (eS.tagName == 'HTML')
        return;
    while (eS != document.body && !jpf.flow.findBlock(eS.id)) {
        eS = jpf.isGecko ? eS.parentNode : eS.parentElement;
    }

    var block = jpf.flow.findBlock(eS.id);

    //if block is not in canvas.htmlBlocks
    if (!block) {
        return false;
    }

    // if a draggable element was found, calculate its actual position
    if (block.draggable) {
        jpf.flow.isdrag = true;
        jpf.flow.elementToMove = block;
        var etm = block.htmlElement;
        var b = jpf.flow.bounds;

        // calculate start point
        jpf.flow.elementStartX = etm.offsetLeft + jpf.flow.getXBorder(etm.parentNode, "left");
        jpf.flow.elementStartY = etm.offsetTop + jpf.flow.getXBorder(etm.parentNode, "top");

        jpf.flow.mouseStartX = e.clientX;
        jpf.flow.mouseStartY = e.clientY;

        b[0] = 0;
        b[1] = 0;

        b[2] = etm.parentNode.offsetWidth;
        b[3] = etm.parentNode.offsetHeight;

        jpf.flow.blocksToMove = new Array();
        jpf.flow.blocksToMove.push(block);

        document.onmousemove = jpf.flow.movemouse;

        return false;
    }
};

jpf.flow.stopDrag = function(e) {
    if(jpf.flow.isdrag)
        jpf.flow.inputManager.showInputs(jpf.flow.elementToMove);
    jpf.flow.isdrag = false;
    if(!jpf.flow.elementToMove)
        return;
        
    var etm = jpf.flow.elementToMove.htmlElement;
    if (etm) {
        jpf.flow.mouseup(etm);
    }
    etm = document.onmousemove = null;
};

/** Function returns border size of htmlElement depending on if browser needs him to calculations a new position.  
 *
 * @param {htmlElement} htmlElement
 * @param {String} Border: {left, top, right, bottom}
 */
jpf.flow.getXBorder = function(htmlElement, border) {
    //else is for Gecko and Opera
    return jpf.isIE ? 0 : parseInt(jpf.getStyle(htmlElement, "border-" + border + "-width"));
};

/**
 * Creates canvas.
 * 
 * @param {htmlElement} htmlElement
 */
jpf.flow.canvas = function(htmlElement){
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
        jpf.flow.htmlCanvases[this.htmlElement.getAttribute("id")] = this;
    };
};

/**
 * This class creates new Block object
 * 
 * @param {htmlElement} htmlElement
 * @param {Object}      canvas       Canvas object
 * @param {hash Array}  other        Hash Array with block properties:
 *                                   lock - element is lock or unlock
 *                                   flipv - vertical flipping of element
 *                                   fliph - horizontal flipping of element
 *                                   rotation - rotation of element
 *                                   inputList - list of inputs, block could haven't any inputs
 *                                   type - type of element, could be created in template file
 *                                   picture - element background picture
 *                                   dwidth - element default width
 *                                   dheight - element default height
 *                                   scalex - element could be resized in Y axis
 *                                   scaley - element could be resized in X axis
 *                                   scaleratio - element could be resized in XY axes
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
                _self.changeRotation(_self.other.rotation, _self.other.fliph, _self.other.flipv);
            }
        }
    };

    

    /**
     * Function change rotation, vertical and horzontal flipping
     * of block element and paint new image
     *
     * @param {String} rotation block rotation
     * @param {Number} fliph    block horizontal flip
     * @param {Number} flipv    block vertical flip
     */
    this.changeRotation = function(rotation, fliph, flipv) {
        var o = this.other, prev = [o.rotation, o.fliph, o.flipv];
        if (!o.type)
            return;

        o.rotation = parseInt(rotation) % 360 || 0;
        o.fliph    = parseInt(fliph) || 0;
        o.flipv    = parseInt(flipv) || 0;

        var flip = (o.fliph == 1 && o.flipv == 0
            ? "horizontal" 
            : (o.fliph == 0 && o.flipv == 1
                ? "vertical"
                : "none"));
                
        if (prev[0] != o.rotation || prev[1] != o.fliph || prev[2] != o.flipv) {
            this.repaintImage(flip, o.rotation, 'rel');
            this.onMove();
        }

    };

    /**
     * Function paint new Block image
     * 
     * @param {String} flip   Block flipp - none/horizontal/vertical 
     * @param {Number} angle  Block rotation
     * @param {String} whence
     */
    
    this.repaintImage = function(flip, angle, whence) {
        var p = this.image;

        p.angle = !whence ? ((p.angle == undefined ? 0 : p.angle) + angle) % 360 : angle;

        var rotation = Math.PI *(p.angle >= 0 ? p.angle : 360 + p.angle)/ 180;
        var costheta = Math.cos(rotation);
        var sintheta = Math.sin(rotation);
        
        if (document.all && !window.opera) {
            var canvas          = document.createElement('img');
            canvas.src          = p.src;
            canvas.style.height = p.height + "px";
            canvas.style.width  = p.width + "px";
            
            canvas.style.filter = "progid:DXImageTransform.Microsoft.Matrix(M11=" 
                                + costheta + ",M12=" + (-sintheta) + ",M21=" + sintheta 
                                + ",M22=" + costheta + ",SizingMethod='auto expand')";
            
            if (flip !== "none") {
                canvas.style.filter += "progid:DXImageTransform.Microsoft.BasicImage("
                                    +(flip == "horizontal" ? "mirror=1" : "rotation=2, mirror=1") 
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

            canvas.style.width  = canvas.width  = Math.abs(costheta * canvas.oImage.width)
                                                + Math.abs(sintheta * canvas.oImage.height);
            canvas.style.height = canvas.height = Math.abs(costheta * canvas.oImage.height)
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
                context.translate(canvas.width, -costheta * canvas.oImage.height);
            }
            else if (rotation <= 1.5 * Math.PI) {
                context.translate(-costheta * canvas.oImage.width, canvas.height);
            }
            else {
                context.translate(0, -sintheta * canvas.oImage.width);
            }
            context.rotate(rotation);

            try {
                context.drawImage(canvas.oImage, 0, 0, canvas.oImage.width, canvas.oImage.height);
                context.restore();
            } 
            catch (e) {}
        }
        canvas.angle = p.angle;
        this.htmlElement.replaceChild(canvas, p);
        this.image = canvas;
    };

    /**
     * Function is called when Block moved
     */
    this.onMove = function() {
        for (var i = 0, ml = this.moveListeners, l = ml.length; i < l; i++) {
            ml[i].onMove();
        }

    };

    this.updateInputPos = function(input) {
        var b = this.htmlElement;
        var o = this.other;
        var w = parseInt(b.style.width), h = parseInt(b.style.height);
        var ior = input ? input.position : "auto";
        var x = input ? input.x : w / 2, y = input ? input.y : h / 2;
        var dw = o.dwidth, dh = o.dheight;
        var fv = o.flipv, fh = o.fliph;
        var r = o.rotation;
        var positions = {0 : "top", 1 : "right", 2 : "bottom", 3 : "left",
                         "top" : 0, "right" : 1, "bottom" : 2, "left" : 3};
        var sSize = jpf.flow.sSize;

        /* Changing input floating */
        ior = ior == "auto" ? "auto" : positions[(positions[ior] + parseInt(r) / 90)%4];
        if (fv == 1)
            ior = ior == "top" ? "bottom" : (ior == "bottom" ? "top" : ior);
        if (fh == 1)
            ior = ior == "left" ? "right" : (ior == "right" ? "left" : ior);

        /* If block is resized, block keep proportion */
        x = r == 90 || r == 270 ? x*h / dh : x*w / dw;
        y = r == 90 || r == 270 ? y*w / dw : y*h / dh;

        /* If rotate, change inputs coordinates */
        var _x = x, _y = y;

        _x = r == 90 ? w - (y + sSize) : (r == 180 ? w - (x + sSize) : (r == 270 ? y : x));
        _y = r == 90 ? x : (r == 180 ? h - (y + sSize) : (r == 270 ? w - (x + sSize) : y));

        /* Flip Vertical and Horizontal */
        _x = fh == 1 ? w - (_x + sSize) : _x;
        _y = fv == 1 ? h - (_y + sSize) : _y;

        return [_x, _y, ior];
    };

    /* ********************************
     * Events 
     **********************************/

    this.htmlElement.onmouseover = function(e) {
        jpf.flow.inputManager.showInputs(_self);
    }
    
    var timer;
    this.htmlElement.onmouseout = function(e) {
        e = e || event;

        var t = jpf.isGecko ? e.relatedTarget : e.toElement;
        if(jpf.flow.isInput(t))
            return;
        
        jpf.flow.inputManager.hideInputs();
    }

};

jpf.flow.input = function(objBlock) {
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
        this.htmlElement.style.left = x + "px";
        this.htmlElement.style.top = y + "px";
    };

    this.htmlElement.onmousedown = function(e) {
        e = (e || event);
        e.cancelBubble = true;
        
        var vMB = new jpf.flow.virtualMouseBlock(objBlock.canvas, e);
        
        var connection = new jpf.flow.addConnector(objBlock.canvas, objBlock, vMB, {output : _self.number});
        
        document.onmousemove = function(e) {
            e = (e || event);
            vMB.onMove(e);
        }
        
    }
}

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
            var input = jpf.flow.cachedInputs.length ? jpf.flow.cachedInputs.pop() : new jpf.flow.input(objBlock);
                input.number = id;
            jpf.flow.usedInputs.push(input);
            var pos = objBlock.updateInputPos(inp[id]);

            input.moveTo(l + pos[0], t + pos[1]);
            input.show();
        }
    };

    this.hideInputs = function() {
       var inp = jpf.flow.usedInputs;

       for (var i = 0; i < inp.length; i++) {
           inp[i].hide();
       }
    };
}

jpf.flow.virtualMouseBlock = function(canvas, e){
    e = (e || event);
    
    this.canvas = canvas;
    this.htmlElement = document.createElement('div');
    
    this.canvas.htmlElement.appendChild(this.htmlElement);

    this.moveListeners = new Array();
    this.draggable = true;

    this.onMove = function(e) {
        e = (e || event);
        var cx = e.clientX;
        var cy = e.clientY

        this.htmlElement.style.left = cx + "px";
        this.htmlElement.style.top = cy + "px";

        for (var i = 0, l = this.moveListeners.length; i < l; i++) {
            this.moveListeners[i].onMove();
        }
    };
};


/**
 * Connector class. Creates Connection between two Block elements. 
 * 
 * @param {htmlElement}                htmlElement of connector
 * @param {Object} canvas              object canvas
 * @param {Object} objBlockSource      object of source block
 * @param {Object} objBlockDestination object of destination block
 * @param {Hash Array} other           values of output, input and xmlNode
 */
jpf.flow.connector = function(htmlElement, objCanvas, objSource, objDestination, other) {
    var htmlSegments = [];
    var htmlSegmentsTemp = [];

    var sSize  = jpf.flow.sSize; //Segment size
    var fsSize = jpf.flow.fsSize; //First segment size

    var i1 = other.output ? objSource.other.inputList[other.output] : {x : 0, y : 0, position : "auto"};
    var i2 = other.input ? objDestination.other.inputList[other.input] : {x : 0, y : 0, position : "auto"};

    var _self = this;

    this.initConnector = function() {
        if (!htmlElement.getAttribute("id")) {
            jpf.setUniqueHtmlId(htmlElement);
        }
        objCanvas.htmlConnectors[htmlElement.getAttribute("id")] = this;
        objSource.moveListeners.push(this);
        objDestination.moveListeners.push(this);
        this.draw();
    };

    this.onMove = function() {
        this.draw();
    }

    this.draw = function() {
        var l = [], s = [], d = [];

        s[0] = parseInt(objSource.htmlElement.style.left);
        s[1] = parseInt(objSource.htmlElement.style.top);
        d[0] = parseInt(objDestination.htmlElement.style.left);
        d[1] = parseInt(objDestination.htmlElement.style.top);

        /* Moving old segments to temporary table */
        for (var i = 0, l = htmlSegments.length; i < l; i++) {
            htmlSegmentsTemp.push(htmlSegments[i]);
        }
        htmlSegments = [];

        var sIPos = objSource.updateInputPos(i1);
        var dIPos = objDestination.updateInputPos(i2);
        var sO = sIPos[2];
        var dO = dIPos[2];

        s[0] += sIPos[0];
        s[1] += sIPos[1];
        
        d[0] += dIPos[0];
        d[1] += dIPos[1];

        /* Source first line */
        s = createSegment(s, [fsSize, sO]);

        /* Destination first line */
        d = createSegment(d, [fsSize, dO]);
        l = s;
        position = s[0] > d[0]
                 ? (s[1] > d[1] 
                     ? "TL" : (s[1] < d[1]  ? "BL" : "ML"))
                 : (s[0] < d[0]
                     ? (s[1] > d[1]
                         ? "TR" : (s[1] < d[1]  ? "BR" : "MR"))
                     : (s[1] > d[1]
                         ? "TM" : (s[1] < d[1] ? "MM" : "BM")));

        var condition = position 
                      + (sO == "left" ? 1 : (sO == "right" ? 2 : sO == "top" ? 4 : 8))
                      + (dO == "left" ? 1 : (dO == "right" ? 2 : dO == "top" ? 4 : 8));
        rot.setValue(condition)
        switch (condition) {
            case "TR41":
            case "TR44":
            case "TR14":
            case "TR11":
                l = createSegment(l, [s[1] - d[1], "top"]);
                l = createSegment(l, [d[0] - s[0], "right"]);
                break;
            case "BR22":
            case "BR24":
            case "BR42":
            case "BR44":
                l = createSegment(l, [d[0] - s[0], "right"]);
                l = createSegment(l, [Math.abs(d[1] - s[1]), "bottom"]);
                break;
            case "BR48":
            case "BR41":
            case "BR28":
            case "BR21":
                l = createSegment(l, [(d[0] - s[0]) / 2, "right"]);
                l = createSegment(l, [d[1] - s[1], "bottom"]);
                l = createSegment(l, [(d[0] - s[0]) / 2, "right"]);
                break;
            case "TL44":
            case "TL42":
            case "TL24":
            case "TL22":
                l = createSegment(l, [s[1] - d[1], "top"]);
                l = createSegment(l, [s[0] - d[0], "left"]);
                break;
            case "TR21":
            case "TR24":
            case "TR81":
            case "TR84":
            case "TR21":
            case "TR24":
            case "TR81":
            case "TR84":
                l = createSegment(l, [(d[0] - s[0]) / 2, "right"]);
                l = createSegment(l, [s[1] - d[1], "top"]);
                l = createSegment(l, [(d[0] - s[0]) / 2, "right"]);
                break;
            case "BR18":
            case "BR88":
            case "BR81":
            case "BR11":
                l = createSegment(l, [d[1] - s[1], "bottom"]);
                l = createSegment(l, [d[0] - s[0], "right"]);
                break;
            case "BR84":
            case "BR82":
            case "BR14":
            case "BR12":
                l = createSegment(l, [(d[1] - s[1]) / 2 , "bottom"]);
                l = createSegment(l, [d[0] - s[0], "right"]);
                l = createSegment(l, [(d[1] - s[1]) / 2, "bottom"]);
                break;
            case "BL84":
            case "BL24":
            case "BL21":
                l = createSegment(l, [(d[1] - s[1]) / 2, "bottom"]);
                l = createSegment(l, [s[0] - d[0], "left"]);
                l = createSegment(l, [(d[1] - s[1]) / 2, "bottom"]);
                break;
            case "BL11":
            case "BL14":
            case "BL41":
            case "BL44":
            case "BL81":
                l = createSegment(l, [s[0] - d[0], "left"]);
                l = createSegment(l, [d[1] - s[1], "bottom"]);
                break;
            case "BL12":
            case "BL18":
            case "BL42":
            case "BL48":
                l = createSegment(l, [(s[0] - d[0]) / 2, "left"]);
                l = createSegment(l, [d[1] - s[1], "bottom"]);
                l = createSegment(l, [(s[0] - d[0]) / 2, "left"]);
                break;
            case "BL88":
            case "BL82":
            case "BL28":
            case "BL22":
                l = createSegment(l, [d[1] - s[1], "bottom"]);
                l = createSegment(l, [s[0] - d[0], "left"]);
                break;
            case "TL88":
            case "TL81":
            case "TL18":
            case "TL11":
                l = createSegment(l, [s[0] - d[0], "left"]);
                l = createSegment(l, [s[1] - d[1], "top"]);
                break;
            case "TL41":
            case "TL48":
            case "TL28":
            case "TL21":
                l = createSegment(l, [(s[1] - d[1]) / 2, "top"]);
                l = createSegment(l, [s[0] - d[0], "left"]);
                l = createSegment(l, [(s[1] - d[1]) / 2, "top"]);
                break;
            case "TL12":
            case "TL14":
            case "TL82":
            case "TL84":
                l = createSegment(l, [(s[0] - d[0]) / 2, "left"]);
                l = createSegment(l, [s[1] - d[1], "top"]);
                l = createSegment(l, [(s[0] - d[0]) / 2, "left"]);
                break;
            case "TR12":
            case "TR18":
            case "TR42":
            case "TR48":
                l = createSegment(l, [(s[1] - d[1]) / 2, "top"]);
                l = createSegment(l, [d[0] - s[0], "right"]);
                l = createSegment(l, [(s[1] - d[1]) / 2, "top"]);
                break;
            case "TR22":
            case "TR28":
            case "TR82":
            case "TR88":
                l = createSegment(l, [d[0] - s[0], "right"]);
                l = createSegment(l, [s[1] - d[1], "top"]);
                break;
            default:
                switch (position) {
                    case "ML":
                        l = createSegment(l, [s[0] - d[0], "left"]);
                        break;
                    case "MM":
                        l = createSegment(l, [s[0] - d[0], "left"]);
                        l = createSegment(l, [d[1] - s[1], "bottom"]);
                        break;
                    case "TM":
                        l = createSegment(l, [s[1] - d[1], "top"]);
                        l = createSegment(l, [s[0] - d[0], "left"]);
                        break;
                    case "MR":
                        /* This part is not checked, only MR41 needs line with "right", 
                         * else need them both */
                        l = createSegment(l, [d[0] - s[0], "right"]);
                        if(condition.substring(2,4) == "41")
                            break;
                        l = createSegment(l, [Math.abs(d[1] - s[1]), "bottom"]);
                        break;
                }
                break;
        }

        for (var i = 0, l = htmlSegmentsTemp.length; i < l; i++) {
            htmlSegmentsTemp[i].style.display = "none";
        }
    }
    
    function createSegment(coor, lines) {
        var or = lines[1], l = lines[0];
        var sX = coor[0], sY = coor[1];
        var segment = htmlSegmentsTemp.pop();

        if (!segment) {
            var segment = htmlElement.appendChild(document.createElement("div"));
            jpf.setUniqueHtmlId(segment);
            jpf.setStyleClass(segment, "segment");
        }

        var w = or == "top" || or == "bottom" ? sSize : l;
        var h = or == "top" || or == "bottom" ? l : sSize;

        if(or == "top")
            sY -= l;
        if(or == "left")
            sX -=l;

        segment.style.display = "block";
        segment.style.left    = sX + "px";
        segment.style.top     = sY + "px";
        segment.style.width   = w + "px";
        segment.style.height  = h + "px";

        if(or == "bottom")
            sY += h;
        if(or == "right")
            sX += w;

        htmlSegments.push(segment);

        return [sX, sY];
    };

};

/*
 * Utility functions
 */

/** 
 * This method looking for a Block in htmlBlocks hash table.
 *
 * @param {idBlock} Id of Block element
 * @return {objBlock} Block Object
 *
 */
jpf.flow.findBlock = function(blockId) {
    var c = jpf.flow.htmlCanvases;

    for (var id in c) {
        if (c[id].htmlBlocks[blockId]) {
            return c[id].htmlBlocks[blockId];
        }
    }
};

jpf.flow.isBlock = function(htmlElement) {
    var c = jpf.flow.htmlCanvases;
    for (var id in c) {
        if (c[id].htmlBlocks[htmlElement.id]) {
            return c[id].htmlBlocks[htmlElement.id];
        }
    }
};

jpf.flow.isCanvas = function(htmlElement) {
    if (htmlElement) {
        return jpf.flow.htmlCanvases[htmlElement.id];
    }
};

jpf.flow.isInput = function(htmlElement) {
    for(var i = 0, inp = jpf.flow.usedInputs, l = inp.length; i < l; i++) {
        if (inp[i].htmlElement == htmlElement) {
            return inp[i];
        }
    }
};

/**
 * This method creates a new Canvas.
 *
 * @param {htmlNode} Canvas htmlElement
 * @return {Object}     Canvas object
 */
jpf.flow.getCanvas = function(htmlElement) {
    var newCanvas = jpf.flow.isCanvas(htmlElement);

    if (!newCanvas) {
        newCanvas = new jpf.flow.canvas(htmlElement);
        newCanvas.initCanvas();
    }
    return newCanvas;
};

/** 
 * Removes Canvas element with his all elements.
 *
 * @param {htmlNode} Canvas htmlElement
 *
 */
jpf.flow.removeCanvas = function(htmlElement) {
    var canvas = jpf.flow.isCanvas(htmlElement);
    canvas.destroy();
};

/**
 * This method creates a new Block on Canvas
 *
 * @param {htmlNode}   Block htmlElement
 * @param {Object}     Canvas object
 * @param {Hash Array} Block properties
 * 
 * @return {Object}    Block object
 *
 */
jpf.flow.addBlock = function(htmlElement, objCanvas, other){
    if (!jpf.flow.isBlock(htmlElement)) {
        var newBlock = new jpf.flow.block(htmlElement, objCanvas, other);
        newBlock.initBlock();
        return newBlock;
    }
    else {
        throw new Error(jpf.formErrorString(0, null, "Block exists", "Block exists."));
    }
};

/** 
 * Removes Block element with his connections from Canvas.
 *
 * @param {htmlNode} Block htmlElement
 *
 */
jpf.flow.removeBlock = function(htmlElement) {
    var block = jpf.flow.isBlock(htmlElement);
    block.destroy();
};

/**
 * 
 * @param {Object} objCanvas
 * @param {Object} objSource
 * @param {Object} objDestination
 * @param {Hash Array} other
 */

jpf.flow.addConnector = function(c, s, d, o) {
    var htmlElement = c.htmlElement.appendChild(document.createElement("div"));
    var newConnector = new jpf.flow.connector(htmlElement, c, s, d, o);
        newConnector.initConnector();
}

//#endif