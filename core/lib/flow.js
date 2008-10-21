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
    isdraged           : false,
    htmlCanvases       : {},

    cachedInputs       : [], /* cached Block inputs */
    usedInputs         : [], /* used Block inputs */

    connectionsTemp    : null,

    inputManager       : null,
    connectionsManager : null,

    sSize : 1,
    fsSize : 10,

    init : function() {
        jpf.flow.inputsManager = new jpf.flow.inputsManager;
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
            
            if(!objBlock) 
                return;

            var sx = e.clientX, sy = e.clientY,
                dx, dy,
                l = parseInt(target.style.left), t = parseInt(target.style.top),
                hideSquares = true, obm = jpf.flow.onbeforemove;

            if (!jpf.isIE6) {
                e.preventDefault();
            }

            document.onmousemove = function(e) {
                e = (e || event);
                dx = e.clientX - sx;
                dy = e.clientY - sy;

                target.style.left = (l + dx) + "px";
                target.style.top = (t + dy) + "px";
                objBlock.onMove();
                
                if (obm && hideSquares) {
                    jpf.flow.onbeforemove();
                    jpf.flow.inputsManager.hideInputs();
                    jpf.console.info("hideInputs - onbefore move")
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
 * Creates canvas.
 * 
 * @param {htmlElement} htmlElement
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
        jpf.flow.htmlCanvases[this.htmlElement.getAttribute("id")] = this;
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
        if(jpf.flow.isdraged)
            return;
        jpf.flow.inputsManager.showInputs(_self);
        jpf.console.info("showInputs from Block hover")
    }

    this.htmlElement.onmouseout = function(e) {
        if(jpf.flow.isdraged)
            return;
            
        e = e || event;
        var t = e.relatedTarget || e.toElement;
        if (jpf.flow.isCanvas(t)) {
            jpf.flow.inputsManager.hideInputs();
        }
    }
};

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
        this.htmlElement.style.left = x + "px";
        this.htmlElement.style.top  = y + "px";
    };

    this.htmlElement.onmouseout = function(e) {
        if(jpf.flow.isdraged) 
            return;
        jpf.flow.inputsManager.hideInputs();
    };

    var connection;
    this.htmlElement.onmousedown = function(e) {
        e = (e || event);
        e.cancelBubble = true;

        var pn = _self.htmlElement.parentNode;
        var canvas = _self.objBlock.canvas;
        var mode = canvas.mode;

        if (!jpf.isIE6) {
            e.preventDefault();
        }
        
        var vMB = new jpf.flow.virtualMouseBlock(canvas, e);

        switch(mode) {
            case "normal":
                break;
            case "connection-change":
                var con = jpf.flow.findConnector(_self.objBlock, _self.number);
                if (con) {
                    var source = con.source ? con.connector.objDestination : con.connector.objSource;
                    var sourceInput = con.source ? con.connector.other.input : con.connector.other.output;

                    _self.objBlock.onremoveconnection([con.connector.other.xmlNode]);
                    jpf.flow.removeConnector(con.connector.htmlElement);
    
                    connection = new jpf.flow.addConnector(canvas , source, vMB, {output : sourceInput});
                    jpf.flow.connectionsManager.addBlock(source, sourceInput);
                }
                break;
            case "connection-add":
                connection = new jpf.flow.addConnector(canvas , _self.objBlock, vMB, {output : _self.number});
                jpf.flow.connectionsManager.addBlock(_self.objBlock, _self.number);
                break;
        }

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
        }

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
                    
                    jpf.flow.connectionsManager.clear();
                    
                    _self.objBlock.canvas.setMode("normal");
                    break;
            }
        }
    };
    
    this.htmlElement.onmouseup = function(e) {
        var mode = _self.objBlock.canvas.mode;
    
        switch(mode) {
            case "normal":
                break;
            case "connection-change":
            case "connection-add":
                if (connection) {
                    jpf.flow.removeConnector(connection.newConnector.htmlElement);
                }
                jpf.flow.connectionsManager.addBlock(_self.objBlock, _self.number);                
                _self.objBlock.canvas.setMode("normal");
                break;
        }
    }
    
}

jpf.flow.connectionsManager = function() {
    this.addBlock = function(objBlock, inputNumber) {
        var s = jpf.flow.connectionsTemp;

        if (!s) {
            jpf.flow.connectionsTemp = {objBlock : objBlock, inputNumber : inputNumber};
        }
        else {
            objBlock.oncreateconnection(s.objBlock.other.xmlNode, s.inputNumber, objBlock.other.xmlNode, inputNumber);
            this.clear();
        }
    };

    this.clear = function() {
        jpf.flow.connectionsTemp = null;
    }
};

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
}

