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
     * this variable stores the orginal z-index of the object being dragged in order
     * to restore it upon drop.
     */
    originalZIndex : null,

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
        for (var i = 0, l = this.usedInputs.length; i < l; i++) {
            this.cachedInputs.push(this.usedInputs[i]);
            this.usedInputs[i].oExt.style.display = "none";
            this.usedInputs[i].oExt.parentNode.removeChild(this.usedInputs[i].oExt);
        }
        this.usedInputs.length = 0;
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
        var i;
        if (this.visitor.visit(element)) {
            // visit child elements
            var children = element.childNodes;
            for (i = 0, l = children.length; i < l; i++) {
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
    var objBlock = jpf.flow.isBlock(htmlBlock);
    
    if (objBlock.canvas.onblockmove) {
        objBlock.canvas.onblockmove(jpf.flow.elementToMove);
    }
};

jpf.flow.movemouse = function(e) {
    e = (e || event);

    if (jpf.flow.isdrag) {
        var currentMouseX = jpf.isGecko ? e.clientX : event.clientX;
        var currentMouseY = jpf.isGecko ? e.clientY : event.clientY;
        var newElementX   = jpf.flow.elementStartX + currentMouseX - jpf.flow.mouseStartX;
        var newElementY   = jpf.flow.elementStartY + currentMouseY - jpf.flow.mouseStartY;
        
        // check bounds
        // note: the "-1" and "+1" is to avoid borders overlap
        if (newElementX < jpf.flow.bounds[0])
            newElementX = jpf.flow.bounds[0] + 1;
        if (newElementX + jpf.flow.elementToMove.offsetWidth > jpf.flow.bounds[2])
            newElementX = jpf.flow.bounds[2] - jpf.flow.elementToMove.offsetWidth - 1;
        if (newElementY < jpf.flow.bounds[1])
            newElementY = jpf.flow.bounds[1] + 1;
        if (newElementY + jpf.flow.elementToMove.offsetHeight > jpf.flow.bounds[3])
            newElementY = jpf.flow.bounds[3] - jpf.flow.elementToMove.offsetHeight - 1;

        // move element
        jpf.flow.elementToMove.style.left = newElementX + "px";
        jpf.flow.elementToMove.style.top  = newElementY + "px";

        jpf.flow.elementToMove.style.right  = null;
        jpf.flow.elementToMove.style.bottom = null;
        
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
    var eventSource = jpf.isGecko ? e.target : e.srcElement;

    if (eventSource.tagName == 'HTML')
        return;
    while (eventSource != document.body && !jpf.flow.findBlock(eventSource.id)) {
        eventSource = jpf.isGecko ? eventSource.parentNode : eventSource.parentElement;
    }

    var block = jpf.flow.findBlock(eventSource.id);

    //if block is not in canvas.htmlBlocks
    if (!block) {
        block = eventSource;
    }

    // if a draggable element was found, calculate its actual position
    if (block.draggable) {
        jpf.flow.isdrag = true;
        jpf.flow.elementToMove = eventSource;

        // set absolute positioning on the element		
        jpf.flow.elementToMove.style.position = "absolute";

        // calculate start point
        jpf.flow.elementStartX = jpf.flow.elementToMove.offsetLeft
                               + jpf.flow.getXBorder(jpf.flow.elementToMove.parentNode, "left");
        jpf.flow.elementStartY = jpf.flow.elementToMove.offsetTop
                               + jpf.flow.getXBorder(jpf.flow.elementToMove.parentNode, "top");

        // calculate mouse start point
        jpf.flow.mouseStartX = e.clientX;
        jpf.flow.mouseStartY = e.clientY;

        // calculate bounds as left, top, width, height of the parent element		
        jpf.flow.bounds[0] = 0;
        jpf.flow.bounds[1] = 0;

        jpf.flow.bounds[2] = jpf.flow.bounds[0] + jpf.flow.elementToMove.parentNode.offsetWidth;
        jpf.flow.bounds[3] = jpf.flow.bounds[1] + jpf.flow.elementToMove.parentNode.offsetHeight;

        // either find the block related to the dragging element to call its onMove method
        jpf.flow.blocksToMove = new Array();

        jpf.flow.blocksToMoveScanner.scan(eventSource);
        document.onmousemove = jpf.flow.movemouse;

        jpf.flow.elementToMove.style.zIndex = "3";

        return false;
    }
};

jpf.flow.stopDrag = function(e) {
    jpf.flow.isdrag = false;
    if (jpf.flow.elementToMove) {
        jpf.flow.mouseup(jpf.flow.elementToMove);
        jpf.flow.elementToMove.style.zIndex = jpf.flow.originalZIndex;
    }

    jpf.flow.elementToMove = document.onmousemove = null;
};

/** Function returns border size of htmlElement depending on if browser needs him to calculations a new position.  
 *
 * @param {htmlElement} htmlElement
 * @param {String} Border: {left, top, right, bottom}
 */
jpf.flow.getXBorder = function(htmlElement, border){
    border.toLowerCase();
    
    if (jpf.isIE) {
        return 0;
    }
    else if (jpf.isGecko) {
        return parseInt(jpf.getStyle(htmlElement, "border-" + border + "-width"));
    }
    else if (jpf.isOpera) {
        return -parseInt(jpf.getStyle(htmlElement, "border-" + border + "-width"));
    }
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

    this.width          = 0;
    this.height         = 0;
    this.mode           = "normal";
    this.disableremove  = false;

    this.destroy = function() {
        //deleting phisical object
        for (var id in jpf.flow.htmlCanvases) {
            if (jpf.flow.htmlCanvases[id].id == this.id) {
                //removing blocks (connections are between blocks, removing blocks we remove connections)
                for (var id2 in jpf.flow.htmlCanvases[id].htmlBlocks) {
                    jpf.flow.htmlCanvases[id].htmlBlocks[id2].destroy();
                }
                delete jpf.flow.htmlCanvases[id];
            }
        }
        //removing canvas		
        this.htmlElement.parentNode.removeChild(this.htmlElement);
    };

    this.initCanvas = function() {
        jpf.flow.htmlCanvases[this.htmlElement.getAttribute("id")] = this;

        // inspect canvas children to identify first level blocks
        new jpf.flow.DocumentScanner(this, true).scan(this.htmlElement);
        
        var visibleWidth  = this.htmlElement.offsetWidth - 2; // - 2 is to avoid border overlap
        var visibleHeight = this.htmlElement.offsetHeight - 2; // - 2 is to avoid border overlap
        // consider the scrollbars width calculating the inner div size
        if (this.height > visibleHeight) 
            visibleWidth -= jpf.flow.SCROLLBARS_WIDTH;
        if (this.width > visibleWidth) 
            visibleHeight -= jpf.flow.SCROLLBARS_WIDTH;
        
        this.height = Math.max(this.height, visibleHeight);
        this.width  = Math.max(this.width, visibleWidth);

        // init connectors -- i think this should be deleted, because we are init they with methods...
        for (var id in this.htmlConnectors) {
            this.htmlConnectors[id].initConnector();
        }
    };

    this.visit = function(element) {
        if (element == this.htmlElement)
            return true;
    };

    /**
     * This function searches for a nested block with a given id
     */
    this.findBlock = function(blockId) {
        var result;

        if (!result) {
            for (var id in this.htmlBlocks) {
                result = this.htmlBlocks[id].findBlock(blockId);
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
    
    this.rotation      = 0;
    this.fliph         = 0;
    this.flipv         = 0;

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

    this.hasSquares = function(){
        for (var id in this.squarePool) {
            if (this.squarePool[id]) {
                return true;
            }
        }
        return false;
    };

    this.initBlock = function(){
        this.canvas.htmlBlocks[this.htmlElement.getAttribute("id")] = this;
        new jpf.flow.DocumentScanner(this, true).scan(this.htmlElement);
        
        var bChilds = this.htmlElement.childNodes;
        for (var i = 0; i < bChilds.length; i++) {
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
        if (!this.other.type)
            return;

        this.rotation = parseInt(rotation) || 0;
        this.fliph    = parseInt(fliph) || 0;
        this.flipv    = parseInt(flipv) || 0;

        var flip = (this.fliph == 1 && this.flipv == 0
            ? "horizontal" 
            : (this.fliph == 0 && this.flipv == 1
                ? "vertical"
                : "none"));

        this.repaintImage(flip, this.rotation, 'rel');
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
        var result;
        if (!result) {
            for (var id in this.htmlBlocks) {
                result = this.htmlBlocks[id].findBlock(blockId);
            }
        }
        return result;
    };

    /**
     * Function is called when Block moved
     */
    this.onMove = function() {
        for (var i = 0, l = this.moveListeners.length; i < l; i++) {
            this.moveListeners[i].onMove();
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
    for (var id in jpf.flow.htmlCanvases) {
        if (jpf.flow.htmlCanvases[id].htmlBlocks[blockId]) {
            return jpf.flow.htmlCanvases[id].htmlBlocks[blockId];
        }
    }
};

jpf.flow.isBlock = function(htmlElement) {
    for (var id in jpf.flow.htmlCanvases) {
        if (jpf.flow.htmlCanvases[id].htmlBlocks[htmlElement.id]) {
            return jpf.flow.htmlCanvases[id].htmlBlocks[htmlElement.id];
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