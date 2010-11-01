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

// #ifdef __AMLMODALWINDOW || __INC_ALL

/**
 * @private
 */
apf.WinServer = {
    count : 9000,
    wins  : [],

    setTop : function(win, norecur){
        if (win.zindex || win.modal) 
            return;
        
        if (win.$opened) {
            if (win.$opened.visible)
                return;
            else 
                delete win.$opened;
        }
        
        var topmost;
        if (!norecur && this.wins.length) {
            var topmost = this.wins[this.wins.length - 1];
            if (topmost == win)
                return;
            
            if (!topmost.modal || !topmost.visible)
                topmost = null;
            else if (topmost && win.modal) {
                win.$opener = topmost;
                topmost.$opened = win;
                topmost = null;
            }
        }
        
        this.count += 2;

        win.setProperty("zindex", this.count);
        this.wins.remove(win);
        this.wins.push(win);

        if (topmost)
            this.setTop(topmost, true);

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
 * Element displaying a skinnable, draggable window with optionally
 * a min, max, edit and close button. This element is also used
 * as a portal widget container. Furthermore this element supports
 * docking in an alignment layout.
 * Example:
 * <code>
 *  <a:window 
 *    id        = "winMail"
 *    modal     = "false"
 *    buttons   = "min|max|close"
 *    title     = "Mail message"
 *    icon      = "icoMail.gif"
 *    visible   = "true"
 *    resizable = "true"
 *    minwidth  = "300"
 *    minheight = "290"
 *    width     = "500"
 *    height    = "400">
 *  </a:window>
 * </code>
 *
 * @constructor
 * @define modalwindow
 * @allowchild {elements}, {smartbinding}, {anyaml}
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits apf.Presentation
 * @inherits apf.Transaction
 *
 * @event show          Fires when the window is opened.
 * @event close         Fires when the window is closed.
 * @event editstart     Fires before the user edits the properties of this window. Used mostly for when this window is part of the {@link element.portal}.
 * @event editstop      Fires after the user edited the properties of this window. Used mostly for when this window is part of the {@link element.portal}.
 *   cancelable:   Prevents the edit panel from being closed.
 * @event statechange   Fires after the state of this window changed.
 *   object:
 *   {Boolean} minimized  whether the window is minimized.
 *   {Boolean} maximized  whether the window is maximized.
 *   {Boolean} normal     whether the window has it's normal size and position.
 *   {Boolean} edit       whether the window is in the edit state.
 *   {Boolean} closed     whether the window is closed.
 */
apf.toolwindow  = function(struct, tagName){
    this.$init(tagName || "toolwindow", apf.NODE_VISIBLE, struct);
};

apf.modalwindow = function(struct, tagName){
    this.$init(tagName || "modalwindow", apf.NODE_VISIBLE, struct);
};

apf.AmlWindow = function(struct, tagName){
    this.$init(tagName || "window", apf.NODE_VISIBLE, struct);
};

(function(){
    this.implement(
        apf.BaseStateButtons
    );

    this.$isWindowContainer = true;
    this.collapsedHeight   = 30;
    this.canHaveChildren   = 2;
    this.visible           = false;
    this.showdragging      = false;
    this.kbclose           = false;
    this.$focussable       = apf.KEYBOARD;
    this.$editableCaption  = ["title"];

    /**** Public Methods ****/

    //#ifdef __WITH_CONVENIENCE_API

    /**
     * Sets the title of the window. Call-chaining is supported.
     * @param {String} caption the text of the title.
     */
    this.setTitle = function(caption){
        this.setProperty("title", caption, false, true);
        return this;
    };

    /**
     * Sets the icon of the window. Call-chaining is supported.
     * @param {String} icon the location of the image.
     */
    this.setIcon = function(icon){
        this.setProperty("icon", icon, false, true);
        return this;
    };
    
    //For modal elements
    this.show = function(callback){
        this.execAction = callback; //@todo Proper error handling??
        this.setProperty("visible", true, false, true);
        return this;
    }
    //#endif
    
    //#ifdef __WITH_WINDOW_ANIMATIONS
    
    this.slideIn = function(sFrom, bSticky) {
        if (!sFrom)
            sFrom = "bottom";
        var _center = this.center;
        this.center = false;
        this.setProperty("visible", true);
        this.center = _center;
        
        var iFrom  = 0,
            iTo    = 0,
            innerW = (apf.isIE
                ? this.$ext.offsetParent.offsetWidth
                : window.innerWidth),
            innerH = (apf.isIE
                ? this.$ext.offsetParent.offsetHeight
                : window.innerHeight),
            cX     = Math.max(0, ((innerW - this.$ext.offsetWidth)  / 2)),
            cY     = Math.max(0, ((innerH - this.$ext.offsetHeight) / 3)),
            sType  = "top",
            pad    = 10;

        switch(sFrom) {
            case "top":
                iFrom = -(this.$ext.offsetHeight) - pad;
                iTo   = bSticky ? 0 : cY;
                break;
            case "left":
                iFrom = -(this.$ext.offsetWidth) - pad;
                iTo   = bSticky ? 0 : cX;
                sType = "left";
                break;
            case "bottom":
                iFrom = innerH + this.$ext.offsetHeight + pad;
                iTo   = bSticky ? innerH - this.$ext.offsetHeight : cY;
                break;
            case "right":
                iFrom = innerW + this.$ext.offsetLeft + pad;
                iTo   = bSticky ? innerW - this.$ext.offsetWidth : cX;
                sType = "left";
                break;
        }
        
        apf.tween.single(this.$ext, {
            steps   : apf.isIphone ? 5 : 30,
            interval: 10,
            from    : iFrom,
            to      : iTo,
            type    : sType,
            anim    : apf.tween.EASEIN
        });
        return this;
    };

    this.slideOut = function(sTo) {
        if (!sTo)
            sTo = "bottom";
        var iFrom = 0,
            iTo   = 0,
            sType = "top",
            pad   = 10;

        switch(sTo) {
            case "top":
                iFrom = this.$ext.offsetTop;
                iTo   = -(this.$ext.offsetHeight) - pad;
                break;
            case "left":
                iFrom = this.$ext.offsetLeft;
                iTo   = -(this.$ext.offsetWidth) - pad;
                sType = "left";
                break;
            case "bottom":
                iFrom = this.$ext.offsetTop;
                iTo = (apf.isIE
                    ? this.$ext.offsetParent.offsetHeight
                    : window.innerHeight) + this.$ext.offsetHeight + pad;
                break;
            case "right":
                iFrom = this.$ext.offsetLeft;
                iTo   = (apf.isIE
                    ? this.$ext.offsetParent.offsetWidth
                    : window.innerWidth) + this.$ext.offsetLeft + pad;
                sType = "left";
                break;
        }

        var _self = this;
        apf.tween.single(this.$ext, {
            steps   : apf.isIphone ? 5 : 30,
            interval: 10,
            from    : iFrom,
            to      : iTo,
            type    : sType,
            anim    : apf.tween.EASEOUT,
            onfinish: function() { _self.setProperty("visible", false); }
        });
        return this;
    };
    
    //#endif

    this.bringToFront = function(){
        apf.WinServer.setTop(this);
        return this;
    };

    /**** Properties and Attributes ****/

    this.$booleanProperties["modal"]        = true;
    this.$booleanProperties["center"]       = true;
    this.$booleanProperties["transaction"]  = true;
    this.$booleanProperties["hideselects"]  = true;
    this.$booleanProperties["showdragging"] = true;
    this.$booleanProperties["kbclose"]      = true;
    this.$supportedProperties.push("title", "icon", "modal", "minwidth",
        "minheight", "hideselects", "center", "kbclose",
        "maxwidth", "maxheight", "showdragging", "transaction");

    /**
     * @attribute {Boolean} modal whether the window prevents access to the
     * layout below it.
     */
    this.$propHandlers["modal"] = function(value){
        if (value) {
            if (this.visible)
                apf.plane.show(this.$ext, false, null, null, {
                    color   : "black", 
                    opacity : 0.5,
                    protect : this.$uniqueId
                });
        }
        else { 
            apf.plane.hide(this.$uniqueId);
        }
    };

    /**
     * @attribute {Boolean} center centers the window relative to it's parent's
     * containing rect when shown.
     */
    this.$propHandlers["center"] = function(value){
        this.$ext.style.position = "absolute"; //@todo no unset
    };

    /**
     * @attribute {String} title the text of the title.
     */
    this.$propHandlers["title"] = function(value){
        if (this.oTitle)
            this.oTitle.nodeValue = value;
    };

    /**
     * @attribute {String} icon the location of the image.
     */
    this.$propHandlers["icon"] = function(value){
        if (!this.oIcon) return;

        this.oIcon.style.display = value ? "" : "none";
        apf.skins.setIcon(this.oIcon, value, this.iconPath);
    };
    
    this.$afterRender = function(){
        if (this.center && !this.left && !this.top && !this.right && !this.bottom && !this.anchors) {
            //#ifdef __WITH_LAYOUT
            apf.layout.processQueue();
            //#endif
    
            var size = !this.$ext.offsetParent || this.$ext.offsetParent.tagName == "BODY"
                ? [apf.getWindowWidth(), apf.getWindowHeight()]
                : [this.$ext.offsetParent.offsetWidth, this.$ext.offsetParent.offsetHeight, 0, 0];
    
            if (size.length == 2) {
                size.push(document.documentElement.scrollLeft, 
                  document.documentElement.scrollTop);
            }
            
            //@todo it's better to add this to the layout queue
            this.$ext.style.left = (Math.max(0, ((
                size[0] - parseInt(this.$ext.offsetWidth || 0))/2)) + size[2]) + "px";
            this.$ext.style.top  = (Math.max(0, ((
                size[1] - parseInt(this.$ext.offsetHeight || 0))/3)) + size[3]) + "px";
        }            
        
        // #ifdef __WITH_FOCUS
        //@todo make widget a tagname and alias
        if (this.$amlLoaded && (this.model 
          || (!this.dockable || !this.aData) && !this.$isWidget 
          && this.localName != "toolwindow"))
            this.focus(false, {mouse:true});
        // #endif
        
        this.dispatchEvent("show");
    }

    var hEls = [], wasVisible;
    this.$propHandlers["visible"] = function(value){
        if (apf.isTrue(value)){
            if (this.dispatchEvent("beforeshow") === false)
                return (this.visible = false);
            
            if (this.modal){
                apf.plane.show(this.$ext, false, null, null, {
                    color   : "black", 
                    opacity : 0.5,
                    protect : this.$uniqueId
                });
            }

            this.state = this.state.split("|").remove("closed").join("|");

            this.$ext.style.display = ""; //Some form of inheritance detection

            //if (this.modal) 
                //this.$ext.style.position = "fixed";
            
            if (!apf.canHaveHtmlOverSelects && this.hideselects) {
                hEls = [];
                var nodes = document.getElementsByTagName("select");
                for (var i = 0; i < nodes.length; i++) {
                    var oStyle = apf.getStyle(nodes[i], "display");
                    hEls.push([nodes[i], oStyle]);
                    nodes[i].style.display = "none";
                }
            }

            //if (this.modal)
                //this.$ext.style.zIndex = apf.plane.$zindex - 1;
            
            if (apf.isIE) {
                var cls = this.$ext.className;
                this.$ext.className = "rnd" + Math.random();
                this.$ext.className = cls;
            }
            
            if (this.$rendered === false)
                this.addEventListener("afterrender", this.$afterRender);
            else
                this.$afterRender();
        }
        else { 
            if (this.modal)
                apf.plane.hide(this.$uniqueId);

            this.$ext.style.display = "none";

            if (!apf.canHaveHtmlOverSelects && this.hideselects) {
                for (var i = 0; i < hEls.length; i++) {
                    hEls[i][0].style.display = hEls[i][1];
                }
            }

            if (this.hasFocus())
                apf.window.moveNext(true, this, true);//go backward to detect modals

            this.visible = false;
            
            this.dispatchEvent("hide");
        }
        
        //#ifdef __WITH_LAYOUT
        if (apf.layout && this.$int)
            apf.layout.forceResize(this.$int); //@todo this should be recursive down
        //#endif

        wasVisible = value;
    };

    this.$propHandlers["zindex"] = function(value){
        this.$ext.style.zIndex = value + 1;
    };

    /**** Keyboard ****/

    //#ifdef __WITH_KEYBOARD
    //#ifdef __SUPPORT_IPHONE
    if (!apf.isIphone) {
    //#endif
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;

        /*if (key > 36 && key < 41) {
            if (this.hasFeature && this.hasFeature(apf.__ANCHORING__))
                this.$disableAnchoring();
        }*/

        var retValue = false;
        switch (key) {
            /*case 9:
                break;
            case 13:
                break;
            case 32:
                break;*/
            case 38:
            //UP
                if (shiftKey && this.resizable)
                    this.setProperty("height", Math.max(this.minheight || 0,
                        this.$ext.offsetHeight - (ctrlKey ? 50 : 10)));
                else if (this.draggable)
                    this.setProperty("top",
                        this.$ext.offsetTop - (ctrlKey ? 50 : 10));
                break;
            case 37:
            //LEFT
                if (shiftKey && this.resizable)
                    this.setProperty("width", Math.max(this.minwidth || 0,
                        this.$ext.offsetWidth - (ctrlKey ? 50 : 10)));
                else if (this.draggable)
                    this.setProperty("left",
                        this.$ext.offsetLeft - (ctrlKey ? 50 : 10));
                break;
            case 39:
            //RIGHT
                if (shiftKey && this.resizable)
                    this.setProperty("width", Math.min(this.maxwidth || 10000,
                        this.$ext.offsetWidth + (ctrlKey ? 50 : 10)));
                else if (this.draggable)
                    this.setProperty("left",
                        this.$ext.offsetLeft + (ctrlKey ? 50 : 10));
                break;
            case 40:
            //DOWN
                if (shiftKey && this.resizable)
                    this.setProperty("height", Math.min(this.maxheight || 10000,
                        this.$ext.offsetHeight + (ctrlKey ? 50 : 10)));
                else if (this.draggable)
                    this.setProperty("top",
                        this.$ext.offsetTop + (ctrlKey ? 50 : 10));
                break;
            default:
                retValue = null;
                return;
        }
        //#ifdef __WITH_LAYOUT
        if (apf.hasSingleRszEvent)
            apf.layout.forceResize(this.$int);
        //#endif
        return retValue;
    }, true);
    
    this.addEventListener("keydown", function(e){
        if (e.keyCode == 27 && this.buttons.indexOf("close") > -1 
          && (!this.dockable || !this.aData) && this.kbclose)
            this.close();
    });
    //#ifdef __SUPPORT_IPHONE
    }
    //#endif

    //#endif

    /**** Init ****/

    this.$draw = function(){
        this.popout = apf.isTrue(this.getAttribute("popout"));
        if (this.popout)
            this.$pHtmlNode = document.body;

        this.$ext = this.$getExternal(null, null, function(oExt){
            this.$initButtons(oExt);
        });
        this.oTitle   = this.$getLayoutNode("main", "title", this.$ext);
        this.oIcon    = this.$getLayoutNode("main", "icon",  this.$ext);
        this.oDrag    = this.$getLayoutNode("main", "drag",  this.$ext);
        this.$buttons = this.$getLayoutNode("main", "buttons",  this.$ext);

        if (this.popout)
            this.$ext.style.position = "absolute";

        if (this.oIcon)
            this.oIcon.style.display = "none";

        //#ifdef __SUPPORT_IPHONE
        if (!apf.isIphone) {
        //#endif
        
        var _self = this;
        if (this.oDrag) {
            this.oDrag.host = this;
            this.oDrag.onmousedown = function(e){
                if (!e) e = event;
    
                //because of some issue I don't understand oExt.onmousedown is not called
                if (!_self.$isWidget && (!_self.aData || !_self.dockable || _self.aData.hidden == 3))
                    apf.WinServer.setTop(_self);
    
                if (_self.$lastState.maximized)
                    return false;
    
                //#ifdef __WITH_ALIGNMENT
                if (_self.aData && _self.dockable) {
                    if (_self.$lastState.normal) //@todo
                        _self.startDocking(e);
                    return false;
                }
                //#endif
            };
        }

        this.$ext.onmousedown = function(){
            //#ifdef __WITH_FOCUS
            var p = apf.document.activeElement;
            if (p && p.$focusParent != _self && p.$focusParent.modal)
                return false;
            //#endif
            
            //Set ZIndex on oExt mousedown
            if (!_self.$isWidget && (!_self.aData || !_self.dockable || _self.aData.hidden == 3))
                apf.WinServer.setTop(_self);

            if (!_self.$lastState.normal)
                return false;
        }
        this.$ext.onmousemove = function(){
            if (!_self.$lastState.normal)
                return false;
        }
        //#ifdef __SUPPORT_IPHONE
        }
        //#endif
        

        /*var v;
        if (!((v = this.getAttribute("visible")).indexOf("{") > -1 || v.indexOf("[") > -1)) {
            this.$aml.setAttribute("visible", "{" + apf.isTrue(v) + "}");
        }*/
    };

    this.$loadAml = function(x){
        apf.WinServer.setTop(this);

        this.$int = this.$getLayoutNode("main", "container", this.$ext);

        //#ifdef __SUPPORT_IPHONE
        if (!apf.isIphone) {
        //#endif
            if (this.oTitle) {
                var _self = this;
                (this.oTitle.nodeType != 1
                  ? this.oTitle.parentNode
                  : this.oTitle).ondblclick = function(e){
                    if (_self.state.indexOf("normal") == -1)
                        _self.restore();
                    else if (_self.buttons.indexOf("max") > -1)
                        _self.maximize();
                    else if (_self.buttons.indexOf("min") > -1)
                        _self.minimize();
                }
            }
    
            if (typeof this.draggable == "undefined") {
                (this.$propHandlers.draggable
                    || apf.GuiElement.propHandlers.draggable).call(this, true);
                this.draggable = true;
            }

            if (typeof this.buttons == "undefined")
                this.buttons = "";
                //this.setProperty("buttons", "min|max|close");
        //#ifdef __SUPPORT_IPHONE
        }
        //#endif

        if (this.modal === undefined) { 
            this.$propHandlers.modal.call(this, true);
            this.modal = true;
        }

        //Set default visible hidden
        if (!this.visible) {
            this.$ext.style.display = "none";
        }
        //#ifdef __WITH_FOCUS
        else if (this.modal) {
            var _self = this;
            apf.queue.add("focus", function(){
                _self.focus(false, {mouse:true});
            });
        }
        //#endif

        if (this.minwidth === undefined)
            this.minwidth  = this.$getOption("Main", "min-width");
        if (this.minheight === undefined)
            this.minheight = this.$getOption("Main", "min-height");
        if (this.maxwidth === undefined)
            this.maxwidth  = this.$getOption("Main", "max-width");
        if (this.maxheight === undefined)
            this.maxheight = this.$getOption("Main", "max-height");

        if (this.center && this.visible) {
            this.visible = false;
            this.$ext.style.display = "none"; /* @todo temp done for project */
            
            var _self = this;
            $setTimeout(function(){
                _self.setProperty("visible", true);
            });
        }
    };

    //#ifdef __WITH_SKIN_CHANGE
    this.addEventListener("$skinchange", function(){
        if (this.title)
            this.$propHandlers["title"].call(this, this.title);

        if (this.icon)
            this.$propHandlers["icon"].call(this, this.icon);
    });
    //#endif

    this.$destroy = function(skinChange){
        if (this.oDrag) {
            this.oDrag.host = null;
            this.oDrag.onmousedown = null;
            apf.destroyHtmlNode(this.oDrag);
            this.oDrag = null;
        }

        this.oTitle =  this.oIcon = null;

        if (this.$ext && !skinChange) {
            this.$ext.onmousedown = null;
            this.$ext.onmousemove = null;
        }
    };
    
    // #ifdef __WITH_UIRECORDER
    this.$getActiveElements = function() {
        // init $activeElements
        if (!this.$activeElements) {
            this.$activeElements = {
                $title       : this.oTitle,
                $icon        : this.oIcon
                // $drag        : this.oDrag,
            }
            
            // set buttons
            if (this.$buttons && this.$buttons.children && this.$buttons.children.length) {
                for (var bi = 0, bl = this.$buttons.children.length; bi < bl; bi++) {
                    this.$activeElements["$" + this.$buttons.children[bi].className.trim().split(" ")[0] + "Btn"] = this.$buttons.children[bi];
                }
            }
        }

        return this.$activeElements;
    }
    //#endif
}).call(apf.modalwindow.prototype = new apf.Presentation());

apf.AmlWindow.prototype = apf.toolwindow.prototype = apf.modalwindow.prototype;

apf.aml.setElement("toolwindow",  apf.toolwindow);
apf.aml.setElement("modalwindow", apf.modalwindow);
apf.aml.setElement("window",      apf.modalwindow);
// #endif