jpf.flow.virtualMouseBlock = function(canvas) {
    this.canvas = canvas;
    this.htmlElement = document.createElement('div');

    this.canvas.htmlElement.appendChild(this.htmlElement);

    this.htmlElement.style.display = "block";
    this.moveListeners             = new Array();
    this.draggable                 = true;

    var pn = this.htmlElement.parentNode;
    jpf.setStyleClass(this.htmlElement, "vMB");
    
    var sX = this.htmlElement.offsetLeft;
    var sY = this.htmlElement.offsetTop;

    var _self = this;

    this.onMove = function(e) {
        e = (e || event);
        var cx = e.clientX;
        var cy = e.clientY;

        var pos = [(parseInt(pn.style.left) || pn.offsetLeft || 0), (parseInt(pn.style.top) || pn.offsetTop || 0)];

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

    this.objSource = objSource;
    this.objDestination = objDestination;
    this.other = other;
    
    this.selected = false;

    this.htmlElement = htmlElement;

    var sSize  = jpf.flow.sSize; //Segment size
    var fsSize = jpf.flow.fsSize; //First segment size

    this.i1 = other.output ? this.objSource.other.inputList[other.output] : {x : 0, y : 0, position : "auto"};
    this.i2 = other.input ? this.objDestination.other.inputList[other.input] : {x : 0, y : 0, position : "auto"};

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

        s[0] = parseInt(this.objSource.htmlElement.style.left);
        s[1] = parseInt(this.objSource.htmlElement.style.top);
        d[0] = parseInt(this.objDestination.htmlElement.style.left);
        d[1] = parseInt(this.objDestination.htmlElement.style.top);

        /* Moving old segments to temporary table */
        for (var i = 0, l = htmlSegments.length; i < l; i++) {
            htmlSegmentsTemp.push(htmlSegments[i]);
        }
        htmlSegments = [];

        var sIPos = this.objSource.updateInputPos(this.i1);
        var dIPos = this.objDestination.updateInputPos(this.i2);
        var sO = sIPos[2];
        var dO = dIPos[2];

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
                      + (sO == "left" ? 1 : (sO == "right" ? 2 : sO == "top" ? 4 : 8))
                      + (dO == "left" ? 1 : (dO == "right" ? 2 : dO == "top" ? 4 : 8));
        //rot.setValue(condition)
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
                        l = this.createSegment(l, [Math.abs(d[1] - s[1]), "bottom"]);
                        break;
                }
                break;
        }

        for (var i = 0, l = htmlSegmentsTemp.length; i < l; i++) {
            htmlSegmentsTemp[i].style.display = "none";
        }
    }
    
    this.createSegment = function(coor, lines) {
        var or = lines[1], l = lines[0];
        var sX = coor[0], sY = coor[1];
        var segment = htmlSegmentsTemp.shift();

        if (!segment) {
            var segment = htmlElement.appendChild(document.createElement("div"));
            jpf.setUniqueHtmlId(segment);
            jpf.setStyleClass(segment, "segment");
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
            _self.selected = _self.selected == true ? false : true;
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
                jpf.setStyleClass(segments[i], "", ["segment"+type]);
            }
        }
    };

    this.select = function(type) {
        var segments = this.htmlElement.childNodes;

        for (var i = 0, l = segments.length; i < l; i++) {
            if ((segments[i].className || "").indexOf("segment") != -1) {
                jpf.setStyleClass(segments[i], "segment"+type);
            }
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

jpf.flow.isInput = function(htmlElement) {
    for(var i = 0, inp = jpf.flow.usedInputs, l = inp.length; i < l; i++) {
        if (inp[i].htmlElement == htmlElement) {
            return inp[i];
        }
    }
};

jpf.flow.findConnector = function(objBlock, iNumber, objBlock2, iNumber2) {
    var c = jpf.flow.htmlCanvases;
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
                    if (cobjS.id == objBlock.id && co == iNumber && cobjD.id == objBlock2.id && ci == iNumber2) {
                        return {connector : connectors[id2], source : true};
                    }
                    else if (cobjD.id == objBlock.id && ci == iNumber && cobjS.id == objBlock2.id && co == iNumber2) {
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


jpf.flow.isConnector = function(htmlElement) {
    var c = jpf.flow.htmlCanvases;
    for (var id in c) {
        if (c[id].htmlConnectors[htmlElement.id])
            return c[id].htmlConnectors[htmlElement.id];
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
jpf.flow.addBlock = function(htmlElement, objCanvas, other) {
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
    this.newConnector = new jpf.flow.connector(htmlElement, c, s, d, o);
    this.newConnector.initConnector();
}

/** This method removes Connector element with his Labels and ConnectorsEnds from Canvas.
 *
 * @param {htmlElement} Connector htmlElement
 *
 */
jpf.flow.removeConnector = function(htmlElement) {
    var connector = jpf.flow.isConnector(htmlElement);
    if (connector) {
        connector.destroy();
    }
    delete connector;
};

/* Temporary functions */
jpf.flow.vardump = function(obj, depth, recur) {
            if(!obj) return obj + "";
            if(!depth) depth = 0;
        
            switch(obj.dataType){
                case "string":    return "\"" + obj + "\"";
                case "number":    return obj;
                case "boolean": return obj ? "true" : "false";
                case "date": return "Date[" + new Date() + "]";
                case "array":
                    var str = "{\n";
                    for(var i=0;i<obj.length;i++){
                        str += "     ".repeat(depth+1) + i + " => " + (!recur && depth > 0 ? typeof obj[i] : jpf.flow.vardump(obj[i], depth+1, !recur)) + "\n";
                    }
                    str += "     ".repeat(depth) + "}";
                    
                    return str;
                default:
                    if(typeof obj == "function") return "function";
                    //if(obj.xml) return depth==0 ? "[ " + obj.xml + " ]" : "XML Element";
                    if(obj.xml || obj.serialize) return depth==0 ? "[ " + (obj.xml || obj.serialize()) + " ]" : "XML Element";
                    
                    if(!recur && depth>0) return "object";
                
                    //((typeof obj[prop]).match(/(function|object)/) ? RegExp.$1 : obj[prop])
                    var str = "{\n";
                    for(prop in obj){
                        try{
                            str += "     ".repeat(depth+1) + prop + " => " + (!recur && depth > 0? typeof obj[prop] : jpf.flow.vardump(obj[prop], depth+1, !recur)) + "\n";
                        }catch(e){
                            str += "     ".repeat(depth+1) + prop + " => [ERROR]\n";
                        }
                    }
                    str += "     ".repeat(depth) + "}";
                    
                    return str;
            }
        }

        jpf.flow.alert_r = function(obj, recur){
            alert(jpf.flow.vardump(obj, null, !recur));
        }
/* Temporary functions */

//#endif