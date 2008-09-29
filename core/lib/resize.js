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

jpf.resizeServer = {
    inited    : false,
    dragdata  : {},
    proportion: null,
    
    init: function(){
        this.inited = true;
        jpf.dragmode.defineMode("jpf.resize", this);
    },
    
    start: function(objSquare){
        jpf.dragmode.setMode("jpf.resize");
        this.objSquare = objSquare;
    },
    
    onmousemove: function(e){
        e = e || window.event;
        var objSquare = jpf.resizeServer.objSquare;
        
        var htmlBElement = objSquare.resize.htmlElement;
        var oExt = objSquare.oExt;
        
        var posX = objSquare.posX;
        var posY = objSquare.posY;
        
        var borderLeft = jpf.resize.getXBorder(oExt.parentNode, "left");
        var borderTop  = jpf.resize.getXBorder(oExt.parentNode, "top");
        
        var rborderLeft = jpf.resize.getBorder(oExt.parentNode, "left");
        var rborderTop  = jpf.resize.getBorder(oExt.parentNode, "top");
        
        var m = objSquare.resize.m;
        
        var ots = objSquare.oExt.offsetTop;
        var ols = objSquare.oExt.offsetLeft;
        var ows = objSquare.oExt.offsetWidth;
        var ohs = objSquare.oExt.offsetHeight;
        
        var currentMouseX = e.clientX;
        var currentMouseY = e.clientY;
        
        //parent offset     			 
        var pt = htmlBElement.parentNode.offsetTop;
        var pl = htmlBElement.parentNode.offsetLeft;
        
        var w = htmlBElement.offsetWidth;
        var h = htmlBElement.offsetHeight;
        
        var t = htmlBElement.offsetTop + borderTop;
        var l = htmlBElement.offsetLeft + borderLeft;
        
        var cx = jpf.resizeServer.dragdata.cx;
        var cy = jpf.resizeServer.dragdata.cy;
        
        var fixl = 21 + (jpf.isOpera ? rborderLeft : -rborderLeft);
        var fixt = 21 + (jpf.isOpera ? rborderTop : -rborderTop);
        
        var fix2l = jpf.isOpera ? -rborderLeft : rborderLeft;
        var fix2t = jpf.isOpera ? -rborderTop : rborderTop;
        
        var proportion = !jpf.resizeServer.proportion ? h / w : jpf.resizeServer.proportion;
        
        if (e.shiftKey) {
            rot2.setValue(proportion)
            if (posY == "bottom" || posY == "top") {
                if (posX == "left" || posX == "right") {
                    htmlBElement.style.width = (posX == "right" 
                        ? currentMouseX - l - cx - m - pl - fix2l 
                        : (posX == "left" 
                            ? w + l - currentMouseX + (ows - cx) + m - pl - fixl 
                            : w)) + "px";
                    htmlBElement.style.height = parseInt(htmlBElement.style.width) * proportion + "px";
                }
            }
        }
        else {
            htmlBElement.style.width  = Math.max(objSquare.resize.scales.dwidth, 
                (posX == "right" 
                    ? currentMouseX - l - cx - m - pl - fix2l 
                    : (posX == "left" 
                        ? w + l - currentMouseX + (ows - cx) + m - pl - fixl 
                        : w))) + "px";
            htmlBElement.style.height = Math.max(objSquare.resize.scales.dheight, 
                (posY == "bottom" 
                    ? currentMouseY - t - cy - m - pt - fix2t 
                    : (posY == "top" 
                        ? h + t - currentMouseY + (ohs - cy) + m + pt - fixt 
                        : h))) + "px";
        }
        
        htmlBElement.style.left = (posX == "left" 
            ? currentMouseX - (ows - cx) - m + pl + fixl 
            : l) + "px";
        htmlBElement.style.top  = (posY == "top" 
            ? currentMouseY - (ohs - cy) - m - pt + fixt 
            : t) + "px";
        
        objSquare.resize.show();
        
        if (objSquare.resize.onresize) {
            objSquare.resize.onresize();
        }
    },
    
    onmouseup: function(e){
        jpf.dragmode.clear();
        
        var objSquare = jpf.resizeServer.objSquare;
        if (objSquare.resize.onresizedone) {
            objSquare.resize.onresizedone();
            objSquare.resize.show();
        }
    },
    
    /**
     * @constructor
     */
    Square: function(posY, posX, resize){
        var t = 0, l = 0, w = 0, h = 0, c = "pointer";
        
        this.id       = null;
        this.visible  = true;
        this.dragging = 0;
        this.posX     = posX;
        this.posY     = posY;
        this.resize   = resize;
        var _self     = this;
        
        this.repaint = function(){
            if (this.visible) {
                this.oExt.style.display = 'block';
                var htmlElement = this.resize.htmlElement;
                
                var w = htmlElement.offsetWidth;
                var h = htmlElement.offsetHeight;
                var t = htmlElement.offsetTop;
                var l = htmlElement.offsetLeft;
                
                var oW = this.oExt.offsetWidth; // Square offsetWidth
                var oH = this.oExt.offsetHeight; // Square offsetHeight
                var borderl = jpf.resize.getXBorder(this.oExt.parentNode, "left");
                var bordert = jpf.resize.getXBorder(this.oExt.parentNode, "top");
                
                if (jpf.isGecko || jpf.isOpera) {
                    oW -= borderl;
                    oH -= bordert;
                }
                
                t = (posY == "top" 
                    ? t - oH - this.resize.m 
                    : (posY == "middle" 
                        ? (2 * t + h - oH + bordert) / 2 
                        : t + h + this.resize.m + bordert));
                l = (posX == "left" 
                    ? l - oW - this.resize.m 
                    : (posX == "middle" 
                        ? (2 * l + w - oW + borderl) / 2 
                        : l + w + this.resize.m + borderl));
                c = (posY == "middle" 
                    ? "w-resize" 
                    : (posX == "middle" 
                        ? "n-resize" 
                        : (posY + posX == "topleft" || posY + posX == "bottomright") 
                            ? "nw-resize" : "ne-resize"));
                
                this.oExt.style.top = t + "px";
                this.oExt.style.left = l + "px";
                this.oExt.style.width = this.resize.ws + "px";
                this.oExt.style.height = this.resize.hs + "px";
                this.oExt.style.cursor = c;
                //this.oExt.onclick = this.onclick;
            }
            else {
                this.oExt.style.display = 'none';
            }
        }
        
        this.destroy = function(){
            jpf.removeNode(this.oExt);
        }
        
        /* Init */
        
        this.oExt = this.resize.htmlElement.parentNode.appendChild(document.createElement('div'));
        this.oExt.style.position = "absolute";
        this.oExt.style.backgroundColor = "white";
        this.oExt.style.border = "1px solid midnightblue";
        this.oExt.style.zindex = "10000";
        
        this.oExt.onmouseover = function(e){
            _self.oExt.style.backgroundColor = "midnightblue";
            _self.oExt.style.borderColor = "white";
        }
        
        this.oExt.onmouseout = function(e){
            _self.oExt.style.backgroundColor = "white";
            _self.oExt.style.borderColor = "midnightblue";
        }
        
        this.oExt.onmousedown = function(e){
            e = e || window.event;
            jpf.resizeServer.dragdata = {
                cx: e.offsetX || e.layerX, //click X on square
                cy: e.offsetY || e.layerY //click Y on square
            };
            jpf.resizeServer.start(_self);
            var temp = _self.resize.htmlElement.offsetHeight / _self.resize.htmlElement.offsetWidth;
            jpf.resizeServer.proportion = temp;
        }
        
        //Why this?
        if (!this.oExt.getAttribute("id")) 
            jpf.setUniqueHtmlId(this.oExt);
        
        this.id = this.oExt.getAttribute("id");
        this.repaint();
    }
};

