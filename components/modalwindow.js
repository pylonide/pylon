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
        win.setProperty("zindex", this.count++);
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
 * @todo Please refactor this!
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 * @todo Please, please refactor
 */
jpf.modalwindow = function(pHtmlNode, tagName, jmlNode){
    jpf.register(this, tagName || "modalwindow", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    this.__focussable = true;
    this.state        = "normal";
    this.edit         = false;
    var _self         = this;
    
    this.inherit(jpf.Presentation); /** @inherits jpf.Presentation */
    // #ifdef __WITH_DELAYEDRENDER
    this.inherit(jpf.DelayedRender); /** @inherits jpf.DelayedRender */
    // #endif
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"Main" : [["title","@title"]]};
    // #endif

    /**** Methods ****/
    
    this.setTitle = function(caption){
        this.setProperty("title", caption);
    }
    
    this.setIcon = function(icon){
        this.setProperty("icon", icon);
    }
    
    //@todo show should unset closed
    this.close = function(){
        this.setProperty("state", this.state.split("|")
            .pushUnique("closed").join("|"));
    }
    this.minimize = function(){
        this.setProperty("state", this.state.split("|")
            .remove("maximized")
            .remove("normal")
            .pushUnique("minimized").join("|"));
    }
    this.maximize = function(){
        this.setProperty("state", this.state.split("|")
            .remove("minimized")
            .remove("normal")
            .pushUnique("maximized").join("|"));
    }
    this.restore = function(){
        this.setProperty("state", this.state.split("|")
            .remove("minimized")
            .remove("maximized")
            .pushUnique("normal").join("|"));
    }
    this.edit = function(value){
        this.setProperty("state", this.state.split("|")
            .pushUnique("edit").join("|"));
    }
    this.closeedit = function(value){
        this.setProperty("state", this.state.split("|")
            .remove("edit").join("|"));
    }
    
    var actions  = {
        "min"   : ["minimized", "minimize", "restore"],
        "max"   : ["maximized", "maximize", "restore"],
        "edit"  : ["edit", "edit", "closeedit"],
        "close" : ["closed", "close", "show"]
    };
    this.__toggle = function(type){
        var c = actions[type][0];
        this[actions[type][this.state.indexOf(c) > -1 ? 2 : 1]]();
    }
    
    //#ifdef __WITH_ALIGNMENT
    //@todo change this to use setProperty
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
    
    /**** Properties ****/
    
    //@todo Please add state here min/max etc
    this.__booleanProperties["modal"]       = true;
    this.__booleanProperties["center"]      = true;
    this.__booleanProperties["hideselects"] = true;
    this.__supportedProperties.push("title", "icon", "modal", "minwidth", 
        "minheight", "hideselects", "center", "buttons", "state",
        "maxwidth", "maxheight");
    
    //@todo implement minwidth, minheight, resizable
    this.__propHandlers["modal"] = function(value){
        if (value && !this.oCover) {
            var oCover = this.__getLayoutNode("Cover");
            if (oCover) {
                this.oCover = jpf.xmldb.htmlImport(oCover, this.pHtmlNode);
                
                if (!this.visible)
                    this.oCover.style.display = "none";
                
                this.oCover.style.zIndex = this.zindex;
            }
        }
        
        if (!value && this.oCover) {
            this.oCover.style.display = "none";
        }
    }
    this.__propHandlers["center"] = function(value){        
        this.oExt.style.position = "absolute"; //@todo no unset
    }
    this.__propHandlers["title"] = function(value){
        this.oTitle.nodeValue = value   ;
    }
    this.__propHandlers["icon"] = function(value){
        if (!this.oIcon) return;
        
        this.oIcon.style.display = value ? "block" : "none";
        if (!value)
            return;
        
        if (this.oIcon.tagName.toLowerCase() == "img")
            this.oIcon.src = this.iconPath + value;
        else
            this.oIcon.style.backgroundImage = "url(" + this.iconPath + value + ")";
    }
    
    var hEls = [];
    this.__propHandlers["visible"] = function(value){
        if (jpf.isTrue(value)){
            //if (!x && !y && !center) center = true;
    
            // #ifdef __WITH_DELAYEDRENDER
            this.render();
            // #endif
            
            if (this.oCover){ 
                this.oCover.style.height = Math.max(document.body.scrollHeight,
                    document.documentElement.offsetHeight) + 'px';
                this.oCover.style.width  = Math.max(document.body.scrollWidth,
                    document.documentElement.offsetWidth) + 'px';
                this.oCover.style.display = "block";
            }
            
            this.state = this.state.split("|").remove("closed").join("|");
            
            // #ifdef __WITH_ALIGNMENT
            //if(!this.__noAlignUpdate && this.hasFeature(__ANCHORING__)) this.enableAnchoring(true);//jpf.JmlParser.loaded
            if (!this.__noAlignUpdate && this.hasFeature(__ALIGNMENT__) && this.aData) {
                this.enableAlignment(true);
                //setTimeout(function(value){jmlNode.oExt.style.display = "block";});
            }
            else 
            // #endif
                this.oExt.style.display = "block"; //Some form of inheritance detection
            
            //!jpf.isIE && 
            if (jpf.layoutServer && this.oInt)
                jpf.layoutServer.forceResize(this.oInt); //this should be recursive down
            
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
            
            if (!jpf.canHaveHtmlOverSelects && this.hideselects) {
                hEls = [];
                var nodes = document.getElementsByTagName("select");
                for (var i = 0; i < nodes.length; i++) {
                    var oStyle = jpf.getStyle(nodes[i], "display");
                    hEls.push([nodes[i], oStyle]);
                    nodes[i].style.display = "none";
                }
            }
        }
        else if (jpf.isFalse(value)) {
            //this.setProperty("visible", false);
            if (this.oCover)
                this.oCover.style.display = "none";
            
            this.dispatchEvent("onclose");
            
            // #ifdef __WITH_ALIGNMENT
            if (!this.__noAlignUpdate && this.hasFeature(__ALIGNMENT__) && this.aData) {
                this.disableAlignment(true);
                //setTimeout(function(value){jmlNode.oExt.style.display = "none";});
            }
            else 
            // #endif
                this.oExt.style.display = "none";
            
            if (!jpf.canHaveHtmlOverSelects && this.hideselects) {
                for (var i = 0; i < hEls.length; i++) {
                    hEls[i][0].style.display = hEls[i][1];
                }
            }
        }
    }
        
    /**
     * Unlike other components, this disables all children
     * @todo You might want to move this to all child having 
     *       widgets like bar, container
     */
    this.__propHandlers["disabled"] = function(value){
        function loopChildren(nodes){
            for (var node, i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i];
                node.setProperty("disabled", value);
                
                if (node.childNodes.length)
                    loopChildren(node.childNodes);
            }
        }
        loopChildren(this.childNodes);
    }
    this.__propHandlers["zindex"] = function(value){
        this.oExt.style.zIndex = value + 1;
        if (this.oCover)
            this.oCover.style.zIndex = value;
    }
    var lastheight = null;
    var lastpos    = null;
    var lastState  = {"normal":1};
    this.__propHandlers["state"] = function(value){
        var i, o = {}, s = value.split("|");
        for (i = 0; i < s.length; i++)
            o[s[i]] = true;

        var styleClass = [];
        
        if (!o.maximized && !o.minimized)
            o.normal = true;
        
        //Closed state
        if (o.closed == this.visible) {//change detected
            this.setProperty("visible", !o["closed"]);
            //@todo difference is, we're not clearing the other states, check the docking example
        }
        
        //Restore state
        if (o.normal != lastState.normal 
          || !o.normal && (o.minimized != lastState.minimized 
            || o.maximized != lastState.maximized)) {
            
            if (lastheight) { // this.aData && this.aData.hidden == 3 ??
                this.oExt.style.height = (lastheight 
                    - jpf.getHeightDiff(this.oExt)) + "px";
            }
            
            if (lastpos) {
                this.oExt.style.left   = lastpos[0];
                this.oExt.style.top    = lastpos[1];
                this.oExt.style.width  = lastpos[2];
                this.oExt.style.height = lastpos[3];
                
                var pNode = (this.oExt.parentNode == document.body 
                    ? document.documentElement 
                    : this.oExt.parentNode);
                pNode.style.overflow = lastpos[4];
            }
            
            lastheight = lastpos = null;
            
            //#ifdef __WITH_ALIGNMENT
            if (this.aData) {
                if (this.aData.restore)
                    this.aData.restore();
            
                jpf.layoutServer.play(this.pHtmlNode);
            }
            //#endif
            
            if (o.normal)
                styleClass.push("",
                    this.baseCSSname + "Max", 
                    this.baseCSSname + "Min");
        }
        
        if (o.minimized != lastState.minimized) {
            if (o.minimized) {
                styleClass.unshift(
                    this.baseCSSname + "Min", 
                    this.baseCSSname + "Max", 
                    this.baseCSSname + "Edit");
                
                //#ifdef __WITH_ALIGNMENT
                if (this.aData && this.aData.minimize)
                    this.aData.minimize(this.collapsedHeight);
                //#endif
                
                if (!this.aData || !this.aData.minimize) {
                    lastheight = this.oExt.offsetHeight;
                    this.oExt.style.height = Math.max(0, this.collapsedHeight 
                        - jpf.getHeightDiff(this.oExt)) + "px";
                }
            }
            else {
                styleClass.push(this.baseCSSname + "Min");
            }
        }
        
        if (o.maximized != lastState.maximized) {
            if (o.maximized) {
                styleClass.unshift(
                    this.baseCSSname + "Max", 
                    this.baseCSSname + "Min", 
                    this.baseCSSname + "Edit");
    
                var pNode = (this.oExt.parentNode == document.body 
                    ? document.documentElement 
                    : this.oExt.parentNode);
    
                lastpos = [this.oExt.style.left, this.oExt.style.top, 
                           this.oExt.style.width, this.oExt.style.height, 
                           pNode.style.overflow];
                
                pNode.style.overflow = "hidden";
                this.oExt.style.left = (-1 * marginBox[3]) + "px";
                this.oExt.style.top  = (-1 * marginBox[0]) + "px";
                
                var htmlNode = this.oExt;
                function setMax(){
                    htmlNode.style.width  = (pNode.offsetWidth 
                        - hordiff + marginBox[1] + marginBox[3]) + "px";
                    htmlNode.style.height = (pNode.offsetHeight 
                        - verdiff + marginBox[0] + marginBox[2]) + "px";
                }
                
                //#ifdef __WITH_ALIGNMENT
                if (this.aData)
                    jpf.layoutServer.pause(this.pHtmlNode, setMax);
                else
                //#endif
                    setMax();
                
                jpf.WinServer.setTop(this);
            }
            else {
                styleClass.push(this.baseCSSname + "Max");
            }
        }
        
        if (o.edit != lastState.edit) {
            if (o.edit) {
                styleClass.unshift(
                    this.baseCSSname + "Edit",
                    this.baseCSSname + "Max", 
                    this.baseCSSname + "Min");
                    
                if (this.btnedit)
                    oButtons.edit.innerHTML = "close"; //hack
                
                this.dispatchEvent('oneditstart');
            }
            else {
                if (this.dispatchEvent('oneditstop') === false)
                    return false;
                
                styleClass.push(this.baseCSSname + "Edit");
                if (styleClass.length == 1)
                    styleClass.unshift("");

                if (this.btnedit)
                    oButtons.edit.innerHTML = "edit"; //hack
            }
        }
        
        if (styleClass.length) {
            this.__setStyleClass(this.oExt, styleClass.shift(), styleClass);
            
            this.dispatchEvent('onstatechange', o);
            lastState = o;
            
            //#ifdef __WITH_ALIGNMENT
            if (this.aData && !o.maximized) //@todo is this the most optimal position?
                this.purgeAlignment();
            //#endif
        }
    }
    
    var oButtons = {}
    this.__propHandlers["buttons"] = function(value){
        var buttons = value.split("|");
        var nodes   = this.oButtons.childNodes;
        var re      = new RegExp("(" + value + ")");
        var found   = {};

        //Check if we can 'remove' buttons
        var idleNodes = [];
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1)
                continue;
            
            if (!nodes[i].className || !nodes[i].className.match(re)) {
                nodes[i].style.display = "none";
                this.__setStyleClass(nodes[i], "", ["min", "max", "close", "edit"]);
                idleNodes.push(nodes[i]);
            }
            else 
                found[RegExp.$1] = nodes[i];
        }
        
        //Create new buttons if needed
        for (i = 0; i < buttons.length; i++) {
            if (found[buttons[i]]) {
                this.oButtons.insertBefore(found[buttons[i]], this.oButtons.firstChild);
                continue;
            }
            
            var btn = idleNodes.pop();
            if (!btn) {
                this.__getNewContext("button"); 
                btn = this.__getLayoutNode("button");
                setButtonEvents(btn);
                btn = jpf.xmldb.htmlImport(btn, this.oButtons);
            }
            
            this.__setStyleClass(btn, buttons[i], ["min", "max", "close", "edit"]);
            btn.onclick = new Function("jpf.lookup(" + this.uniqueId + ").__toggle('" 
                                       + buttons[i] + "')");
            btn.style.display = "block";
            oButtons[buttons[i]] = btn;
            this.oButtons.insertBefore(btn, this.oButtons.firstChild);
        }
    }
    
    /**** Keyboard ****/
    
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        switch (key) {
            case 27:
                if (this.buttons.indexOf("close") > -1 && !this.aData)
                    this.close();
                break;
            default:
                break;
        }
    }
    
    function setButtonEvents(btn){
        btn.setAttribute("onmousedown", 
            "jpf.setStyleClass(this, 'down');\
             event.cancelBubble = true;");
        btn.setAttribute("onmouseup",   
            "jpf.setStyleClass(this, '', ['down'])");
        btn.setAttribute("onmouseover", 
            "jpf.setStyleClass(this, 'hover')");
        btn.setAttribute("onmouseout",  
            "jpf.setStyleClass(this, '', ['hover', 'down'])");
    }
    
    /**** Init ****/

    //#ifdef __WITH_DOCKING
    this.inherit(jpf.Docking); /** @inherits jpf.Docking */
    //#endif
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    var marginBox;
    this.draw = function(){
        this.popout = jpf.isTrue(this.jml.getAttribute("popout"));
        if (this.popout)
            this.pHtmlNode = document.body;
        
        this.oExt = this.__getExternal(null, null, function(oExt){
            var oButtons = this.__getLayoutNode("Main", "buttons", oExt);
            
            var len = (this.jml.getAttribute("buttons") || "").split("|").length;
            for (var btn, i = 0; i < len; i++) {
                this.__getNewContext("button"); 
                btn = oButtons.appendChild(this.__getLayoutNode("button"));
                setButtonEvents(btn);
            }
        });
        this.oTitle   = this.__getLayoutNode("Main", "title", this.oExt);
        this.oIcon    = this.__getLayoutNode("Main", "icon",  this.oExt);
        this.oDrag    = this.__getLayoutNode("Main", "drag",  this.oExt);
        this.oButtons = this.__getLayoutNode("Main", "buttons",  this.oExt);
        this.oDrag.host = this;
        this.oIcon.style.display = "none";

        this.oDrag.onmousedown = function(e){
            if (!e) e = event;
            
            if (lastState.maximized)
                return false;
            
            //#ifdef __WITH_ALIGNMENT
            if (this.host.aData){
                if (lastState.normal) //@todo
                    _self.startDocking(e);
                return false;
            }
            //#endif
        };
        this.oExt.onmousedown = function(){
            //Set ZIndex on oExt mousedown
            if (!_self.isWidget && (!_self.aData || _self.aData.hidden == 3))
                jpf.WinServer.setTop(_self);
            
            if (!lastState.normal)
                return false;
        }
        this.oExt.onmousemove = function(){
            if (!lastState.normal)
                return false;
        }

        var diff = jpf.getDiff(this.oExt);
        hordiff  = diff[0];
        verdiff  = diff[1];
        marginBox = jpf.getBox(jpf.getStyle(this.oExt, "borderWidth"));

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
    
    this.__loadJML = function(x){
        jpf.WinServer.setTop(this);
        
        var oInt      = this.__getLayoutNode("Main", "container", this.oExt);
            
        this.oInt = this.oInt 
            ? jpf.JmlParser.replaceNode(oInt, this.oInt) 
            : jpf.JmlParser.parseChildren(this.jml, oInt, this, true);

        if (this.draggable === undefined) {
            (this.__propHandlers.draggable 
                || jpf.JmlNode.propHandlers.draggable).call(this, true);
            this.draggable = true;
        }

        if (this.modal === undefined) {
            this.__propHandlers.modal.call(this, true);
            this.modal = true;
        }
        
        //Set default visible hidden
        if (!this.visible) {
            this.oExt.style.display = "none";
            
            if (this.oCover)
                this.oCover.style.display = "none";
        }
        
        this.collapsedHeight = this.__getOption("Main", "collapsed-height");
        
        if (this.minwidth === undefined)
            this.minwidth  = this.__getOption("Main", "min-width");
        if (this.minheight === undefined)
            this.minheight = this.__getOption("Main", "min-height");
        if (this.maxwidth === undefined)
            this.maxwidth  = this.__getOption("Main", "max-width");
        if (this.maxheight === undefined)
            this.maxheight = this.__getOption("Main", "max-height");
    }	
    
    this.__destroy = function(){
        if (this.oDrag) {
            this.oDrag.host = null;
            this.oDrag.onmousedown = null;
            jpf.removeNode(this.oDrag);
            this.oDrag = null;
        }

        this.oTitle =  this.oIcon = this.oCover = null;
        
        for (var name in oButtons) {
            oButtons[name].onclick = null;
        }
        
        if (this.oExt) {
            this.oExt.onmousedown = null;
            this.oExt.onmousemove = null;
        }
    }
}
// #endif
