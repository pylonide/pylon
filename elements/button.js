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

// #ifdef __JBUTTON || __INC_ALL
// #define __WITH_PRESENTATION 1
// #define __JBASEBUTTON 1

/**
 * Element displaying a clickable rectangle that visually confirms to the
 * user when the area is clicked and then executes a command.
 *
 * @constructor
 * @define button, submit, trigger, reset
 * @addnode elements
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits jpf.Presentation
 * @inherits jpf.BaseButton
 */
jpf.submit  =
jpf.trigger =
jpf.reset   =
jpf.button  = jpf.component(jpf.NODE_VISIBLE, function(){
    var useExtraDiv;
    var _self = this;

    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {
        "main": [["caption", "text()"]]
    };
    // #endif

    /* #ifdef __WITH_EDITMODE
     this.editableEvents = {"click":true}
    #endif */

    /**** Properties and Attributes ****/

    this.$focussable = true; // This object can get the focus
    this.value       = null;

    /**
     * @attribute {String}  icon     the url from which the icon image is loaded.
     * @attribute {Boolean} state    whether this boolean is a multi state button.
     * @attribute {String}  value    the initial value of a state button.
     * @attribute {String}  tooltip  the text displayed when a user hovers with the mouse over the element.
     * @attribute {String}  color    the text color of the caption of this element.
     * @attribute {String}  caption  the text displayed on this element indicating the action when the button is pressed.
     * @attribute {String}  action   one of the default actions this button can perform when pressed.
     *   Possible values:
     *   undo     Executes undo on the action tracker of the target element.
     *   redo     Executes redo on the action tracker of the target element.
     *   remove   Removes the selected node(s) of the target element.
     *   add      Adds a node to the target element.
     *   rename   Starts the rename function on the target element.
     *   login    Calls log in on the auth element with the values of the textboxes of type username and password.
     *   logout   Calls lot out on the auth element.
     *   ok       Executes a commitTransaction() on the target element, and closes or hides that element.
     *   cancel   Executes a rollbackTransaction() on the target element, and closes or hides that element.
     *   apply    Executes a commitTransaction() on the target element.
     *   close    Closes the target element.
     * @attribute {String}  target   id of the element to apply the action to. Defaults to the parent container.
     * @attribute {String}  default  whether this button is the default action for the containing window.
     * @attribute {String}  submenu  the name of the contextmenu to display when the button is pressed.
     */
    this.$booleanProperties["default"] = true;
    this.$supportedProperties.push("icon", "value", "tooltip", "state",
        "color", "caption", "action", "target", "default", "submenu");

    this.$propHandlers["icon"] = function(value){
        // #ifdef __DEBUG
        if (!this.oIcon)
            return jpf.console.warn("No icon defined in the Button skin", "button");
        /* #else
        if (!this.oIcon) return;
        #endif */

        if (value)
            this.$setStyleClass(this.oExt, this.baseCSSname + "Icon");
        else
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Icon"]);

        jpf.skins.setIcon(this.oIcon, value, this.iconPath);
    };

    this.$propHandlers["value"] = function(value){
        if (value === undefined)
            value = !this.value;
        this.value = value;

        if (this.value)
            this.$setState("Down", {});
        else
            this.$setState("Out", {});
    };

    this.$propHandlers["tooltip"] = function(value){
        this.oExt.setAttribute("title", value);
    };

    this.$propHandlers["state"] = function(value){
        this.$setStateBehaviour(value == 1);
    };

    this.$propHandlers["color"] = function(value){
        if (this.oCaption)
            this.oCaption.parentNode.style.color = value;
    };

    this.$propHandlers["caption"] = function(value){
        if (value)
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Empty"]);
        else
            this.$setStyleClass(this.oExt, this.baseCSSname + "Empty");

        if (this.oCaption)
            this.oCaption.nodeValue = String(value || "").trim();
    };

    //@todo reparenting
    var forceFocus;
    this.$propHandlers["default"] = function(value){
        if (!this.focussable && value || forceFocus)
            this.setAttribute("focussable", forceFocus = value);
        
        this.parentNode.removeEventListener("focus", setDefault);
        this.parentNode.removeEventListener("blur", removeDefault);

        if (!value)
            return;

        //Currrently only support for parentNode, this might need to be expanded
        this.parentNode.addEventListener("focus", setDefault);
        this.parentNode.addEventListener("blur", removeDefault);
    };

    function setDefault(e){
        if (e.defaultButtonSet || e.returnValue === false)
            return;

        e.defaultButtonSet = true;

        if (useExtraDiv)
            _self.oExt.appendChild(jpf.button.$extradiv);

        _self.$setStyleClass(_self.oExt, _self.baseCSSname + "Default");

        if (e.srcElement != _self && _self.$focusParent) {
            _self.$focusParent.addEventListener("keydown", btnKeyDown);
        }
    }

    function removeDefault(e){
        if (useExtraDiv && jpf.button.$extradiv.parentNode == _self.oExt)
            _self.oExt.removeChild(jpf.button.$extradiv);

        _self.$setStyleClass(_self.oExt, "", [_self.baseCSSname + "Default"]);

        if (e.srcElement != _self && _self.$focusParent) {
            _self.$focusParent.removeEventListener("keydown", btnKeyDown);
        }
    }

    function btnKeyDown(e){
        var ml;

        var f = jpf.window.focussed;
        if (f) {
            if (f.hasFeature(__MULTISELECT__))
                return;

            ml = f.multiline;
        }

        if (ml && ml != "optional" && e.keyCode == 13
          && e.ctrlKey || (!ml || ml == "optional")
          && e.keyCode == 13 && !e.ctrlKey && !e.shiftKey && !e.altKey)
            _self.oExt.onmouseup(e.htmlEvent, true);
    }

    this.addEventListener("focus", setDefault);
    this.addEventListener("blur", removeDefault);

    //#ifdef __JTOOLBAR || __INC_ALL

    //@todo move this to menu.js
    function menuKeyHandler(e){
        return;
        var key = e.keyCode;

        var next, nr = jpf.xmldb.getChildNumber(this);
        if (key == 37) { //left
            next = nr == 0
                ? this.parentNode.childNodes.length - 1
                : nr - 1;
            this.parentNode.childNodes[next].dispatchEvent("mouseover");
        }
        else if (key == 39) { //right
            next = (nr >= this.parentNode.childNodes.length - 1)
                ? 0
                : nr + 1;
            this.parentNode.childNodes[next].dispatchEvent("mouseover");
        }
    }

    function menuDown(e){
        var menu = self[this.submenu];

        this.value = !this.value;

        if (this.value)
            this.$setState("Down", {});

        //#ifdef __DEBUG
        if (!menu) {
            throw new Error(jpf.formatErrorString(0, this,
                "Showing submenu",
                "Could not find submenu '" + this.submenu + "'"));
        }
        //#endif

        if (!this.value) {
            menu.hide();
            this.$setState("Over", {}, "toolbarover");

            this.parentNode.menuIsPressed = false;
            if (this.parentNode.hasMoved)
                this.value = false;

            if (jpf.hasFocusBug)
                jpf.window.$focusfix();

            return false;
        }

        this.parentNode.menuIsPressed = this;

        var pos = jpf.getAbsolutePosition(this.oExt, menu.oExt.offsetParent);
        menu.display(pos[0],
            pos[1] + this.oExt.offsetHeight, false, this,
            null, null, this.oExt.offsetWidth - 2);

        this.parentNode.hasMoved = false;

        e.htmlEvent.cancelBubble = true;

        return false;
    }

    function menuOver(){
        var menuPressed = this.parentNode.menuIsPressed;

        if (!menuPressed || menuPressed == this)
            return;

        menuPressed.setValue(false);
        var oldMenu = self[menuPressed.submenu];
        oldMenu.$propHandlers["visible"].call(oldMenu, false, true);//.hide();

        this.setValue(true);
        this.parentNode.menuIsPressed = this;

        var menu = self[this.submenu];

        //#ifdef __DEBUG
        if (!menu) {
            throw new Error(jpf.formatErrorString(0, this,
                "Showing submenu",
                "Could not find submenu '" + this.submenu + "'"));
        }
        //#endif

        var pos = jpf.getAbsolutePosition(this.oExt, menu.oExt.offsetParent);

        menu.display(pos[0],
            pos[1] + this.oExt.offsetHeight, true, this,
            null, null, this.oExt.offsetWidth - 2);

        //jpf.window.$focus(this);
        this.$focus();

        this.parentNode.hasMoved = true;

        return false;
    }

    /**
     * @attribute {string} submenu If this attribute is set, the button will
     * function like a menu button
     */
    this.$propHandlers["submenu"] = function(value){
        if (!value){
            if (this.value && this.parentNode)
                menuDown.call(this);

            this.$focussable = true;
            this.$setNormalBehaviour();
            this.removeEventListener("mousedown", menuDown);
            this.removeEventListener("mouseover", menuOver);
            this.removeEventListener("keydown", menuKeyHandler, true);
            return;
        }

        this.$focussable = false;
        this.$setStateBehaviour();

        this.addEventListener("mousedown", menuDown);
        this.addEventListener("mouseover", menuOver);
        this.addEventListener("keydown", menuKeyHandler, true);
    };
    //#endif

    /**** Public Methods ****/

    /**
     * @copy   Widget#setValue
     */
    this.setValue = function(value){
        this.setProperty("value", value);
    };

    /**
     * Sets the text displayed as caption of this element.
     *
     * @param  {String}  value  required  The string to display.
     * @see    baseclass.validation
     */
    this.setCaption = function(value){
        this.setProperty("caption", value);
    };

    /**
     * Sets the URL of the icon displayed on this element.
     *
     * @param  {String}  value  required  The URL to the location of the icon.
     * @see    element.button
     * @see    element.modalwindow
     */
    this.setIcon = function(url){
        this.setProperty("icon", url);
    };

    /**** Private state methods ****/

    this.$enable = function(){
        if (this["default"]) {
            setDefault({});
            if (jpf.window.focussed)
                jpf.window.focussed.focus(true);
        }
        if (this.state && this.value) {
            this.$setState("Down", {});
        }

        this.$doBgSwitch(1);
    };

    this.$disable = function(){
        if (this["default"])
            removeDefault({});

        this.$doBgSwitch(4);
        this.$setStyleClass(this.oExt, "",
            [this.baseCSSname + "Over", this.baseCSSname + "Down"]);
    };

    this.$setStateBehaviour = function(value){
        this.value     = value || false;
        this.isBoolean = true;
        this.$setStyleClass(this.oExt, this.baseCSSname + "Bool");

        if (this.value) {
            this.$setStyleClass(this.oExt, this.baseCSSname + "Down");
            this.$doBgSwitch(this.states["Down"]);
        }
    };

    this.$setNormalBehaviour = function(){
        this.value     = null;
        this.isBoolean = false;
        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Bool"]);
    };

    this.$setState = function(state, e, strEvent){
        if (this.disabled)
            return;

        if (strEvent && this.dispatchEvent(strEvent, {htmlEvent: e}) === false)
            return;

        this.$doBgSwitch(this.states[state]);
        var bs = this.baseCSSname;
        this.$setStyleClass(this.oExt, (state != "Out" ? bs + state : ""),
            [(this.value ? "" : bs + "Down"), bs + "Over"]);

        if (this.submenu) {
            bs = this.baseCSSname + "menu";
            this.$setStyleClass(this.oExt, (state != "Out" ? bs + state : ""),
            [(this.value ? "" : bs + "Down"), bs + "Over"]);
        }

        //if (state != "Down")
            //e.cancelBubble = true;
    };

    this.$clickHandler = function(){
        // This handles the actual OnClick action. Return true to redraw the button.
        if (this.isBoolean && !this.submenu) {
            this.setProperty("value", !this.value);
            return true;
        }
    };

    //#ifdef __JTOOLBAR || __INC_ALL
    this.$submenu = function(hide, force){
        if (hide) {
            this.setValue(false);
            this.$setState("Out", {}, "mouseout");
            this.parentNode.menuIsPressed = false;
        }
    };
    //#endif

    /**** DOM Hooks ****/

    //@todo can't we make this generic for button, bar, page, divider and others, maybe in presentation
    this.$domHandlers["reparent"].push(
        function(beforeNode, pNode, withinParent){
            if (!this.$jmlLoaded)
                return;

            var skinName;
            if (isUsingParentSkin && !withinParent
              && this.skinName != pNode.skinName
              || !isUsingParentSkin && (skinName = this.parentNode.$getOption
              && this.parentNode.$getOption("main", "button-skin"))) {
                isUsingParentSkin = true;
                this.$forceSkinChange(this.parentNode.skinName.split(":")[0] + ":" + skinName);
            }
        });

    /**** Init ****/

    var inited = false, isUsingParentSkin = false;
    this.$draw  = function(){
        if (typeof this.focussable == "undefined") {
            if (this.parentNode.parentNode
              && this.parentNode.parentNode.tagName == "toolbar"
              && !this.$jml.getAttribute("focussable"))
                this.focussable = false;
        }

        var skinName;
        if (this.parentNode && (skinName = this.parentNode.$getOption
          && this.parentNode.$getOption("main", "button-skin"))) {
            isUsingParentSkin = true;
            skinName = this.parentNode.skinName.split(":")[0] + ":" + skinName;
            if (this.skinName != skinName)
                this.$loadSkin(skinName);
            this.$focussable = jpf.KEYBOARD;
        }
        else if(isUsingParentSkin){
            isUsingParentSkin = false;
            this.$loadSkin();
            this.$focussable = true;
        }

        //Build Main Skin
        this.oExt     = this.$getExternal();
        this.oIcon    = this.$getLayoutNode("main", "icon", this.oExt);
        this.oCaption = this.$getLayoutNode("main", "caption", this.oExt);

        useExtraDiv = jpf.isTrue(this.$getOption("main", "extradiv"));
        if (!jpf.button.$extradiv && useExtraDiv) {
            (jpf.button.$extradiv = document.createElement("div"))
                .className = "extradiv"
        }

        if (this.tagName == "submit")
            this.action = "submit";
        else if (this.tagName == "reset")
            this.action = "reset";

        this.$setupEvents();
    };

    //#ifdef __WITH_SKIN_CHANGE
    this.$skinchange = function(){
        if (this.caption)
            this.$propHandlers["caption"].call(this, this.caption);

        if (this.icon)
            this.$propHandlers["icon"].call(this, this.icon);

        this.$updateState({reset:1});
        //this.$blur();

        //if (this.$focussable !== true && this.hasFocus())
            //jpf.window.$focusLast(this.$focusParent);
    }
    //#endif

    this.$loadJml = function(x){
        if (!this.caption && x.firstChild)
            this.setProperty("caption", x.firstChild.nodeValue);
        else if (typeof this.caption == "undefined")
            this.$propHandlers["caption"].call(this, "");

        /* #ifdef __WITH_EDITMODE
         if(this.editable)
         #endif */
        // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
        this.$makeEditable("main", this.oExt, this.$jml);
        // #endif

        if (!inited) {
            jpf.JmlParser.parseChildren(this.$jml, null, this);
            inited = true;
        }
    };

    //#ifdef __ENABLE_BUTTON_ACTIONS
    //@todo solve how this works with XForms
    this.addEventListener("click", function(e){
        var action = this.action;

        //#-ifdef __WITH_HTML5
        if (!action)
            action = this.tagName;
        //#-endif

        setTimeout(function(){
            (jpf.button.actions[action] || jpf.K).call(_self);
        });
    });
    //#endif

    /* #ifdef __WITH_XFORMS

    //XForms support
    if (this.tagName == "trigger") {
        this.addEventListener("click", function(e){
            this.dispatchXFormsEvent("DOMActivate", e);
        });
    }

    //XForms support
    this.action = (this.tagName == "submit")
        ? "submit"
        : x.getAttribute("action");
    this.target = x.getAttribute("target");
    if (this.action == "submit")
        this.submission = x.getAttribute("submission");

    this.addEventListener("click", function(e){
        if (!this.action)
            return;
        var target;

        if (this.submission) {
            var submission = self[this.submission];
            if (!submission)
                throw new Error(jpf.formatErrorString(0, this,
                    "Submission",
                    "Could not find submission to execute action on '"
                    + this.submission + "'", this.$jml));

            submission.dispatchXFormsEvent("xforms-submit");

            return;
        }
        else
            if (this.target) {
                //#ifdef __DEBUG
                if (!self[this.target])
                    throw new Error(jpf.formatErrorString(0, this,
                        "Clicking on Button",
                        "Could not find target to execute action on '"
                        + this.target + "' with action '"
                        + this.action + "'", this.$jml));
                //#endif

                target = self[this.target]
            }
            else {
                var p = this;
                while (p.parentNode) {
                    if (p[this.action]) {
                        target = p;
                        break;
                    }
                    p = p.parentNode;
                };

                if (!target) {
                    target = this.getModel();
                    //#ifdef __DEBUG
                    if (!target)
                        throw new Error(jpf.formatErrorString(0, this,
                            "Clicking on Button",
                            "Could not find target to for action '"
                            + this.action + "'", this.$jml));
                    //#endif
                }
            }

        //#ifdef __DEBUG
        if (!target[this.action])
            throw new Error(jpf.formatErrorString(0, this,
                "Clicking on Button",
                "Could not find action on target.", this.$jml));
        //#endif

        target[this.action]();
    });

    //if(x.getAttribute("condition")) this.condition = x.getAttribute("condition");
    //this.form.registerButton(this.action, this);

    #endif*/
}).implement(jpf.Presentation, jpf.BaseButton);