jpf.resize = function(){
    this.hs = 6; //square height
    this.ws = 6; //square width
    this.m  = 6; //block margin
    this.scales = {
        scalex    : false,
        scaley    : false,
        scaleratio: false
    };
    
    var squares = []
    
    this.init = function(){
        squares = [
            new jpf.resizeServer.Square("top",    "left",   this),
            new jpf.resizeServer.Square("top",    "middle", this),
            new jpf.resizeServer.Square("top",    "right",  this),
            new jpf.resizeServer.Square("middle", "left",   this),
            new jpf.resizeServer.Square("middle", "right",  this),
            new jpf.resizeServer.Square("bottom", "left",   this),
            new jpf.resizeServer.Square("bottom", "middle", this),
            new jpf.resizeServer.Square("bottom", "right",  this)];
        this.show();
    };
    
    this.grab = function(oHtml, scales){
        this.htmlElement = oHtml;
        this.scales = scales;
        
        if (squares.length) {
            this.show();
        }
        else {
            this.init();
            jpf.resizeServer.init();
        }
    };
    
    this.hide = function(){
        for (var i = 0; i < squares.length; i++) {
            squares[i].visible = false;
            squares[i].repaint();
        }
    };
    
    this.show = function(){
        for (var i = 0; i < squares.length; i++) {
            if (this.scales.scalex && this.scales.scaley) {
                squares[i].visible = true;
                squares[i].repaint();
            }
            else if (this.scales.scaley || this.scales.scalex || this.scales.scaleratio) {
                if (this.scales.scaley && !this.scales.scalex) {
                    if (squares[i].posX == "middle") {
                        squares[i].visible = true;
                        squares[i].repaint();
                    }
                    else {
                        squares[i].visible = false;
                        squares[i].repaint();
                    }
                }
                if (this.scales.scalex && !this.scales.scaley) {
                    if (squares[i].posY == "middle") {
                        squares[i].visible = true;
                        squares[i].repaint();
                    }
                    else {
                        squares[i].visible = false;
                        squares[i].repaint();
                    }
                }
                if (this.scales.scaleratio) {
                    if ((squares[i].posY == "top" || squares[i].posY == "bottom") && squares[i].posX !== "middle") {
                        squares[i].visible = true;
                        squares[i].repaint();
                    }
                    else {
                        squares[i].visible = false;
                        squares[i].repaint();
                    }
                }
            }
            else {
                squares[i].visible = false;
                squares[i].repaint();
            }
        }
    };
    
    this.destroy = function(){
        for (var i = 0; i < squares.length; i++) {
            squares[i].destroy();
        }
    };
};

