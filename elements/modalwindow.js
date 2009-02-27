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

/**
 * @private
 */
jpf.WinServer = {
    count : 9000,
    wins  : [],

    setTop : function(win){
        this.count += 2;

        win.setProperty("zindex", this.count);
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
 * Element displaying a skinnable, draggable window with optionally
 * a min, max, edit and close button. This element is also used
 * as a portal widget container. Furthermore this element supports
 * docking in an alignment layout.
 * Example:
 * <code>
 *  <j:window id="winMail"
 *    modal       = "false"
 *    buttons     = "min|max|close"
 *    title       = "Mail message"
 *    icon        = "icoMail.gif"
 *    visible     = "true"
 *    resizable   = "true"
 *    minwidth    = "300"
 *    minheight   = "290">
 *      ...
 *  </j:window>
 * </code>
 *
 * @constructor
 * @define modalwindow
 * @allowchild {elements}, {smartbinding}, {anyjml}
 * @addnode elements
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits jpf.Presentation
 * @inherits jpf.DelayedRender
 * @inherits jpf.Docking
 */
jpf.modalwindow = jpf.component(jpf.NODE_VISIBLE, function(){
    this.isWindowContainer = true;
    this.canHaveChildren   = 2;
    this.animate           = true;//!jpf.hasSingleRszEvent; // experimental
    this.visible           = false;
    this.showdragging      = false;
    this.buttons           = "min|max|close";
    this.$focussable       = jpf.KEYBOARD;
    this.state             = "normal";
    this.edit              = false;
    var _self              = this;

    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {"main" : [["title","@title"]]};
    // #endif

    /**** Public Methods ****/

    /**
     * Sets the title of the window.
     * @param {String} caption the text of the title.
     */
    this.setTitle = function(caption){
        this.setProperty("title", caption);
    };

    /**
     * Sets the icon of the window.
     * @param {String} icon the location of the image.
     */
    this.setIcon = function(icon){
        this.setProperty("icon", icon);
    };

    /**
     * Close the window. It can be reopened by using {@link show}
     * @todo show should unset closed
     */
    this.close = function(){
        this.setProperty("state", this.state.split("|")
            .pushUnique("closed").join("|"));
    };

    /**
     * Minimize the window. The window will become the height of the title of
     * the window.
     */
    this.minimize = function(){
        this.setProperty("state", this.state.split("|")
            .remove("maximized")
            .remove("normal")
            .pushUnique("minimized").join("|"));
    };

    /**
     * Maximize the window. The window will become the width and height of the
     * browser window.
     */
    this.maximize = function(){
        this.setProperty("state", this.state.split("|")
            .remove("minimized")
            .remove("normal")
            .pushUnique("maximized").join("|"));
    };

    /**
     * Restore the size of the window. The window will become the width and
     * height it had before it was minimized or maximized.
     */
    this.restore = function(){
        this.setProperty("state", this.state.split("|")
            .remove("minimized")
            .remove("maximized")
            .pushUnique("normal").join("|"));
    };

    /**
     * Set the window into edit state. The configuration panel is shown.
     */
    this.edit = function(value){
        this.setProperty("state", this.state.split("|")
            .pushUnique("edit").join("|"));
    };

    /**
     * Removes the edit state of this window. The configuration panel is hidden.
     */
    this.closeedit = function(value){
        this.setProperty("state", this.state.split("|")
            .remove("edit").join("|"));
    };

    this.bringToFront = function(){
        jpf.WinServer.setTop(this);
    };

    var actions  = {
        "min"   : ["minimized", "minimize", "restore"],
        "max"   : ["maximized", "maximize", "restore"],
        "edit"  : ["edit", "edit", "closeedit"],
        "close" : ["closed", "close", "show"]
    };

    this.$toggle = function(type){
        var c = actions[type][0];
        this[actions[type][this.state.indexOf(c) > -1 ? 2 : 1]]();
    };

    //#ifdef __WITH_ALIGNMENT
    /**
     * @todo change this to use setProperty
     * @private
     */
    this.syncAlignment = function(oItem){
        if (oItem.hidden == 3)
            jpf.WinServer.setTop(this);

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
    this.$booleanProperties["animate"]      = true;
    this.$booleanProperties["showdragging"] = true;
    this.$supportedProperties.push("title", "icon", "modal", "minwidth",
        "minheight", "hideselects", "center", "buttons", "state",
        "maxwidth", "maxheight", "animate", "showdragging", "transaction");

    /**
     * @attribute {Boolean} modal whether the window prevents access to the
     * layout below it.
     */
    this.$propHandlers["modal"] = function(value){
        if (value && !this.oCover) {
            var oCover = this.$getLayoutNode("cover");
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
        this.oTitle.nodeValue = value;
    };

    /**
     * @attribute {String} icon the location of the image.
     */
    this.$propHandlers["icon"] = function(value){
        if (!this.oIcon) return;

        this.oIcon.style.display = value ? "block" : "none";
        jpf.skins.setIcon(this.oIcon, value, this.iconPath);
    };

    var hEls = [], wasVisible;
    this.$propHandlers["visible"] = function(value){
        if (jpf.isTrue(value)){
            //if (!x && !y && !center) center = true;

            // #ifdef __WITH_DELAYEDRENDER
            this.$render();
            // #endif

            if (this.oCover){
                /*this.oCover.style.height = Math.max(document.body.scrollHeight,
                    document.documentElement.offsetHeight) + 'px';
                this.oCover.style.width  = Math.max(document.body.scrollWidth,
                    document.documentElement.offsetWidth) + 'px';*/
                this.oCover.style.display = "block";
            }

            this.state = this.state.split("|").remove("closed").join("|");

            this.oExt.style.display = "block"; //Some form of inheritance detection

            //!jpf.isIE &&
            if (jpf.layout && this.oInt)
                jpf.layout.forceResize(this.oInt); //this should be recursive down

            if (this.center) {
                this.oExt.style.left = Math.max(0, ((
                    (jpf.isIE
                        ? document.documentElement.offsetWidth
                        : window.innerWidth)
                    - this.oExt.offsetWidth)/2)) + "px";
                this.oExt.style.top  = Math.max(0, ((
                    (jpf.isIE
                        ? document.documentElement.offsetHeight
                        : window.innerHeight)
                    - this.oExt.offsetHeight)/3)) + "px";
            }

            if (!this.isRendered) {
                this.addEventListener("afterrender", function(){
                    this.dispatchEvent("display");
                    this.removeEventListener("display", arguments.callee);
                });
            }
            else
                this.dispatchEvent("display");

            if (!jpf.canHaveHtmlOverSelects && this.hideselects) {
                hEls = [];
                var nodes = document.getElementsByTagName("select");
                for (var i = 0; i < nodes.length; i++) {
                    var oStyle = jpf.getStyle(nodes[i], "display");
                    hEls.push([nodes[i], oStyle]);
                    nodes[i].style.display = "none";
                }
            }

            if (wasVisible != true && this.$show)
                this.$show();

            if (this.modal) {
                this.bringToFront();
                this.focus(false, {mouse:true});
            }
        }
        else if (jpf.isFalse(value)) {
            //this.setProperty("visible", false);
            if (this.oCover)
                this.oCover.style.display = "none";

            this.oExt.style.display = "none";

            if (!jpf.canHaveHtmlOverSelects && this.hideselects) {
                for (var i = 0; i < hEls.length; i++) {
                    hEls[i][0].style.display = hEls[i][1];
                }
            }

            if (this.$hide)
                this.$hide();

            if (this.hasFocus())
                jpf.window.moveNext(null, this, true)

            this.dispatchEvent("close");
        }

        wasVisible = value;
    };

    this.$propHandlers["zindex"] = function(value){
        this.oExt.style.zIndex = value + 1;
        if (this.oCover)
            this.oCover.style.zIndex = value;
    };

    var lastheight = null;
    var lastpos    = null;
    var lastzindex = 0;
    var lastState  = {"normal":1};

    /**
     * @attribute {String} state the state of the window. The state can be a
     * combination of multiple states seperated by a pipe '|' character.
     *   Possible values:
     *   minimized  The window is minimized.
     *   maximized  The window is maximized.
     *   normal     The window has it's normal size and position.
     *   edit       The window is in the edit state.
     *   closed     The window is closed.
     */
    this.$propHandlers["state"] = function(value, noanim){
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
                if (this.animate && !noanim) {
                    //Pre remove paused event because of not having onresize
                    //if (jpf.hasSingleRszEvent)
                        //delete jpf.layout.onresize[jpf.layout.getHtmlId(this.pHtmlNode)];

                    _self.animstate = 1;
                    jpf.tween.multi(this.oExt, {
                        steps    : 5,
                        interval : 100,
                        tweens   : [
                            {type: "left",   from: this.oExt.offsetLeft,   to: lastpos[0]},
                            {type: "top",    from: this.oExt.offsetTop,    to: lastpos[1]},
                            {type: "width",  from: this.oExt.offsetWidth,  to: lastpos[2]},
                            {type: "height", from: this.oExt.offsetHeight, to: lastpos[3]}
                        ],
                        oneach   : function(){
                            if (jpf.hasSingleRszEvent)
                                jpf.layout.forceResize(_self.oInt);
                        },
                        onfinish : function(){
                            _self.$propHandlers["state"].call(_self, value, true);
                        }
                    });

                    return;
                }

                this.oExt.style.left   = lastpos[0] + "px";
                this.oExt.style.top    = lastpos[1] + "px";
                this.oExt.style.width  = lastpos[2] + "px";
                this.oExt.style.height = lastpos[3] + "px";

                var pNode = (this.oExt.parentNode == document.body
                    ? document.documentElement
                    : this.oExt.parentNode);
                pNode.style.overflow = lastpos[4];
            }

            //#ifdef __WITH_ALIGNMENT
            if (this.aData && this.aData.restore)
                this.aData.restore();
            //#endif
            
            if (jpf.layout)
                jpf.layout.play(this.pHtmlNode);

            if (lastzindex)
                this.oExt.style.zIndex = lastzindex

            lastheight = lastpos = lastzindex = null;

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

                if (this.hasFocus())
                    jpf.window.moveNext(null, this, true);
                //else if(jpf.window.focussed)
                    //jpf.window.focussed.$focus({mouse: true});
            }
            else {
                styleClass.push(this.baseCSSname + "Min");

                setTimeout(function(){
                    jpf.window.$focusLast(_self);
                });
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

                lastpos = [this.oExt.offsetLeft, this.oExt.offsetTop,
                           this.oExt.offsetWidth - hordiff, this.oExt.offsetHeight - verdiff,
                           pNode.style.overflow];

                pNode.style.overflow = "hidden";

                _self.animstate = 0;
                var hasAnimated = false, htmlNode = this.oExt;
                function setMax(){
                    var w = !jpf.isIE && pNode == document.documentElement
                        ? window.innerWidth
                        : pNode.offsetWidth;

                    var h = !jpf.isIE && pNode == document.documentElement
                        ? window.innerHeight
                        : pNode.offsetHeight;

                    if (_self.animate && !hasAnimated) {
                        _self.animstate = 1;
                        hasAnimated = true;
                        jpf.tween.multi(htmlNode, {
                            steps    : 5,
                            interval : 10,
                            tweens   : [
                                {type: "left",   from: htmlNode.offsetLeft,   to: -1 * marginBox[3]},
                                {type: "top",    from: htmlNode.offsetTop,    to: -1 * marginBox[0]},
                                {type: "width",  from: htmlNode.offsetWidth,  to: (w - hordiff + marginBox[1] + marginBox[3])},
                                {type: "height", from: htmlNode.offsetHeight, to: (h - verdiff + marginBox[0] + marginBox[2])}
                            ],
                            oneach   : function(){
                                if (jpf.hasSingleRszEvent)
                                    jpf.layout.forceResize(_self.oInt);
                            },
                            onfinish : function(){
                                _self.animstate = 0;
                            }
                        });
                    }
                    else if (!_self.animstate) {
                        htmlNode.style.left = (-1 * marginBox[3]) + "px";
                        htmlNode.style.top  = (-1 * marginBox[0]) + "px";

                        htmlNode.style.width  = (w
                            - hordiff + marginBox[1] + marginBox[3]) + "px";
                        htmlNode.style.height = (h
                            - verdiff + marginBox[0] + marginBox[2]) + "px";
                    }
                }

                if (jpf.layout)
                    jpf.layout.pause(this.pHtmlNode, setMax);

                lastzindex = this.oExt.style.zIndex;
                this.oExt.style.zIndex = jpf.WinServer.count + 1;
                //jpf.WinServer.setTop(this);
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

                this.dispatchEvent('editstart');
            }
            else {
                if (this.dispatchEvent('editstop') === false)
                    return false;

                styleClass.push(this.baseCSSname + "Edit");
                if (styleClass.length == 1)
                    styleClass.unshift("");

                if (this.btnedit)
                    oButtons.edit.innerHTML = "edit"; //hack
            }
        }

        if (styleClass.length) {
            this.$setStyleClass(this.oExt, styleClass.shift(), styleClass);

            this.dispatchEvent('statechange', o);
            lastState = o;

            //#ifdef __WITH_ALIGNMENT
            if (this.aData && !o.maximized) { //@todo is this the most optimal position?
                this.purgeAlignment();
            }
            //#endif

            if (!this.animate && jpf.hasSingleRszEvent && jpf.layout)
                jpf.layout.forceResize(_self.oInt);
        }
    };

    var oButtons = {}
    /**
     * @attribute {String} buttons the buttons that the window displays. This
     * can be multiple values seperated by a pipe '|' character.
     *   Possible values:
     *   min    The button that minimizes the window.
     *   max    The button that maximizes the window.
     *   close  The button that closes the window.
     *   edit   The button that puts the window into the edit state.
     */
    this.$propHandlers["buttons"] = function(value){
        var buttons = value.split("|");
        var nodes   = this.oButtons.childNodes;
        var re      = new RegExp("(" + value + ")");
        var found   = {};

        //Check if we can 'remove' buttons
        var idleNodes = [];
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1 || nodes[i].tagName != "DIV") //@todo temp hack
                continue;

            if (!nodes[i].className || !nodes[i].className.match(re)) {
                nodes[i].style.display = "none";
                this.$setStyleClass(nodes[i], "", ["min", "max", "close", "edit"]);
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
                this.$getNewContext("button");
                btn = this.$getLayoutNode("button");
                setButtonEvents(btn);
                btn = jpf.xmldb.htmlImport(btn, this.oButtons);
            }

            this.$setStyleClass(btn, buttons[i], ["min", "max", "close", "edit"]);
            btn.onclick = new Function("jpf.lookup(" + this.uniqueId + ").$toggle('"
                                       + buttons[i] + "')");
            btn.style.display = "block";
            oButtons[buttons[i]] = btn;
            this.oButtons.insertBefore(btn, this.oButtons.firstChild);
        }
    };

    /**** Keyboard ****/

    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;

        if (key > 36 && key < 41) {
            if (_self.hasFeature && _self.hasFeature(__ANCHORING__))
                _self.disableAnchoring();
        }

        switch (key) {
            case 27:
                if (this.buttons.indexOf("close") > -1 && !this.aData)
                    this.close();
                return;
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
                return;
        }

        if (jpf.hasSingleRszEvent)
            jpf.layout.forceResize(this.oInt);
    }, true);
    //#endif

    function setButtonEvents(btn){
        btn.setAttribute("onmousedown",
            "jpf.setStyleClass(this, 'down');\
             event.cancelBubble = true; \
             jpf.findHost(this).oExt.onmousedown(event);\
             document.onmousedown(event);");
        btn.setAttribute("onmouseup",
            "jpf.setStyleClass(this, '', ['down'])");
        btn.setAttribute("onmouseover",
            "jpf.setStyleClass(this, 'hover')");
        btn.setAttribute("onmouseout",
            "jpf.setStyleClass(this, '', ['hover', 'down'])");
    }

    /**** Init ****/

    var marginBox, hordiff, verdiff;
    this.$draw = function(){
        this.popout = jpf.isTrue(this.$jml.getAttribute("popout"));
        if (this.popout)
            this.pHtmlNode = document.body;

        this.oExt = this.$getExternal(null, null, function(oExt){
            var oButtons = this.$getLayoutNode("main", "buttons", oExt);

            var len = (this.$jml.getAttribute("buttons") || "").split("|").length;
            for (var btn, i = 0; i < len; i++) {
                this.$getNewContext("button");
                btn = oButtons.appendChild(this.$getLayoutNode("button"));
                setButtonEvents(btn);
            }
        });
        this.oTitle   = this.$getLayoutNode("main", "title", this.oExt);
        this.oIcon    = this.$getLayoutNode("main", "icon",  this.oExt);
        this.oDrag    = this.$getLayoutNode("main", "drag",  this.oExt);
        this.oButtons = this.$getLayoutNode("main", "buttons",  this.oExt);
        this.oDrag.host = this;

        if (this.oIcon)
            this.oIcon.style.display = "none";

        this.oDrag.onmousedown = function(e){
            if (!e) e = event;

            //because of some issue I don't understand oExt.onmousedown is not called
            if (!_self.isWidget && (!_self.aData || !_self.dockable || _self.aData.hidden == 3))
                jpf.WinServer.setTop(_self);

            if (lastState.maximized)
                return false;

            //#ifdef __WITH_ALIGNMENT
            if (_self.aData && _self.dockable) {
                if (lastState.normal) //@todo
                    _self.startDocking(e);
                return false;
            }
            //#endif
        };

        this.oExt.onmousedown = function(){
            //Set ZIndex on oExt mousedown
            if (!_self.isWidget && (!_self.aData || !_self.dockable || _self.aData.hidden == 3))
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
            this.$makeEditable("main", this.oExt, this.$jml);
        // #endif

        /*var v;
        if (!jpf.dynPropMatch.test(v = this.$jml.getAttribute("visible"))) {
            this.$jml.setAttribute("visible", "{" + jpf.isTrue(v) + "}");
        }*/
    };

    this.$loadJml = function(x){
        jpf.WinServer.setTop(this);

        var oInt = this.$getLayoutNode("main", "container", this.oExt);

        this.oInt = this.oInt
            ? jpf.JmlParser.replaceNode(oInt, this.oInt)
            : jpf.JmlParser.parseChildren(this.$jml, oInt, this, true);

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

        if (this.draggable === undefined) {
            (this.$propHandlers.draggable
                || jpf.JmlElement.propHandlers.draggable).call(this, true);
            this.draggable = true;
        }

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

        this.collapsedHeight = this.$getOption("Main", "collapsed-height");

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
            jpf.JmlParser.stateStack.push({
                node  : this,
                name  : "visible",
                value : "true"
            });
        }
        
        if (!this.hasFeature(__DATABINDING__)
          && !this.transaction && (this.$jml.getAttribute("smartbinding")
          || this.$jml.getAttribute("actions"))) {
            this.$propHandlers.transaction.call(this, true);
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
            jpf.removeNode(this.oDrag);
            this.oDrag = null;
        }

        this.oTitle =  this.oIcon = this.oCover = null;

        for (var name in oButtons) {
            oButtons[name].onclick = null;
        }

        if (this.oExt && !skinChange) {
            this.oExt.onmousedown = null;
            this.oExt.onmousemove = null;
        }
    };
}).implement(
    // #ifdef __WITH_DELAYEDRENDER
    jpf.DelayedRender,
    // #endif
    //#ifdef __WITH_DOCKING
    jpf.Docking,
    //#endif
    jpf.Presentation
);
// #endif
