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

// #ifdef __JMODALWINDOW || __INC_ALL
// #define __WITH_PRESENTATION 1

//Fix this to only include the widget support when needed is 6Kb

jpf.WinServer = {
    count : 9000,
    wins  : [],
    
    setTop : function(win){
        win.setZIndex(this.count++);
        this.wins.remove(win);
        this.wins.push(win);
        return win;
    },
    
    setNext : function(){
        if (this.wins.length < 2) return;
        var nwin, start = this.wins.shift();
        do {
            if (this.setTop(nwin || start).visible)
                break;
            nwin = this.wins.shift();
        } while (start != nwin);
    },
    
    setPrevious : function(){
        if (this.wins.length < 2) return;
        this.wins.unshift(this.wins.pop());
        var nwin, start = this.wins.pop();
        do {
            if (this.setTop(nwin || start).visible)
                break;
            nwin = this.wins.pop();
        } while (start != nwin);
    },
    
    remove : function(win){
        this.wins.remove(win);	
    }
}

/**
 * Component displaying a skinnable, draggable window with optionally
 * a min, max, edit and close button. This component is also used
 * as a portal widget container. Furthermore this component supports
 * docking in an alignment layout.
 *
 * @classDescription		This class creates a new window
 * @return {ModalWindow} Returns a new window
 * @type {ModalWindow}
 * @constructor
 * @allowchild {components}, {smartbinding}, {anyjml}
 * @addnode components:modalwindow
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.modalwindow = function(pHtmlNode, tagName, jmlNode, isWidget){
    jpf.register(this, "modalwindow", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    this.focussable = true;
    
    /* ***********************
            Inheritance
    ************************/
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    // #ifdef __WITH_DELAYEDRENDER
    this.inherit(jpf.DelayedRender); /** @inherits jpf.DelayedRender */
    // #endif
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"Main" : [["title","@title"]]};
    // #endif

    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/
    
    this.minWT = null;
    this.minHT = null;

    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.setCaption = function(caption){
        this.oTitle.nodeValue = caption;
    }
    
    this.setIcon = function(icon){
        if (!this.oIcon) return;
        
        if (this.oIcon.tagName.toLowerCase() == "img")
            this.oIcon.src = this.iconPath + icon;
        else
            this.oIcon.style.backgroundImage = "url(" + this.iconPath + ")";
    }
    
    this.display = function(center, x, y){
        this.setProperty("visible", true);
        
        if (x)
            this.oExt.style.left = x + "px";
        if (y)
            this.oExt.style.top = y + "px";
        if (center) {
            this.oExt.style.left = Math.max(0, ((jpf.getWindowWidth() 
                - this.oExt.offsetWidth) / 2)) + "px";
            this.oExt.style.top  = Math.max(0, ((jpf.getWindowHeight() 
                - this.oExt.offsetHeight) / 3)) + "px";
        }
        
        if (!this.isModal)
            jpf.WinServer.setTop(this);
    }
    
    //#ifdef __WITH_ALIGNMENT
    
    this.syncAlignment = function(oItem){
        if (oItem.hidden == 3)
            jpf.WinServer.setTop(this);

        if (oItem.state > 0) {
            this.__setStyleClass(this.oExt, this.baseCSSname + "Min",
                [this.baseCSSname + "Edit", this.baseCSSname + "Max"]);
        }
        else {
            this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Min",
                this.baseCSSname + "Edit", this.baseCSSname + "Max"]);
        }
    }
    
    //#endif
    
    this.close = function(){
        this.setProperty("visible", false);
        this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Min",
            this.baseCSSname + "Edit", this.baseCSSname + "Max"]);
        this.dispatchEvent('onclose');
        state[0] = state[1] = state[2] = 1
    }
    
    var state      = [];
    var lastheight = null;
    
    this.min = function(){
        //toggle
        if (state[0] < 0) {
            state[0] = 1;
            this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Min"]);
            
            if (this.aData && this.aData.hidden != 3)
                this.aData.restore();
            else {
                if (this.aData && this.aData.hidden == 3)
                    this.aData.restore();
                this.oExt.style.height = (lastheight 
                    - jpf.compat.getHeightDiff(this.oExt)) + "px";
            }
            
            this.dispatchEvent('onrestore')
        }
        else {
            state[0] = -1;
            state[1] = 1;
            if (state[2] < 1)
                this.max();
            state[2] = 1;
            this.__setStyleClass(this.oExt, this.baseCSSname + "Min", 
                [this.baseCSSname + "Edit", this.baseCSSname + "Max"]);

            if (this.aData && this.aData.hidden != 3)
                this.aData.minimize(this.minheight);
            else{
                if (this.aData && this.aData.hidden == 3)
                    this.aData.minimize(this.minheight);
                lastheight = this.oExt.offsetHeight;
                this.oExt.style.height = Math.max(0, this.minheight 
                    - jpf.compat.getHeightDiff(this.oExt)) + "px";
            }
            
            this.dispatchEvent('onminimize')
        }
        
        if (this.aData)
            this.purgeAlignment();
    }
    
    var startpos = null;
    
    this.max = function(){
        //toggle
        if (state[2] < 0) {
            state[2] = 1;
            this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Max"]);
            
            this.oExt.style.left   = startpos[0];
            this.oExt.style.top    = startpos[1];
            this.oExt.style.width  = startpos[2];
            this.oExt.style.height = startpos[3];
            
            var pNode = (this.oExt.parentNode == document.body 
                ? document.documentElement 
                : this.oExt.parentNode);
            pNode.style.overflow = startpos[4];
            
            jpf.layoutServer.play(this.pHtmlNode);
            if (this.aData && this.aData.state > 0 && this.aData.hidden != 3) {
                this.aData.restore();
                this.purgeAlignment();
            }
            
            this.dispatchEvent('onrestore')
        }
        else {
            state[2] = -1;
            state[1] = 1;
            if (state[0] < 1)
                this.min();
            state[0] = 1;
            this.__setStyleClass(this.oExt, this.baseCSSname + "Max", 
                [this.baseCSSname + "Min", this.baseCSSname + "Edit"]);

            var pNode = (this.oExt.parentNode == document.body 
                ? document.documentElement 
                : this.oExt.parentNode);
            startpos = [this.oExt.style.left, this.oExt.style.top, 
                this.oExt.style.width, this.oExt.style.height, pNode.style.overflow];
            
            var diff    = jpf.compat.getDiff(this.oExt);
            var verdiff = diff[1];
            var hordiff = diff[0];
            
            var box = jpf.compat.getBox(jpf.compat.getStyle(this.oExt, "borderWidth"));
            
            pNode.style.overflow = "hidden";
            this.oExt.style.left = (-1 * box[3]) + "px";
            this.oExt.style.top  = (-1 * box[0]) + "px";
            
            var htmlNode = this.oExt;
            jpf.layoutServer.pause(this.pHtmlNode, function(){
                htmlNode.style.width  = (htmlNode.parentNode.offsetWidth 
                    - hordiff + box[1] + box[3]) + "px";
                htmlNode.style.height = (htmlNode.parentNode.offsetHeight 
                    - verdiff + box[0] + box[2]) + "px";
            });
            jpf.WinServer.setTop(this)
            
            this.dispatchEvent('onmaximize')
        }
    }
    
    
    this.edit = function(oHtml){
        //toggle
        if (state[1] < 0) {
            if (this.dispatchEvent('oneditstop') === false) 
                return false;
            
            state[1] = 1;
            this.__setStyleClass(this.oExt, "", [this.baseCSSname + "Edit"]);
            if (oHtml)
                oHtml.innerHTML = "edit"; //hack
        }
        else {
            state[1] = -1;
            state[0] = 1;
            this.__setStyleClass(this.oExt, this.baseCSSname + "Edit", 
                [this.baseCSSname + "Min"]);
            if (oHtml)
                oHtml.innerHTML = "close"; //hack
            
            this.dispatchEvent('oneditstart');
        }
    }
    
    var hEls = [];
    this.__handlePropSet = function(prop, value){
        switch (prop) {
            case "visible":
                if (jpf.isTrue(value)){
                    //if (!x && !y && !center) center = true;
            
                    // #ifdef __WITH_DELAYEDRENDER
                    this.render();
                    // #endif
                    
                    if (this.isModal){ 
                        this.oCover.style.height = Math.max(document.body.scrollHeight,
                            document.documentElement.offsetHeight) + 'px';
                        this.oCover.style.width  = Math.max(document.body.scrollWidth,
                            document.documentElement.offsetWidth) + 'px';
                        this.oCover.style.display = "block";
                    }

                    //!jpf.isIE && 
                    if (jpf.layoutServer)
                        jpf.layoutServer.forceResize(this.oInt); //this should be recursive down
                    
                     this.oExt.style.display = "block";
                    
                    if (this.center) {
                        this.oExt.style.left = Math.max(0, ((jpf.getWindowWidth() 
                            - this.oExt.offsetWidth)/2)) + "px";
                        this.oExt.style.top  = Math.max(0, ((jpf.getWindowHeight() 
                            - this.oExt.offsetHeight)/3)) + "px";
                    }
                    
                    if (!this.isRendered) {
                        this.addEventListener("onafterrender", function(){
                            this.dispatchEvent("ondisplay");
                            this.removeEventListener("ondisplay", arguments.callee);
                        });
                    }
                    else
                        this.dispatchEvent("ondisplay");
                    
                    if (!jpf.canHaveHtmlOverSelects && this.hideSelects) {
                        hEls = [];
                        var nodes = document.getElementsByTagName("select");
                        for (var i = 0; i < nodes.length; i++) {
                            var oStyle = jpf.compat.getStyle(nodes[i], "display");
                            hEls.push([nodes[i], oStyle]);
                            nodes[i].style.display = "none";
                        }
                    }
                }
                else if (jpf.isFalse(value)) {
                    //this.setProperty("visible", false);
                    if (this.isModal)
                        this.oCover.style.display = "none";
                    this.dispatchEvent("onclose");
                    
                    this.oExt.style.display = "none";
                    
                    if (!jpf.canHaveHtmlOverSelects && this.hideSelects) {
                        for (var i = 0; i < hEls.length; i++) {
                            hEls[i][0].style.display = hEls[i][1];
                        }
                    }
                }
                break;
        }
    }
    
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        switch (key) {
            case 27:
                if (this.btnclose && !this.aData)
                    this.close();
                break;
            default:
                break;
        }
    }
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/

    //this should be put in a baseclass and rewritten to use setDragMode
    if (isWidget){
        //Should be moved to an init function
        this.positionHolder = document.body.appendChild(document.createElement("div"));
        
        var winNode = this;
        this.winMouseDown = function(e){
            if (!e) e = event;
            MOVER = this;
            //jpf.Plane.show(MOVER.host.showDragBox());
    
            this.coX = e.clientX;
            this.stX = this.host.oExt.offsetLeft;// - 10
            this.coY = e.clientY;
            this.stY = this.host.oExt.offsetTop;// - 10
    
            var htmlNode = this.host.oExt;
            var p        = this.host.positionHolder;
            p.className  = "position_holder";
            
            htmlNode.parentNode.insertBefore(p, htmlNode);
            //p.style.width = (htmlNode.offsetWidth - 2) + "px";
            p.style.height = (htmlNode.offsetHeight - (jpf.isIE6 ? 0 : 13)) + "px";
            
            var diff     = jpf.compat.getDiff(htmlNode);
            var lastSize = [htmlNode.style.width, htmlNode.style.height];
            htmlNode.style.width = (htmlNode.offsetWidth - diff[0]) + "px";
            //htmlNode.style.height = (htmlNode.offsetHeight - diff[1]) + "px";
            var toX = e.clientX - this.coX + this.stX;
            var toY = e.clientY - this.coY + this.stY;
            htmlNode.style.left = toX + "px";
            htmlNode.style.top  = toY + "px";
            htmlNode.style.position = "absolute";
            htmlNode.style.zIndex   = htmlNode.parentNode.style.zIndex = 100000;
            htmlNode.parentNode.style.position = "relative";
            htmlNode.parentNode.style.left     = "0"; //hack
            jpf.Animate.fade(htmlNode, 0.8);
            
            jpf.DragMode.mode = true;
    
            document.cData       = [htmlNode, p];
            document.onmousemove = this.host.winMouseMove;
            document.onmouseup   = function(){
                document.onmousemove = document.onmouseup = null;
                
                htmlNode.style.position = "";//relative";
                htmlNode.style.left     = 0;
                htmlNode.style.top      = 0;
                htmlNode.style.width    = lastSize[0];
                //htmlNode.style.height = lastSize[1];
                htmlNode.style.zIndex   = htmlNode.parentNode.style.zIndex = 1;
                //htmlNode.parentNode.style.position = "static";
                p.parentNode.insertBefore(htmlNode, p);
                p.parentNode.removeChild(p);
                jpf.Animate.fade(htmlNode, 1);
                
                //Hack, temp fix
                var grids = winNode.getElementsByTagName("datagrid");
                for(var i = 0; i < grids.length; i++) {
                    grids[i].updateWindowSize(true);
                }
                
                //MOVER.host.hideDragBox();
                //jpf.Plane.hide();
                //MOVER.host.set_Top();
                
                jpf.DragMode.mode = null;
            }
            
            e.cancelBubble = true;
            return false;
        }
        
        function insertInColumn(el, ey){
            //search for position
            var pos   = jpf.compat.getAbsolutePosition(el);
            var cy    = ey - pos[1];
            var nodes = el.childNodes;
            for (var th = 0, i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType != 1 
                  || jpf.getStyle(nodes[i], "position") == "absolute")
                    continue;
                th = nodes[i].offsetTop + nodes[i].offsetHeight;
                if (th > cy) {
                    if (th - (nodes[i].offsetHeight / 2) > cy)
                        el.insertBefore(document.cData[1], nodes[i]);
                    else
                        el.insertBefore(document.cData[1], nodes[i].nextSibling);
                    break;	
                }
            }
            if (i == nodes.length)
                el.appendChild(document.cData[1]);	
        }
        
        this.winMouseMove = function(e){
            if (!e) e = event;
            
            var o = MOVER;
            
            var toX = e.clientX - o.coX + o.stX;
            var toY = e.clientY - o.coY + o.stY;
            
            var db  = MOVER.host.oExt;//.host.showDragBox();
            
            //status = "(" + toX + ", " + toY + ")";
            
            db.style.top = "10000px";
            var ex  = e.clientX+document.documentElement.scrollLeft;
            var ey  = e.clientY+document.documentElement.scrollTop;
            var el  = document.elementFromPoint(ex, ey);
            if (el.isColumn){
                insertInColumn(el, ey);
            }
            else {
                //search for element
                while (el.parentNode && !el.isColumn) {
                    el = el.parentNode;
                }
                if (el.isColumn)
                    insertInColumn(el, ey);
                else
                    status = "notfound" + new Date();
            }
            
            db.style.left  = toX + "px";
            db.style.top   = toY + "px";
            
            e.cancelBubble = true;
        }
    }
    else {
        this.winMouseDown = function(e){
            if (!e) e = event;
            //#ifdef __WITH_ALIGNMENT
            if (this.host.aData){
                if (!(state[2] < 0))
                    this.host.startDocking(e);
                return;
            }
            //#endif
            
            if (!this.host.draggable) return;
            
            if (!e) e = event;
            MOVER = this;
            //jpf.Plane.show(MOVER.host.showDragBox());
    
            this.coX = e.clientX;
            this.stX = this.host.oExt.offsetLeft;
            this.coY = e.clientY;
            this.stY = this.host.oExt.offsetTop;
    
            document.onmousemove = this.host.winMouseMove;
            document.onmouseup   = function(){
                document.onmousemove = document.onmouseup = null;
                
                //MOVER.host.hideDragBox();
                //jpf.Plane.hide();
                //MOVER.host.set_Top();
            }
            
            return false;
        }
        
        this.winMouseMove = function(e){
            if(!e) e = event;
            
            var o = MOVER;
            
            var toX = e.clientX - o.coX + o.stX;
            var toY = e.clientY - o.coY + o.stY;
            
            var db = MOVER.host.oExt;//.host.showDragBox();
            
            //status = "(" + toX + ", " + toY + ")";
            
            db.style.left = toX + "px";
            db.style.top  = toY + "px";
            
            //e.cancelBubble = true;
        }
    }
    
    /* *********
        INIT
    **********/
    //#ifdef __WITH_DOCKING
    this.inherit(jpf.Docking); /** @inherits jpf.Docking */
    //#endif
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.setZIndex = function(value){
        this.oExt.style.zIndex = value + 1;
        if (this.isModal)
            this.oCover.style.zIndex = value;
    }

    function addButton(prop, type, func, oButtons){
        if (!this[prop])
            this[prop] = jpf.isTrue(this.jml.getAttribute(prop));
        if (this[prop] && this.__hasLayoutNode(type)) {
            this.__getNewContext(type); 
            var btn = oButtons.appendChild(this.__getLayoutNode(type));
            btn.setAttribute("onclick",     func);
            btn.setAttribute("onmousedown", "jpf.setStyleClass(this, 'down');\
                event.cancelBubble = true;");
            btn.setAttribute("onmouseup",   "jpf.setStyleClass(this, '',\
                ['down'])");
            btn.setAttribute("onmouseover", "jpf.setStyleClass(this, 'hover')");
            btn.setAttribute("onmouseout",  "jpf.setStyleClass(this, '',\
                ['hover', 'down'])");
        }
    }
    
    this.draw = function(){
        this.popout = this.jml.getAttribute("popout") == "true";
        if (this.popout)
            this.pHtmlNode = document.body;
        
        this.oExt = this.__getExternal(null, null, function(oExt){
            var oButtons = this.__getLayoutNode("Main", "buttons", oExt);
            
            addButton.call(this, "btnclose", "CloseBtn", 
                "jpf.lookup(" + this.uniqueId + ").close()", oButtons);
            addButton.call(this, "btnmax",   "MaxBtn", 
                "jpf.lookup(" + this.uniqueId + ").max()",   oButtons);
            addButton.call(this, "btnmin",   "MinBtn", 
                "jpf.lookup(" + this.uniqueId + ").min()",   oButtons);
            
            if (isWidget && $xmlns(this.jml, "config", jpf.ns.jpf).length)
                addButton.call(this, "btnedit", "EditBtn", 
                    "jpf.lookup(" + this.uniqueId + ").edit(this)", oButtons);
        });
        this.oTitle = this.__getLayoutNode("Main", "title", this.oExt);
        this.oIcon  = this.__getLayoutNode("Main", "icon",  this.oExt);
        this.oDrag  = this.__getLayoutNode("Main", "drag",  this.oExt);

        if (!isWidget) {
            var oCover = this.__getLayoutNode("Cover");
            if (oCover) {
                this.oCover = jpf.XMLDatabase.htmlImport(oCover, this.pHtmlNode);
                this.oCover.style.display = "none";
            }
        }
        
        this.movable = this.jml.getAttribute("movable") != "false";
        if (this.movable)
            this.oDrag.onmousedown = this.winMouseDown;
        this.oDrag.host = this;
        
        // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
        if (this.hasFeature(__MULTILANG__))
            this.__makeEditable("Main", this.oExt, this.jml);
        // #endif
        
        if (!this.hasFeature(__DATABINDING__) 
          && (this.jml.getAttribute("smartbinding") 
          || this.jml.getAttribute("actions"))) {
            /** 
             * @inherits jpf.DataBinding
             * @inherits jpf.Transaction
             * @inherits jpf.EditTransaction
             */
            this.inherit(jpf.DataBinding, jpf.Transaction, jpf.EditTransaction);
        }
    }
    
    this.__loadJML = function(x, skinName){
        if (x.getAttribute("minwidth"))
            this.minWT = x.getAttribute("minwidth");
        if (x.getAttribute("minheight"))
            this.minHT = x.getAttribute("minheight");
        if (x.getAttribute("title"))
            this.setCaption(x.getAttribute("title"));
        if (x.getAttribute("icon"))
            this.setIcon(x.getAttribute("icon"));

        //if(x.getAttribute("zindex")) this.setZIndex(x.getAttribute("zindex"));
        
        this.hideSelects = x.getAttribute("hide-selects") == "true";
        this.center      = x.getAttribute("center") == "true";
        this.isModal     = this.oCover && (x.getAttribute("modal") != "false");
        this.draggable   = x.getAttribute("draggable") != "false";
        
        if (this.center)
            this.oExt.style.position = "absolute";
        if (!this.isModal) {
            this.oExt.onmousedown = function(e){
                if (!this.host.aData && !this.host.modal || this.host.aData.hidden == 3)
                    jpf.WinServer.setTop(this.host);
                //(e || event).cancelBubble = true;
            }
        }
        
        jpf.WinServer.setTop(this);
        
        var oInt      = this.__getLayoutNode("Main", "container", this.oExt);
        var oSettings = this.__getLayoutNode("Main", "settings_content", this.oExt);
            
        //jpf.PresentationServer.defaultSkin = skinName;

        if (!isWidget) {
            this.oInt = this.oInt 
                ? jpf.JMLParser.replaceNode(oInt, this.oInt) 
                : jpf.JMLParser.parseChildren(this.jml, oInt, this, true);
        }
        else {
            var oConfig = $xmlns(this.jml, "config", jpf.ns.jpf)[0];
            if (oConfig)
                oConfig.parentNode.removeChild(oConfig);
            var oBody = $xmlns(this.jml, "body", jpf.ns.jpf)[0];//jpf.XMLDatabase.selectSingleNode("j:body", this.jml);
            oBody.parentNode.removeChild(oBody);

            jpf.JMLParser.parseChildren(this.jml, null, this);
            
            if (oConfig)
                this.jml.appendChild(oConfig);
            this.jml.appendChild(oBody);
        
            if (oSettings && oConfig) {
                this.oSettings = this.oSettings 
                    ? jpf.JMLParser.replaceNode(oSettings, this.oSettings) 
                    : jpf.JMLParser.parseChildren(oConfig, oSettings, this, true);
            }
            
            this.oInt = this.oInt 
                ? jpf.JMLParser.replaceNode(oInt, this.oInt) 
                : jpf.JMLParser.parseChildren(oBody, oInt, this, true);
            
            if (oBody.getAttribute("cssclass"))
                this.__setStyleClass(this.oInt, oBody.getAttribute("cssclass"))
        }
        
        //jpf.PresentationServer.defaultSkin = null;
        
        //this.close();
        if (this.isModal)
            this.oCover.style.display = "none";
        if (!this.jml.getAttribute("visible") 
          || jpf.isFalse(this.jml.getAttribute("visible"))){
            this.oExt.style.display = "none";
            this.visible = false;
        }
        
        this.minwidth  = this.__getOption("Main", "min-width");
        this.minheight = this.__getOption("Main", "min-height");
    }	
    
    this.__destroy = function(){
        if (this.oDrag) {
            this.oDrag.host = null;
            jpf.removeNode(this.oDrag);
            this.oDrag = null;
        }
        this.oTitle =  this.oIcon = this.oCover = null;
        
        if (this.oExt)
            this.oExt.onmousedown = null;
    }
}
// #endif