/** Function returns border size of htmlElement
 *
 * @param {htmlElement} htmlElement
 * @param {String} Border: {left, top, right, bottom}
 */
jpf.resize.getBorder = function(htmlElement, border){
    border.toLowerCase();
    
    if (jpf.isIE) {
        border = border.substr(0, 1).toUpperCase() + border.substr(1);
        return parseInt(jpf.getStyle(htmlElement, "border" + border + "Width"));
    }
    else 
        if (jpf.isGecko) {
            return parseInt(jpf.getStyle(htmlElement, "border-" + border + "-width"));
        }
        else 
            if (jpf.isOpera) {
                return -parseInt(jpf.getStyle(htmlElement, "border-" + border + "-width"));
            }
};

/** Function returns border size of htmlElement depending on if browser needs him to calculations a new position.  
 *
 * @param {htmlElement} htmlElement
 * @param {String} Border: {left, top, right, bottom}
 */
jpf.resize.getXBorder = function(htmlElement, border){
    border.toLowerCase();
    
    if (jpf.isIE) {
        return 0;
    }
    else {
        if (jpf.isGecko) {
            return parseInt(jpf.getStyle(htmlElement, "border-" + border + "-width"));
        }
        else if (jpf.isOpera) {
            return -parseInt(jpf.getStyle(htmlElement, "border-" + border + "-width"));
        }
    }
};

/* Example Code:
    In workflow
    jpf.workflow = function(){
        ...
        var resize;
        var _self = this;
        
        //Code for before move
        if (resize) resize.hide();
        
        //Code for after move
        if (resize) resize.show();
        
        //Code for onafterselect
        this.addEventListener("afterselect", function(){
            if(resize) resize.grab(this.selected);
        });
        
        this.loadJml = function(x) {
            if(!jpf.isFalse(x.getAttribute("resize"))){
                resize = new jpf.resize();
                
                resize.onresizedone = function(){
                    //your code to call the action
                	self.resize();
                }
            }
        }
        ...
    }
*/
