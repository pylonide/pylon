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


/**
 * Component implementing adding and removing new elements and connections 
 * on workflow component. 
 * 
 * @author      Łukasz Lipiński
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

    /*************
     * Constants *
     *************/
    LEFT            : 1,
    RIGHT           : 2,
    UP              : 4,
    DOWN            : 8,
    HORIZONTAL      : 3, /* this.RIGHT + this.LEFT */
    VERTICAL        : 12,/* this.UP + this.DOWN */
    AUTO            : 15,/* this.HORIZONTAL + this.VERTICAL */
    START           : 0,
    END             : 1,
    SCROLLBARS_WIDTH: 18,
    STICKS_LENGHT   : 10,

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
        this.blocksToMoveScanner = new jpf.flow.DocumentScanner(new jpf.flow.BlocksToMoveVisitor(), true);

        document.onmousedown = this.startDrag;
        document.onmouseup   = this.stopDrag;
    }
};

/****************************************************
 * This class is a scanner for the visitor pattern. *
 ****************************************************/
/**
 * Constructor, parameters are:
 * visitor: the visitor implementation, it must be a class with a visit(element) method.
 * scanElementsOnly: a flag telling whether to scan html elements only or all html nodes.
 */
jpf.flow.DocumentScanner = function(visitor, scanElementsOnly) {
    this.visitor = visitor;
    this.scanElementsOnly = scanElementsOnly;

    /**
     * Scans the element
     */
    this.scan = function(element) {
        if (this.visitor.visit(element)) {
            // visit child elements
            var children = element.childNodes;
            for (var i = 0, l = children.length; i < l; i++) {
                if (!this.scanElementsOnly || children[i].nodeType == 1) {
                    this.scan(children[i]);
                }
            }
        }
    };
};

jpf.flow.BlocksToMoveVisitor = function() {
    this.visit = function(element) {
        if (jpf.flow.isBlock(element)) {
            jpf.flow.blocksToMove.push(jpf.flow.findBlock(element.id));
            return false;
        }
        else
            return true;
    };
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

        // calculate mouse start point
        jpf.flow.mouseStartX = e.clientX;
        jpf.flow.mouseStartY = e.clientY;

        // calculate bounds as left, top, width, height of the parent element		
        b[0] = 0;
        b[1] = 0;

        b[2] = b[0] + etm.parentNode.offsetWidth;
        b[3] = b[1] + etm.parentNode.offsetHeight;

        // either find the block related to the dragging element to call its onMove method
        jpf.flow.blocksToMove = new Array();

        jpf.flow.blocksToMoveScanner.scan(eS);
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
jpf.flow.Canvas = function(htmlElement){
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

        new jpf.flow.DocumentScanner(this, true).scan(this.htmlElement);
    };

    this.visit = function(element) {
        if (element == this.htmlElement)
            return true;
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
jpf.flow.Block = function(htmlElement, canvas, other) {

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

    this.visit = function(element) {
        if (element == this.htmlElement) {
            // exclude itself
            return true;
        }
        else {
            return false;
        }
    };

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
        new jpf.flow.DocumentScanner(this, true).scan(this.htmlElement);
        
        var bChilds = this.htmlElement.childNodes;
        for (var i = 0, l = bChilds.length; i < l; i++) {
            var tag = bChilds[i].tagName;
            if (tag) {
                if (tag.toLowerCase() == "img") {
                   this.image = bChilds[i];
                }
            }
        }
        this.image.src = this.other.picture;
        
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
        var o = this.other;
        if (!o.type)
            return;

        o.rotation = parseInt(rotation) || 0;
        o.fliph    = parseInt(fliph) || 0;
        o.flipv    = parseInt(flipv) || 0;

        var flip = (o.fliph == 1 && o.flipv == 0
            ? "horizontal" 
            : (o.fliph == 0 && o.flipv == 1
                ? "vertical"
                : "none"));

        this.repaintImage(flip, o.rotation, 'rel');
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

/*
 * Utility functions
 */
/** This method looking for a Block in htmlBlocks hash table.
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
        newCanvas = new jpf.flow.Canvas(htmlElement);
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
        var newBlock = new jpf.flow.Block(htmlElement, objCanvas, other);
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