//#ifdef __ENABLE_BUTTON_ACTIONS
jpf.button.actions = {
    // #ifdef __WITH_ACTIONTRACKER
    "undo" : function(action){
        var tracker;
        if (this.target && self[this.target]) {
            tracker = self[this.target].getActionTracker()
        }
        else {
            var at, node = this;
            while(node.parentNode)
                at = (node = node.parentNode).$at;
        }

        (tracker || jpf.window.$at)[action || "undo"]();
    },

    "redo" : function(){
        jpf.button.actions.undo.call(this, "redo");
    },
    //#endif

    //#ifdef __WITH_MULTISELECT
    "remove" : function(){
        if (this.target && self[this.target])
            self[this.target].remove()
        //#ifdef __DEBUG
        else
            jpf.console.warn("Target to remove wasn't found or specified:'"
                             + this.target + "'");
        //#endif
    },

    "add" : function(){
        if (this.target && self[this.target])
            self[this.target].add()
        //#ifdef __DEBUG
        else
            jpf.console.warn("Target to add wasn't found or specified:'"
                             + this.target + "'");
        //#endif
    },

    "rename" : function(){
        if (this.target && self[this.target])
            self[this.target].startRename()
        //#ifdef __DEBUG
        else
            jpf.console.warn("Target to rename wasn't found or specified:'"
                             + this.target + "'");
        //#endif
    },
    //#endif

    //#ifdef __WITH_AUTH
    "login" : function(){
        var parent = this.target && self[this.target]
            ? self[this.target]
            : this.parentNode;

        var vg = parent.$validgroup || new jpf.ValidationGroup();
        if (!vg.childNodes.length)
            vg.childNodes = parent.childNodes.slice();

        var vars = {};
        function loopChildren(nodes){
            for (var node, i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i];

                if (node.hasFeature(__VALIDATION__)
                  && !node.$validgroup && !node.form) {
                    node.setProperty("validgroup", vg);
                }

                if (node.$jml.getAttribute("type"))
                    vars[node.$jml.getAttribute("type")] = node.getValue();

                if (vars.username && vars.password)
                    return;

                if (node.childNodes.length)
                    loopChildren(node.childNodes);
            }
        }
        loopChildren(parent.childNodes);

        if (!vg.isValid())
            return;

        if (!vars.username || !vars.password) {
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(0, this,
                "Clicking the login button",
                "Could not find the username or password box"));
            //#endif

            return;
        }

        jpf.auth.login(vars.username, vars.password);
    },

    "logout" : function(){
        jpf.auth.logout();
    },
    //#endif

    //#ifdef __WITH_MODEL
    "submit" : function(doReset){
        var vg, model;

        var parent = this.target && self[this.target]
            ? self[this.target]
            : this.parentNode;

        if (parent.tagName == "model")
            model = parent;
        else {
            if (!parent.$validgroup) {
                parent.$validgroup = parent.validgroup
                    ? self[parent.validgroup]
                    : new jpf.ValidationGroup();
            }

            vg = parent.$validgroup;
            if (!vg.childNodes.length)
                vg.childNodes = parent.childNodes.slice();

            function loopChildren(nodes){
                for (var node, i = 0, l = nodes.length; i < l; i++) {
                    node = nodes[i];

                    if (node.getModel) {
                        model = node.getModel();
                        if (model)
                            return false;
                    }

                    if (node.childNodes.length)
                        if (loopChildren(node.childNodes) === false)
                            return false;
                }
            }
            loopChildren(parent.childNodes);

            if (!model) {
                //#ifdef __DEBUG
                throw new Error(jpf.formatErrorString(0, this,
                    "Finding a model to submit",
                    "Could not find a model to submit."));
                //#endif

                return;
            }
        }

        if (doReset) {
            model.reset();
            return;
        }

        if (vg && !vg.isValid())
            return;

        model.submit();
    },

    "reset" : function(){
        jpf.button.actions["submit"].call(this, true);
    },
    //#endif

    //#ifdef __WITH_TRANSACTION
    "ok" : function(){
        var node;

        if (this.target) {
            node = self[this.target];
        }
        else {
            var node = this.parentNode;
            while (node && !node.hasFeature(__TRANSACTION__)) {
                node = node.parentNode;
            }

            if (node && !node.hasFeature(__TRANSACTION__))
                return;
        }

        if (node.commit() && node.close) 
            node.close();
    },

    "cancel" : function(){
        var node;

        if (this.target) {
            node = self[this.target];
        }
        else {
            var node = this.parentNode;
            while (node && !node.hasFeature(__TRANSACTION__)) {
                node = node.parentNode;
            }

            if (node && !node.hasFeature(__TRANSACTION__))
                return;
        }

        node.rollback();
        if (node.close)
            node.close();
    },

    "apply" : function(){
        var node;

        if (this.target) {
            node = self[this.target];
        }
        else {
            var node = this.parentNode;
            while (node && !node.hasFeature(__TRANSACTION__)) {
                node = node.parentNode;
            }

            if (node && !node.hasFeature(__TRANSACTION__))
                return;
        }

        if (node.autoshow)
            node.autoshow = -1;
        if (node.commit())
            node.begin("update");
    },
    //#endif

    "close" : function(){
        var parent = this.target && self[this.target]
            ? self[this.target]
            : this.parentNode;

        while(parent && !parent.close)
            parent = parent.parentNode;

        if (parent && parent.close)
            parent.close();
        //#ifdef __DEBUG
        else
            jpf.console.warn("Target to close wasn't found or specified:'"
                             + this.target + "'");
        //#endif
    }
};
//#endif

// #endif
