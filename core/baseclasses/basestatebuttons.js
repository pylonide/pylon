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
// #ifdef __AMLBASESTATEBUTTONS || __INC_ALL

/**
 * @constructor
 * @baseclass
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.BaseStateButtons = function(){
    this.state   = "normal";
    this.edit    = false;
    
    var actions  = {
        "min"   : ["minimized", "minimize", "restore"],
        "max"   : ["maximized", "maximize", "restore"],
        "edit"  : ["edit", "edit", "closeedit"],
        "close" : ["closed", "close", "show"]
    };
    this.$lastheight  = null;
    this.$lastpos     = null;

    this.$lastState = {"normal":true};    
    this.$booleanProperties["animate"] = true;
    this.$supportedProperties.push("buttons", "animate", "state");
    
    /**
     * Close the window. It can be reopened by using {@link baseclass.guielement.method.show}
     * Call-chaining is supported.
     * @todo show should unset closed
     */
    this.close = function(){
        this.setProperty("state", this.state.split("|")
            .pushUnique("closed").join("|"), false, true);
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
            .pushUnique("minimized").join("|"), false, true);
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
            .pushUnique("maximized").join("|"), false, true);
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
            .pushUnique("normal").join("|"), false, true);
        return this;
    };
    
     /**
     * Set the window into edit state. The configuration panel is shown.
     * Call-chaining is supported.
     */
    this.edit = function(value){
        this.setProperty("state", this.state.split("|")
            .pushUnique("edit").join("|"), false, true);
        return this;
    };

    /**
     * Removes the edit state of this window. The configuration panel is hidden.
     * Call-chaining is supported.
     */
    this.closeedit = function(value){
        this.setProperty("state", this.state.split("|")
            .remove("edit").join("|"), false, true);
        return this;
    };
    
    this.$toggle = function(type){
        var c = actions[type][0];
        this[actions[type][this.state.indexOf(c) > -1 ? 2 : 1]]();
    };
    
    this.$propHandlers["refparent"] = function(value){
        if (typeof value == "string")
            this.$refParent = self[value] && self[value].$ext || document.getElementById(value);
        else this.$refParent = value;
    }
    
    this.$propHandlers["maxconf"] = function(value){
        this.$maxconf = value.splitSafe(",");
    }
    
    /**
     * @attribute {String} state the state of the window. The state can be a
     * combination of multiple states seperated by a pipe '|' character.
     *   Possible values:
     *   normal     The window has it's normal size and position. Default value.
     *   minimized  The window is minimized.
     *   maximized  The window is maximized.
     *   edit       The window is in the edit state.
     *   closed     The window is closed.
     */
    this.$propHandlers["state"] = function(value, prop, force, reenter, noanim){
        var _self = this;
        if (!this.$amlLoaded) { //@todo I still think this is weird and should not be needed
            apf.queue.add("state" + this.$uniqueId, function(){
                _self.$propHandlers["state"].call(_self, value, prop, force, reenter, noanim);
            });
            return;
        }

        if (value == 0)
            value = "normal";

        var i, pNode, position, l, t,
            o          = {},
            s          = value.split("|"),
            lastState  = this.$lastState,
            styleClass = [];

        for (i = 0; i < s.length; i++)
            o[s[i]] = true;
        o.value = value;

        if (!o.maximized && !o.minimized)
            o.normal = true;

        if (!reenter && this.dispatchEvent("beforestatechange", {
          from : lastState, 
          to   : o}) === false) {
            this.state = lastState.value;
            return false;
        }

        //Closed state
        if (o.closed == this.visible) {//change detected
            this.setProperty("visible", !o["closed"], false, true);
            //@todo difference is, we're not clearing the other states, check the docking example
        }

        //Restore state
        if (o.normal != lastState.normal
          || !o.normal && (o.minimized != lastState.minimized
            || o.maximized != lastState.maximized)) {

            if (this.$lastheight) // this.aData && this.aData.hidden == 3 ??
                this.$ext.style.height = this.$lastheight;//(this.$lastheight - apf.getHeightDiff(this.$ext)) + "px";

            if (this.$lastpos) {
                apf.plane.hide(this.$uniqueId);
                
                if (this.animate && !noanim) {
                    //Pre remove paused event because of not having onresize
                    //if (apf.hasSingleRszEvent)
                        //delete apf.layout.onresize[apf.layout.getHtmlId(this.$pHtmlNode)];

                    var htmlNode = this.$ext;
                    position = apf.getStyle(htmlNode, "position");
                    if (position != "absolute") {
                        l = parseInt(apf.getStyle(htmlNode, "left")) || 0;
                        t = parseInt(apf.getStyle(htmlNode, "top")) || 0;
                    }
                    else {
                        l = htmlNode.offsetLeft;
                        t = htmlNode.offsetTop;
                    }

                    this.animstate = 1;
                    apf.tween.multi(htmlNode, {
                        steps    : 15,
                        anim     : apf.tween.easeInOutCubic,
                        interval : 10,
                        tweens   : [
                            {type: "left",   from: l,    to: this.$lastpos.px[0]},
                            {type: "top",    from: t,    to: this.$lastpos.px[1]},
                            {type: "width",  from: this.$ext.offsetWidth,
                                to: this.$lastpos.px[2]},
                            {type: "height", from: this.$ext.offsetHeight,
                                to: this.$lastpos.px[3]}
                        ],
                        oneach   : function(){
                            //#ifdef __WITH_LAYOUT
                            if (apf.hasSingleRszEvent)
                                apf.layout.forceResize(_self.$int);
                            //#endif
                        },
                        onfinish : function(){
                            _self.$lastpos.parentNode.insertBefore(_self.$ext, _self.$lastpos.beforeNode);
                            
                            if (_self.$placeHolder)
                                _self.$placeHolder.parentNode.removeChild(_self.$placeHolder);
                            
                            _self.$propHandlers["state"].call(_self, value, null,
                                null, true, true);
                        }
                    });

                    return;
                }
                else if (!this.animate) {
                    apf.plane.hide(this.$uniqueId, true);
                    
                    _self.$lastpos.parentNode.insertBefore(_self.$ext, _self.$lastpos.beforeNode);
                            
                    if (_self.$placeHolder)
                        _self.$placeHolder.parentNode.removeChild(_self.$placeHolder);
                }

                this.$ext.style.position = this.$lastpos.pos;
                this.$ext.style.left     = this.$lastpos.css[0];
                this.$ext.style.top      = this.$lastpos.css[1];
                this.$ext.style.width    = this.$lastpos.css[2];
                this.$ext.style.height   = this.$lastpos.css[3];
                
                pNode = this.$lastpos.parentNode;
                pNode.style.width    = this.$lastpos.parent[0];
                pNode.style.height   = this.$lastpos.parent[1];
                pNode.style.overflow = this.$lastpos.parent[2];
            }

            //#ifdef __WITH_ALIGNMENT
            if (this.aData && this.aData.restore)
                this.aData.restore();
            //#endif

            //#ifdef __WITH_LAYOUT
            if (apf.layout)
                apf.layout.play(this.$pHtmlNode);
            //#endif

            this.$lastheight = this.$lastpos = null;

            if (o.normal)
                styleClass.push("",
                    this.$baseCSSname + "Max",
                    this.$baseCSSname + "Min");
        }

        if (o.minimized != lastState.minimized) {
            if (o.minimized) {
                styleClass.unshift(
                    this.$baseCSSname + "Min",
                    this.$baseCSSname + "Max",
                    this.$baseCSSname + "Edit");

                //#ifdef __WITH_ALIGNMENT
                if (this.aData && this.aData.minimize)
                    this.aData.minimize(this.collapsedHeight);
                //#endif

                if (!this.aData || !this.aData.minimize) {
                    this.$lastheight = apf.getStyle(this.$ext, "height");//this.$ext.offsetHeight;

                    this.$ext.style.height = Math.max(0, this.collapsedHeight
                        - apf.getHeightDiff(this.$ext)) + "px";
                }

                if (this.hasFocus())
                    apf.window.moveNext(null, this, true);
                //else if(apf.document.activeElement)
                    //apf.document.activeElement.$focus({mouse: true});
            }
            else {
                styleClass.push(this.$baseCSSname + "Min");

                $setTimeout(function(){
                    apf.window.$focusLast(_self);
                });
            }
        }

        if (o.maximized != lastState.maximized) {
            if (o.maximized) {
                styleClass.unshift(
                    this.$baseCSSname + "Max",
                    this.$baseCSSname + "Min",
                    this.$baseCSSname + "Edit");

                pNode = this.$refParent;
                if (!pNode)
                    pNode = (this.$ext.offsetParent == document.body
                      ? document.documentElement
                      : this.$ext.parentNode);

                this.animstate = 0;
                var hasAnimated = false, htmlNode = this.$ext;
                
                var position = apf.getStyle(htmlNode, "position");
                if (position == "absolute") {
                    pNode.style.overflow = "hidden";
                    l = htmlNode.offsetLeft;
                    t = htmlNode.offsetTop;
                }
                else {
                    var pos = apf.getAbsolutePosition(htmlNode); //pNode
                    l = pos[0];//parseInt(apf.getStyle(htmlNode, "left")) || 0;
                    t = pos[1];//parseInt(apf.getStyle(htmlNode, "top")) || 0;
                }
                
                this.$lastpos = {
                    css    : [this.$ext.style.left, this.$ext.style.top,
                              this.$ext.style.width, this.$ext.style.height,
                              this.$ext.style.margin, this.$ext.style.zIndex],
                    px     : [l, t, this.$ext.offsetWidth, 
                              this.$ext.offsetHeight],
                    parent : [pNode.style.width, pNode.style.height, 
                              pNode.style.overflow],
                    pos        : htmlNode.style.position,
                    parentNode : pNode,
                    beforeNode : this.$ext.nextSibling
                };
                
                if (this.parentNode.$layout) {
                    if (!this.$placeHolder)
                        this.$placeHolder = document.createElement("div");
                    this.$placeHolder.style.position = this.$lastpos.pos;
                    this.$placeHolder.style.left   = this.$lastpos.css[0];
                    this.$placeHolder.style.top    = this.$lastpos.css[1];
                    this.$placeHolder.style.width  = this.$lastpos.px[2] + "px";
                    this.$placeHolder.style.height = this.$lastpos.px[3] + "px";
                    this.$placeHolder.style.margin = this.$lastpos.css[4];
                    this.$placeHolder.style.zIndex = this.$lastpos.css[5];
                    this.$pHtmlNode.insertBefore(this.$placeHolder, this.$ext);
                    
                    htmlNode.style.position = "absolute";
                }
                
                document.body.appendChild(htmlNode);
                htmlNode.style.left = l + "px";
                htmlNode.style.top  = t + "px";
                
                function setMax(){
                    //While animating dont execute this function
                    if (_self.animstate)
                        return;
                    
                    var w, h, pos, box, pDiff;
                    if (_self.maxconf) {
                        w = _self.$maxconf[0];
                        h = _self.$maxconf[1];
                        
                        pos = [_self.$maxconf[2] == "center" 
                            ? (apf.getWindowWidth() - w)/2
                            : _self.$maxconf[2], 
                               _self.$maxconf[3] == "center" 
                            ? (apf.getWindowHeight() - h)/3
                            : _self.$maxconf[3]];
                    }
                    else {
                        w = !apf.isIE && pNode == document.documentElement
                            ? window.innerWidth
                            : pNode.offsetWidth,
                        h = !apf.isIE && pNode == document.documentElement
                            ? window.innerHeight
                            : pNode.offsetHeight;
                    }
                    
                    if (!pos) {
                        pos = pNode != htmlNode.offsetParent
                            ? apf.getAbsolutePosition(pNode, htmlNode.offsetParent)
                            : [0, 0];
                    }

                    if (position != "absolute") {
                        var diff = apf.getDiff(pNode);
                        w -= diff[0] + (!_self.$refParent && apf.isIE8 ? 4 : 0);//@todo dirty hack!
                        h -= diff[0] + (!_self.$refParent && apf.isIE8 ? 4 : 0);//@todo dirty hack!
                    }
                    //@todo dirty hack!
                    else if (!_self.$refParent && apf.isIE8) {
                        w -= 4;
                        h -= 4;
                    }
                    
                    box = _self.$refParent ? [0,0,0,0] : marginBox;
                    pDiff = apf.getDiff(pNode);

                    pNode.style.width  = (pNode.offsetWidth - pDiff[0]) + "px";
                    pNode.style.height = (pNode.offsetHeight - pDiff[1]) + "px";
                    
                    if (!hasAnimated && _self.$maxconf && _self.$maxconf[4])
                        apf.plane.show(htmlNode, false, null, null, {
                            color   : _self.$maxconf[4], 
                            opacity : _self.$maxconf[5],
                            animate : _self.animate,
                            protect : _self.$uniqueId
                        });
                    
                    if (_self.animate && !hasAnimated) {
                        _self.animstate = 1;
                        hasAnimated     = true;
                        apf.tween.multi(htmlNode, {
                            steps    : 15,
                            anim     : apf.tween.easeInOutCubic,
                            interval : 10,
                            tweens   : [
                                {type: "left",   from: l, to: pos[0] - box[3]},
                                {type: "top",    from: t, to: pos[1] - box[0]},
                                {type: "width",  from: _self.$lastpos.px[2],
                                    to: (w + box[1] + box[3] - apf.getWidthDiff(_self.$ext))},
                                {type: "height", from: _self.$lastpos.px[3],
                                    to: (h + box[0] + box[2] - apf.getHeightDiff(_self.$ext))}
                            ],
                            oneach   : function(){
                                //#ifdef __WITH_LAYOUT
                                if (apf.hasSingleRszEvent)
                                    apf.layout.forceResize(_self.$int);
                                //#endif
                            },
                            onfinish : function(){
                                _self.animstate = 0;
                                
                                _self.dispatchEvent("afterstatechange", {
                                  from : lastState, 
                                  to   : o
                                });
                                
                                //#ifdef __WITH_LAYOUT
                                if (apf.hasSingleRszEvent)
                                    apf.layout.forceResize(_self.$int);
                                //#endif
                            }
                        });
                    }
                    else if (!_self.animstate) {
                        htmlNode.style.left = (pos[0] - box[3]) + "px";
                        htmlNode.style.top  = (pos[1] - box[0]) + "px";

                        var diff = apf.getDiff(_self.$ext);
                        htmlNode.style.width  = (w
                            - diff[0] + box[1] + box[3]) + "px";
                        htmlNode.style.height = (h
                            - diff[1] + box[0] + box[2]) + "px";
                    }
                }

                //#ifdef __WITH_LAYOUT
                if (apf.layout)
                    apf.layout.pause(this.$pHtmlNode, setMax);
                //#endif
            }
            else {
                styleClass.push(this.$baseCSSname + "Max");
            }
        }

        if (o.edit != lastState.edit) {
            if (o.edit) {
                styleClass.unshift(
                    this.$baseCSSname + "Edit",
                    this.$baseCSSname + "Max",
                    this.$baseCSSname + "Min");

                if (this.btnedit)
                    oButtons.edit.innerHTML = "close"; //hack

                this.dispatchEvent('editstart');
            }
            else {
                if (this.dispatchEvent('editstop') === false)
                    return false;

                styleClass.push(this.$baseCSSname + "Edit");
                if (styleClass.length == 1)
                    styleClass.unshift("");

                if (this.btnedit)
                    oButtons.edit.innerHTML = "edit"; //hack
            }
        }

        if (styleClass.length || o.closed != lastState.closed) {
            if (styleClass.length)
                this.$setStyleClass(this.$ext, styleClass.shift(), styleClass);
                
            if (o.edit) { //@todo apf3.0
                this.dispatchEvent("prop.visible", {value:true});
                //#ifdef __WITH_LAYOUT
                if (_self.oSettings)
                    apf.layout.forceResize(_self.oSettings);
                //#endif
            }

            //@todo research why this is not symmetrical
            if (!o.maximized || !this.animate || lastState.maximized && _self.animate) {
                _self.dispatchEvent("afterstatechange", {
                  from : lastState, 
                  to   : o});
            }
            
            this.$lastState = o;

            //#ifdef __WITH_ALIGNMENT
            if (this.aData && !o.maximized) { //@todo is this the most optimal position?
                this.$purgeAlignment();
            }
            //#endif

            //#ifdef __WITH_LAYOUT
            if (!this.animate && apf.hasSingleRszEvent && apf.layout)
                apf.layout.forceResize(_self.$int);
            //#endif
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
        if (!this.$hasLayoutNode("button"))
            return;

        var buttons   = value && (value = value.replace(/(\|)\||\|$/, "$1")).split("|") || [],
            nodes     = this.$buttons.childNodes,
            re        = value && new RegExp("(" + value + ")"),
            found     = {},
            idleNodes = [];

        //Check if we can 'remove' buttons
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1 || nodes[i].tagName != "DIV") //@todo temp hack
                continue;

            if (nodes[i].getAttribute("button") && (!value 
              || !nodes[i].className || !nodes[i].className.match(re))) {
                nodes[i].style.display = "none";
                this.$setStyleClass(nodes[i], "", ["min", "max", "close", "edit"]);
                idleNodes.push(nodes[i]);
            }
            else {
                found[RegExp.$1] = nodes[i];
            }
        }

        //Create new buttons if needed
        for (i = 0; i < buttons.length; i++) {
            if (!buttons[i])
                continue;
            
            if (found[buttons[i]]) {
                this.$buttons.insertBefore(found[buttons[i]], this.$buttons.firstChild);
                continue;
            }

            var btn = idleNodes.pop();
            if (!btn) {
                this.$getNewContext("button");
                btn = this.$getLayoutNode("button");
                btn.setAttribute("button", "button");
                setButtonEvents.call(this, btn);
                btn = apf.insertHtmlNode(btn, this.$buttons);
            }

            this.$setStyleClass(btn, buttons[i], ["min", "max", "close", "edit"]);
            btn.onclick = new Function("apf.lookup(" + this.$uniqueId + ").$toggle('"
                                       + buttons[i] + "')");
            btn.style.display = "block";
            oButtons[buttons[i]] = btn;
            this.$buttons.insertBefore(btn, this.$buttons.firstChild);
        }
        
        marginBox = apf.getBox(apf.getStyle(this.$ext, "borderWidth"));
    };
    
    function setButtonEvents(btn){
        //@todo can this cancelBubble just go?
        //event.cancelBubble = true; \
        btn.setAttribute("onmousedown",
            "var o = apf.all[" + this.$uniqueId + "];\
             o.$setStyleClass(this, 'down', null, true);\
             apf.cancelBubble(event, o); \
             var o = apf.findHost(this).$ext;\
             if (o.onmousedown) o.onmousedown(event);\
             apf.cancelBubble(event, o);\
             apf.window.$mousedown(event);");
        btn.setAttribute("onmouseup",
            "var o = apf.all[" + this.$uniqueId + "];\
             o.$setStyleClass(this, '', ['down'], true);");
        btn.setAttribute("onmouseover",
            "var o = apf.all[" + this.$uniqueId + "];\
             o.$setStyleClass(this, 'hover', null, true);");
        btn.setAttribute("onmouseout",
            "var o = apf.all[" + this.$uniqueId + "];\
             o.$setStyleClass(this, '', ['hover', 'down'], true);");
        btn.setAttribute("ondblclick", "apf.stopPropagation(event);");
    }
    
    this.$initButtons = function(oExt){
        this.animate = apf.enableAnim;
        
        this.collapsedHeight = this.$getOption("Main", "collapsed-height");

        var oButtons = this.$getLayoutNode("main", "buttons", oExt);
        if (!oButtons || apf.isIphone || !this.getAttribute("buttons") 
          || !this.$hasLayoutNode("button"))
            return;

        var len = (this.getAttribute("buttons") || "").split("|").length;
        for (var btn, i = 0; i < len; i++) {
            this.$getNewContext("button");
            btn = oButtons.appendChild(this.$getLayoutNode("button"));
            btn.setAttribute("button", "button");
            setButtonEvents.call(this, btn);
        }
    };
    
    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        for (var name in oButtons) {
            oButtons[name].onclick = null;
        }
    });
};

//#endif
