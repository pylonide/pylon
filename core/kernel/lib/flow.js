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
    isdrag       : false, /* this flag indicates that the mouse movement is actually a drag. */
    mouseStartX  : null, /* mouse position when drag starts */
    mouseStartY  : null,
    elementStartX: null, /* element position when drag starts */
    elementStartY: null,
    
    /**
     * the html element being dragged.
     */
    elementToMove: null,
    
    /**
     * an array containing the blocks being dragged. This is used to notify them of move.
     */
    blocksToMove: null,
    
    /**
     * this variable stores the orginal z-index of the object being dragged in order
     * to restore it upon drop.
     */
    originalZIndex: null,
    
    /**
     * an array containing bounds to be respected while dragging elements,
     * these bounds are left, top, left + width, top + height of the parent element.
     */
    bounds: new Array(4),
    
    /** 
     * an associate tables with block, connector and label objects
     *
     */
    htmlCanvases: {},
    
    /*************
     * Constants *
     *************/
    LEFT            : 1,
    RIGHT           : 2,
    UP              : 4,
    DOWN            : 8,
    HORIZONTAL      : 3, /* this.RIGHT + this.LEFT */
    VERTICAL        : 12, /* this.UP + this.DOWN */
    AUTO            : 15, /* this.HORIZONTAL + this.VERTICAL */
    START           : 0,
    END             : 1,
    SCROLLBARS_WIDTH: 18,
    STICKS_LENGHT   : 10,
    
    cachedInputs      : [], /* cached Block inputs */
    usedInputs        : [], /* used Block inputs */
    connectorTemp     : [], /* clicked outputs */
    
    getConnectionInput: function(objBlock, i){
    
        if (!jpf.flow.inputServer.inited) {
            jpf.flow.inputServer.init();
        }
        
        var input = this.cachedInputs.length ? this.cachedInputs.pop() : new jpf.flow.inputServer.Input();
        
        this.usedInputs.push(input);
        input.setBlock(objBlock, i);
        
        return input;
    },
    
    clearConnectionInputs: function(){
        for (var i = 0; i < this.usedInputs.length; i++) {
            this.cachedInputs.push(this.usedInputs[i]);
            this.usedInputs[i].oExt.style.display = "none";
            this.usedInputs[i].oExt.parentNode.removeChild(this.usedInputs[i].oExt);
        }
        this.usedInputs.length = 0;
    },
    
    init: function(){
        this.blocksToMoveScanner = new jpf.flow.DocumentScanner(new jpf.flow.BlocksToMoveVisitor(), true);
        
        document.onmousedown = this.startDrag;
        document.onmouseup   = this.stopDrag;
        
    }
}

/****************************************************
 * This class is a scanner for the visitor pattern. *
 ****************************************************/
/**
 * Constructor, parameters are:
 * visitor: the visitor implementation, it must be a class with a visit(element) method.
 * scanElementsOnly: a flag telling whether to scan html elements only or all html nodes.
 */
jpf.flow.DocumentScanner = function(visitor, scanElementsOnly){
    this.visitor = visitor;
    this.scanElementsOnly = scanElementsOnly;
    
    /**
     * Scans the element
     */
    this.scan = function(element){
        var i;
        if (this.visitor.visit(element)) {
            // visit child elements
            var children = element.childNodes;
            for (i = 0; i < children.length; i++) {
                if (!this.scanElementsOnly || children[i].nodeType == 1) {
                    this.scan(children[i]);
                }
            }
        }
    }
}


jpf.flow.BlocksToMoveVisitor = function(){
    this.visit = function(element){
        if (jpf.flow.isBlock(element)) {
            jpf.flow.blocksToMove.push(jpf.flow.findBlock(element.id));
            return false;
        }
        else 
            return true;
    }
}


jpf.flow.mouseup = function(htmlBlock){
    objBlock = jpf.flow.isBlock(htmlBlock);
    
    if (objBlock.canvas.onblockmove) {
        objBlock.canvas.onblockmove(jpf.flow.elementToMove);
    }
}


jpf.flow.movemouse = function(e){
    if (jpf.flow.isdrag) {
        var currentMouseX = jpf.isGecko ? e.clientX : event.clientX;
        var currentMouseY = jpf.isGecko ? e.clientY : event.clientY;
        var newElementX = jpf.flow.elementStartX + currentMouseX - jpf.flow.mouseStartX;
        var newElementY = jpf.flow.elementStartY + currentMouseY - jpf.flow.mouseStartY;
        
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
        
        
        showx.setValue(newElementX);
        showy.setValue(newElementY);
        
        // move element
        jpf.flow.elementToMove.style.left = newElementX + 'px';
        jpf.flow.elementToMove.style.top = newElementY + 'px';
        
        // elementToMove.style.left = newElementX / elementToMove.parentNode.offsetWidth * 100 + '%';
        // elementToMove.style.top  = newElementY / elementToMove.parentNode.offsetHeight * 100 + '%';
        
        jpf.flow.elementToMove.style.right = null;
        jpf.flow.elementToMove.style.bottom = null;
        
        if (jpf.flow.onbeforemove) {
            jpf.flow.onbeforemove();
        }
        
        var i;
        
        for (i = 0; i < jpf.flow.blocksToMove.length; i++) {
            jpf.flow.blocksToMove[i].onMove();
            jpf.flow.blocksToMove[i].deactivateOutputs();
        }
        return false;
    }
}

/**
 * finds the innermost draggable element starting from the one that generated the event "e"
 * (i.e.: the html element under mouse pointer), then setup the document's onmousemove function to
 * move the element around.
 */
jpf.flow.startDrag = function(e){
    var eventSource = jpf.isGecko ? e.target : event.srcElement;
    //jpf.alert_r(e['bubbleEvents']);
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
        jpf.flow.elementStartX = jpf.flow.elementToMove.offsetLeft + jpf.flow.getXBorder(jpf.flow.elementToMove.parentNode, "left");
        jpf.flow.elementStartY = jpf.flow.elementToMove.offsetTop + jpf.flow.getXBorder(jpf.flow.elementToMove.parentNode, "top");
        
        
        // calculate mouse start point
        jpf.flow.mouseStartX = jpf.isGecko ? e.clientX : event.clientX;
        jpf.flow.mouseStartY = jpf.isGecko ? e.clientY : event.clientY;
        
        
        // calculate bounds as left, top, width, height of the parent element		
        jpf.flow.bounds[0] = 0;
        jpf.flow.bounds[1] = 0;
        
        jpf.flow.bounds[2] = jpf.flow.bounds[0] + jpf.flow.elementToMove.parentNode.offsetWidth;
        jpf.flow.bounds[3] = jpf.flow.bounds[1] + jpf.flow.elementToMove.parentNode.offsetHeight;
        
        // either find the block related to the dragging element to call its onMove method
        jpf.flow.blocksToMove = new Array();
        
        jpf.flow.blocksToMoveScanner.scan(eventSource);
        document.onmousemove = jpf.flow.movemouse;
        
        jpf.flow.originalZIndex = jpf.flow.getStyle(jpf.flow.elementToMove, "z-index");
        jpf.flow.elementToMove.style.zIndex = "3";
        
        return false;
    }
}

jpf.flow.stopDrag = function(e){
    jpf.flow.isdrag = false;
    if (jpf.flow.elementToMove) {
        jpf.flow.mouseup(jpf.flow.elementToMove);
        jpf.flow.elementToMove.style.zIndex = jpf.flow.originalZIndex;
    }
    
    jpf.flow.elementToMove = document.onmousemove = null;
}

/** Function returns border size of htmlElement
 *
 * @param {htmlElement} htmlElement
 * @param {String} Border: {left, top, right, bottom}
 */
jpf.flow.getBorder = function(htmlElement, border){
    border.toLowerCase();
    
    if (jpf.isIE) {
        border = border.substr(0, 1).toUpperCase() + border.substr(1);
        return parseInt(jpf.getStyle(htmlElement, "border" + border + "Width"));
    }
    else if (jpf.isGecko) {
        return parseInt(jpf.getStyle(htmlElement, "border-" + border + "-width"));
    }
    else if (jpf.isOpera) {
        return parseInt(jpf.getStyle(htmlElement, "border-" + border + "-width"));
    }
}

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
}




/**
 * Creates canvas.
 * 
 * @param {htmlElement} htmlElement
 */
