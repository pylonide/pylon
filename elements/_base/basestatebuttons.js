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
// #ifdef __JBASESTATEBUTTONS || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * @constructor
 * @baseclass
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.BaseStateButtons = function(){
    this.state   = "normal";
    this.edit    = false;
    this.animate = true;//!apf.hasSingleRszEvent; // experimental
    
    var actions  = {
        "min"   : ["minimized", "minimize", "restore"],
        "max"   : ["maximized", "maximize", "restore"],
        "edit"  : ["edit", "edit", "closeedit"],
        "close" : ["closed", "close", "show"]
    };
    
    var lastheight  = null;
    var lastpos     = null;
    var lastzindex  = null;
    var _self       = this;

    this.$lastState = {"normal":1};    
    this.$booleanProperties["animate"] = true;
    this.$supportedProperties.push("buttons", "animate", "state");
    
    /**
     * Close the window. It can be reopened by using {@link baseclass.amlelement.method.show}
     * Call-chaining is supported.
     * @todo show should unset closed
     */
    this.close = function(){
        this.setProperty("state", this.state.split("|")
            .pushUnique("closed").join("|"));
        return this;
    };

    /**
     * Minimize the window. The window will become the height of the title of
     * the window.
     * Call-chaining is supported.
     */
    this.minimize = function(){
        this.setProperty("state", this.state.split("|")
            .remove("maximized")
            .remove("normal")
            .pushUnique("minimized").join("|"));
        return this;
    };

    /**
     * Maximize the window. The window will become the width and height of the
     * browser window.
     * Call-chaining is supported.
     */
    this.maximize = function(){
        this.setProperty("state", this.state.split("|")
            .remove("minimized")
            .remove("normal")
            .pushUnique("maximized").join("|"));
        return this;
    };

    /**
     * Restore the size of the window. The window will become the width and
     * height it had before it was minimized or maximized.
     * Call-chaining is supported.
     */
    this.restore = function(){
        this.setProperty("state", this.state.split("|")
            .remove("minimized")
            .remove("maximized")
            .pushUnique("normal").join("|"));
        return this;
    };
    
     /**
     * Set the window into edit state. The configuration panel is shown.
     * Call-chaining is supported.
     */
    this.edit = function(value){
        this.setProperty("state", this.state.split("|")
            .pushUnique("edit").join("|"));
        return this;
    };

    /**
     * Removes the edit state of this window. The configuration panel is hidden.
     * Call-chaining is supported.
     */
    this.closeedit = function(value){
        this.setProperty("state", this.state.split("|")
            .remove("edit").join("|"));
        return this;
    };
    
    this.$toggle = function(type){
        var c = actions[type][0];
        this[actions[type][this.state.indexOf(c) > -1 ? 2 : 1]]();
    };
    
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
    this.$propHandlers["state"] = function(value, noanim, comp, reenter){
        var i, o = {}, s = value.split("|");
        for (i = 0; i < s.length; i++)
            o[s[i]] = true;
        o.value = value;
        
        var lastState = this.$lastState, styleClass = [];

        if (!o.maximized && !o.minimized)
            o.normal = true;

        if (!reenter && _self.dispatchEvent("beforestatechange", {
          from : lastState, 
          to   : o}) === false) {
            this.state = lastState.value;
            return false;
        }

        //Closed state
        if (o.closed == this.visible) {//change detected
            this.setProperty("visible", !o["closed"]);
            //@todo difference is, we're not clearing the other states, check the docking example
        }

        //Restore state
        if (o.normal != lastState.normal
          || !o.normal && (o.minimized != lastState.minimized
            || o.maximized != lastState.maximized)) {

            if (lastheight) // this.aData && this.aData.hidden == 3 ??
                this.oExt.style.height = lastheight;//(lastheight - apf.getHeightDiff(this.oExt)) + "px";

            if (lastpos) {
                if (this.animate && !noanim) {
                    //Pre remove paused event because of not having onresize
                    //if (apf.hasSingleRszEvent)
                        //delete apf.layout.onresize[apf.layout.getHtmlId(this.pHtmlNode)];

                    var htmlNode = this.oExt;
                    var position = apf.getStyle(htmlNode, "position");
                    if (position != "absolute") {
                        var l = parseInt(apf.getStyle(htmlNode, "left")) || 0;
                        var t = parseInt(apf.getStyle(htmlNode, "top")) || 0;
                    }
                    else {
                        var l = htmlNode.offsetLeft;
                        var t = htmlNode.offsetTop;
                    }

                    _self.animstate = 1;
                    apf.tween.multi(htmlNode, {
                        steps    : 5,
                        interval : 10,
                        tweens   : [
                            {type: "left",   from: l,    to: lastpos.px[0]},
                            {type: "top",    from: t,    to: lastpos.px[1]},
                            {type: "width",  from: this.oExt.offsetWidth - hordiff,  to: lastpos.px[2]},
                            {type: "height", from: this.oExt.offsetHeight - verdiff, to: lastpos.px[3]}
                        ],
                        oneach   : function(){
                            if (apf.hasSingleRszEvent)
                                apf.layout.forceResize(_self.oInt);
                        },
                        onfinish : function(){
                            _self.$propHandlers["state"].call(_self, value, true, null, true);
                        }
                    });

                    return;
                }

                this.oExt.style.left   = lastpos.css[0];// + "px";
                this.oExt.style.top    = lastpos.css[1];// + "px";
                this.oExt.style.width  = lastpos.css[2];// + "px";
                this.oExt.style.height = lastpos.css[3];// + "px";

                var pNode = (this.oExt.parentNode == document.body
                    ? this.oExt.offsetParent || document.documentElement
                    : this.oExt.offsetParent);
                pNode.style.overflow = lastpos.css[4];
            }

            //#ifdef __WITH_ALIGNMENT
            if (this.aData && this.aData.restore)
                this.aData.restore();
            //#endif
            
            if (apf.layout)
                apf.layout.play(this.pHtmlNode);

            if (lastzindex) {
                this.oExt.style.zIndex = lastzindex[0];
                if (this.oCover)
                    this.oCover.style.zIndex = lastzindex[1];
            }

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
                    lastheight = apf.getStyle(this.oExt, "height");//this.oExt.offsetHeight;

                    this.oExt.style.height = Math.max(0, this.collapsedHeight
                        - apf.getHeightDiff(this.oExt)) + "px";
                }

                if (this.hasFocus())
                    apf.window.moveNext(null, this, true);
                //else if(apf.window.focussed)
                    //apf.window.focussed.$focus({mouse: true});
            }
            else {
                styleClass.push(this.baseCSSname + "Min");

                setTimeout(function(){
                    apf.window.$focusLast(_self);
                });
            }
        }

        if (o.maximized != lastState.maximized) {
            if (o.maximized) {
                styleClass.unshift(
                    this.baseCSSname + "Max",
                    this.baseCSSname + "Min",
                    this.baseCSSname + "Edit");

                var pNode = (this.$refParent || this.oExt.parentNode);
                pNode = (pNode == document.body
                    ? pNode.offsetParent || document.documentElement
                    : pNode.parentNode);

                _self.animstate = 0;
                var hasAnimated = false, htmlNode = this.oExt;
                
                var position = apf.getStyle(htmlNode, "position");
                if (position == "absolute") {
                    pNode.style.overflow = "hidden";
                    var l = htmlNode.offsetLeft;
                    var t = htmlNode.offsetTop;
                }
                else {
                    var pos = apf.getAbsolutePosition(htmlNode, pNode);
                    var l = pos[0];//parseInt(apf.getStyle(htmlNode, "left")) || 0;
                    var t = pos[1];//parseInt(apf.getStyle(htmlNode, "top")) || 0;
                }
                
                lastpos = {
                    css: [this.oExt.style.left, this.oExt.style.top,
                          this.oExt.style.width, this.oExt.style.height, 
                          this.oExt.style.overflow],
                    px : [l, t, this.oExt.offsetWidth - hordiff, 
                          this.oExt.offsetHeight - verdiff]
                };

                var from = [htmlNode.offsetWidth, htmlNode.offsetHeight];
                function setMax(){
                    var w = !apf.isIE && pNode == document.documentElement
                        ? window.innerWidth
                        : pNode.offsetWidth;

                    var h = !apf.isIE && pNode == document.documentElement
                        ? window.innerHeight
                        : pNode.offsetHeight;
                    
                    if (position != "absolute") {
                        var diff = apf.getDiff(pNode);
                        w -= diff[0] + (apf.isIE8 ? 4 : 0);
                        h -= diff[0] + (apf.isIE8 ? 4 : 0);
                    }
                    
                    //@todo dirty hack!
                    if (apf.isIE8) {
                        w -= 4;
                        h -= 4;
                    }
                    
                    if (_self.animate && !hasAnimated) {
                        _self.animstate = 1;
                        hasAnimated = true;
                        apf.tween.multi(htmlNode, {
                            steps    : 5,
                            interval : 10,
                            tweens   : [
                                {type: "left",   from: l,   to: -1 * marginBox[3]},
                                {type: "top",    from: t,    to: -1 * marginBox[0]},
                                {type: "width",  from: from[0] - hordiff, 
                                 to: (w - hordiff + marginBox[1] + marginBox[3])},
                                {type: "height", from: from[1] - verdiff, 
                                 to: (h - verdiff + marginBox[0] + marginBox[2])}
                            ],
                            oneach   : function(){
                                if (apf.hasSingleRszEvent)
                                    apf.layout.forceResize(_self.oInt);
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

                if (apf.layout)
                    apf.layout.pause(this.pHtmlNode, setMax);

                lastzindex = [
                    this.oExt.style.zIndex || 1, 
                    this.oCover && this.oCover.style.zIndex || 1
                ];
                
                if (this.oCover)
                    this.oCover.style.zIndex = apf.WinServer.count + 1;
                this.oExt.style.zIndex = apf.WinServer.count + 2;
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

            _self.dispatchEvent("afterstatechange", {
              from : lastState, 
              to   : o});
            
            this.$lastState = o;

            //#ifdef __WITH_ALIGNMENT
            if (this.aData && !o.maximized) { //@todo is this the most optimal position?
                this.purgeAlignment();
            }
            //#endif

            if (!this.animate && apf.hasSingleRszEvent && apf.layout)
                apf.layout.forceResize(_self.oInt);
        }
    };

    var marginBox, hordiff, verdiff, oButtons = {}
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
        //#ifdef __SUPPORT_IPHONE
        if (apf.isIphone) return;
        //#endif
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
                btn = apf.xmldb.htmlImport(btn, this.oButtons);
            }

            this.$setStyleClass(btn, buttons[i], ["min", "max", "close", "edit"]);
            btn.onclick = new Function("apf.lookup(" + this.uniqueId + ").$toggle('"
                                       + buttons[i] + "')");
            btn.style.display = "block";
            oButtons[buttons[i]] = btn;
            this.oButtons.insertBefore(btn, this.oButtons.firstChild);
        }
        
        var diff = apf.getDiff(this.oExt);
        hordiff  = diff[0];
        verdiff  = diff[1];
        marginBox = apf.getBox(apf.getStyle(this.oExt, "borderWidth"));
    };
    
    function setButtonEvents(btn){
        btn.setAttribute("onmousedown",
            "apf.setStyleClass(this, 'down');\
             event.cancelBubble = true; \
             var o = apf.findHost(this).oExt;\
             if (o.onmousedown) o.onmousedown(event);\
             apf.window.$mousedown(event);");
        btn.setAttribute("onmouseup",
            "apf.setStyleClass(this, '', ['down'])");
        btn.setAttribute("onmouseover",
            "apf.setStyleClass(this, 'hover')");
        btn.setAttribute("onmouseout",
            "apf.setStyleClass(this, '', ['hover', 'down'])");
    }
    
    this.$initButtons = function(oExt){
        var oButtons = this.$getLayoutNode("main", "buttons", oExt);
        if (!oButtons || apf.isIphone || !this.$aml.getAttribute("buttons"))
            return;

        var len = (this.$aml.getAttribute("buttons") || "").split("|").length;
        for (var btn, i = 0; i < len; i++) {
            this.$getNewContext("button");
            btn = oButtons.appendChild(this.$getLayoutNode("button"));
            setButtonEvents(btn);
        }
        
        this.collapsedHeight = this.$getOption("Main", "collapsed-height");
    }
    
    this.$amlDestroyers.push(function(){
        for (var name in oButtons) {
            oButtons[name].onclick = null;
        }
    });
}

//#endif
