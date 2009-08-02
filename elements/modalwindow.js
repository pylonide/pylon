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

// #ifdef __JMODALWINDOW || __INC_ALL || __JWINDOW
// #define __WITH_PRESENTATION 1

/**
 * @private
 */
apf.WinServer = {
    count : 9000,
    wins  : [],

    setTop : function(win, norecur){
        var topmost;
        if (!norecur && this.wins.length) {
            var topmost = this.wins[this.wins.length - 1];
            if (!topmost.modal || !topmost.visible)
                topmost = null;
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
 *  <a:window id="winMail"
 *    modal       = "false"
 *    buttons     = "min|max|close"
 *    title       = "Mail message"
 *    icon        = "icoMail.gif"
 *    visible     = "true"
 *    resizable   = "true"
 *    minwidth    = "300"
 *    minheight   = "290">
 *      ...
 *  </a:window>
 * </code>
 *
 * @constructor
 * @define modalwindow
 * @allowchild {elements}, {smartbinding}, {anyaml}
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits apf.Presentation
 * @inherits apf.DelayedRender
 * @inherits apf.Docking
 * @inherits apf.Transaction
 *
 * @event display       Fires when the window is displayed.
 * @event close         Fires when the window is closed.
 * @event editstart     Fires before the user edits the properties of this window. Used mostly for when this window is part of the {@link element.portal}.
 * @event editstop      Fires after the user edited the properties of this window. Used mostly for when this window is part of the {@link element.portal}.
 *   cancellable:   Prevents the edit panel from being closed.
 * @event statechange   Fires after the state of this window changed.
 *   object:
 *   {Boolean} minimized  whether the window is minimized.
 *   {Boolean} maximized  whether the window is maximized.
 *   {Boolean} normal     whether the window has it's normal size and position.
 *   {Boolean} edit       whether the window is in the edit state.
 *   {Boolean} closed     whether the window is closed.
 */
apf.toolwindow  = 
apf.modalwindow = apf.component(apf.NODE_VISIBLE, function(){
    this.isWindowContainer = true;
    this.collapsedHeight   = 30;
    this.canHaveChildren   = 2;
    this.visible           = false;
    this.showdragging      = false;
    this.kbclose           = false;
    this.$focussable       = apf.KEYBOARD;
    var _self              = this;

    // #ifdef __WITH_EDITMODE
    this.editableParts = {"main" : [["title","@title"]]};
    // #endif

    /**** Public Methods ****/

    /**
     * Sets the title of the window. Call-chaining is supported.
     * @param {String} caption the text of the title.
     */
    this.setTitle = function(caption){
        this.setProperty("title", caption);
        return this;
    };

    /**
     * Sets the icon of the window. Call-chaining is supported.
     * @param {String} icon the location of the image.
     */
    this.setIcon = function(icon){
        this.setProperty("icon", icon);
        return this;
    };
    
    //For modal elements
    this.show = function(callback){
        this.execAction = callback; //@todo Proper error handling??
        this.setProperty("visible", true);
    }
    
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
                ? this.oExt.offsetParent.offsetWidth
                : window.innerWidth),
            innerH = (apf.isIE
                ? this.oExt.offsetParent.offsetHeight
                : window.innerHeight),
            cX     = Math.max(0, ((innerW - this.oExt.offsetWidth)  / 2)),
            cY     = Math.max(0, ((innerH - this.oExt.offsetHeight) / 3)),
            sType  = "top",
            pad    = 10;

        switch(sFrom) {
            case "top":
                iFrom = -(this.oExt.offsetHeight) - pad;
                iTo   = bSticky ? 0 : cY;
                break;
            case "left":
                iFrom = -(this.oExt.offsetWidth) - pad;
                iTo   = bSticky ? 0 : cX;
                sType = "left";
                break;
            case "bottom":
                iFrom = innerH + this.oExt.offsetHeight + pad;
                iTo   = bSticky ? innerH - this.oExt.offsetHeight : cY;
                break;
            case "right":
                iFrom = innerW + this.oExt.offsetLeft + pad;
                iTo   = bSticky ? innerW - this.oExt.offsetWidth : cX;
                sType = "left";
                break;
        }
        
        apf.tween.single(this.oExt, {
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
                iFrom = this.oExt.offsetTop;
                iTo   = -(this.oExt.offsetHeight) - pad;
                break;
            case "left":
                iFrom = this.oExt.offsetLeft;
                iTo   = -(this.oExt.offsetWidth) - pad;
                sType = "left";
                break;
            case "bottom":
                iFrom = this.oExt.offsetTop;
                iTo = (apf.isIE
                    ? this.oExt.offsetParent.offsetHeight
                    : window.innerHeight) + this.oExt.offsetHeight + pad;
                break;
            case "right":
                iFrom = this.oExt.offsetLeft;
                iTo   = (apf.isIE
                    ? this.oExt.offsetParent.offsetWidth
                    : window.innerWidth) + this.oExt.offsetLeft + pad;
                sType = "left";
                break;
        }

        apf.tween.single(this.oExt, {
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

    this.bringToFront = function(){
        apf.WinServer.setTop(this);
        return this;
    };

    //#ifdef __WITH_ALIGNMENT
    /**
     * @todo change this to use setProperty
     * @private
     */
    this.syncAlignment = function(oItem){
        if (oItem.hidden == 3)
            apf.WinServer.setTop(this);

        if (oItem.state > 0) {
            this.$setStyleClass(this.oExt, this.baseCSSname + "Min",
                [this.baseCSSname + "Edit", this.baseCSSname + "Max"]);
        }
        else {
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Min",
                this.baseCSSname + "Edit", this.baseCSSname + "Max"]);
        }
    };
    //#endif

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
        if (value && !this.oCover) {
            var oCover = this.$getLayoutNode("cover");
            if (oCover) {
                this.oCover = apf.xmldb.htmlImport(oCover, this.pHtmlNode);

                if (!this.visible)
                    this.oCover.style.display = "none";

                if (this.zindex)
                    this.oCover.style.zIndex = this.zindex;
            }
        }

        if (!value && this.oCover) {
            this.oCover.style.display = "none";
        }
    };

    /**
     * @attribute {Boolean} center centers the window relative to it's parent's
     * containing rect when shown.
     */
    this.$propHandlers["center"] = function(value){
        this.oExt.style.position = "absolute"; //@todo no unset
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

        this.oIcon.style.display = value ? "block" : "none";
        apf.skins.setIcon(this.oIcon, value, this.iconPath);
    };

    var hEls = [], wasVisible;
    this.$propHandlers["visible"] = function(value){
        if (apf.isTrue(value)){
            //if (!x && !y && !center) center = true;

            // #ifdef __WITH_DELAYEDRENDER
            this.$render();
            // #endif

            if (this.oCover){
                if (!this.modal) {
                    this.oCover.style.height = this.oCover.offsetParent.scrollHeight + 'px';
                    this.oCover.style.width  = this.oCover.offsetParent.scrollWidth + 'px';
                }
                this.oCover.style.display = "block";
            }

            this.state = this.state.split("|").remove("closed").join("|");

            this.oExt.style.display = "block"; //Some form of inheritance detection

            //!apf.isIE &&
            if (apf.layout && this.oInt)
                apf.layout.forceResize(this.oInt); //@todo this should be recursive down

            //if (this.modal) 
                //this.oExt.style.position = "fixed";
            
            if (this.center) {
                var size = !this.oExt.offsetParent || this.oExt.offsetParent.tagName == "BODY"
                    ? [apf.getWindowWidth(), apf.getWindowHeight()]
                    : [this.oExt.offsetParent.offsetWidth, this.oExt.offsetParent.offsetHeight, 0, 0];

                if (size.length == 2) {
                    size.push(document.documentElement.scrollLeft, 
                      document.documentElement.scrollTop);
                }
                
                this.oExt.style.left = (Math.max(0, ((
                    size[0] - this.oExt.offsetWidth)/2)) + size[2]) + "px";
                this.oExt.style.top  = (Math.max(0, ((
                    size[1] - this.oExt.offsetHeight)/3)) + size[3]) + "px";
            }

            if (!this.$rendered) {
                this.addEventListener("afterrender", function(){
                    this.dispatchEvent("display");
                    this.removeEventListener("display", arguments.callee);
                });
            }
            else
                this.dispatchEvent("display");

            if (!apf.canHaveHtmlOverSelects && this.hideselects) {
                hEls = [];
                var nodes = document.getElementsByTagName("select");
                for (var i = 0; i < nodes.length; i++) {
                    var oStyle = apf.getStyle(nodes[i], "display");
                    hEls.push([nodes[i], oStyle]);
                    nodes[i].style.display = "none";
                }
            }

            if (wasVisible != true && this.$show)
                this.$show();

            if (this.modal)
                this.bringToFront();
            
            // #ifdef __WITH_FOCUS
            //@todo make widget a tagname and alias
            if (!apf.isParsing && (this.model 
              || (!this.dockable || !this.aData) && !this.$isWidget 
              && this.tagName != "toolwindow"))
                this.focus(false, {mouse:true});
            // #endif
            
            if (apf.isIE) {
                var cls = this.oExt.className;
                this.oExt.className = "rnd" + Math.random();
                this.oExt.className = cls;
            }
        }
        else if (apf.isFalse(value)) {
            //this.setProperty("visible", false);
            if (this.oCover)
                this.oCover.style.display = "none";

            this.oExt.style.display = "none";

            if (!apf.canHaveHtmlOverSelects && this.hideselects) {
                for (var i = 0; i < hEls.length; i++) {
                    hEls[i][0].style.display = hEls[i][1];
                }
            }

            if (this.$hide)
                this.$hide();

            if (this.hasFocus())
                apf.window.moveNext(true, this, true);//go backward to detect modals

            this.dispatchEvent("close");
        }

        wasVisible = value;
    };

    this.$propHandlers["zindex"] = function(value){
        this.oExt.style.zIndex = value + 1;
        if (this.oCover)
            this.oCover.style.zIndex = value;
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

        if (key > 36 && key < 41) {
            if (_self.hasFeature && _self.hasFeature(__ANCHORING__))
                _self.disableAnchoring();
        }

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
                        this.oExt.offsetHeight - (ctrlKey ? 50 : 10)));
                else if (this.draggable)
                    this.setProperty("top",
                        this.oExt.offsetTop - (ctrlKey ? 50 : 10));
                break;
            case 37:
            //LEFT
                if (shiftKey && this.resizable)
                    this.setProperty("width", Math.max(this.minwidth || 0,
                        this.oExt.offsetWidth - (ctrlKey ? 50 : 10)));
                else if (this.draggable)
                    this.setProperty("left",
                        this.oExt.offsetLeft - (ctrlKey ? 50 : 10));
                break;
            case 39:
            //RIGHT
                if (shiftKey && this.resizable)
                    this.setProperty("width", Math.min(this.maxwidth || 10000,
                        this.oExt.offsetWidth + (ctrlKey ? 50 : 10)));
                else if (this.draggable)
                    this.setProperty("left",
                        this.oExt.offsetLeft + (ctrlKey ? 50 : 10));
                break;
            case 40:
            //DOWN
                if (shiftKey && this.resizable)
                    this.setProperty("height", Math.min(this.maxheight || 10000,
                        this.oExt.offsetHeight + (ctrlKey ? 50 : 10)));
                else if (this.draggable)
                    this.setProperty("top",
                        this.oExt.offsetTop + (ctrlKey ? 50 : 10));
                break;
            default:
                retValue = null;
                return;
        }

        if (apf.hasSingleRszEvent)
            apf.layout.forceResize(this.oInt);
        
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
        this.popout = apf.isTrue(this.$aml.getAttribute("popout"));
        if (this.popout)
            this.pHtmlNode = document.body;

        this.oExt = this.$getExternal(null, null, function(oExt){
            this.$initButtons(oExt);
        });
        this.oTitle   = this.$getLayoutNode("main", "title", this.oExt);
        this.oIcon    = this.$getLayoutNode("main", "icon",  this.oExt);
        this.oDrag    = this.$getLayoutNode("main", "drag",  this.oExt);
        this.oButtons = this.$getLayoutNode("main", "buttons",  this.oExt);
        this.oDrag.host = this;

        if (this.oIcon)
            this.oIcon.style.display = "none";

        //#ifdef __SUPPORT_IPHONE
        if (!apf.isIphone) {
        //#endif
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

        this.oExt.onmousedown = function(){
            //#ifdef __WITH_FOCUS
            var p = apf.window.focussed;
            if (p && p.$focusParent != _self && p.$focusParent.modal)
                return false;
            //#endif
            
            //Set ZIndex on oExt mousedown
            if (!_self.$isWidget && (!_self.aData || !_self.dockable || _self.aData.hidden == 3))
                apf.WinServer.setTop(_self);

            if (!_self.$lastState.normal)
                return false;
        }
        this.oExt.onmousemove = function(){
            if (!_self.$lastState.normal)
                return false;
        }
        //#ifdef __SUPPORT_IPHONE
        }
        //#endif
        

        /*var v;
        if (!apf.dynPropMatch.test(v = this.$aml.getAttribute("visible"))) {
            this.$aml.setAttribute("visible", "{" + apf.isTrue(v) + "}");
        }*/
    };

    this.$loadAml = function(x){
        apf.WinServer.setTop(this);

        var oInt = this.$getLayoutNode("main", "container", this.oExt);

        this.oInt = this.oInt
            ? apf.AmlParser.replaceNode(oInt, this.oInt)
            : apf.AmlParser.parseChildren(this.$aml, oInt, this, true);

        //#ifdef __SUPPORT_IPHONE
        if (!apf.isIphone) {
        //#endif
            if (this.oTitle) {
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
                    || apf.AmlElement.propHandlers.draggable).call(this, true);
                this.draggable = true;
            }

            if (typeof this.buttons == "undefined")
                this.buttons = "";
                //this.setProperty("buttons", "min|max|close");
        //#ifdef __SUPPORT_IPHONE
        }
        //#endif

        if (this.modal === undefined && this.oCover) {
            this.$propHandlers.modal.call(this, true);
            this.modal = true;
        }

        //Set default visible hidden
        if (!this.visible) {
            this.oExt.style.display = "none";

            if (this.oCover)
                this.oCover.style.display = "none";
        }
        //#ifdef __WITH_FOCUS
        else if (this.modal)
            this.focus(false, {mouse:true});
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
            this.oExt.style.display = "none"; /* @todo temp done for project */
            apf.AmlParser.stateStack.push({
                node  : this,
                name  : "visible",
                value : "true"
            });
        }
    };

    //#ifdef __WITH_SKIN_CHANGE
    this.$skinchange = function(){
        if (this.title)
            this.$propHandlers["title"].call(this, this.title);

        if (this.icon)
            this.$propHandlers["icon"].call(this, this.icon);
    }
    //#endif

    this.$destroy = function(skinChange){
        if (this.oDrag) {
            this.oDrag.host = null;
            this.oDrag.onmousedown = null;
            apf.destroyHtmlNode(this.oDrag);
            this.oDrag = null;
        }

        this.oTitle =  this.oIcon = this.oCover = null;

        if (this.oExt && !skinChange) {
            this.oExt.onmousedown = null;
            this.oExt.onmousemove = null;
        }
    };
}).implement(
    // #ifdef __WITH_DELAYEDRENDER
    apf.DelayedRender,
    // #endif
    //#ifdef __WITH_DOCKING
    apf.Docking,
    //#endif
    apf.Presentation,
    apf.BaseStateButtons
);
// #endif
