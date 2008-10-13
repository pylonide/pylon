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
    connectorTemp      : [], /* clicked outputs */

    getConnectionInput : function(objBlock, i) {
        if (!jpf.flow.inputServer.inited) {
            jpf.flow.inputServer.init();
        }

        var input = this.cachedInputs.length ? this.cachedInputs.pop() : new jpf.flow.inputServer.Input();

        this.usedInputs.push(input);
        input.setBlock(objBlock, i);

        return input;
    },

    clearConnectionInputs: function() {
        for (var i = 0, ui = this.usedInputs, l = ui.length; i < l; i++) {
            this.cachedInputs.push(ui[i]);
            ui[i].oExt.style.display = "none";
            ui[i].oExt.parentNode.removeChild(ui[i].oExt);
        }
        ui.length = 0;
    },
    
    init : function() {
        document.onmousedown = this.startDrag;
        document.onmouseup   = this.stopDrag;
    }
};

jpf.flow.mouseup = function(htmlBlock) {
    var c = jpf.flow.isBlock(htmlBlock).canvas;
    
    if (c.onblockmove)
        c.onblockmove(jpf.flow.elementToMove);
};

jpf.flow.movemouse = function(e) {
    e = (e || event);

    if (jpf.flow.isdrag) {
        var nX = jpf.flow.elementStartX + e.clientX - jpf.flow.mouseStartX;
        var nY = jpf.flow.elementStartY + e.clientY - jpf.flow.mouseStartY;

        // check bounds
        // note: the "-1" and "+1" is to avoid borders overlap
        var   b = jpf.flow.bounds;
        var etm = jpf.flow.elementToMove;

        etm.style.left = nX < b[0] ? b[0] + 1 : (nX + etm.offsetWidth > b[2] ? b[2] - etm.offsetWidth - 1 : nX) + "px";
        etm.style.top = nY < b[1] ? b[1] + 1 : (nY + etm.offsetHeight > b[3] ? b[3] - etm.offsetHeight - 1 : nY) + "px";

        etm.style.right  = null;
        etm.style.bottom = null;

        if (jpf.flow.onbeforemove) {
            jpf.flow.onbeforemove();
        }

        for (var i = 0, l = jpf.flow.blocksToMove.length; i < l; i++) {
            jpf.flow.blocksToMove[i].onMove();
            //jpf.flow.blocksToMove[i].deactivateOutputs(); // trzeba pamietac aby wylaczyc outputy podczas przeciagania
        }
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
        block = eS;
    }

    // if a draggable element was found, calculate its actual position
    if (block.draggable) {
        jpf.flow.isdrag = true;
        var etm = jpf.flow.elementToMove = eS;
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
    jpf.flow.isdrag = false;
    var etm = jpf.flow.elementToMove;
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

    /**
     * This function searches for a nested block with a given id
     */
    this.findBlock = function(blockId) {
        var result, hBlocks = this.htmlBlocks; 

        if (!result) {
            for (var id in hBlocks) {
                result = hBlocks[id].findBlock(blockId);
            }
        }
        return result;
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
jpf.flow.block = function(htmlElement, canvas, other) {

    if (!htmlElement.getAttribute("id")) {
        jpf.setUniqueHtmlId(htmlElement);
    }

    this.canvas        = canvas;
    this.htmlElement   = htmlElement;
    this.id            = htmlElement.getAttribute("id");
    this.moveListeners = new Array();
    this.draggable     = true;

    this.inputs        = [];
    this.image         = null;
    this.other         = other;
    this.squarePool    = {};

    var _self = this;

    this.hasSquares = function() {
        var sP = this.squarePool;
        for (var id in sP) {
            if (sP[id]) {
                return true;
            }
        }
        return false;
    };

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

    this.setRotation = function(rotation) {
        this.other.rotation = rotation;
    }
    
    this.setFlipV = function(flipv) {
        this.other.flipv = flipv;
    }
    
    this.setFlipH = function(fliph) {
        this.other.fliph = fliph;
    }

    /**
     * Function change rotation, vertical and horzontal flipping
     * of block element and paint new image
     *
     * @param {String} rotation block rotation
     * @param {Number} fliph    block horizontal flip
     * @param {Number} flipv    block vertical flip
     */
    this.changeRotation = function(rotation, fliph, flipv) {
        var o = this.other;
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

        this.repaintImage(flip, o.rotation, 'rel');
        this.onMove();
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
     * This function searches for a nested block (or the block itself) with a given id
     * 
     * @param {String} blockId Block id
     */
    this.findBlock = function(blockId){
        var result, hBlocks = this.htmlBlocks;
        if (!result) {
            for (var id in hBlocks) {
                result = hBlocks[id].findBlock(blockId);
            }
        }
        return result;
    };

    /**
     * Function is called when Block moved
     */
    this.onMove = function() {
        for (var i = 0, ml = this.moveListeners, l = ml.length; i < l; i++) {
            ml[i].onMove();
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
    
    var sSize  =  1; //Segment size
    var fsSize = 10; //First segment size

    var i1 = objSource.other.inputList[other.output];
    var i2 = objDestination.other.inputList[other.input];
    var sOr = i1 ? getOrientation(i1.position, objSource.other.rotation) : "auto";
    var dOr = i2 ? getOrientation(i2.position, objDestination.other.rotation) : "auto";

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
        var b1   = objSource.htmlElement,     b2 = objDestination.htmlElement,
            w1   = parseInt(b1.style.width),  w2 = parseInt(b2.style.width),
            h1   = parseInt(b1.style.height), h2 = parseInt(b2.style.height);
            s[0] = parseInt(b1.style.left), s[1] = parseInt(b1.style.top),
            d[0] = parseInt(b2.style.left), d[1] = parseInt(b2.style.top),
            r1   = objSource.other.rotation, r2  = objDestination.other.rotation,
            x1 = i1 ? i1.x : w1/2, 
            y1 = i1 ? i1.y : h1/2, 
            x2 = i2 ? i2.x : w2/2, 
            y2 = i2 ? i2.y : h2/2,
            dw1 = objSource.other.dwidth, dh1 = objSource.other.dheight,
            dw2 = objDestination.other.dwidth, dh2 = objDestination.other.dheight;
        
        var sO = getOrientation(sOr, r1);
        var dO = getOrientation(dOr, r2);

        for (var i = 0, l = htmlSegments.length; i < l; i++) {
            htmlSegmentsTemp.push(htmlSegments[i]);
        }
        htmlSegments = [];

        /* If block is resized, block keep proportion */
        x1 = r1 == 90 || r1 == 270 ? x1*h1/dh1 : x1*w1/dw1;
        y1 = r1 == 90 || r1 == 270 ? y1*w1/dw1 : y1*h1/dh1;
        
        x2 = r2 == 90 || r2 == 270 ? x2*h2/dh2 : x2*w2/dw2;
        y2 = r2 == 90 || r2 == 270 ? y2*w2/dw2 : y2*h2/dh2;

        /* If rotate */
       var _x1 = x1, _y1 = y1, _x2 = x2, _y2 = y2;
       
       _x1 = r1 == 90 ? w1 - (y1+1) : (r1 == 180 ? w1 - (x1+1) : (r1 == 270 ? y1 : x1));
       _y1 = r1 == 90 ? x1 : (r1 == 180 ? h1 - (y1+1) : (r1 == 270 ? w1 - (x1+1) : y1));
       
       _x2 = r2 == 90 ? w2 - (y2+1) : (r2 == 180 ? w2 - (x2+1) : (r2 == 270 ? y2 : x2));
       _y2 = r2 == 90 ? x2 : (r2 == 180 ? h2 - (y2+1) : (r2 == 270 ? w2 - (x2+1) : y2));
       
       
       /*switch(r1) {
           case 90:
               _x1 = w1 - (y1+1);
               _y1 = x1;
           break
           case 180:
               _x1 = w1 - (x1+1);
               _y1 = h1 - (y1+1);
           break;
           case 270:
               _x1 = y1;
               _y1 = w1 - (x1+1);
           break;
           
       }*/
 
        /* END If rotate */
        s[0] += _x1;
        s[1] += _y1;
        
        d[0] += _x2;
        d[1] += _y2;

        /* Source first line */
        s = createSegments(s, [fsSize, sO])
        
        /* Destination first line */
        d = createSegments(d, [fsSize, dO]);
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
                l = createSegments(l, [s[1] - d[1], "top"]);
                l = createSegments(l, [d[0] - s[0], "right"]);
                break;
            case "MR41":
                l = createSegments(l, [d[0] - s[0], "right"]);
                break;
            case "MR11":
            case "MR12":
            case "MR14":
            case "MR18":
            case "MR21":
            case "MR22":
            case "MR24":
            case "MR28":
            case "MR42":
            case "MR44":
            case "MR48":
            case "MR81":
            case "MR84":
            case "MR82":
            case "MR88":
            case "BR22":
            case "BR24":
            case "BR42":
            case "BR44":
                l = createSegments(l, [d[0] - s[0], "right"]);
                l = createSegments(l, [Math.abs(d[1] - s[1]), "bottom"]);
                break;
            case "BR48":
            case "BR41":
            case "BR28":
            case "BR21":
                l = createSegments(l, [(d[0] - s[0])/2, "right"]);
                l = createSegments(l, [d[1] - s[1], "bottom"]);
                l = createSegments(l, [(d[0] - s[0])/2, "right"]);
                break;
            case "TL44":
            case "TL42":
            case "TL24":
            case "TL22":
                l = createSegments(l, [s[1] - d[1], "top"]);
                l = createSegments(l, [s[0] - d[0], "left"]);
                break;
            case "TR21":
            case "TR24":
            case "TR81":
            case "TR84":
            case "TR21":
            case "TR24":
            case "TR81":
            case "TR84":
                l = createSegments(l, [(d[0] - s[0])/2, "right"]);
                l = createSegments(l, [s[1] - d[1], "top"]);
                l = createSegments(l, [(d[0] - s[0])/2, "right"]);
                break;
            case "BR18":
            case "BR88":
            case "BR81":
            case "BR11":
                l = createSegments(l, [d[1] - s[1], "bottom"]);
                l = createSegments(l, [d[0] - s[0], "right"]);
                break;
            case "BR84":
            case "BR82":
            case "BR14":
            case "BR12":
                l = createSegments(l, [(d[1] - s[1])/2 , "bottom"]);
                l = createSegments(l, [d[0] - s[0], "right"]);
                l = createSegments(l, [(d[1] - s[1])/2, "bottom"]);
                break;
            case "BL84":
            case "BL24":
            case "BL21":
                l = createSegments(l, [(d[1] - s[1])/2, "bottom"]);
                l = createSegments(l, [s[0] - d[0], "left"]);
                l = createSegments(l, [(d[1] - s[1])/2, "bottom"]);
                break;
            case "BL11":
            case "BL14":
            case "BL41":
            case "BL44":
            case "BL81":
                l = createSegments(l, [s[0] - d[0], "left"]);
                l = createSegments(l, [d[1] - s[1], "bottom"]);
                break;
            case "BL12":
            case "BL18":
            case "BL42":
            case "BL48":
                l = createSegments(l, [(s[0] - d[0])/2, "left"]);
                l = createSegments(l, [d[1] - s[1], "bottom"]);
                l = createSegments(l, [(s[0] - d[0])/2, "left"]);
                break;
            case "BL88":
            case "BL82":
            case "BL28":
            case "BL22":
                l = createSegments(l, [d[1] - s[1], "bottom"]);
                l = createSegments(l, [s[0] - d[0], "left"]);
                break;
            case "TL88":
            case "TL81":
            case "TL18":
            case "TL11":
                l = createSegments(l, [s[0] - d[0], "left"]);
                l = createSegments(l, [s[1] - d[1], "top"]);
                break;
            case "TL41":
            case "TL48":
            case "TL28":
            case "TL21":
                l = createSegments(l, [(s[1] - d[1])/2, "top"]);
                l = createSegments(l, [s[0] - d[0], "left"]);
                l = createSegments(l, [(s[1] - d[1])/2, "top"]);
                break;
            case "TL12":
            case "TL14":
            case "TL82":
            case "TL84":
                l = createSegments(l, [(s[0] - d[0])/2, "left"]);
                l = createSegments(l, [s[1] - d[1], "top"]);
                l = createSegments(l, [(s[0] - d[0])/2, "left"]);
                break;
            case "TR12":
            case "TR18":
            case "TR42":
            case "TR48":
                l = createSegments(l, [(s[1] - d[1])/2, "top"]);
                l = createSegments(l, [d[0] - s[0], "right"]);
                l = createSegments(l, [(s[1] - d[1])/2, "top"]);
                break;
            case "TR22":
            case "TR28":
            case "TR82":
            case "TR88":
                l = createSegments(l, [d[0] - s[0], "right"]);
                l = createSegments(l, [s[1] - d[1], "top"]);
                break;
            default:
                switch (position) {
                    case "ML":
                        l = createSegments(l, [s[0] - d[0], "left"]);//bylem
                        break;
                    case "MM":
                        l = createSegments(l, [s[0] - d[0], "left"]);
                        l = createSegments(l, [d[1] - s[1], "bottom"]);
                        break;
                    case "TM":
                        l = createSegments(l, [s[1] - d[1], "top"]);
                        l = createSegments(l, [s[0] - d[0], "left"]);
                        break;
                }
                break;
        }

        for (var i = 0, l = htmlSegmentsTemp.length; i < l; i++) {
            htmlSegmentsTemp[i].style.display = "none";
        }
    }
    
    function createSegments(coor, lines) {
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
        segment.style.left   = sX + "px";
        segment.style.top    = sY + "px";
        segment.style.width  = w + "px";
        segment.style.height = h + "px";
        
        if(or == "bottom")
            sY += h;
        if(or == "right")
            sX += w;

        htmlSegments.push(segment);

        return [sX, sY];
    };

    /**
     * 
     * @param {String} start
     * @param {Number} rotation
     */

    function getOrientation(start, rotation) {
        var positions = {0 : "top", 1 : "right", 2 : "bottom", 3 : "left",
                         "top" : 0, "right" : 1, "bottom" : 2, "left" : 3};
        if (start == "auto")
            return "auto";
        else {
            jpf.console.info(start+" "+rotation+" = "+positions[(positions[start] + parseInt(rotation) / 90)%4])
            return positions[(positions[start] + parseInt(rotation) / 90)%4];
        }
            
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