jpf.flow.Canvas = function(htmlElement){
    /*
     * initialization
     */
    if (!htmlElement.getAttribute("id")) {
        jpf.setUniqueHtmlId(htmlElement);
    }
    
    this.id = htmlElement.getAttribute("id");
    this.htmlElement = htmlElement;
    
    this.htmlBlocks = {};
    this.htmlConnectors = {};
    
    this.offsetLeft = jpf.flow.calculateOffsetLeft(this.htmlElement);
    this.offsetTop = jpf.flow.calculateOffsetTop(this.htmlElement);
    
    this.width;
    this.height;
    this.mode = "normal";
    this.disableremove = false;
    
    // create the inner div element
    this.innerDiv = document.createElement("div");
    
    this.destroy = function(){
        //deleting phisical object		  
        for (var id in jpf.flow.htmlCanvases) {
            if (jpf.flow.htmlCanvases[id].id == this.id) {
                //removing blocks (connections are between blocks, removing blocks we remove connections)				
                for (var id2 in jpf.flow.htmlCanvases[id].htmlBlocks) {
                    //jpf.alert_r(jpf.flow.htmlCanvases[id].htmlBlocks[id2].htmlElement);
                    jpf.flow.htmlCanvases[id].htmlBlocks[id2].destroy();
                }
                delete jpf.flow.htmlCanvases[id];
            }
        }
        //removing canvas		
        this.htmlElement.parentNode.removeChild(this.htmlElement);
    }
    
    
    this.initCanvas = function(){
        jpf.flow.htmlCanvases[this.htmlElement.getAttribute("id")] = this;
        
        // setup the inner div
        var children = this.htmlElement.childNodes;
        var i;
        var el;
        var n = children.length;
        for (i = 0; i < n; i++) {
            el = children[0];
            this.htmlElement.removeChild(el);
            this.innerDiv.appendChild(el);
            if (el.style) 
                el.style.zIndex = "2";
        }
        this.htmlElement.appendChild(this.innerDiv);
        
        this.htmlElement.style.overflow = "auto";
        this.htmlElement.style.position = "relative";
        this.innerDiv.id = this.id + "_innerDiv";
        this.innerDiv.style.border = "none";
        this.innerDiv.style.padding = "0px";
        this.innerDiv.style.margin = "0px";
        this.innerDiv.style.position = "absolute";
        this.innerDiv.style.top = "0px";
        this.innerDiv.style.left = "0px";
        this.width = 0;
        this.height = 0;
        this.offsetLeft = jpf.flow.calculateOffsetLeft(this.innerDiv);
        this.offsetTop = jpf.flow.calculateOffsetTop(this.innerDiv);
        
        
        // inspect canvas children to identify first level blocks
        new jpf.flow.DocumentScanner(this, true).scan(this.htmlElement);
        
        // now this.width and this.height are populated with minimum values needed for the inner
        // blocks to fit, add 2 to avoid border overlap;
        this.height += 2;
        this.width += 2;
        
        var visibleWidth  = this.htmlElement.offsetWidth - 2; // - 2 is to avoid border overlap
        var visibleHeight = this.htmlElement.offsetHeight - 2; // - 2 is to avoid border overlap
        // consider the scrollbars width calculating the inner div size
        if (this.height > visibleHeight) 
            visibleWidth -= jpf.flow.SCROLLBARS_WIDTH;
        if (this.width > visibleWidth) 
            visibleHeight -= jpf.flow.SCROLLBARS_WIDTH;
        
        this.height = Math.max(this.height, visibleHeight);
        this.width  = Math.max(this.width, visibleWidth);
        
        this.innerDiv.style.width  = this.width + "px";
        this.innerDiv.style.height = this.height + "px";
        
        // init connectors -- i think this should be deleted, because we are init they with methods...
        for (var id in this.htmlConnectors) {
            this.htmlConnectors[id].initConnector();
        }
    }
    
    this.visit = function(element){
        if (element == this.htmlElement) 
            return true;
        /*
        // check the element dimensions against the acutal size of the canvas
        this.width = Math.max(this.width, jpf.flow.calculateOffsetLeft(element) - this.offsetLeft + element.offsetWidth);
        this.height = Math.max(this.height, jpf.flow.calculateOffsetTop(element) - this.offsetTop + element.offsetHeight);
        alert(this.width+" / "+this.height);*/
    }

    /*
     * methods
     */
    this.print = function(){
        var output = '<ul><legend>canvas: ' + this.id + '</legend>';
        
        for (var id in this.htmlBlocks) {
            output += '<li>' + this.htmlBlocks[id].print() + '</li>';
        }
        output += '</ul>';
        return output;
    }
    
    /*
     * This function searches for a nested block with a given id
     */
    this.findBlock = function(blockId){
        var result;
        
        if (!result) {
            for (var id in this.htmlBlocks) {
                result = this.htmlBlocks[id].findBlock(blockId);
            }
        }
        return result;
    }
    
    this.toString = function(){
        return 'canvas: ' + this.id;
    }
}

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
jpf.flow.Block = function(htmlElement, canvas, other){
    
    if (!htmlElement.getAttribute("id")) {
        jpf.setUniqueHtmlId(htmlElement);
    }
    
    this.canvas        = canvas;
    this.htmlElement   = htmlElement;
    this.id            = htmlElement.getAttribute("id");
    this.blocksInBlock = {};
    this.moveListeners = new Array();
    this.draggable     = true;
    
    this.rotation  = other.rotation;
    this.fliph     = other.fliph;
    this.flipv     = other.flipv;
    this.inputList = other.inputList;
    this.inputs    = [];
    this.type      = other.type;
    this.image     = null;
    this.other     = other;
    
    this.squarePool = {};
    
    this.currentTop = jpf.flow.calculateOffsetTop(this.htmlElement) - this.canvas.offsetTop;
    this.currentLeft = jpf.flow.calculateOffsetLeft(this.htmlElement) - this.canvas.offsetLeft;
    
    var _self = this;
    
	/**
	 * Function destroy block object
	 */
	
    this.destroy = function(){
        for (var id in this.canvas.htmlConnectors) {
            if (this.canvas.htmlConnectors[id].source.id == this.id || this.canvas.htmlConnectors[id].destination.id == this.id) {
                this.canvas.htmlConnectors[id].destroy();
            }
        }
        //removing block
        this.htmlElement.parentNode.removeChild(this.htmlElement);
        
        delete this.canvas.htmlBlocks[this.htmlElement.id];
        
    // clear all references in arrays, parent objects, hashes etc	
    // remove all event handlers on the htmlElements	
    }
    
    this.visit = function(element){
        if (element == this.htmlElement) {
            // exclude itself
            return true;
        }
        else {
            return false;
        }
    }
    
    this.htmlElement.onmouseover = function(e){
        _self.activateOutputs();
    }
    
    this.htmlElement.onmouseout = function(e){
        var e = (e || event);
        
        if (jpf.flow.isCanvas(e.relatedTarget) || jpf.flow.isCanvas(e.toElement)) {
            _self.deactivateOutputs();
        }
    }
    
    /**
     * Function show element outputs
     * 
     */	

    this.activateOutputs = function(){
        for (var i = 0; i < _self.inputList.length; i++) {
            var input = jpf.flow.getConnectionInput(_self, i);
            input.repaint();
        }
    }
    
	/**
     * Function hide element outputs
     * 
     */	
	
    this.deactivateOutputs = function(){
        jpf.flow.clearConnectionInputs();
    }
    
	/**
     * Function looking for element connection
     * 
     * @param  {input number} input element input number 
     * 
     * @return {Hash Array}         hash array with connector object and type 
     * 
     */	
	
    this.hasConnectionWithInput = function(input){
        for (var id in this.canvas.htmlConnectors) {
            if (this.canvas.htmlConnectors[id].source.id == this.id 
              && this.canvas.htmlConnectors[id].output == input) {
                return {
                    connector: this.canvas.htmlConnectors[id],
                    type: "S"
                };
            }
            if (this.canvas.htmlConnectors[id].destination.id == this.id 
              && this.canvas.htmlConnectors[id].input == input) {
                return {
                    connector: this.canvas.htmlConnectors[id],
                    type: "D"
                };
            }
        }
    }
    
	/**
	 * Function get Connector object
	 * 
	 * @param {htmlElement} htmlDestinationNode htmlElement of destination element
	 * @param {Number}      output              output number
	 * @param {Number}      input               input number
	 * 
	 * @return {Object}                         Connector object
	 */
    
    this.getConnection = function(htmlDestinationNode, output, input){
        for (var id in this.canvas.htmlConnectors) {
            if (this.canvas.htmlConnectors[id].source.id == this.id 
                && this.canvas.htmlConnectors[id].destination.id == htmlDestinationNode.getAttribute("id")) {
                if (this.canvas.htmlConnectors[id].output == output 
                  && this.canvas.htmlConnectors[id].input == input) {
                    return this.canvas.htmlConnectors[id];
                }
            }
        }
    }
    
    this.hasSquares = function(){
        for (var id in this.squarePool) {
            if (this.squarePool[id]) {
                return true;
            }
        }
        return false;
    }
    
	/**
	 * Function change rotation, vertical and horzontal flipping
	 * of block element and paint new image  
	 * 
	 * @param {String} rotation block rotation
	 * @param {Number} fliph    block horizontal flip
	 * @param {Number} flipv    block vertical flip
	 */
	
    this.changeRotation = function(rotation, fliph, flipv){
        if (_self.type == " ") {
            return;
        }
        
        rotation = parseInt(rotation);
        
        if (rotation || rotation == 0) {
            if (this.rotation !== rotation) {
                this.rotation = rotation;
            }
        }
        if (fliph) {
            this.fliph = fliph;
        }
        if (flipv) {
            this.flipv = flipv;
        }
        
        var flip = "none";
        
        if (this.fliph == 1 && this.flipv == 0) {
            flip = "horizontal";
        }
        else if (this.fliph == 0 && this.flipv == 1) {
            flip = "vertical";
        }
        
        rot.setValue(this.rotation + " " + flip);
        this.rotateIt(flip, this.rotation, 'rel');
    }
    
    this.initBlock = function(){
        this.canvas.htmlBlocks[this.htmlElement.getAttribute("id")] = this;
        new jpf.flow.DocumentScanner(this, true).scan(this.htmlElement);
    }
    
    this.top = function(){
        return this.currentTop;
    }
    
    this.left = function(){
        return this.currentLeft;
    }
    
    this.width = function(){
        return this.htmlElement.offsetWidth;
    }
    
    this.height = function(){
        return this.htmlElement.offsetHeight;
    }


    this.print = function(){
    
        var output = "";
        
        for (var id in this.blocksInBlock) {
            output += '<li>' + this.blocksInBlock[id].print() + '</li>';
        }
        
        return "block: " + this.id + (output ? "<ul>" + output + "</ul>" : "");
    }
    
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
    }
    
    /**
     * Function move Block to xy position
     * 
     * @param {String} left Block style propertie
     * @param {String} top  Block style propertie
     */
    
    this.move = function(left, top){
        this.htmlElement.style.left = left;
        this.htmlElement.style.top = top;
        
        this.onMove();
    }
    
    /**
     * Function called when Block is on move
     */
    
    this.onMove = function(){        
        this.currentLeft = jpf.flow.calculateOffsetLeft(this.htmlElement) - this.canvas.offsetLeft;
        this.currentTop  = jpf.flow.calculateOffsetTop(this.htmlElement) - this.canvas.offsetTop;
        // notify listeners
        for (var i = 0; i < this.moveListeners.length; i++) {
            this.moveListeners[i].onMove();
        }
    }
    
    this.toString = function(){
        return 'block: ' + this.id;
    }
    
    
    /**
     * Function paint new Block image
     * 
     * @param {String} flip   Block flipp - none/horizontal/vertical 
     * @param {Number} angle  Block rotation
     * @param {String} whence
     */
    
    this.rotateIt = function(flip, angle, whence){
        var p = this.image;
        
        // we store the angle inside the image tag for persistence
        if (!whence) {
            p.angle = ((p.angle == undefined ? 0 : p.angle) + angle) % 360;
        }
        else {
            p.angle = angle;
        }
        
        if (p.angle >= 0) {
            var rotation = Math.PI * p.angle / 180;
        }
        else {
            var rotation = Math.PI * (360 + p.angle) / 180;
        }
        var costheta = Math.cos(rotation);
        var sintheta = Math.sin(rotation);
        
        if (document.all && !window.opera) {
            var canvas = document.createElement('img');
            
            canvas.src = p.src;            
            canvas.style.height = p.height + "px";
            canvas.style.width = p.width + "px";
            
            canvas.style.filter = "progid:DXImageTransform.Microsoft.Matrix(M11=" 
                + costheta + ",M12=" + (-sintheta) + ",M21=" + sintheta 
                + ",M22=" + costheta + ",SizingMethod='auto expand')";
            
            switch (flip) {
                case "horizontal":
                    canvas.style.filter += "progid:DXImageTransform.Microsoft.BasicImage(mirror=1)";
                    break;
                    
                case "vertical":
                    canvas.style.filter += "progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)";
                    break;
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
            
            canvas.style.width  = canvas.width = Math.abs(costheta * canvas.oImage.width) + Math.abs(sintheta * canvas.oImage.height);
            canvas.style.height = canvas.height = Math.abs(costheta * canvas.oImage.height) + Math.abs(sintheta * canvas.oImage.width);
            
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
        canvas.id = p.id;
        canvas.angle = p.angle;
        
        if (p.parentNode) {
            p.parentNode.replaceChild(canvas, p);
        }
        else {
            document.getElementById(canvas.id.slice(1)).replaceChild(canvas, document.getElementById(canvas.id));
        }
    }
}

/**
 * Function manage creating new, changing and removing connections
 *  
 */

jpf.flow.inputServer = {
    inited: false,
    
    init: function(){
        this.inited = true;
        jpf.DragMode.defineMode("jpf.input", this);
    },
    
    start: function(objBlock, input_number, vMB){
        jpf.DragMode.setMode("jpf.input");
        this.objBlock = objBlock;
        this.input_number = input_number;
        this.vMB = vMB;
    },
    
    onmousemove: function(e){
        var e = (e || event);
        jpf.flow.inputServer.vMB.onMove(e);
    },
    
    onmouseup: function(e){
        var e = (e || event);
        var target = (e.target || e.srcElement);
        
        jpf.flow.inputServer.vMB.destroy();
        
        var objInput = jpf.flow.isInput(target);
        if (objInput) {
            jpf.flow.ConnectorManager(objInput.objBlock, objInput.input_number);
            objInput.objBlock.canvas.mode = "normal";
        }
        else {
            jpf.flow.clearConnectorsTemp();
        }
        
        jpf.DragMode.clear();
    },
    
    Input: function(){
        var _self = this;
        this.objBlock;
        this.input_number;
        
        this.oExt = document.createElement('div');
        this.oExt.style.display = "none";
        this.oExt.style.position = "absolute";
        this.oExt.style.border = "1px solid black";
        this.oExt.style.zindex = 9999;
        this.oExt.style.width = "6px";
        this.oExt.style.height = "6px";
        this.oExt.style.backgroundColor = "#8dc63f";
        
        this.setBlock = function(){
            this.objBlock = arguments[0];
            this.i = arguments[1];
            this.input_number = parseInt(this.objBlock.inputList[this.i].name);
            this.objBlock.htmlElement.appendChild(this.oExt);
        }
        
        this.repaint = function(){
            var newposition  = jpf.flow.getNewPosition(this.objBlock.inputList[this.i].position, this.objBlock.rotation);
            input_numbernput = jpf.flow.getPosition(this.i, this.objBlock, newposition, this.objBlock.width(), this.objBlock.height());
            
            input_numbernput.x -= 4;
            input_numbernput.y -= 4;
            
            if (this.objBlock.flipv == 1) {
                if (this.objBlock.rotation == 90) {
                    if (input_numbernput.position == "bottom") {
                        input_numbernput.y += parseInt(this.objBlock.htmlElement.style.height);
                    }
                }
                else if (this.objBlock.rotation == 270) {
                    if (input_numbernput.position == "top") {
                        input_numbernput.y -= parseInt(this.objBlock.htmlElement.style.height);
                    }
                }
            }
            if (this.objBlock.fliph == 1) {
                if (this.objBlock.rotation == 0) {
                    if (input_numbernput.position == "right") {
                        input_numbernput.x += parseInt(this.objBlock.htmlElement.style.width);
                    }
                }
                else if (this.objBlock.rotation == 180) {
                    if (input_numbernput.position == "left") {
                        input_numbernput.x -= parseInt(this.objBlock.htmlElement.style.width);
                    }
               }
            }
            
            this.oExt.style.display = "block";
            this.oExt.style.left = input_numbernput.x + "px";
            this.oExt.style.top  = input_numbernput.y + "px";
        }
        
        this.oExt.onmousedown = function(e){
            var e = (e || event);
            e.cancelBubble = true;
            
            var vMB = new jpf.flow.virtualMouseBlock(_self.objBlock.canvas, e);
            vMB.init();
            
            var hasConnection = _self.objBlock.hasConnectionWithInput(_self.input_number);
            
            if (hasConnection) {
                if (_self.objBlock.canvas.mode == "connection-change") {
                    var t_source = hasConnection.type == "S" 
                        ? hasConnection.connector.source 
                        : hasConnection.connector.destination;
                    var t_destination = hasConnection.type == "S" 
                        ? hasConnection.connector.destination 
                        : hasConnection.connector.source;
                    var t_output = hasConnection.type == "S" 
                        ? hasConnection.connector.output 
                        : hasConnection.connector.input;
                    var t_input = hasConnection.type == "S" 
                        ? hasConnection.connector.input 
                        : hasConnection.connector.output;
                    
                    if (t_source.onremoveconnection) {
                        if (hasConnection.type == "S") {
                            t_source.onremoveconnection([hasConnection.connector.other.xmlNode]);
                        }
                        else {
                            t_destination.onremoveconnection([hasConnection.connector.other.xmlNode]);
                        }
                    }
                    
                    new jpf.flow.addConnector(_self.objBlock.canvas, t_destination, vMB, {
                        output: t_input,
                        input: null,
                        xmlNode: null
                    });
                    jpf.flow.ConnectorManager(t_destination, t_input);
                    jpf.flow.inputServer.start(t_destination, t_input, vMB);
                }
            }
            else {
                if (_self.objBlock.canvas.mode == "connection-add") {
                    new jpf.flow.addConnector(_self.objBlock.canvas, _self.objBlock, vMB, {
                        output: _self.input_number,
                        input: null,
                        xmlNode: null
                    });
                    jpf.flow.ConnectorManager(_self.objBlock, _self.input_number);
                    jpf.flow.inputServer.start(_self.objBlock, _self.input_number, vMB);
                }
            }
        }
    }
}

/**
 * This class creates virtual Block who is using when connection follow
 * the mouse cursor. Virtual Block have similar properties and methods like Block object
 * 
 * @param {Object} canvas Canvas object
 * @param {Event}  e      event
 * 
 */

jpf.flow.virtualMouseBlock = function(canvas, e){
    this.canvas = canvas;
    this.htmlElement = document.createElement('div');
    
    if (!this.htmlElement.getAttribute("id")) {
        jpf.setUniqueHtmlId(this.htmlElement);
    }
    
    this.canvas.htmlElement.appendChild(this.htmlElement);
    this.id = this.htmlElement.getAttribute("id");
    this.moveListeners = new Array();
    this.draggable = true;
    
    this.rotation  = 0;
    this.fliph     = 0;
    this.flipv     = 0;
    this.inputList = [];
    this.inputs    = [];
    this.type      = " ";
    this.image     = null;
    //this.other     = other;	
    
    this.squarePool = {};
    
    this.e = (e || event);
    
    this.currentTop  = this.e.clientY;
    this.currentLeft = this.e.clientX;
    
    var _self = this;
    
    this.visit = function(element){
        if (element == this.htmlElement) {
            // exclude itself
            return true;
        }
        else {
            return false;
        }
    }
    
    this.destroy = function(){
        for (var id in this.canvas.htmlConnectors) {
            if (this.canvas.htmlConnectors[id].source.id == this.id 
              || this.canvas.htmlConnectors[id].destination.id == this.id) {
                this.canvas.htmlConnectors[id].destroy();
            }
        }
        
        this.htmlElement.parentNode.removeChild(this.htmlElement);
        
        delete this.canvas.htmlBlocks[this.htmlElement.id];
    }
    
    this.activateOutputs = function(){
    }
    
    this.deactivateOutputs = function(){
    }
    
    this.getConnection = function(htmlDestinationNode, output, input){
        for (var id in this.canvas.htmlConnectors) {
            if (this.canvas.htmlConnectors[id].source.id == this.id 
              && this.canvas.htmlConnectors[id].destination.id == htmlDestinationNode.getAttribute("id")) {
                if (this.canvas.htmlConnectors[id].output == output 
                  && this.canvas.htmlConnectors[id].input == input) {
                    return this.canvas.htmlConnectors[id];
                }
            }
        }
    }
    
    this.hasSquares = function(){
        for (var id in this.squarePool) {
            if (this.squarePool[id]) {
                return true;
            }
        }
        return false;
    }
    
    this.changeRotation = function(rotation, fliph, flipv){
    
    }
    
    this.init = function(){
        this.htmlElement.style.width = "1px";
        this.htmlElement.style.height = "1px";
        this.htmlElement.style.display = "none";
        
        // inspect block children to identify nested blocks
        new jpf.flow.DocumentScanner(this, true).scan(this.htmlElement);
    }
    
    this.top = function(){
        return this.currentTop;
    }
    
    this.left = function(){
        return this.currentLeft;
    }
    
    this.width = function(){
        return this.htmlElement.offsetWidth;
    }
    
    this.height = function(){
        return this.htmlElement.offsetHeight;
    }
    
    
    /**
     * This function searches for a nested block (or the block itself) with a given id
     */
    this.findBlock = function(blockId){
        var result;
        
        if (!result) {
            for (var id in this.htmlBlocks) {
                result = this.htmlBlocks[id].findBlock(blockId);
            }
        }
        return result;
    }
    
    this.move = function(left, top){
        this.htmlElement.style.left = left;
        this.htmlElement.style.top = top;
        
        this.onMove();
    }
    
    this.onMove = function(e){
        var i;
        
        var pt = _self.htmlElement.parentNode.offsetTop;
        var pl = _self.htmlElement.parentNode.offsetLeft;
        
        var bl = jpf.flow.getBorder(_self.htmlElement.parentNode, "left");
        var bt = jpf.flow.getBorder(_self.htmlElement.parentNode, "top");
        
        this.currentLeft = e.clientX - bl - pl;
        this.currentTop = e.clientY - bt - pt;
        // notify listeners
        for (i = 0; i < this.moveListeners.length; i++) {
            this.moveListeners[i].onMove();
        }
    }
    
    this.rotateIt = function(flip, angle, whence){
    
    }
}


/**
 * This class represents a connector segment, it is drawn via a div element.
 * A segment has a starting point defined by the properties startX and startY, a length,
 * a thickness and an orientation.
 * Allowed values for the orientation property are defined by the constants jpf.flow.UP, jpf.flow.LEFT, jpf.flow.DOWN and jpf.flow.RIGHT.
 * 
 * @param {String} id Segment   id
 * @param {Object} objConnector Connector object
 */
jpf.flow.Segment = function(id, objConnector){
    this.id = id;
    this.htmlElement = document.createElement('div');
    this.htmlElement.id = id;
    this.htmlElement.className = "segment";
    this.htmlElement.style.position = 'absolute';
    this.htmlElement.style.overflow = 'hidden';
    objConnector.htmlElement.appendChild(this.htmlElement);
    
    this.startX;
    this.startY;
    this.length;
    this.thickness;
    this.orientation;
    this.nextSegment;
    this.visible = true;
    this.todelete
    
    var _self = this;
    
    this.htmlElement.onmouseover = function(e){
        if (objConnector.canvas.mode == "normal") {
            for (var id in objConnector.canvas.htmlConnectors) {
                if (objConnector.canvas.htmlConnectors[id] == objConnector) {
                    for (var id2 in objConnector.canvas.htmlConnectors[id].htmlConnectorSegments) {
                        objConnector.canvas.htmlConnectors[id]
                            .htmlConnectorSegments[id2].htmlElement.style.border = "1px solid black";
                    }
                }
            }
        }
    }
    
    this.htmlElement.onmouseout = function(e){
        for (var id in objConnector.canvas.htmlConnectors) {
            if (objConnector.canvas.htmlConnectors[id] == objConnector) {
                for (var id2 in objConnector.canvas.htmlConnectors[id].htmlConnectorSegments) {
                    objConnector.canvas.htmlConnectors[id].htmlConnectorSegments[id2].htmlElement.style.border = "none";
                }
            }
        }
    }
    
    
    this.htmlElement.onclick = function(e){
        var e = (e || event);
        for (var id in objConnector.canvas.htmlConnectors) {
            if (objConnector.canvas.htmlConnectors[id] == objConnector) {
                for (var id2 in objConnector.canvas.htmlConnectors[id].htmlConnectorSegments) {
                    if (objConnector.canvas.htmlConnectors[id].htmlConnectorSegments[id2].htmlElement.className == "selSegment") {
                        objConnector.canvas.htmlConnectors[id].htmlConnectorSegments[id2].htmlElement.className = "segment";
                        objConnector.canvas.htmlConnectors[id].todelete = false;
                    }
                    else {
                        objConnector.canvas.htmlConnectors[id].htmlConnectorSegments[id2].htmlElement.className = "selSegment";
                        objConnector.canvas.htmlConnectors[id].todelete = true;
                        objConnector.canvas.mode = "connection-change";
                    }
                }
            }
        }
    }
    
    this.destroy = function(){
        //deleting phisical object		
        for (var id in jpf.flow.htmlCanvases) {
            for (var id2 in jpf.flow.htmlCanvases[id].htmlConnectors) {
                if (jpf.flow.htmlCanvases[id].htmlConnectors[id2].htmlConnectorSegments[this.htmlElement.id]) {
                    jpf.flow.htmlCanvases[id].htmlConnectors[id2]
                        .htmlConnectorSegments[this.htmlElement.id].htmlElement
                        .parentNode.removeChild(jpf.flow.htmlCanvases[id].htmlConnectors[id2].htmlConnectorSegments[this.htmlElement.id].htmlElement);
                    delete jpf.flow.htmlCanvases[id].htmlConnectors[id2]
                        .htmlConnectorSegments[this.htmlElement.id];
                }
            }
        }
    }
    
    /**
     * draw the segment. This operation is cascaded to next segment if any.
     */
    this.draw = function(){
    
        if (this.visible) 
            this.htmlElement.style.display = 'block';
        else 
            this.htmlElement.style.display = 'none';
        
        switch (this.orientation) {
            case jpf.flow.LEFT:
                this.htmlElement.style.left = (this.startX - this.length) + "px";
                this.htmlElement.style.top = this.startY + "px";
                this.htmlElement.style.width = this.length + "px";
                this.htmlElement.style.height = this.thickness + "px";
                break;
            case jpf.flow.RIGHT:
                this.htmlElement.style.left = this.startX + "px";
                this.htmlElement.style.top = this.startY + "px";
                
                this.htmlElement.style.width = this.length + "px";
                this.htmlElement.style.height = this.thickness + "px";
                break;
            case jpf.flow.UP:
                this.htmlElement.style.left = this.startX + "px";
                this.htmlElement.style.top = (this.startY - this.length) + "px";
                this.htmlElement.style.width = this.thickness + "px";
                this.htmlElement.style.height = this.length + "px";
                break;
            case jpf.flow.DOWN:
                this.htmlElement.style.left = this.startX + "px";
                this.htmlElement.style.top = this.startY + "px";
                this.htmlElement.style.width = this.thickness + "px";
                
                this.htmlElement.style.height = this.length + "px";
                break;
        }
        
        if (this.nextSegment) 
            this.nextSegment.draw();
    }
    
    /**
     * Returns the "left" coordinate of the end point of this segment
     */
    this.getEndX = function(){
        switch (this.orientation) {
            case jpf.flow.LEFT:
                return this.startX - this.length;
            case jpf.flow.RIGHT:
                return this.startX + this.length;
            case jpf.flow.DOWN:
                return this.startX;
            case jpf.flow.UP:
                return this.startX;
        }
    }
    
    /**
     * Returns the "top" coordinate of the end point of this segment
     */
    this.getEndY = function(){
        switch (this.orientation) {
            case jpf.flow.LEFT:
                return this.startY;
            case jpf.flow.RIGHT:
                return this.startY;
            case jpf.flow.DOWN:
                return this.startY + this.length;
            case jpf.flow.UP:
                return this.startY - this.length;
        }
    }
    
    /**
     * Append another segment to the end point of this.
     * If another segment is already appended to this, cascades the operation so
     * the given next segment will be appended to the tail of the segments chain.
     */
    this.append = function(nextSegment){
        if (!nextSegment) 
            return;
        if (!this.nextSegment) {
            this.nextSegment = nextSegment;
            this.nextSegment.startX = this.getEndX();
            this.nextSegment.startY = this.getEndY();
        }
        else 
            this.nextSegment.append(nextSegment);
    }
    
    this.detach = function(){
        var s = this.nextSegment;
        this.nextSegment = null;
        return s;
    }
    
    /**
     * hides this segment and all the following
     */
    this.cascadeHide = function(){
        this.visible = false;
        if (this.nextSegment) 
            this.nextSegment.cascadeHide();
    }
}
/**
 * Connector class. Creates Connection between two Block elements. 
 * 
 * @param {htmlElement}                htmlElement of connector
 * @param {Object} canvas              object canvas
 * @param {Object} objBlockSource      object of source block
 * @param {Object} objBlockDestination object of destination block
 * @param {Hash Array} other           values of output, input and xmlNode
 */
jpf.flow.Connector = function(htmlElement, canvas, objBlockSource, objBlockDestination, other){
    this.htmlLabels = {};
    this.htmlConnectorEnds = {};
    this.htmlConnectorSegments = {};
    
    /**
     * declaring html element
     */
    this.htmlElement = htmlElement;
    
    /**
     * the canvas this connector is in
     */
    this.canvas = canvas;
    
    /**
     * the source block object
     */
    this.source = objBlockSource;
    
    /**
     * the destination block object
     */
    this.destination = objBlockDestination;
    
    /**
     * preferred orientation
     */
    this.preferredSourceOrientation = jpf.flow.AUTO;
    this.preferredDestinationOrientation = jpf.flow.AUTO;
    
    
    /**
     * minimum length for a connector segment.
     */
    this.minSegmentLength = 10;
    
    /**
     * size of the connector, i.e.: thickness of the segments.
     */
    this.size = 1;
    
    /**
     * move listeners, they are notify when connector moves
     */
    this.moveListeners = new Array();
    
    this.firstSegment = null;
    
    this.segmentsPool = null;
    
    this.segmentsNumber = 0;
    
    this.strategy = null;
    
    this.output = other.output;
    this.input = other.input;
    this.other = other;
    this.todelete = false;
    
    var _self = this;
    
    this.destroy = function(){
        //removing Labels
        for (var id2 in this.htmlLabels) {
            this.htmlLabels[id2].destroy();
        }
        //removing ConnectionEnds (Arrows)
        for (var id2 in this.htmlConnectorEnds) {
            this.htmlConnectorEnds[id2].destroy();
        }
        //removing Connection Segments (so entire connection)
        for (var id2 in this.htmlConnectorSegments) {
            this.htmlConnectorSegments[id2].destroy();
        }
        
        this.clearSegments();
        
        delete this.canvas.htmlConnectors[this.htmlElement.id];
        
        this.htmlElement.parentNode.removeChild(this.htmlElement);
    }
    
    this.initConnector = function() {
        if (!this.htmlElement.getAttribute("id")) {
            jpf.setUniqueHtmlId(this.htmlElement);
        }
        
        this.canvas.htmlConnectors[this.htmlElement.getAttribute("id")] = this;
        
        this.id = this.htmlElement.getAttribute("id");
        
        this.strategy = new jpf.flow.drawStrategy(this);
        this.repaint();
        
        this.source.moveListeners.push(this);
        this.destination.moveListeners.push(this);
    }
    
    this.getStartSegment = function(){
        return this.firstSegment;
    }
    
    this.getEndSegment = function(){
        var s = this.firstSegment;
        while (s.nextSegment) 
            s = s.nextSegment;
        return s;
    }
    
    this.getMiddleSegment = function(){
        if (!this.strategy) 
            return null;
        else 
            return this.strategy.getMiddleSegment();
    }
    
    this.createSegment = function(){
        var segment;
        
        // if the pool contains more objects, borrow the segment, create it otherwise
        if (this.segmentsPool) {
            segment = this.segmentsPool;
            this.segmentsPool = this.segmentsPool.detach();
        }
        else {
            var newSegmentID = this.id + "_" + (this.segmentsNumber + 1);
            segment = new jpf.flow.Segment(newSegmentID, _self);
            this.htmlConnectorSegments[newSegmentID] = segment;
            segment.thickness = this.size;
        }
        this.segmentsNumber++;
        
        if (this.firstSegment) 
            this.firstSegment.append(segment);
        else 
            this.firstSegment = segment;
        segment.visible = true;
        return segment;
    }
    
    
    /**
 * Repaints the connector
 */
    this.repaint = function(){
        // check strategies fitness and choose the best fitting one
        
        this.strategy = new jpf.flow.drawStrategy(this);
        
        this.clearSegments();
        this.strategy.paint();
        
        this.firstSegment.draw();
        
        if (this.segmentsPool) 
            this.segmentsPool.draw();
    }
    
    /**
 * Hide all the segments and return them to pool
 */
    this.clearSegments = function(){
        if (this.firstSegment) {
            this.firstSegment.cascadeHide();
            this.firstSegment.append(this.segmentsPool);
            this.segmentsPool = this.firstSegment;
            this.firstSegment = null;
        }
    }
    
    this.selectSegments = function(){
        if (this.firstSegment) {
            this.firstSegment.htmlElement.style.backgroundColor = "red";
        }
    }
    
    this.onMove = function(){
        this.repaint();
        
        // notify listeners
        var i;
        for (i = 0; i < this.moveListeners.length; i++) 
            this.moveListeners[i].onMove();
    }
}


jpf.flow.ConnectorManager = function(objBlock, input_number){
    if (jpf.flow.connectorTemp.length == 0) {
        jpf.flow.connectorTemp.push({
            objBlock: objBlock,
            input_number: input_number
        });
    }
    else {
        var source = jpf.flow.connectorTemp.pop();
        if (source.objBlock.canvas == objBlock.canvas) {
            if (objBlock.oncreateconnection) {
                if (source.objBlock.xmlNode && source.input_number && objBlock.xmlNode && input_number) {
                    objBlock.oncreateconnection(source.objBlock.xmlNode, source.input_number, objBlock.xmlNode, input_number);
                }
                else {
                    jpf.console.info("jpf.flow: Function need all parameters to create connection");
                }
            }
            jpf.flow.clearConnectorsTemp();
        }
        else {
            alert("Cannot make connection between different Canvases");
        }
    }
}

jpf.flow.clearConnectorsTemp = function(){
    jpf.flow.connectorTemp.length = 0;
}

jpf.flow.getNewPosition = function(startPosition, rotation){
    var positions = new Array("top", "right", "bottom", "left", "top", "right", "bottom");
    var rotate = parseInt(rotation) / 90;
    var count = false;
    var counter = 0;
    
    if (rotate > 0) {
        for (var i = 0; i < positions.length; i++) {
            if (count) {
                counter++;
            }
            if (startPosition == positions[i]) {
                count = true;
            }
            
            if (counter == rotate) {
                return positions[i];
            }
        }
    }
    else {
        return startPosition;
    }
    
}

jpf.flow.invertPosition = function(position){
    return position == "left" ? "right" : (position == "right" ? "left" : (position == "top" ? "bottom" : "top"));
}

jpf.flow.getPosition = function(i, objBlock, newposition, w, h){

    //init values with parameters
    var position = objBlock.inputList[i].position;
    var rotation = parseInt(objBlock.rotation);
    var fliph = objBlock.fliph;
    var flipv = objBlock.flipv;
    var x = parseInt(objBlock.inputList[i].x);
    var y = parseInt(objBlock.inputList[i].y);
    var sHeight = objBlock.other.dheight;
    var sWidth = objBlock.other.dwidth;
    
    w = parseInt(w);
    h = parseInt(h);
    
    var t = newposition == "bottom" ? h : 0;
    var l = newposition == "right" ? w : 0;
    
    var input = {
        position: null,
        x: null,
        y: null
    };
    
    if (rotation == 90 || rotation == 270) {
        y = (y * w) / sWidth;
        x = (x * h) / sHeight;
    }
    else {
        x = (x * w) / sWidth;
        y = (y * h) / sHeight;
    }
    
    input.position = newposition;
    
    switch (rotation) {
        case 0:
            switch (position) {
                case "left":
                case "right":
                    input.x = x;
                    input.y = y;
                    break;
                case "top":
                case "bottom":
                    input.x = x;
                    input.y = y;
                    break;
            }
            break;
            
        case 90:
            switch (position) {
                case "left":
                case "right":
                    input.x = l + w - y;
                    input.y = t;
                    if (jpf.isIE || jpf.isOpera) {
                        input.x--;
                    }
                    break;
                case "top":
                case "bottom":
                    input.x = l;
                    input.y = t + x;
                    break;
            }
            break;
            
        case 180:
            switch (position) {
                case "left":
                case "right":
                    input.x = l;
                    input.y = t + h - y;
                    if (jpf.isIE || jpf.isOpera) {
                        input.y--;
                    }
                    break;
                case "top":
                case "bottom":
                    input.x = l + w - x;
                    if (jpf.isIE || jpf.isOpera) {
                        input.x--;
                    }
                    input.y = t;
                    break;
            }
            break;
            
        case 270:
            switch (position) {
                case "left":
                case "right":
                    input.x = l + y;
                    input.y = t;
                    break;
                case "top":
                case "bottom":
                    input.x = l;
                    input.y = t + h - x;
                    if (jpf.isIE || jpf.isOpera) {
                        input.y--;
                    }
                    break;
            }
            break;
        default:
            alert("Default case in getPosition function: " + rotation);
            break;
    }
    
    //Horizontal
    if (fliph == 1 && flipv == 0) {
        if ((input.position == "left" || input.position == "right") 
          && (rotation == 0 || rotation == 180)) {
            input.position = jpf.flow.invertPosition(input.position);
        }
        else if ((input.position == "top" || input.position == "bottom") 
          && (rotation == 0 || rotation == 180)) {
            input.x = w - input.x;
            if (jpf.isIE || jpf.isOpera) {
                input.x--;
            }
        }
        else if ((input.position == "top" || input.position == "bottom") 
          && (rotation == 90 || rotation == 270)) {
            if (jpf.isIE || jpf.isOpera) {
                input.position == "bottom" ? input.x -= 1 : input.x++;
            }
        }
        else if ((input.position == "left" || input.position == "right") 
          && (rotation == 90 || rotation == 270)) {
            input.position = jpf.flow.invertPosition(input.position);
        }
    }
    //Vertical
    else 
        if (fliph == 0 && flipv == 1) {
            if ((input.position == "top" || input.position == "bottom") 
              && (rotation == 0 || rotation == 180)) {
                input.position = jpf.flow.invertPosition(input.position);
                input.y = h - input.y + 2;
            }
            else if ((input.position == "top" || input.position == "bottom") 
              && (rotation == 90 || rotation == 270)) {
                input.position = jpf.flow.invertPosition(input.position);
                input.x = w - input.x;
                if ((jpf.isIE || jpf.isOpera) && input.position == "bottom") {
                    input.x -= 2;
                }
            }
            else if ((input.position == "left" || input.position == "right") 
              && (rotation == 90 || rotation == 270)) {
                input.y = h - input.y;
                if (jpf.isIE || jpf.isOpera) {
                    input.y--;
                }
            }
            else if ((input.position == "left" || input.position == "right") 
              && (rotation == 0 || rotation == 180)) {
                input.y = h - input.y;
                if (jpf.isIE || jpf.isOpera) {
                    input.y--;
                }
            }
        }
    
    return input;
}


jpf.flow.getInput = function(objBlock, output, w, h){
    var input = null;
    //alert(t+" "+l+" "+w+" "+h);
    if (objBlock.inputList.length > 0 && output) {
        for (var i = 0; i < objBlock.inputList.length; i++) {
            if (objBlock.inputList[i].name == output) {
                var newposition = jpf.flow.getNewPosition(objBlock.inputList[i].position, objBlock.rotation);
                return jpf.flow.getPosition(i, objBlock, newposition, w, h);
            }
        }
    }
    else {
        return input = {
            position: "auto"
        };
    }
}

jpf.flow.getOrientation = function(position){
    switch (position) {
        case 'top':
            return jpf.flow.UP;
            break;
        case 'bottom':
            return jpf.flow.DOWN;
            break;
        case 'left':
            return jpf.flow.LEFT;
            break;
        case 'right':
            return jpf.flow.RIGHT;
            break;
        case 'auto':
            return jpf.flow.AUTO;
            break;
    }
}

jpf.flow.drawStrategy = function(connector){
    this.c = connector;
    this.realInput  = null;
    this.realOutput = null;
    //this.segments = new Array();
    
    var sourceLeft   = this.c.source.left();
    var sourceTop    = this.c.source.top();
    var sourceWidth  = this.c.source.width();
    var sourceHeight = this.c.source.height();
    
    var destinationLeft   = this.c.destination.left();
    var destinationTop    = this.c.destination.top();
    var destinationWidth  = this.c.destination.width();
    var destinationHeight = this.c.destination.height();
    
    this.realOutput = jpf.flow.getInput(this.c.source, this.c.output, sourceWidth, sourceHeight);
    this.realInput  = jpf.flow.getInput(this.c.destination, this.c.input, destinationWidth, destinationHeight);
    
    this.startSegment;
    this.endSegment;
    
    this.paint = function(){
        this.startSegment = connector.createSegment();
        this.endSegment = connector.createSegment();
        
        this.createStartLine(this.startSegment, jpf.flow.STICKS_LENGHT, 
            sourceTop, sourceLeft, sourceWidth, sourceHeight, 
            destinationTop, destinationLeft, destinationWidth, destinationHeight, 
            this.realOutput);
        this.createStartLine(this.endSegment, jpf.flow.STICKS_LENGHT, 
            destinationTop, destinationLeft, destinationWidth, destinationHeight, 
            sourceTop, sourceLeft, sourceWidth, sourceHeight, this.realInput);
        
        this.createRestLines(this.startSegment, this.endSegment);
    }
    
    this.createStartLine = function(objSegment, length, t, l, w, h, dt, dl, dw, dh, output){
        objSegment.length = length;
        
        if (output.position !== "auto") {
            objSegment.orientation = jpf.flow.getOrientation(output.position);
        }
        
        testXY.setValue(output.position + ": " + output.y + " / " + output.x);
        switch (output.position) {
            case 'left':
                objSegment.startX = l + 1;
                objSegment.startY = output.y ? t + parseInt(output.y) : t + h / 2;
                break;
            case 'right':
                objSegment.startX = l + w;
                objSegment.startY = output.y ? t + parseInt(output.y) : t + h / 2;
                break;
            case 'top':
                objSegment.startX = output.x ? l + parseInt(output.x) : l + w / 2;
                objSegment.startY = t + 1;
                break;
            case 'bottom':
                objSegment.startX = output.x ? l + parseInt(output.x) : l + w / 2;
                objSegment.startY = t + h;
                
                break;
            case 'auto':
                if (t + h * 1.5 < dt) {
                    objSegment.startX = output.x ? l + parseInt(output.x) : l + w / 2;
                    objSegment.startY = t + h;
                    objSegment.orientation = 8;
                }
                else if (t > dt + dh * 1.5) {
                    objSegment.startX = output.x ? l + parseInt(output.x) : l + w / 2;
                    objSegment.startY = t;
                    objSegment.orientation = 4;
                }
                else {
                    if (l > dl + dw / 2) {
                        objSegment.startX = l;
                        objSegment.startY = output.y ? t + parseInt(output.y) : t + h / 2;
                        objSegment.orientation = 1;
                    }
                    else if (l < dl) {
                        objSegment.startX = l + w;
                        objSegment.startY = output.y ? t + parseInt(output.y) : t + h / 2;
                        objSegment.orientation = 2;
                    }
                    else {
                        objSegment.startX = l;
                        objSegment.startY = output.y ? t + parseInt(output.y) : t + h / 2;
                        objSegment.orientation = 1;
                    }
                }
                break;
        }
        objSegment.draw();
    }
    
    this.createLine = function(startX, startY, length, orientation){
        var objSegment = connector.createSegment();
        objSegment.startX      = startX;
        objSegment.startY      = startY;
        objSegment.orientation = orientation;
        objSegment.length      = length;
    }
    
    this.createRestLines = function(objSSegment, objESegment){
        var l = parseInt(objSSegment.htmlElement.style.left);
        var t = parseInt(objSSegment.htmlElement.style.top);
        var h = parseInt(objSSegment.htmlElement.style.height);
        var w = parseInt(objSSegment.htmlElement.style.width);
        
        var dl = parseInt(objESegment.htmlElement.style.left);
        var dt = parseInt(objESegment.htmlElement.style.top);
        var dh = parseInt(objESegment.htmlElement.style.height);
        var dw = parseInt(objESegment.htmlElement.style.width);
        
        var orient = objSSegment.orientation;
        var dorient = objESegment.orientation;
        
        var l  = orient == 1  ? l  : l + w - 1;//-1 - point_x
        var t  = orient == 4  ? t  : t + h - 1;//-1 - point_y
        var dl = dorient == 1 ? dl : dl + dw - 1;//-1 - point_dx
        var dt = dorient == 4 ? dt : dt + dh - 1;// - point_dy
        if (l > dl) {
            //dX is on the left
            if (t > dt) {
                position = "TL";
            }//dY is above
            else if (t < dt) {
                position = "BL";
            }//dY is under
            else {
                position = "ML";
            }//dY is equal
        }
        else if (l < dl) {
            //dX jest po prawej
            if (t > dt) {
                position = "TR";
            }//dY jest nad
            else if (t < dt) {
                position = "BR";
            }//dY jest pod
            else {
                position = "MR";
            }//dY jest na rï¿½wni
        }
        else {
            //X jest na rï¿½wni
            if (t > dt) {
                position = "TM";
            }//dY jest nad
            else if (t < dt) {
                position = "MM";
            }//dY jest pod
            else {
                position = "BM";
            }//dY jest na rï¿½wni
        }
        
        posXY.setValue(position + objSSegment.orientation + objESegment.orientation);
        
        switch (position + objSSegment.orientation + objESegment.orientation) {
            case "TR41":
            case "TR44":
            case "TR14":
            case "TR11":
                this.createLine(l, dt, t - dt, jpf.flow.DOWN);
                this.createLine(l, dt, dl - l, jpf.flow.RIGHT);
                break;
                
            case "MR41":
                this.createLine(l, t - 1, dl - l, jpf.flow.RIGHT);
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
                this.createLine(l, t, dl - l, jpf.flow.RIGHT);
                break;
                
            case "BR48":
            case "BR41":
            case "BR28":
            case "BR21":
                this.createLine(l, t, (dl - l) / 2, jpf.flow.RIGHT);
                this.createLine(l + (dl - l) / 2, t, dt - t, jpf.flow.DOWN);
                this.createLine(dl - (dl - l) / 2, dt, (dl - l) / 2, jpf.flow.RIGHT);
                break;
                
            case "TM48":
            case "TM44":
            case "TM82":
            case "TM84":
            case "TM22":
            case "TM24":
                this.createLine(dl, dt, t - dt, jpf.flow.DOWN);
                break;
                
            case "TM88":
            case "TM81":
            case "TM42":
            case "TM41":
            case "TM28":
            case "TM21":
            case "TM18":
            case "TM14":
            case "TM12":
            case "TM11":
                this.createLine(dl - 1, dt, t - dt, jpf.flow.DOWN);
                break;
                
            case "TR21":
            case "TR24":
            case "TR81":
            case "TR84":
                this.createLine(l, t, (dl - l) / 2, jpf.flow.RIGHT);
                this.createLine(l + (dl - l) / 2, dt, t - dt, jpf.flow.DOWN);
                this.createLine(l + (dl - l) / 2, dt, (dl - l) / 2, jpf.flow.RIGHT);
                break;
                
            case "BR18":
                this.createLine(l, t, 1 + dt - t, jpf.flow.DOWN);
                this.createLine(l, dt + 1, dl - l, jpf.flow.RIGHT);
                break;
                
            case "BR88":
            case "BR81":
            case "BR11":
                this.createLine(l, t, dt - t, jpf.flow.DOWN);
                this.createLine(l, dt, dl - l, jpf.flow.RIGHT);
                break;
                
            case "BR84":
            case "BR82":
            case "BR14":
            case "BR12":
                this.createLine(l, t, (dt - t) / 2, jpf.flow.DOWN);
                this.createLine(l, t + (dt - t) / 2, dl - l, jpf.flow.RIGHT);
                this.createLine(dl, dt - (dt - t) / 2, (dt - t) / 2, jpf.flow.DOWN);
                break;
                
            case "BR22":
            case "BR24":
            case "BR42":
            case "BR44":
                this.createLine(l, t, dl - l, jpf.flow.RIGHT);
                this.createLine(dl, t, dt - t, jpf.flow.DOWN);
                break;
                
            case "BL84":
            case "BL24":
            case "BL21":
                this.createLine(l, t, 1 + (dt - t) / 2, jpf.flow.DOWN);
                this.createLine(l, t + (dt - t) / 2, l - dl, jpf.flow.LEFT);
                this.createLine(dl, t + (dt - t) / 2, (dt - t) / 2, jpf.flow.DOWN);
                break;
                
            case "BL11":
            case "BL14":
            case "BL41":
            case "BL44":
            case "BL81":
                this.createLine(dl, t, l - dl, jpf.flow.RIGHT);
                this.createLine(dl, t, dt - t, jpf.flow.DOWN);
                break;
                
            case "BL12":
            case "BL18":
            case "BL42":
            case "BL48":
                this.createLine(l - (l - dl) / 2, t, (l - dl) / 2, jpf.flow.RIGHT);
                this.createLine(l - (l - dl) / 2, t, dt - t, jpf.flow.DOWN);
                this.createLine(dl, dt, 1 + (l - dl) / 2, jpf.flow.RIGHT);
                break;
                
            case "BL88":
            case "BL82":
            case "BL28":
            case "BL22":
                this.createLine(l, t, dt - t, jpf.flow.DOWN);
                this.createLine(dl, dt, l - dl, jpf.flow.RIGHT);
                break;
                
            case "TL88":
            case "TL81":
            case "TL18":
            case "TL11":
                this.createLine(dl, t, l - dl, jpf.flow.RIGHT);
                this.createLine(dl, dt, t - dt, jpf.flow.DOWN);
                break;
                
            case "TL41":
                this.createLine(dl, dt, (t - dt) / 2, jpf.flow.DOWN);
                this.createLine(dl, dt + (t - dt) / 2, l - dl, jpf.flow.RIGHT);
                this.createLine(l, dt + (t - dt) / 2, (t - dt) / 2, jpf.flow.DOWN);
                break;
                
            case "TL48":
            case "TL28":
            case "TL21":
                this.createLine(l, t - (t - dt) / 2, (t - dt) / 2, jpf.flow.DOWN);
                this.createLine(dl, t - (t - dt) / 2, l - dl, jpf.flow.RIGHT);
                this.createLine(dl, dt, (t - dt) / 2, jpf.flow.DOWN);
                break;
                
            case "TL12":
            case "TL14":
            case "TL82":
            case "TL84":
                this.createLine(l, t, (l - dl) / 2, jpf.flow.LEFT);
                this.createLine(dl + (l - dl) / 2, dt, t - dt, jpf.flow.DOWN);
                this.createLine(dl, dt, (l - dl) / 2, jpf.flow.RIGHT);
                break;
                
            case "TL44":
            case "TL42":
            case "TL24":
            case "TL22":
                this.createLine(l, dt, t - dt, jpf.flow.DOWN);
                this.createLine(dl, dt, l - dl, jpf.flow.RIGHT);
                break;
                
            case "TR12":
            case "TR18":
            case "TR42":
            case "TR48":
                this.createLine(l, t - (t - dt) / 2, (t - dt) / 2, jpf.flow.DOWN);
                this.createLine(l, t - (t - dt) / 2, 1 + dl - l, jpf.flow.RIGHT);
                this.createLine(dl, dt, (t - dt) / 2, jpf.flow.DOWN);
                break;
                
            case "TR21":
            case "TR24":
            case "TR81":
            case "TR84":
                this.createLine(l, t, (dl - l) / 2, jpf.flow.RIGHT);
                this.createLine(l + (dl - l) / 2, t, t - dt, jpf.flow.UP);
                this.createLine(dl - (dl - l) / 2, dt, (dl - l) / 2, jpf.flow.RIGHT);
                break;
                
            case "TR22":
            case "TR28":
            case "TR82":
            case "TR88":
                this.createLine(dl, dt, 1 + t - dt, jpf.flow.DOWN);
                this.createLine(l, t, dl - l, jpf.flow.RIGHT);
                break;
                
            default:
                switch (position) {
                    case "ML":
                        this.createLine(dl, dt, 1 + l - dl, jpf.flow.RIGHT);
                        break;
                        
                    case "MM":
                        this.createLine(l, t, dt - t, jpf.flow.DOWN);
                        break;
                }
                break;
                
        }
    }
    
}





jpf.flow.ConnectorEnd = function(htmlElement, connector, side){

    this.side = side;
    this.htmlElement = htmlElement;
    this.connector = connector;
    
    if (!this.htmlElement.getAttribute("id")) {
        jpf.setUniqueHtmlId(this.htmlElement);
    }
    this.connector.htmlConnectorEnds[this.htmlElement.getAttribute("id")] = this;
    
    this.connector.canvas.htmlElement.appendChild(htmlElement);
    // strip extension
    if (this.htmlElement.tagName.toLowerCase() == "img") {
        this.src = this.htmlElement.src.substring(0, this.htmlElement.src.lastIndexOf('.'));
        this.srcExtension = this.htmlElement.src.substring(this.htmlElement.src.lastIndexOf('.'));
        this.htmlElement.style.zIndex = jpf.flow.getStyle(this.connector.htmlElement, "z-index");
    }
    
    this.orientation;
    
    this.destroy = function(){
        if (this.connector.htmlConnectorEnds[this.htmlElement.id]) {
            this.connector.htmlConnectorEnds[this.htmlElement.id]
                .htmlElement.parentNode.removeChild(this.connector.htmlConnectorEnds[this.htmlElement.id].htmlElement);
            delete this.connector.htmlConnectorEnds[this.htmlElement.id];
        }
    }
    
    this.repaint = function(){
        this.htmlElement.style.position = 'absolute';
        
        var left;
        var top;
        var segment;
        var orientation;
        
        if (this.side == jpf.flow.START) {
            segment = connector.getStartSegment();
            left = segment.startX;
            top = segment.startY;
            orientation = segment.orientation;
            // swap orientation
            if ((orientation & jpf.flow.VERTICAL) != 0) 
                orientation = (~ orientation) & jpf.flow.VERTICAL;
            else 
                orientation = (~ orientation) & jpf.flow.HORIZONTAL;
        }
        else {
            segment = connector.getEndSegment();
            left = segment.getEndX();
            top = segment.getEndY();
            orientation = segment.orientation;
        }
        
        switch (orientation) {
            case jpf.flow.LEFT:
                top -= (this.htmlElement.offsetHeight - segment.thickness) / 2;
                break;
            case jpf.flow.RIGHT:
                left -= this.htmlElement.offsetWidth;
                top -= (this.htmlElement.offsetHeight - segment.thickness) / 2;
                break;
            case jpf.flow.DOWN:
                top -= this.htmlElement.offsetHeight;
                left -= (this.htmlElement.offsetWidth - segment.thickness) / 2;
                break;
            case jpf.flow.UP:
                left -= (this.htmlElement.offsetWidth - segment.thickness) / 2;
                break;
        }
        
        this.htmlElement.style.left = Math.ceil(left) + "px";
        this.htmlElement.style.top = Math.ceil(top) + "px";
        
        if (this.htmlElement.tagName.toLowerCase() == "img" && this.orientation != orientation) {
            var orientationSuffix;
            switch (orientation) {
                case jpf.flow.UP:
                    orientationSuffix = "u";
                    break;
                case jpf.flow.DOWN:
                    orientationSuffix = "d";
                    break;
                case jpf.flow.LEFT:
                    orientationSuffix = "l";
                    break;
                case jpf.flow.RIGHT:
                    orientationSuffix = "r";
                    break;
            }
            this.htmlElement.src = this.src + "_" + orientationSuffix + this.srcExtension;
        }
        this.orientation = orientation;
    }
    
    this.onMove = function(){
        this.repaint();
    }
}

jpf.flow.SideConnectorLabel = function(connector, htmlElement, side){
    this.connector = connector;
    this.htmlElement = htmlElement;
    this.side = side;
    this.connector.htmlElement.parentNode.appendChild(htmlElement);
    
    if (!this.htmlElement.getAttribute("id")) {
        jpf.setUniqueHtmlId(this.htmlElement);
    }
    this.id = this.htmlElement.id;
    
    this.connector.htmlLabels[this.htmlElement.getAttribute("id")] = this;
    
    this.destroy = function(){
        if (this.connector.htmlLabels[this.htmlElement.id]) {
            this.connector.htmlLabels[this.htmlElement.id].htmlElement
                .parentNode.removeChild(this.connector.htmlLabels[this.htmlElement.id].htmlElement);
            delete this.connector.htmlLabels[this.htmlElement.id];
        }
    }
    
    this.repaint = function(){
        this.htmlElement.style.position = 'absolute';
        var left;
        var top;
        var segment;
        
        if (this.side == jpf.flow.START) {
            segment = this.connector.getStartSegment();
            left = segment.startX;
            top = segment.startY;
            if (segment.orientation == jpf.flow.LEFT) 
                left -= this.htmlElement.offsetWidth;
            if (segment.orientation == jpf.flow.UP) 
                top -= this.htmlElement.offsetHeight;
            
            if ((segment.orientation & jpf.flow.HORIZONTAL) != 0 
              && top < this.connector.getEndSegment().getEndY()) 
                top -= this.htmlElement.offsetHeight;
            if ((segment.orientation & jpf.flow.VERTICAL) != 0 
              && left < this.connector.getEndSegment().getEndX()) 
                left -= this.htmlElement.offsetWidth;
        }
        else {
            segment = this.connector.getEndSegment();
            left = segment.getEndX();
            top = segment.getEndY();
            if (segment.orientation == jpf.flow.RIGHT) 
                left -= this.htmlElement.offsetWidth;
            if (segment.orientation == jpf.flow.DOWN) 
                top -= this.htmlElement.offsetHeight;
            if ((segment.orientation & jpf.flow.HORIZONTAL) != 0 
              && top < this.connector.getStartSegment().startY) 
                top -= this.htmlElement.offsetHeight;
            if ((segment.orientation & jpf.flow.VERTICAL) != 0 
              && left < this.connector.getStartSegment().startX) 
                left -= this.htmlElement.offsetWidth;
        }
        
        this.htmlElement.style.left = Math.ceil(left) + "px";
        this.htmlElement.style.top  = Math.ceil(top) + "px";
    }
    
    this.onMove = function(){
        this.repaint();
    }
}

jpf.flow.MiddleConnectorLabel = function(connector, htmlElement){
    this.connector = connector;
    this.htmlElement = htmlElement;
    
    this.connector.canvas.htmlElement.appendChild(this.htmlElement);
    
    if (!this.htmlElement.getAttribute("id")) {
        jpf.setUniqueHtmlId(this.htmlElement);
    }
    this.connector.htmlLabels[this.htmlElement.getAttribute("id")] = this;
    
    
    this.destroy = function(){
        if (this.connector.htmlLabels[this.htmlElement.id]) {
            this.connector.htmlLabels[this.htmlElement.id].htmlElement
                .parentNode.removeChild(this.connector.htmlLabels[this.htmlElement.id].htmlElement);
            delete this.connector.htmlLabels[this.htmlElement.id];
        }
    }
    
    this.repaint = function(){
        this.htmlElement.style.position = 'absolute';
        
        var left;
        var top;
        var segment = this.connector.getMiddleSegment();
        
        if ((segment.orientation & jpf.flow.VERTICAL) != 0) {
            // put label at middle height on right side of the connector
            top  = segment.htmlElement.offsetTop + (segment.htmlElement.offsetHeight - this.htmlElement.offsetHeight) / 2;
            left = segment.htmlElement.offsetLeft;
        }
        else {
            // put connector below the connector at middle widths
            top  = segment.htmlElement.offsetTop;
            left = segment.htmlElement.offsetLeft + (segment.htmlElement.offsetWidth - this.htmlElement.offsetWidth) / 2;
        }
        
        this.htmlElement.style.left = Math.ceil(left) + "px";
        this.htmlElement.style.top  = Math.ceil(top) + "px";
    }
    
    this.onMove = function(){
        this.repaint();
    }
}

/*
 * Utility functions
 */
/** This method looking for a Block in htmlBlocks hash table.
 *
 * @param {idBlock} Id of Block element
 * @return {objBlock} Block Object
 *
 */
jpf.flow.findBlock = function(blockId){
    for (var id in jpf.flow.htmlCanvases) {
        if (jpf.flow.htmlCanvases[id].htmlBlocks[blockId]) 
            return jpf.flow.htmlCanvases[id].htmlBlocks[blockId];
    }
}

jpf.flow.isBlock = function(htmlElement){
    for (var id in jpf.flow.htmlCanvases) {
        if (jpf.flow.htmlCanvases[id].htmlBlocks[htmlElement.id]) 
            return jpf.flow.htmlCanvases[id].htmlBlocks[htmlElement.id];
    }
}

jpf.flow.isInput = function(htmlElement){
    for (var i = 0; i < jpf.flow.usedInputs.length; i++) {
        if (jpf.flow.usedInputs[i].oExt == htmlElement) {
            return jpf.flow.usedInputs[i];
        }
    }
}
/*cachedInputs : [] 
 usedInputs : [] 	*/
jpf.flow.isSquare = function(htmlElement){
    for (var id in jpf.flow.htmlCanvases) {
        for (var id2 in jpf.flow.htmlCanvases[id].htmlBlocks) {
            if (jpf.flow.htmlCanvases[id].htmlBlocks[id2].squarePool[htmlElement.id]) 
                return jpf.flow.htmlCanvases[id].htmlBlocks[id2].squarePool[htmlElement.id];
        }
    }
}

jpf.flow.isCanvas = function(htmlElement){
    if (htmlElement) {
        return jpf.flow.htmlCanvases[htmlElement.id];
    }
}

jpf.flow.isConnector = function(htmlElement){
    for (var id in jpf.flow.htmlCanvases) {
        if (jpf.flow.htmlCanvases[id].htmlConnectors[htmlElement.id]) 
            return jpf.flow.htmlCanvases[id].htmlConnectors[htmlElement.id];
    }
}

jpf.flow.isConnectorEnd = function(htmlElement){
    for (var id in jpf.flow.htmlCanvases) {
        for (var id2 in jpf.flow.htmlCanvases[id].htmlConnectors) {
            if (jpf.flow.htmlCanvases[id].htmlConnectors[id2].htmlConnectorEnds[htmlElement.id]) {
                return jpf.flow.htmlCanvases[id].htmlConnectors[id2].htmlConnectorEnds[htmlElement.id];
            }
        }
    }
}

jpf.flow.isLabel = function(htmlElement){
    for (var id in jpf.flow.htmlCanvases) {
        for (var id2 in jpf.flow.htmlCanvases[id].htmlConnectors) {
            if (jpf.flow.htmlCanvases[id].htmlConnectors[id2].htmlLabels[htmlElement.id]) {
                return jpf.flow.htmlCanvases[id].htmlConnectors[id2].htmlLabels[htmlElement.id];
            }
        }
    }
}

/**
 * This function calculates the absolute 'top' value for a html node
 */
jpf.flow.calculateOffsetTop = function(obj){
    return obj.offsetTop;
}

/**
 * This function calculates the absolute 'left' value for a html node
 */
jpf.flow.calculateOffsetLeft = function(obj){
    return obj.offsetLeft;
}

jpf.flow.parseBorder = function(obj, side){
    var sizeString = getStyle(obj, "border-" + side + "-width");
    if (sizeString && sizeString != "") {
        if (sizeString.substring(sizeString.length - 2) == "px") 
            return parseInt(sizeString.substring(0, sizeString.length - 2));
    }
    return 0;
}

jpf.flow.hasClass = function(element, className){
    if (!element || !element.className) 
        return false;
    
    var classes = element.className.split(' ');
    var i;
    for (i = 0; i < classes.length; i++) 
        if (classes[i] == className) 
            return true;
    return false;
}

/**
 * This function retrieves the actual value of a style property even if it is set via css.
 */
jpf.flow.getStyle = function(node, styleProp){
    // if not an element
    if (node.nodeType != 1) 
        return;
    
    var value;
    if (node.currentStyle) {
        // ie case 			
        styleProp = jpf.flow.replaceDashWithCamelNotation(styleProp);
        value = node.currentStyle[styleProp];
    }
    else if (window.getComputedStyle) {
        // mozilla case
        value = document.defaultView.getComputedStyle(node, null).getPropertyValue(styleProp);
    }
    
    return value;
}

jpf.flow.replaceDashWithCamelNotation = function(value){
    var pos = value.indexOf('-');
    while (pos > 0 && value.length > pos + 1) {
        value = value.substring(0, pos) + value.substring(pos + 1, pos + 2).toUpperCase() + value.substring(pos + 2);
        pos = value.indexOf('-');
    }
    return value;
}

/**
 * This method creates a new Canvas.
 *
 * @param {htmlElement} Canvas htmlElement
 * @return {Canvas} Canvas object
 */
jpf.flow.getCanvas = function(htmlElement){
    this.newCanvas = null;
    var checkCanvas = jpf.flow.isCanvas(htmlElement);
    
    if (!checkCanvas) {
        this.newCanvas = new jpf.flow.Canvas(htmlElement);
        this.newCanvas.initCanvas();
        return this.newCanvas;
    }
    else {
        return checkCanvas;
    }
}

/**
 * This method creates a new Block on Canvas
 *
 * @param {htmlElement}	Block htmlElement
 * @param {Canvas} Canvas object
 *
 */
jpf.flow.addBlock = function(htmlElement, objCanvas, other){
    if (!jpf.flow.isBlock(htmlElement)) {
        var newBlock = new jpf.flow.Block(htmlElement, objCanvas, other);
        newBlock.initBlock();
        return newBlock;
    }
    else {
        throw new Error(jpf.formErrorString(0, null, "Block exists", "Block exists."))
    }
}

/**
 * This method creates a new Connector on Canvas between two blocks
 *
 * @param {htmlElement}	Connector htmlElement
 * @param {Canvas} Canvas object
 *
 */
jpf.flow.addConnector = function(objCanvas, objBlockSource, objBlockDestination, other){
    this.newConnector = null;
    var htmlElement = objCanvas.htmlElement.appendChild(document.createElement("div"));
    
    if (!jpf.flow.isConnector(htmlElement)) {
        this.newConnector = new jpf.flow.Connector(htmlElement, objCanvas, 
            objBlockSource, objBlockDestination, other);
        
        this.newConnector.initConnector();
    }
    else {
        throw new Error(jpf.formErrorString(0, null, "Getting Flow Connector", "Connector object in use."));
    }
    
    /**This method creaes a new Connector Labels in 3 positions
 *
 * @param {htmlElement} label htmlElement
 * @param {String} position of Label (source, middle, destination)
 */
    this.addLabel = function(htmlElement, position){
        var newElement = null;
        
        switch (position) {
            case 'source':
                newElement = new jpf.flow.SideConnectorLabel(this.newConnector, htmlElement, jpf.flow.START);
                newElement.repaint();
                this.newConnector.moveListeners.push(newElement);
                break;
                
            case 'middle':
                newElement = new jpf.flow.MiddleConnectorLabel(this.newConnector, htmlElement);
                newElement.repaint();
                this.newConnector.moveListeners.push(newElement);
                break;
                
            case 'destination':
                newElement = new jpf.flow.SideConnectorLabel(this.newConnector, htmlElement, jpf.flow.END);
                newElement.repaint();
                this.newConnector.moveListeners.push(newElement);
                break;
        }
    }
    
    /** This method creates connectors Arrows.
 *
 * @param {Object} Arrow htmlElement
 * @param {Object} Arrow position (jpf.flow.START, jpf.flow.END)
 */
    this.addConnectorEnd = function(htmlElement, position){
        var newElement = new jpf.flow.ConnectorEnd(htmlElement, this.newConnector, position);
        newElement.repaint();
        this.newConnector.moveListeners.push(newElement);
    }
    
    
    /** This method sets preferred orientation of Source Block
 *
 * @param {orientation} Prefered Connection Orientation of Source Block (jpf.flow.VERTICAL,jpf.flow.HORIZONTAL, jpf.flow.LEFT, jpf.flow.RIGHT, jpf.flow.UP, jpf.flow.DOWN0
 *
 */
    this.setSourceBlockPrefOrient = function(orientation){
        this.newConnector.preferredSourceOrientation = orientation;
    }
    
    /** This method sets preferred orientation of Destination Block
 *
 * @param {orientation} Prefered Connection Orientation of Source Block (jpf.flow.VERTICAL,jpf.flow.HORIZONTAL, jpf.flow.LEFT, jpf.flow.RIGHT, jpf.flow.UP, jpf.flow.DOWN0
 *
 */
    this.setDestinationBlockPrefOrient = function(orientation){
        this.newConnector.preferredDestinationOrientation = orientation;
    }
}

/** This method removes Block element with his connections from Canvas.
 *
 * @param {htmlElement} Block htmlElement
 *
 */
jpf.flow.removeBlock = function(htmlElement){
    var block = jpf.flow.isBlock(htmlElement);
    block.destroy();
}

/** This method removes Connection Label element from Canvas.
 *
 * @param {htmlElement} Label htmlElement
 *
 */
jpf.flow.removeLabel = function(htmlElement){
    var label = jpf.flow.isLabel(htmlElement);
    label.destroy();
}

/** This method removes ConnectorEnd (Arrow) element from Canvas.
 *
 * @param {htmlElement}  ConnectorEnd htmlElement
 *
 */
jpf.flow.removeConnectorEnd = function(htmlElement){
    var connectorEnd = jpf.flow.isConnectorEnd(htmlElement);
    connectorEnd.destroy();
}

/** This method removes Connector element with his Labels and ConnectorsEnds from Canvas.
 *
 * @param {htmlElement} Connector htmlElement
 *
 */
jpf.flow.removeConnector = function(htmlElement){
    var connector = jpf.flow.isConnector(htmlElement);
    connector.destroy();
    delete connector;
//jpf.alert_r(connector.htmlConnectorSegments);
//jpf.alert_r(connector.segmentsPool);
}

/** This method removes Canvas element with his all elements.
 *
 * @param {htmlElement} Canvas htmlElement
 *
 */
jpf.flow.removeCanvas = function(htmlElement){
    var canvas = jpf.flow.isCanvas(htmlElement);
    canvas.destroy();
}
